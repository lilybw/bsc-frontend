import { Logger } from "../../logging/filteredLogger"
import { ResErr } from "../../meta/types"
import { BackendIntegration } from "../main_backend/mainBackend"
import { PlayerID } from "../main_backend/mainBackendDTOs"
import { IExpandedAccessMultiplexer } from "./eventMultiplexer"

export interface IMultiplayerIntegration {
    connect: (lobbyID: number) => Promise<Error | undefined>;
}

export const initializeMultiplayerIntegration = (backend: BackendIntegration, log: Logger, multiplexer: IExpandedAccessMultiplexer): ResErr<IMultiplayerIntegration> => {
    const integration = new MultiplayerIntegrationImpl(backend, log, multiplexer);
    return {res: integration, err: null};
}

class MultiplayerIntegrationImpl implements IMultiplayerIntegration {
    constructor(
        private readonly backend: BackendIntegration,
        private readonly log: Logger,
        private readonly multiplexer: IExpandedAccessMultiplexer
    ){}

    connect = async (lobbyID: number): Promise<Error | undefined> => {
        return new Error("not implemented");
    }
}