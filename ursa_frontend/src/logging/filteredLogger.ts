import { ENV } from '../environment/manager';
import { LogLevel } from '../meta/types';

export interface Logger {
    subtrace: (message: string) => void;
    trace: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    copyFor: (name: string) => Logger;
};

class ErrorOnlyLogger implements Logger {
    constructor(
        readonly name: string = 'ursa',
    ){}
    copyFor = (name: string) => new ErrorOnlyLogger(name);
    subtrace = (msg: string) => {};
    trace = (msg: string) => {};
    info = (msg: string) => {};
    warn = (msg: string) => {};
    error = (msg: string) => console.error(this._formatMessage("[E] " + msg));

    _formatMessage = (msg: string) => `[${this.name}] ${msg}`;
}

class WarningLogger extends ErrorOnlyLogger {
    warn = (msg: string) => console.warn(this._formatMessage("[W] " + msg));
    copyFor = (name: string) => new WarningLogger(name);
}

class VerboseLogger extends WarningLogger {
    info = (msg: string) => console.log(this._formatMessage("[I] " + msg));
    copyFor = (name: string) => new VerboseLogger(name);
}

class Blogger extends VerboseLogger {
    trace = (msg: string) => console.log(this._formatMessage("[T] " + msg));
    copyFor = (name: string) => new Blogger(name);
}

class Influencer extends Blogger {
    subtrace = (msg: string) => console.log(this._formatMessage("[S] " + msg));
    copyFor = (name: string) => new Influencer(name);
}

export const initializeLogger = (environment: ENV): Logger => {
    switch (environment.logLevel) {
        case LogLevel.SUBTRACE:
            return new Influencer();
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
