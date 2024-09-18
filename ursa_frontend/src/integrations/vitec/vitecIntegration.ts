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
    const sessionRes = parseForSessionCookie(log);
    if (sessionRes.err != null) {
        return {res: null, err: sessionRes.err};
    }

    const user: VitecUserInfo = {
        userIdentifier: "test",
        currentSessionToken: sessionRes.res,
        IGN: "none",
        LanguagePreference: "en"
    }

    return {res: user, err: null};  
}

const parseForSessionCookie = (log: Logger): ResErr<string> => {
    const cookies = document.cookie.split(';');
    log.trace(`[mv int] Available cookies: ${cookies}`);
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(SESSION_COOKIE_NAME)) {
            const splitOnEquals = cookie.split('=');
            if (splitOnEquals.length < 2) {
                return {res: null, err: `Session cookie found, but no value found for cookie: ${cookie}`};
            }
            return {res: splitOnEquals[1], err: null};
        }
    }
    return {res: null, err: "No session cookie found"};
}
