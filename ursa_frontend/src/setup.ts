import { ENV, initializeEnvironment } from "./environment/manager";
import { initializeBackendIntegration } from "./integrations/main_backend/mainBackend";
import { initializeVitecIntegration } from "./integrations/vitec/vitecIntegration";
import { initializeLogger } from "./logging/filteredLogger";
import { ApplicationContext, ResErr, RuntimeMode } from "./meta/types";

export const init = async (): Promise<ResErr<ApplicationContext>> => {
    const environment = initializeEnvironment();
    const log = initializeLogger(environment);
    log.log('[setup] Initializing application context');
    
    const vitecIntegrationResult = await initializeVitecIntegration(environment, log);
    if (vitecIntegrationResult.err != null) {
        return Promise.reject({res: null, err: vitecIntegrationResult.err});
    }
    log.log('[setup] Vitec integration complete');

    const backendIntegrationInit = await initializeBackendIntegration(environment, log, vitecIntegrationResult.res.userInfo);
    if (backendIntegrationInit.err != null) {
        return Promise.reject({res: null, err: backendIntegrationInit.err});
    }
    log.log('[setup] Main backend integration complete');


    await delaySetupIfDevOrTest(environment);
    console.log(environment);
    const context: ApplicationContext = {
        backend: backendIntegrationInit.res,
        logger: log,
        vitec: vitecIntegrationResult.res,
        multiplayer: undefined as any
    };
    return Promise.resolve({res: context, err: null});
}
const delayTimeMS = 5000;
const delaySetupIfDevOrTest = async (environment: ENV) => {
    if (environment.runtimeMode === RuntimeMode.DEVELOPMENT || environment.runtimeMode === RuntimeMode.TEST) {
        console.log('[setup] Delaying setup for '+delayTimeMS+' seconds');
        await new Promise((resolve) => setTimeout(resolve, delayTimeMS));
    }
}