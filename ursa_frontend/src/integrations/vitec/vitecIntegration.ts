import { ResErr, RuntimeMode } from "../../meta/types";
import { ENV } from "../../environment/manager";
import { Logger } from "../../logging/filteredLogger";
import { VitecIntegrationInformation } from "./vitecDTOs";
/**
 * Single source of truth: The 10-finger angular project: ./src/app/services/auth.service.ts
 */
const SESSION_COOKIE_NAME = 'mvf_session_id';

export type VitecIntegration = {
    log: Logger,
    env: ENV,
    sessionToken: string,
    baseUrl: string
}

export async function initializeVitecIntegration(info: VitecIntegrationInformation, environment: ENV, log: Logger): Promise<ResErr<VitecIntegration>> {
    const userInfoRes = await getSessionToken(environment, log);
    if (userInfoRes.err != null) {
        return {res: null, err: userInfoRes.err};
    }
    const integration: VitecIntegration = {
        log: log,
        env: environment,
        sessionToken: userInfoRes.res,
        baseUrl: info.locationUrl
    };
    return {res: integration, err: null};
}

const getSessionToken = async (environment: ENV, log: Logger): Promise<ResErr<string>> => {
    const sessionRes = parseForSessionCookie(log);
    if (sessionRes.err != null) {
        if (environment.runtimeMode !== RuntimeMode.PRODUCTION) {
            return Promise.resolve({res: "CookieNotFoundResortingToThisAsDevSessionToken", err: null });
        }
        return {res: null, err: sessionRes.err};
    }

    return {res: sessionRes.res, err: null};  
}

const parseForSessionCookie = (log: Logger): ResErr<string> => {
    const cookies = document.cookie.split(';');
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
