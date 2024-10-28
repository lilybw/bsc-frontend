import { ENV } from './manager';
import { Bundle, LogLevel, RuntimeMode } from '../meta/types';
import { LanguagePreference } from '../integrations/vitec/vitecDTOs';

export const TEST_ENVIRONMENT: ENV = {
    runtimeMode: RuntimeMode.TEST,
    mainBackendIP: 'localhost',
    mainBackendPort: 5386,
    logLevel: LogLevel.TRACE,
    authHeaderName: 'URSA-Token',
    proxyMainBackendRequests: true,
    vitecInfo: {
        userIdentifier: 'ursa_internal_test_user',
        firstName: 'Thee Who Shall Not Be Named',
        languagePreference: LanguagePreference.English,
        locationUrl: 'http://localhost:' + import.meta.env.VITE_PORT + '/' + import.meta.env.BASE_URL,
        lastName: 'Thee Who Shall Not Be Named',
        currentSubUrl: '/',
        bundleRequested: Bundle.UNNKNOWN,
    },
};
