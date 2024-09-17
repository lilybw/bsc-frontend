import { ENV } from "./manager";
import { LogLevel, RuntimeMode } from "../meta/types";

export const DEV_ENVIRONMENT: ENV = {
    runtimeMode: RuntimeMode.DEVELOPMENT,
    mainBackendIP: "localhost",
    mainBackendPort: 5386,
    logLevel: LogLevel.INFO,
    testUser: {
        userIdentifier: "ursa_internal_test_user",
        currentSessionToken: "make_sure_internal_auth_is_set_to_naive_on_backend_and_cross_verification_is_set_to_never",
        IGN: "Thee Who Shall Not Be Named",
    }
}