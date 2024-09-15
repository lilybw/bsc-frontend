export type ResErr<T> = { err: string } | { res: T }

export enum RuntimeMode {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    UNKNOWN = 'unknown'
}

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
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