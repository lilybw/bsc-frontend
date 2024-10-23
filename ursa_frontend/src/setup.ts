import { ENV, initializeEnvironment } from './environment/manager';
import { initializeBackendIntegration } from './integrations/main_backend/mainBackend';
import { initializeVitecIntegration } from './integrations/vitec/vitecIntegration';
import { initializeLogger } from './logging/filteredLogger';
import { ApplicationContext, BundleComponent, MultiplayerMode, ResErr, RuntimeMode } from './meta/types';
import { render } from 'solid-js/web';
import GlobalContainer from './GlobalContainer';
import { PreferenceKeys, SessionInitiationRequestDTO } from './integrations/main_backend/mainBackendDTOs';
import { LanguagePreference, VitecIntegrationInformation } from './integrations/vitec/vitecDTOs';
import { ApplicationProps } from './ts/types';
import { initializeInternationalizationService } from './integrations/main_backend/internationalization/internationalization';
import { initializeEventMultiplexer } from './integrations/multiplayer_backend/eventMultiplexer';
import { initializeMultiplayerIntegration } from './integrations/multiplayer_backend/multiplayerBackend';
import { initNavigator } from './integrations/vitec/navigator';
import { SOLIDJS_MOUNT_ELEMENT_ID, URSA_INITIALIZATION_FUNCTION_NAME } from './integrations/vitec/integrationConstants';

export const initApp = (app: BundleComponent<ApplicationProps>) => {
    // global function that Angular will call
    (window as any)[URSA_INITIALIZATION_FUNCTION_NAME] = (vitecInfo: VitecIntegrationInformation) => {
        const root = document.getElementById(SOLIDJS_MOUNT_ELEMENT_ID);
        if (!root) {
            console.error('[setup] Root element not found.');
            return;
        }

        if (app.bundle !== vitecInfo.bundleRequested) {
            console.error('[setup] Bundle mismatch. Expected: ' + vitecInfo.bundleRequested + ', but currently mounting: ' + app.bundle);
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
            languagePreference: LanguagePreference.Danish,
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
    log.info('[setup] Initializing application context');

    const vitecIntegrationResult = await initializeVitecIntegration(vitecInfo, environment, log);
    if (vitecIntegrationResult.err != null) {
        return { res: null, err: vitecIntegrationResult.err };
    }
    log.trace('Recieved vitec information: ' + JSON.stringify(vitecIntegrationResult.res.info));

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

    const playerPreferencesAttempt = await backendIntegrationInit.res.getPlayerPreferences(backendIntegrationInit.res.localPlayer.id);
    const preferences = playerPreferencesAttempt.res;
    if (preferences == null) {
        console.error('[setup] Failed to load preferences: ' + playerPreferencesAttempt.err);
    } else {
        const langVal = preferences.preferences.find((p) => p.key === PreferenceKeys.LANGUAGE)?.chosenValue;
        if (langVal && langVal != null) {
            vitecIntegrationResult.res.info.languagePreference = langVal as LanguagePreference;
        }
    }

    const navigatorInit = await initNavigator(vitecIntegrationResult.res, log, environment, backendIntegrationInit.res.localPlayer);
    if (navigatorInit.err != null) {
        return { res: null, err: navigatorInit.err };
    }

    const internationalizationServiceRes = await initializeInternationalizationService(backendIntegrationInit.res, log, vitecIntegrationResult.res);
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

    const context: ApplicationContext = Object.freeze({
        //Assuring immutability
        multiplayer: multiplayerIntegrationInit.res!,
        backend: backendIntegrationInit.res,
        events: eventMultiplexer,
        logger: log,
        vitec: vitecIntegrationResult.res,
        text: internationalizationServiceRes.res,
        env: environment,
        nav: navigatorInit.res,
    });
    return Promise.resolve({ res: context, err: null });
};
const delayTimeMS = 0;
const delaySetupIfDevOrTest = async (environment: ENV) => {
    if (environment.runtimeMode === RuntimeMode.DEVELOPMENT || environment.runtimeMode === RuntimeMode.TEST) {
        await new Promise((resolve) => setTimeout(resolve, delayTimeMS));
    }
};
