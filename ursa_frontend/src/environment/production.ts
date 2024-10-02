import { ENV } from './manager';
import { LogLevel, RuntimeMode } from '../meta/types';

export const PROD_ENVIRONMENT: ENV = {
    runtimeMode: RuntimeMode.PRODUCTION,
    mainBackendIP: 'localhost',
    mainBackendPort: 5386,
    logLevel: LogLevel.ERROR,
    authHeaderName: 'URSA-Token',
    proxyMainBackendRequests: false,
    mainBackendTLS: true,
};
