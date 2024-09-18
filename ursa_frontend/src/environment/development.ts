import { ENV } from "./manager";
import { LogLevel, RuntimeMode } from "../meta/types";

export const DEV_ENVIRONMENT: ENV = {
    runtimeMode: RuntimeMode.DEVELOPMENT,
    mainBackendIP: "localhost",
    mainBackendPort: 5386,
    logLevel: LogLevel.TRACE,
    authHeaderName: 'URSA-Token',
    proxyMainBackendRequests: true
}