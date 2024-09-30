import { Accessor, createSignal } from "solid-js"
import { Logger } from "../../logging/filteredLogger"
import { type Error, MultiplayerMode, ResErr } from "../../meta/types"
import { BackendIntegration } from "../main_backend/mainBackend"
import { ColonyCode, PlayerID } from "../main_backend/mainBackendDTOs"
import { createViewAndSerializeMessage, parseGoTypeAtOffsetInView, readSourceAndEventID } from "./binUtil"
import { IExpandedAccessMultiplexer } from "./eventMultiplexer"
import { EVENT_ID_MAP, EventSpecification, IMessage, OriginType } from "./EventSpecifications-v0.0.7"
import { createWrappedSignal, WrappedSignal } from "../../ts/wrappedSignal"

export interface RawMessage<T> extends IMessage { [key: string]: any; }

export interface IMultiplayerIntegration {
    getMode: Accessor<MultiplayerMode>;
    connect: (lobbyID: number, onClose: (ev: CloseEvent) => void) => Promise<Error | undefined>;
}

export const initializeMultiplayerIntegration = (backend: BackendIntegration, log: Logger, multiplexer: IExpandedAccessMultiplexer, mode: MultiplayerMode): ResErr<IMultiplayerIntegration> => {
    const integration = new MultiplayerIntegrationImpl(backend, log, multiplexer, mode);
    
    return {res: integration, err: null};
}

class MultiplayerIntegrationImpl implements IMultiplayerIntegration {
    private connection: WebSocket | null = null;
    /**
     * Overwritten on connect
     */
    private subscriptions: number[] = [];
    private mode: WrappedSignal<MultiplayerMode> = createWrappedSignal<MultiplayerMode>(MultiplayerMode.AS_GUEST);
    constructor(
        private readonly backend: BackendIntegration,
        private readonly log: Logger,
        private readonly multiplexer: IExpandedAccessMultiplexer,
        mode: MultiplayerMode
    ){
        this.mode = createWrappedSignal(mode);
    }

    public getMode = this.mode.get;

    public connect = async (colonyCode: ColonyCode, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        const { res, code, err } = await this.backend.joinColony(colonyCode); if (err != null) {
            return "Failed to get multiplayer server address from backend. Code: "+code+" Error: "+err;
        }
        const address = res.multiplayerServerAddress;
        const lobbyID = res.lobbyID;
        const computedIGN = this.backend.localPlayer.firstName + " " + this.backend.localPlayer.lastName;
        const ownerOfColonyJoined = res.ownerID;

        //url: ws://localhost:8080/connect?IGN=ItsaMe&lobbyID=0&clientID=1
        //protocol://host:port is provided by the main backend, as well as lobby id
        let conn;
        try {
            conn = new WebSocket(`${address}/connect?IGN=${computedIGN}&lobbyID=${lobbyID}&clientID=${this.backend.localPlayer.id}`);
        } catch (e) {
            return "Connection to multiplayer server failed. Error: "+JSON.stringify(e);
        }

        this.mode.set(ownerOfColonyJoined === this.backend.localPlayer.id ? MultiplayerMode.AS_OWNER : MultiplayerMode.AS_GUEST);

        //Subscribe to all events coming from this frontend's user's actions
        //in order to replicate them back to the server, which will then send them to all other clients
        //However only subscribe to those which this user is allowed to send to the server in the first place
        this.subscriptions = Object.values(EVENT_ID_MAP).filter(spec => {
            const mode = this.mode.get();
            return (mode === MultiplayerMode.AS_OWNER && (spec.permissions.owner || spec.permissions.guest))
                     ||
                   (mode === MultiplayerMode.AS_GUEST && spec.permissions.guest);
        }).map(spec => {
            return this.multiplexer.subscribe(spec, (data) => { this.send(data, spec); });
        })

        return this.configureConnection(conn, onClose);
    }

    /**
     * @param spec Needed to efficiently serialize data
     * 
     * Exceptionally allowed to THROW
     */
    private send = async <T extends IMessage>(data: T, spec: EventSpecification<T>) => {
        this.connection?.send(createViewAndSerializeMessage(data, spec));
    }

    private configureConnection = (conn: WebSocket, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        conn.onopen = () => {
            this.log.trace(`[multiplayer] Connection to server established`);
            this.connection = conn;
        }
        conn.onerror = (ev) => {
            this.log.error(`[multiplayer] Connection error: ${ev}`);
        }
        conn.onmessage = (ev) => ev.data.arrayBuffer().then((buffer: ArrayBuffer) => {
                const view = new DataView(buffer);
                const {sourceID, eventID} = readSourceAndEventID(view);
                const spec = EVENT_ID_MAP[eventID];

                if (!spec || spec == null) {
                    this.log.error(`[mp int] Received event with unknown ID: ${eventID}`);
                    return;
                }

                let decoded: RawMessage<unknown> = {
                    senderID: sourceID,
                    eventID,
                };

                for (const messageElement of spec.structure) {
                    const fieldName = messageElement.fieldName;
                    const value = parseGoTypeAtOffsetInView(view, messageElement.offset, messageElement.type);
                    decoded[fieldName] = value;
                }

                this.multiplexer.emitRAW(decoded);

            }).catch((e: Error) => {
                this.log.error(`[mp int] Error while processing message: ${e}`);
            })
        
        conn.onclose = onClose;
        return Promise.resolve(undefined);
    }
}