import { Logger } from "../../logging/filteredLogger"
import { type Error, ResErr } from "../../meta/types"
import { BackendIntegration } from "../main_backend/mainBackend"
import { ColonyCode, PlayerID } from "../main_backend/mainBackendDTOs"
import { IExpandedAccessMultiplexer } from "./eventMultiplexer"

export interface IMultiplayerIntegration {
    connect: (lobbyID: number, onClose: (ev: CloseEvent) => void) => Promise<Error | undefined>;
}

export const initializeMultiplayerIntegration = (backend: BackendIntegration, log: Logger, multiplexer: IExpandedAccessMultiplexer): ResErr<IMultiplayerIntegration> => {
    const integration = new MultiplayerIntegrationImpl(backend, log, multiplexer);
    
    return {res: integration, err: null};
}

class MultiplayerIntegrationImpl implements IMultiplayerIntegration {
    private connection: WebSocket | null = null;

    constructor(
        private readonly backend: BackendIntegration,
        private readonly log: Logger,
        private readonly multiplexer: IExpandedAccessMultiplexer
    ){}

    connect = async (colonyCode: ColonyCode, onClose: (ev: CloseEvent) => void): Promise<Error | undefined> => {
        const { res, code, err } = await this.backend.joinColony(colonyCode); if (err != null) {
            return "Failed to get multiplayer server address from backend. Code: "+code+" Error: "+err;
        }
        const address = res.multiplayerServerAddress;
        const lobbyID = res.lobbyID;
        const computedIGN = this.backend.localPlayer.firstName + " " + this.backend.localPlayer.lastName;

        //url: ws://localhost:8080/connect?IGN=ItsaMe&lobbyID=0&clientID=1
        let conn;
        try {
            conn = new WebSocket(`${address}/connect?IGN=${computedIGN}&lobbyID=${lobbyID}&clientID=${this.backend.localPlayer.id}`);
        } catch (e) {
            return "Connection to multiplayer server failed. Error: "+JSON.stringify(e);
        }
        conn.onclose = (ev) => {}

    }
}