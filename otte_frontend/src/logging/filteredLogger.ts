import { ENV } from "../environment/manager";
import { LogLevel } from "../meta/types";

export type Logger = {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
}

const ErrorOnlyLogger: Logger = {
    log: () => {},
    warn: () => {},
    error: console.error
}

const WarningLogger: Logger = {
    log: () => {},
    warn: console.warn,
    error: console.error
}

const VerboseLogger: Logger = {
    log: console.log,
    warn: console.warn,
    error: console.error
}

export const initializeLogger = (environment: ENV): Logger => {
    switch (environment.logLevel) {
        case LogLevel.INFO: return VerboseLogger;
        case LogLevel.WARN: return WarningLogger;
        case LogLevel.ERROR: return ErrorOnlyLogger;
        default:
            console.error(`Unknown log level: ${environment.logLevel}`);
            return VerboseLogger;
    }
}