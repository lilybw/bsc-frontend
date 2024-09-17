import { ENV } from "./manager";
import { LogLevel, RuntimeMode } from "../meta/types";

export const TEST_ENVIRONMENT: ENV = {
    runtimeMode: RuntimeMode.TEST,
    mainBackendIP: "localhost",
    mainBackendPort: 5386,
    logLevel: LogLevel.TRACE,
    authHeaderName: 'URSA-Token',
    proxyMainBackendRequests: true,
    testUser: {
        userIdentifier: "ursa_internal_test_user",
        currentSessionToken: "make_sure_internal_auth_is_set_to_naive_on_backend_and_cross_verification_is_set_to_never",
        IGN: "Thee Who Shall Not Be Named",
        LanguagePreference: "en"
    }
}