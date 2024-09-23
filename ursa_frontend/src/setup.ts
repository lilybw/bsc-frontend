import { JSX } from "solid-js/jsx-runtime";
import { ENV, initializeEnvironment } from "./environment/manager";
import { initializeBackendIntegration } from "./integrations/main_backend/mainBackend";
import { initializeVitecIntegration } from "./integrations/vitec/vitecIntegration";
import { initializeLogger } from "./logging/filteredLogger";
import { ApplicationContext, ResErr, RuntimeMode } from "./meta/types";
import { render } from "solid-js/web";
import GlobalContainer from "./GlobalContainer";
import { SessionInitiationRequestDTO } from "./integrations/main_backend/mainBackendDTOs";
import { LanguagePreference, VitecIntegrationInformation } from "./integrations/vitec/vitecDTOs";
import { Component } from "solid-js";
import { ApplicationProps } from "./ts/types";

/**
 * Single source of truth: this
 */
export const SOLIDJS_MOUNT_ELEMENT_ID = 'solidjs-inlay-root';
export type URSAInitializationFunction = (vitecInfo: VitecIntegrationInformation) => (() => void) | null;
export const URSA_INITIALIZATION_FUNCTION_NAME = 'initializeURSABundle';

export const initApp = (app: Component<ApplicationProps>) => {
    // global function that Angular will call
    (window as any)[URSA_INITIALIZATION_FUNCTION_NAME] = (vitecInfo: VitecIntegrationInformation) => {
        const root = document.getElementById(SOLIDJS_MOUNT_ELEMENT_ID);
    
        if (!root) {
            console.error('Root element not found.');
            return;
        }
    
        const dispose = render(() => GlobalContainer({ app, vitecInfo }), root);
    
        // Return a cleanup function
        return () => {
            dispose();
        };
    };
  
    // For development mode, initialize with mock data
    if (import.meta.env.DEV || import.meta.env.TEST) {
        const mockVitecInfo: VitecIntegrationInformation = {
            userIdentifier: 'dev-user-123',
            firstName: 'DevUser',
            surName: 'TheeWhoCommits',
            languagePreference: LanguagePreference.English,
            locationUrl: "http://localhost:"+(import.meta.env.VITE_PORT ?? 3000) +"/"+import.meta.env.BASE_URL,
        };
        (window as any)[URSA_INITIALIZATION_FUNCTION_NAME](mockVitecInfo); 
    }
}

export const initContext = async (vitecInfo: VitecIntegrationInformation): Promise<ResErr<ApplicationContext>> => {
    const environment = initializeEnvironment();
    const log = initializeLogger(environment);
    log.log('[setup] Initializing application context');
    
    const vitecIntegrationResult = await initializeVitecIntegration(environment, log);
    if (vitecIntegrationResult.err != null) {
        return Promise.reject({res: null, err: vitecIntegrationResult.err});
    }
    log.log('[setup] Vitec integration complete');
    const sessionInitInfo: SessionInitiationRequestDTO = {
        userIdentifier: vitecInfo.userIdentifier,
        IGN: vitecInfo.firstName,
        currentSessionToken: vitecIntegrationResult.res.sessionToken
    }

    const backendIntegrationInit = await initializeBackendIntegration(environment, log, sessionInitInfo);
    if (backendIntegrationInit.err != null) {
        return Promise.reject({res: null, err: backendIntegrationInit.err});
    }
    const playerInfoRes = await backendIntegrationInit.res.getPlayerInfo(backendIntegrationInit.res.internalPlayerID);
    if (playerInfoRes.err != null) {
        return Promise.reject({res: null, err: playerInfoRes.err});
    }
    log.log("[delete me] Player info: "+JSON.stringify(playerInfoRes.res));
    log.log('[setup] Main backend integration complete');

    await delaySetupIfDevOrTest(environment);
    
    console.log(environment);
    const context: ApplicationContext = {
        backend: backendIntegrationInit.res,
        logger: log,
        vitec: vitecIntegrationResult.res,
        multiplayer: undefined as any,
        player: playerInfoRes.res
    };
    return Promise.resolve({res: context, err: null});
}
const delayTimeMS = 0;
const delaySetupIfDevOrTest = async (environment: ENV) => {
    if (environment.runtimeMode === RuntimeMode.DEVELOPMENT || environment.runtimeMode === RuntimeMode.TEST) {
        console.log('[setup] Delaying setup for '+delayTimeMS+' seconds');
        await new Promise((resolve) => setTimeout(resolve, delayTimeMS));
    }
}