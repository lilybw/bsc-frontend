import { ENV } from '../environment/manager';
import { LogLevel } from '../meta/types';

export interface Logger {
    trace: (message: string) => void;
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    copyFor: (name: string) => Logger;
};

class ErrorOnlyLogger implements Logger {
    constructor(
        readonly name: string = 'ursa',
    ){}
    trace = (msg: string) => {};
    log = (msg: string) => {};
    warn = (msg: string) => {};
    error = (msg: string) => console.error(`[${this.name}] ${msg}`);
    copyFor = (name: string) => new ErrorOnlyLogger(name);
}

class WarningLogger extends ErrorOnlyLogger {
    warn = (msg: string) => console.warn(`[${this.name}] ${msg}`);
    copyFor = (name: string) => new WarningLogger(name);
}

class VerboseLogger extends WarningLogger {
    log = (msg: string) => console.log(`[${this.name}] ${msg}`);
    copyFor = (name: string) => new VerboseLogger(name);
}

class Blogger extends VerboseLogger {
    trace = (msg: string) => console.log(`[${this.name}] ${msg}`);
    copyFor = (name: string) => new Blogger(name);
}

export const initializeLogger = (environment: ENV): Logger => {
    switch (environment.logLevel) {
        case LogLevel.TRACE:
            return new Blogger();
        case LogLevel.INFO:
            return new VerboseLogger();
        case LogLevel.WARN:
            return new WarningLogger();
        case LogLevel.ERROR:
            return new ErrorOnlyLogger();
        default:
            console.error(`Unknown log level: ${environment.logLevel}`);
            return new VerboseLogger();
    }
};
