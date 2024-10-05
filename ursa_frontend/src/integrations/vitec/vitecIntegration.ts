import { ResErr, RuntimeMode } from '../../meta/types';
import { ENV } from '../../environment/manager';
import { Logger } from '../../logging/filteredLogger';
import { LanguagePreference, LanguagePreferenceAliases, NormalizedVitecIntegrationInformation, VitecIntegrationInformation } from './vitecDTOs';
import { SubURLs } from './integrationConstants';
/**
 * Single source of truth: The 10-finger angular project: ./src/app/services/auth.service.ts
 */
const SESSION_COOKIE_NAME = 'mvf_session_id';

export type VitecIntegration = {
    sessionToken: string;
    info: NormalizedVitecIntegrationInformation;
};

export async function initializeVitecIntegration(
    info: VitecIntegrationInformation,
    environment: ENV,
    log: Logger,
): Promise<ResErr<VitecIntegration>> {
    log.trace('[mv int] Initializing Vitec integration');
    const userInfoRes = await getSessionToken(environment, log);
    if (userInfoRes.err != null) {
        return { res: null, err: userInfoRes.err };
    }
    const verifiedInfoAttempt = verifyIntegrationInformation(info);
    if (verifiedInfoAttempt.err != null) {
        return { res: null, err: verifiedInfoAttempt.err };
    }
    const integration: VitecIntegration = {
        sessionToken: userInfoRes.res,
        info: verifiedInfoAttempt.res,
    };
    log.trace('[mv int] Vitec integration initialized');
    return { res: integration, err: null };
}

const verifyIntegrationInformation = (info: VitecIntegrationInformation): ResErr<NormalizedVitecIntegrationInformation> => {
    const languageRes = assureUniformLanguageCode(info.languagePreference);
    if (languageRes.err != null) {
        return { res: null, err: languageRes.err };
    }

    if (!info.locationUrl.startsWith('http')) {
        return { res: null, err: `Something's wrong with the location URL: ${info.locationUrl}` };
    }

    //e.g.: protocol://ip:port/ -> protocol://ip:port
    if (info.locationUrl.endsWith('/')) {
        info.locationUrl = info.locationUrl.slice(0, -1);
    }

    let computedCommonSubUrl = info.currentSubUrl;
    let foundMatch = false;
    for (const suburl of Object.values(SubURLs)) {
        if (info.currentSubUrl.endsWith(suburl)) {
            computedCommonSubUrl = info.currentSubUrl.slice(0, -suburl.length);
            foundMatch = true;
            break;
        }
    }
    if (!foundMatch) { //If there is not url extension present, it must be the base suburl itself
        computedCommonSubUrl = info.currentSubUrl;
    }

    return { res: { 
        ...info, 
        languagePreference: languageRes.res,
        commonSubUrl: computedCommonSubUrl
    }, 
        err: null 
    };
};

const getSessionToken = async (environment: ENV, log: Logger): Promise<ResErr<string>> => {
    const sessionRes = parseForSessionCookie(log);
    if (sessionRes.err != null) {
        if (environment.runtimeMode !== RuntimeMode.PRODUCTION) {
            return Promise.resolve({ res: 'CookieNotFoundResortingToThisAsDevSessionToken', err: null });
        }
        return { res: null, err: sessionRes.err };
    }

    return { res: sessionRes.res, err: null };
};

export const assureUniformLanguageCode = (language: string): ResErr<LanguagePreference> => {
    const languageLowerCased = language.toLocaleLowerCase();
    for (const key in LanguagePreferenceAliases) {
        for (const alias of LanguagePreferenceAliases[key as LanguagePreference]) {
            if (alias.toLocaleLowerCase() === languageLowerCased) {
                return { res: key as LanguagePreference, err: null };
            }
        }
    }
    return { res: null, err: `Language code ${language} has no registered aliases` };
};


const parseForSessionCookie = (log: Logger): ResErr<string> => {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(SESSION_COOKIE_NAME)) {
            const splitOnEquals = cookie.split('=');
            if (splitOnEquals.length < 2) {
                return { res: null, err: `Session cookie found, but had no value: ${cookie}` };
            }
            return { res: splitOnEquals[1], err: null };
        }
    }
    return { res: null, err: 'No session cookie found' };
};
