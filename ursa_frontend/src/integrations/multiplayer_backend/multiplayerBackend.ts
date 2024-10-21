import { Accessor, createSignal } from 'solid-js';
import { Logger } from '../../logging/filteredLogger';
import { ColonyState, type Error, MultiplayerMode, ResCodeErr, ResErr } from '../../meta/types';
import { BackendIntegration } from '../main_backend/mainBackend';
import { ColonyCode, PlayerID } from '../main_backend/mainBackendDTOs';
import {
    createViewAndSerializeMessage,
    parseGoTypeAtOffsetInView,
    readSourceAndEventID,
    serializeTypeFromViewAndSpec as serializeTypeFromData,
} from './binUtil';
import { IExpandedAccessMultiplexer } from './eventMultiplexer';
import { EVENT_ID_MAP, EventSpecification, IMessage, OriginType } from './EventSpecifications';
import { createWrappedSignal, WrappedSignal } from '../../ts/wrappedSignal';
import { HealthCheckDTO, LobbyStateResponseDTO } from './multiplayerDTO';

export interface RawMessage<T> extends IMessage {
    [key: string]: any;
}

export interface IMultiplayerIntegration {
    /**
     * Updates to reflect whether the local player (current user of this frontend instance) is the owner of the
     * currently open colony in question, or a guest
     *
     * Defaults to MultiplayerMode.AS_GUEST
     */
    getMode: Accessor<MultiplayerMode>;
    /**
     * The current state of the colony local player is on. 
     * Open means connected to a lobby, and thus multiplayer.
     * Closed is singleplayer.
     */
    getState: Accessor<ColonyState>;
    /**
     * Exceptionally allowed to THROW
     */
    connect: (code: ColonyCode, onClose: (ev: CloseEvent) => void) => Promise<Error | undefined>;
    getServerStatus: () => Promise<ResCodeErr<HealthCheckDTO>>;
    /**
     * Get the state for the currently connected lobby.
     */
    getLobbyState: () => Promise<ResCodeErr<LobbyStateResponseDTO>>;
}

export const initializeMultiplayerIntegration = (
    backend: BackendIntegration,
    log: Logger,
    multiplexer: IExpandedAccessMultiplexer,
    mode: MultiplayerMode,
): ResErr<IMultiplayerIntegration> => {
    const integration = new MultiplayerIntegrationImpl(backend, log, multiplexer, mode);

    return { res: integration, err: null };
};

class MultiplayerIntegrationImpl implements IMultiplayerIntegration {
    // All of the below are overwritten connection.
    private connection: WebSocket | null = null;
    private connectedLobbyID: number | null = null;
    private serverAddress: string | null = null;
    private subscriptions: number[] = [];
    
    private readonly mode: WrappedSignal<MultiplayerMode> = createWrappedSignal<MultiplayerMode>(MultiplayerMode.AS_GUEST);
    private readonly state: WrappedSignal<ColonyState> = createWrappedSignal<ColonyState>(ColonyState.CLOSED);
    private readonly log: Logger;
    constructor(
        private readonly backend: BackendIntegration,
        log: Logger,
        private readonly multiplexer: IExpandedAccessMultiplexer,
        mode: MultiplayerMode,
    ) {
        this.mode = createWrappedSignal(mode);
        this.log = log.copyFor('mp int');
    }

    public getMode = this.mode.get; //Function ref to Accessor<MultiplayerMode>
    public getState = this.state.get; //Function ref to Accessor<ColonyState>

    public getServerStatus = async (): Promise<ResCodeErr<HealthCheckDTO>> => {
        if (this.serverAddress === null) {
            return { res: null, code: 600, err: 'Not connected to a server' };
        }
        let res;
        try {
            res = await fetch(`${this.serverAddress}/health`);
        } catch (e) {
            return { res: null, code: 600, err: 'Failed to send request for server status' };
        }
        if (!res.ok) {
            return { res: null, code: res.status, err: 'Failed to get server status' };
        }
        const json = await res.json();
        return { res: json, code: res.status, err: null };
    };

