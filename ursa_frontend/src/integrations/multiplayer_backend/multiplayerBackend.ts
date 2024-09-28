import { Logger } from "../../logging/filteredLogger"
import { ResErr } from "../../meta/types"
import { BackendIntegration } from "../main_backend/mainBackend"
import { IEventMultiplexer } from "./eventMultiplexer"

export type MultiplayerIntegration = {
    
}

export const initializeMultiplayerIntegration = (backend: BackendIntegration, log: Logger, multiplexer: IEventMultiplexer): ResErr<MultiplayerIntegration> => {
    return {res: null, err: "not implemented"};
}