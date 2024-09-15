import { DEV_ENVIRONMENT } from "./development";
import { PROD_ENVIRONMENT } from "./production";
import { RuntimeMode } from "../meta/types";

export type ENV = {
    runtimeMode: RuntimeMode;
    thisIsUndefined?: string;
}
const BASE_ENV: ENV = {
    runtimeMode: RuntimeMode.UNKNOWN
}

export let environment: ENV = BASE_ENV;

export const initializeEnvironment = (): ENV => {
    const runtimeMode = import.meta.env.MODE as RuntimeMode;
    let overwritingEnv;
    switch (runtimeMode) {
        case RuntimeMode.DEVELOPMENT: overwritingEnv = DEV_ENVIRONMENT; break;
        case RuntimeMode.PRODUCTION: overwritingEnv = PROD_ENVIRONMENT; break;
        default:
            console.error(`Unknown runtime mode: ${runtimeMode}`);
    }
    for (const key in overwritingEnv) {
        const value = overwritingEnv[key as keyof typeof overwritingEnv];
        if (value === undefined || value === null) {
            console.error(`Environment variable ${key} is present but has no value`);
        }
        environment[key as keyof ENV] = overwritingEnv[key as keyof ENV] as any;
    }
    return environment;
}
