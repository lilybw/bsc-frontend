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
import { EVENT_ID_MAP, EventSpecification, GoType, IMessage, OriginType } from './EventSpecifications';
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
     * The code of the currently connected colony.
     */
    getCode: Accessor<ColonyCode | null>;
    connect: (code: ColonyCode, onClose: (ev: CloseEvent) => void) => Promise<Error | undefined>;
    disconnect: () => Promise<void>;
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
    
    private readonly mode: WrappedSignal<MultiplayerMode> = createWrappedSignal<MultiplayerMode>(MultiplayerMode.AS_OWNER);
    private readonly state: WrappedSignal<ColonyState> = createWrappedSignal<ColonyState>(ColonyState.CLOSED);
    private readonly code: WrappedSignal<ColonyCode | null> = createWrappedSignal<ColonyCode | null>(null);
    private readonly log: Logger;
    private readonly internalOriginID: string = 'multiplayerIntegration';
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
    public getCode = this.code.get; //Function ref to Accessor<ColonyCode | null>

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
        //Proxying calls for now to avoid preflight checks
        return this.backend.proxy.multiplayer.getLobbyState(this.connectedLobbyID);
    };

    public connect = async (colonyCode: ColonyCode, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        const { res, code, err } = await this.backend.colony.join(colonyCode);
        if (err != null) {
            return 'Failed to get multiplayer server address from backend. Code: ' + code + ' Error: ' + err;
        }
        const address = res.multiplayerServerAddress;
        const lobbyID = res.lobbyId;
        const computedIGN = this.backend.player.local.firstName + ' ' + this.backend.player.local.lastName;
        const ownerOfColonyJoined = res.owner;
        const localUserID = this.backend.player.local.id;
        
        //protocol://host:port is provided by the main backend, as well as lobby id
        let conn;
        try {
            this.log.trace(`Connecting to lobby: ${lobbyID} at ${address}, as user id: ${localUserID}`);
            conn = new WebSocket(`${address}/connect?IGN=${computedIGN}&lobbyID=${lobbyID}&clientID=${localUserID}`);
        } catch (e) {
            return 'Initial connection attempt to multiplayer server failed. Error: ' + JSON.stringify(e);
        }

        this.mode.set(ownerOfColonyJoined === this.backend.player.local.id ? MultiplayerMode.AS_OWNER : MultiplayerMode.AS_GUEST);
        this.state.set(ColonyState.OPEN);
        this.code.set(colonyCode);
        this.connectedLobbyID = lobbyID;
        this.serverAddress = address;

        //Unsubscribe from all previous subscriptions, if any
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.multiplexer.unsubscribe(...this.subscriptions);
        }
        
        const mode = this.mode.get();
        //Subscribe to all events coming from this frontend's user's actions
        //in order to replicate them back to the server, which will then send them to all other clients
        //However only subscribe to those which this user is allowed to send to the server in the first place
        this.subscriptions = Object.values(EVENT_ID_MAP)
            .filter((spec) => {
                return (
                    (mode === MultiplayerMode.AS_OWNER && (spec.permissions.owner || spec.permissions.guest)) ||
                    (mode === MultiplayerMode.AS_GUEST && spec.permissions.guest)
                );
            })
            .map(this.establishSubscription);

        return this.configureConnection(conn, onClose);
    };
    //Extracted as own function for the generic parameter
    private establishSubscription = <T extends IMessage>(spec: EventSpecification<T>) => {
        return this.multiplexer.subscribe(spec, 
            Object.assign(
                (data: T) => this.send(data, spec), 
                { internalOrigin: this.internalOriginID }
            )
        );
    }

    public disconnect = async () => {
        this.log.info("disconnecting from lobby")
        this.connection?.close();
        this.state.set(ColonyState.CLOSED);
        this.code.set(null);
        //We do not have to overwrite mode, as it is tied to the current colony, not the lobby
        //And if the current colony is dismounted, the app reloads anyways
        this.serverAddress = null;
        this.connectedLobbyID = null;
    }

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
            this.log.error(`[multiplayer] Connection error: ${JSON.stringify(ev)}`);
        };
        conn.onmessage = (ev) =>
            ev.data
                .arrayBuffer()
                .then((buffer: ArrayBuffer) => {
                    const view = new DataView(buffer);
                    if (view.byteLength < 8) {
                        this.log.error(`Received message with less than 8 bytes: ${view.byteLength}, content as string: 
                            ${parseGoTypeAtOffsetInView(view, 8, GoType.STRING)}
                        `);
                        
                        return;
                    }

                    const { sourceID, eventID } = readSourceAndEventID(view);
                    const spec = EVENT_ID_MAP[eventID];

                    if (!spec || spec === null) {
                        this.log.error(`Received event with unknown ID: ${eventID}, source id: ${sourceID}, content as string: 
                            ${parseGoTypeAtOffsetInView(view, 8, GoType.STRING)}
                        `);
                        return;
                    }

                    const decoded = serializeTypeFromData(view, sourceID, spec);

                    this.multiplexer.emitRAW(decoded, this.internalOriginID);
                })
                .catch((e: Error) => {
                    this.log.error(`Error while processing message: ${e}`);
                });

        conn.onclose = (ce: CloseEvent) => {
            onClose(ce);
            this.multiplexer.unsubscribe(...this.subscriptions);
        };
        return Promise.resolve(undefined);
    };
}
