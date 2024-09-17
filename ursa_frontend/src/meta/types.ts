import { BackendIntegration } from "../integrations/main_backend/mainBackend";
import { MultiplayerIntegration } from "../integrations/multiplayer_backend/multiplayerBackend";
import { VitecIntegration } from "../integrations/vitec/vitecIntegration";
import { Logger } from "../logging/filteredLogger";

export type Error = string;
export type ResErr<T> = | { res: null, err: Error } | { res: T, err: null };
export type ResErrSet<T, R extends Error> = | { res: null, err: R } | { res: T, err: null };
export type ResCodeErr<T> = | { res: null, err: Error, code: number } | { res: T, err: null, code: number };

export enum RuntimeMode {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    TEST = 'test',
    UNKNOWN = 'unknown'
}

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    TRACE = 'trace'
}
export enum ParseMethod {
    JSON = 'json',
    TEXT = 'text',
    BLOB = 'blob',
    ARRAYBUFFER = 'arrayBuffer',
    NONE = 'none'
}
export interface ArbitraryResponseDefinition<H extends { [key: string]: any }> {
    bodyParseMethod: ParseMethod;
    headers: H;
};

export type ApplicationContext = {
    backend: BackendIntegration;
    logger: Logger;
    vitec: VitecIntegration;
    multiplayer: MultiplayerIntegration;
}