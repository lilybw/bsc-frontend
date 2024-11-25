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
): ResErr<IMultiplayerIntegration> => {
    const integration = new MultiplayerIntegrationImpl(backend, log, multiplexer);
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
    ) {
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
        const url = `${address}/connect?IGN=${computedIGN}&lobbyID=${lobbyID}&clientID=${localUserID}&colonyID=${res.colonyId}&ownerID=${ownerOfColonyJoined}`
        this.log.trace(`Connecting to lobby: ${lobbyID} at ${address}, as user id: ${localUserID}`);
        const connectAttempt = await websocketConnectHelper(url);
        if (connectAttempt.err != null) {
            return connectAttempt.err;
        }
        const conn = connectAttempt.res;
        
        const newMode = ownerOfColonyJoined === this.backend.player.local.id ? MultiplayerMode.AS_OWNER : MultiplayerMode.AS_GUEST;
        this.log.subtrace(`Local player joined lobby as: ${newMode}`);
        this.mode.set(newMode);
        this.state.set(ColonyState.OPEN);
        this.code.set(colonyCode);
        this.connectedLobbyID = lobbyID;
        this.serverAddress = address;
        this.connection = conn;

        //Unsubscribe from all previous subscriptions, if any
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.multiplexer.unsubscribe(...this.subscriptions);
        }

        //Subscribe to all events coming from this frontend's user's actions
        //in order to replicate them back to the server, which will then send them to all other clients
        //However only subscribe to those which this user is allowed to send to the server in the first place
        this.subscriptions = Object.values(EVENT_ID_MAP)
            .filter((spec) => {
                return (
                    (newMode === MultiplayerMode.AS_OWNER && (spec.permissions.owner || spec.permissions.guest)) ||
                    (newMode === MultiplayerMode.AS_GUEST && spec.permissions.guest)
                );
            })
            .map(this.establishSubscription);

        return this.configureConnection(conn, onClose);
    };
    //Extracted as own function for the generic parameter
    private establishSubscription = <T extends IMessage>(spec: EventSpecification<T>) => {
        return this.multiplexer.subscribe(
            spec,
            Object.assign((data: T) => this.send(data, spec), { internalOrigin: this.internalOriginID }),
        );
    };

    public disconnect = async () => {
        this.log.info('disconnecting from lobby');
        this.connection?.close();
        this.connection = null;
        this.state.set(ColonyState.CLOSED);
        this.code.set(null);
        //We do not have to overwrite mode, as it is tied to the current colony, not the lobby
        //And if the current colony is dismounted, the app reloads anyways
        this.serverAddress = null;
        this.connectedLobbyID = null;
    };

    /**
     * @param spec Needed to efficiently serialize data
     *
     * Exceptionally allowed to THROW
     */
    private send = async <T extends IMessage>(data: T, spec: EventSpecification<T>) => {
        this.log.subtrace(`Sending message with event id: ${spec.id} name: ${spec.name}`);
        this.connection?.send(createViewAndSerializeMessage(data, spec));
    };

    /** From Socket */
    private onMessageRecieved = async (ev: MessageEvent) => {
        if (!ev.data || typeof ev.data.arrayBuffer != "function") {
            this.log.error(`Received message without arrayBuffer function: ${ev.data}`);
            return;
        }

        const buffer: ArrayBuffer = await ev.data.arrayBuffer();
        if (buffer.byteLength < 8) {
            this.log.error(`Received message with less than 8 bytes: ${buffer.byteLength}), origin: ${ev.origin}`);
            return;
        }
       
        const view = new DataView(buffer);

        const { sourceID, eventID } = readSourceAndEventID(view);
        const spec = EVENT_ID_MAP[eventID];

        if (!spec || spec === null) {
            this.log.error(`Received event with unknown ID: ${eventID}, source id: ${sourceID}, content as string: 
                ${parseGoTypeAtOffsetInView(view, 0, GoType.STRING)}
            `);
            return;
        }

        const decoded = serializeTypeFromData(view, sourceID, spec);

        this.multiplexer.emitRAW(decoded, this.internalOriginID); 
    }

    private configureConnection = async (conn: WebSocket, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        conn.onerror = (ev) => {
            this.log.error(`[multiplayer] Connection error: ${JSON.stringify(ev)}`);
            this.disconnect();
        };

        conn.onmessage = this.onMessageRecieved;

        conn.onclose = (ce: CloseEvent) => {
            onClose(ce);
            this.multiplexer.unsubscribe(...this.subscriptions);
            this.disconnect();
        };
        return undefined;
    };
}

export const WebSocketCodeMessage = {
    1000: 'Normal Closure',
    1001: 'Going Away',
    1002: 'Protocol Error',
    1003: 'Unsupported Data',
    1005: 'No Status Received',
    1006: 'Abnormal Closure (possible network error or CORS issue)',
    1007: 'Invalid frame payload data',
    1008: 'Policy Violation',
    1009: 'Message too big',
    1010: 'Missing Extension',
    1011: 'Internal Error',
    1015: 'TLS Handshake Error'
}
export const WebSocketStateMessage = {
    0: 'CONNECTING',
    1: 'OPEN',
    2: 'CLOSING',
    3: 'CLOSED'
}

const websocketConnectHelper = async (url: string): Promise<ResErr<WebSocket>> => {
    let socket: WebSocket | null = null;
    try {
        socket = new WebSocket(url);

        await new Promise<WebSocket>((resolve, reject) => {
            let errorOccurred = false;
            socket!.onopen = () => {
                if (errorOccurred) {
                    reject(new Error('WebSocket Error Occurred before onopen unable to determine if connection was successful'));
                }    
                resolve(socket!)
            };
    
            socket!.onerror = (error: Event) => {
                // There is no information in the error event, so we have to wait for onclose
                errorOccurred = true;
            };
            
            socket!.onclose = (event) => {
                const details: any = {
                    code: event.code,
                    reason: event.reason || 'No reason provided',
                    wasClean: event.wasClean,
                    url: url,
                    timestamp: new Date().toISOString()
                };
                
                // Map common close codes to readable messages
                const codeMessage = WebSocketCodeMessage[event.code as keyof typeof WebSocketCodeMessage] 
                    || 'Unknown Close Code';
                
                details.meaning = codeMessage;
                
                reject(new Error(`WebSocket Closed - ${JSON.stringify(details)}`));
            };
    
            setTimeout(() => {
                const state = socket?.readyState;
                reject(new Error(`WebSocket Timeout - Current state: 
                    ${WebSocketStateMessage[state as keyof typeof WebSocketStateMessage]}`));
            }, 5000);
        });
        
        return { res: socket, err: null };
    } catch (e) {
        if (socket) {
            socket.close();
        }
        return { 
            res: null, 
            err: `Failed to create WebSocket connection: ${e instanceof Error ? e.message : JSON.stringify(e)}`
        };
    }
}