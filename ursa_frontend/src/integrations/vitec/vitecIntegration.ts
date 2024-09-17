import { ResErr, RuntimeMode } from "../../meta/types";
import { ENV } from "../../environment/manager";
import { Logger } from "../../logging/filteredLogger";
import { SessionInitiationRequestDTO } from "../main_backend/mainBackendDTOs";

const SESSION_COOKIE_NAME = 'mvf_session_id';

export type VitecIntegration = {
    getUserInfo: () => Promise<ResErr<SessionInitiationRequestDTO>>
}


export async function initializeVitecIntegration(environment: ENV, log: Logger): Promise<ResErr<VitecIntegration>> {
    document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    const integration: VitecIntegration = {
        getUserInfo: () => getUserInfo(environment, log)
    };
    if (environment.runtimeMode === RuntimeMode.TEST) {
        integration.getUserInfo = () => Promise.resolve({res: environment.testUser!, err: null });
    }

    return {res: integration, err: null};
}

const getUserInfo = async (environment: ENV, log: Logger): Promise<ResErr<SessionInitiationRequestDTO>> => {
    return {res: null, err: "VitecMV integration not implemented"};  
}
