import { initializeEnvironment } from "./environment/manager";
import { initializeBackendIntegration } from "./integrations/main_backend/mainBackend";
import { initializeVitecIntegration } from "./integrations/vitec/vitecIntegration";
import { initializeLogger } from "./logging/filteredLogger";
import { ApplicationContext, ResErr } from "./meta/types";

export const init = async (): Promise<ResErr<ApplicationContext>> => {
    const environment = initializeEnvironment();
    const log = initializeLogger(environment);
    log.log('[setup] Initializing application context');
    
    const vitecIntegrationResult = await initializeVitecIntegration(environment, log);
    if (vitecIntegrationResult.err != null) {
        return Promise.reject({res: null, err: vitecIntegrationResult.err});
    }

    const backendIntegrationInit = await initializeBackendIntegration(environment, log, vitecIntegrationResult.res.userInfo);
    if (backendIntegrationInit.err != null) {
        return Promise.reject({res: null, err: backendIntegrationInit.err});
    }

    console.log(environment);
    const context: ApplicationContext = {
        backend: backendIntegrationInit.res,
        logger: log,
        vitec: vitecIntegrationResult.res,
        multiplayer: undefined as any
    };
    return Promise.resolve({res: context, err: null});
}