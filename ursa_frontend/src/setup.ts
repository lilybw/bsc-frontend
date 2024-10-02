import { JSX } from 'solid-js/jsx-runtime';
import { ENV, initializeEnvironment } from './environment/manager';
import { initializeBackendIntegration } from './integrations/main_backend/mainBackend';
import { initializeVitecIntegration } from './integrations/vitec/vitecIntegration';
import { initializeLogger } from './logging/filteredLogger';
import { ApplicationContext, Bundle, BundleComponent, MultiplayerMode, ResErr, RuntimeMode } from './meta/types';
import { render } from 'solid-js/web';
import GlobalContainer from './GlobalContainer';
import { SessionInitiationRequestDTO } from './integrations/main_backend/mainBackendDTOs';
import { LanguagePreference, VitecIntegrationInformation } from './integrations/vitec/vitecDTOs';
import { ApplicationProps } from './ts/types';
import { initializeInternationalizationService } from './integrations/main_backend/internationalization/internationalization';
import { initializeEventMultiplexer } from './integrations/multiplayer_backend/eventMultiplexer';
import { initializeMultiplayerIntegration } from './integrations/multiplayer_backend/multiplayerBackend';

/**
 * Single source of truth: this
 */
export const SOLIDJS_MOUNT_ELEMENT_ID = 'solidjs-inlay-root';
export type URSAInitializationFunction = (vitecInfo: VitecIntegrationInformation) => (() => void) | null;
export const URSA_INITIALIZATION_FUNCTION_NAME = 'initializeURSABundle';

export const initApp = (app: BundleComponent<ApplicationProps>) => {
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
            lastName: 'TheeWhoCommits',
            languagePreference: LanguagePreference.English,
            locationUrl: 'http://localhost:' + (import.meta.env.VITE_PORT ?? 3000),
            currentSubUrl: import.meta.env.BASE_URL,
            bundleRequested: app.bundle,
        };
        (window as any)[URSA_INITIALIZATION_FUNCTION_NAME](mockVitecInfo);
    }
};

export const initContext = async (vitecInfo: VitecIntegrationInformation): Promise<ResErr<ApplicationContext>> => {
    const environment = initializeEnvironment();
    const log = initializeLogger(environment);
    log.trace('Recieved vitec information: ' + JSON.stringify(vitecInfo));
    log.log('[setup] Initializing application context');

    const vitecIntegrationResult = await initializeVitecIntegration(vitecInfo, environment, log);
    if (vitecIntegrationResult.err != null) {
        return { res: null, err: vitecIntegrationResult.err };
    }
    const sessionInitInfo: SessionInitiationRequestDTO = {
        userIdentifier: vitecInfo.userIdentifier,
        firstName: vitecInfo.firstName,
        lastName: vitecInfo.lastName,
        currentSessionToken: vitecIntegrationResult.res.sessionToken,
    };

    const backendIntegrationInit = await initializeBackendIntegration(environment, log, sessionInitInfo);
    if (backendIntegrationInit.err != null) {
        return { res: null, err: backendIntegrationInit.err };
    }

    const internationalizationServiceRes = await initializeInternationalizationService(backendIntegrationInit.res, log, vitecInfo);
    if (internationalizationServiceRes.err != null) {
        return { res: null, err: internationalizationServiceRes.err };
    }

    const eventMultiplexer = await initializeEventMultiplexer(log, backendIntegrationInit.res.localPlayer.id);

    let currentMultiplayerMode = MultiplayerMode.AS_OWNER;
    const multiplayerIntegrationInit = await initializeMultiplayerIntegration(
        backendIntegrationInit.res,
        log,
        eventMultiplexer,
        currentMultiplayerMode,
    );
    if (multiplayerIntegrationInit.err != null) {
        log.warn(multiplayerIntegrationInit.err);
    }

    await delaySetupIfDevOrTest(environment);

    console.log(environment);
    const context: ApplicationContext = Object.freeze({
        //Assuring immutability
        backend: backendIntegrationInit.res,
        logger: log,
        vitec: vitecIntegrationResult.res,
        multiplayer: undefined as any,
        text: internationalizationServiceRes.res,
        events: eventMultiplexer,
        env: environment,
    });
    return Promise.resolve({ res: context, err: null });
};
const delayTimeMS = 0;
const delaySetupIfDevOrTest = async (environment: ENV) => {
    if (environment.runtimeMode === RuntimeMode.DEVELOPMENT || environment.runtimeMode === RuntimeMode.TEST) {
        console.log('[setup] Delaying setup for ' + delayTimeMS + ' seconds');
        await new Promise((resolve) => setTimeout(resolve, delayTimeMS));
    }
};
