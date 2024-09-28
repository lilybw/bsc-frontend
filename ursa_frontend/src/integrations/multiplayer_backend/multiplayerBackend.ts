import { Logger } from "../../logging/filteredLogger"
import { ResErr } from "../../meta/types"
import { BackendIntegration } from "../main_backend/mainBackend"
import { EventMultiplexer } from "./eventMultiplexer"

export type MultiplayerIntegration = {
    
}

export const initializeMultiplayerIntegration = (backend: BackendIntegration, log: Logger, multiplexer: EventMultiplexer): ResErr<MultiplayerIntegration> => {
    return {res: null, err: "not implemented"};
}