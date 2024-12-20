import { DEV_ENVIRONMENT } from './development';
import { PROD_ENVIRONMENT } from './production';
import { LogLevel, RuntimeMode } from '../meta/types';
import { TEST_ENVIRONMENT } from './test';
import { VitecIntegrationInformation } from '../integrations/vitec/vitecDTOs';

export type ENV = {
    runtimeMode: RuntimeMode;
    mainBackendIP: string;
    mainBackendPort: number;
    mainBackendTLS?: boolean;
    logLevel?: LogLevel;
    vitecInfo?: VitecIntegrationInformation;
    authHeaderName: string;
    /**
     * When the backend is proxied, omit "<protocol>://<ip>:<port>/..." from base url
     * and just use the value of mainBackendURLWhenProxied (e.g. "/ursa_backend")
     */
    proxyMainBackendRequests?: boolean;
    mainBackendURLWhenProxied?: string;
};
const BASE_ENV: ENV = {
    runtimeMode: RuntimeMode.UNKNOWN,
    mainBackendIP: 'not_provided',
    mainBackendPort: 9999,
    logLevel: LogLevel.INFO,
    authHeaderName: 'URSA-Token',
    proxyMainBackendRequests: true,
    mainBackendTLS: true,
    mainBackendURLWhenProxied: '/ursa_backend',
};

let environment: ENV = BASE_ENV;

export const initializeEnvironment = (): ENV => {
    const runtimeMode = import.meta.env.MODE;
    let overwritingEnv: ENV;
    switch (runtimeMode) {
        case RuntimeMode.DEVELOPMENT:
            overwritingEnv = DEV_ENVIRONMENT;
            break;
        case RuntimeMode.PRODUCTION:
            overwritingEnv = PROD_ENVIRONMENT;
            break;
        case RuntimeMode.TEST:
            overwritingEnv = TEST_ENVIRONMENT;
            break;
        default:
            console.error(`[env man] Unknown runtime mode: ${runtimeMode}`);
            return BASE_ENV;
    }
    for (const key in overwritingEnv) {
        const value = overwritingEnv[key as keyof typeof overwritingEnv];
        if (value === undefined || value === null) {
            console.error(`[env man] Environment variable ${key} is present but has no value`);
        }
        (environment as any)[key] = overwritingEnv[key as keyof ENV];
    }
    return environment;
};
