import { Logger } from "../../logging/filteredLogger"
import { ResErr } from "../../meta/types"
import { BackendIntegration } from "../main_backend/mainBackend"
import { IExpandedAccessMultiplexer } from "./eventMultiplexer"

export type MultiplayerIntegration = {
    
}

export const initializeMultiplayerIntegration = (backend: BackendIntegration, log: Logger, multiplexer: IExpandedAccessMultiplexer): ResErr<MultiplayerIntegration> => {
    
    
    return {res: null, err: "not implemented"};
}