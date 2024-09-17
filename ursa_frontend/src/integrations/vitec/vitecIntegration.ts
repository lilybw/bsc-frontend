import { ResErr, RuntimeMode } from "../../meta/types";
import { ENV } from "../../environment/manager";
import { Logger } from "../../logging/filteredLogger";
import { SessionInitiationRequestDTO } from "../main_backend/mainBackendDTOs";

const SESSION_COOKIE_NAME = 'mvf_session_id';

export type VitecUserInfo = {
    /**
     * Losslessly hashed vitec user identifier
     */
    userIdentifier: string;
    /**
     * Current Vitec Session Token
     */
    currentSessionToken: string;
    /**
     * Username
     */
    IGN: string;
    LanguagePreference: string;
}

export type VitecIntegration = {
    log: Logger,
    env: ENV,
    userInfo: VitecUserInfo
}


export async function initializeVitecIntegration(environment: ENV, log: Logger): Promise<ResErr<VitecIntegration>> {
    const userInfoRes = await getUserInfo(environment, log);
    if (userInfoRes.err != null) {
        return {res: null, err: userInfoRes.err};
    }
    const integration: VitecIntegration = {
        log: log,
        env: environment,
        userInfo: userInfoRes.res
    };
    return {res: integration, err: null};
}

const getUserInfo = async (environment: ENV, log: Logger): Promise<ResErr<VitecUserInfo>> => {

    if (environment.runtimeMode === RuntimeMode.TEST) {
        return Promise.resolve({res: environment.testUser!, err: null });
    }

    return {res: null, err: "VitecMV integration not implemented"};  
}
