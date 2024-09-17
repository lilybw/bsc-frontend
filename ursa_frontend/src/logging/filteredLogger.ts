import { ENV } from "../environment/manager";
import { LogLevel } from "../meta/types";

export type Logger = {
    trace: (message: string) => void;
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
}

const ErrorOnlyLogger: Logger = {
    trace : () => {},
    log: () => {},
    warn: () => {},
    error: console.error
}

const WarningLogger: Logger = {
    ...ErrorOnlyLogger,
    warn: console.warn
}

const VerboseLogger: Logger = {
    ...WarningLogger,
    log: console.log
}

const Blogger: Logger = {
    ...VerboseLogger,
    trace: console.log
}

export const initializeLogger = (environment: ENV): Logger => {
    switch (environment.logLevel) {
        case LogLevel.TRACE: return Blogger;
        case LogLevel.INFO: return VerboseLogger;
        case LogLevel.WARN: return WarningLogger;
        case LogLevel.ERROR: return ErrorOnlyLogger;
        default:
            console.error(`Unknown log level: ${environment.logLevel}`);
            return VerboseLogger;
    }
}