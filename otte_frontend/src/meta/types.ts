export type ResErr<T> = { err: string } | { res: T }

export enum RuntimeMode {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    UNKNOWN = 'unknown'
}