    public getLobbyState = async (): Promise<ResCodeErr<LobbyStateResponseDTO>> => {
        if (this.connectedLobbyID === null || this.serverAddress === null) {
            return { res: null, code: 601, err: 'Not connected to a lobby' };
        }
        let res;
        try {
            res = await fetch(`${this.serverAddress}/lobby/${this.connectedLobbyID}`);
        } catch (e) {
            return { res: null, code: 600, err: 'Failed to send request for lobby state' };
        }
        if (!res.ok) {
            return { res: null, code: res.status, err: 'Failed to get lobby state' };
        }
        const json = await res.json();
        return { res: json, code: res.status, err: null };
    };

    public connect = async (colonyCode: ColonyCode, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        const { res, code, err } = await this.backend.joinColony(colonyCode);
        if (err != null) {
            return 'Failed to get multiplayer server address from backend. Code: ' + code + ' Error: ' + err;
        }
        const address = res.multiplayerServerAddress;
        const lobbyID = res.lobbyID;
        const computedIGN = this.backend.localPlayer.firstName + ' ' + this.backend.localPlayer.lastName;
        const ownerOfColonyJoined = res.ownerID;

        //protocol://host:port is provided by the main backend, as well as lobby id
        let conn;
        try {
            conn = new WebSocket(`${address}/connect?IGN=${computedIGN}&lobbyID=${lobbyID}&clientID=${this.backend.localPlayer.id}`);
        } catch (e) {
            return 'Initial connection attempt to multiplayer server failed. Error: ' + JSON.stringify(e);
        }

        this.mode.set(ownerOfColonyJoined === this.backend.localPlayer.id ? MultiplayerMode.AS_OWNER : MultiplayerMode.AS_GUEST);
        this.state.set(ColonyState.OPEN);
        this.connectedLobbyID = lobbyID;
        this.serverAddress = address;

        //Unsubscribe from all previous subscriptions, if any
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.multiplexer.unsubscribe(...this.subscriptions);
        }
        
        //Subscribe to all events coming from this frontend's user's actions
        //in order to replicate them back to the server, which will then send them to all other clients
        //However only subscribe to those which this user is allowed to send to the server in the first place
        this.subscriptions = Object.values(EVENT_ID_MAP)
            .filter((spec) => {
                const mode = this.mode.get();
                return (
                    (mode === MultiplayerMode.AS_OWNER && (spec.permissions.owner || spec.permissions.guest)) ||
                    (mode === MultiplayerMode.AS_GUEST && spec.permissions.guest)
                );
            })
            .map((spec) => {
                return this.multiplexer.subscribe(spec, (data) => {
                    this.send(data, spec);
                });
            });

        return this.configureConnection(conn, onClose);
    };

    /**
     * @param spec Needed to efficiently serialize data
     *
     * Exceptionally allowed to THROW
     */
    private send = async <T extends IMessage>(data: T, spec: EventSpecification<T>) => {
        this.connection?.send(createViewAndSerializeMessage(data, spec));
    };

    private configureConnection = (conn: WebSocket, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        conn.onopen = () => {
            this.log.trace(`[multiplayer] Connection to server established: ${conn.url}`);
            this.connection = conn;
        };
        conn.onerror = (ev) => {
            this.log.error(`[multiplayer] Connection error: ${ev}`);
        };
        conn.onmessage = (ev) =>
            ev.data
                .arrayBuffer()
                .then((buffer: ArrayBuffer) => {
                    const view = new DataView(buffer);
                    const { sourceID, eventID } = readSourceAndEventID(view);
                    const spec = EVENT_ID_MAP[eventID];

                    if (!spec || spec === null) {
                        this.log.error(`[mp int] Received event with unknown ID: ${eventID}`);
                        return;
                    }

                    const decoded = serializeTypeFromData(view, sourceID, spec);

                    this.multiplexer.emitRAW(decoded);
                })
                .catch((e: Error) => {
                    this.log.error(`[mp int] Error while processing message: ${e}`);
                });

        conn.onclose = (ce: CloseEvent) => {
            onClose(ce);
            this.multiplexer.unsubscribe(...this.subscriptions);
        };
        return Promise.resolve(undefined);
    };
}
