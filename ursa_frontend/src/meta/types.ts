import { Component, JSX } from 'solid-js';
import { BackendIntegration } from '../integrations/main_backend/mainBackend';
import { PlayerInfoResponseDTO } from '../integrations/main_backend/mainBackendDTOs';
import { IMultiplayerIntegration } from '../integrations/multiplayer_backend/multiplayerBackend';
import { VitecIntegration } from '../integrations/vitec/vitecIntegration';
import { Logger } from '../logging/filteredLogger';
import { InternationalizationService } from '../integrations/main_backend/internationalization/internationalization';
import { IEventMultiplexer } from '../integrations/multiplayer_backend/eventMultiplexer';
import { ENV } from '../environment/manager';
import { URSANav } from '../integrations/vitec/navigator';

export type Error = string;
interface ResSuccess<T> {
    res: T;
    err: null;
}

interface ResError {
    res: null;
    err: Error;
}

export type ResErr<T> = ResSuccess<T> | ResError;
interface ResCodeSuccess<T> extends ResSuccess<T> {
    code: number;
}

interface ResCodeError extends ResError {
    code: number;
}
export type ResCodeErr<T> = ResCodeSuccess<T> | ResCodeError;

export type NamedVoidFunction = { name: string; func: () => void };

export enum Bundle {
    COLONY = 'colony',
    TUTORIAL = 'tutorial',
    MENU = 'menu',
    UNNKNOWN = 'unknown',
}

export type BundleComponent<T extends object> = Component<T> & { bundle: Bundle };

export enum RuntimeMode {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    TEST = 'test',
    UNKNOWN = 'unknown',
}

export enum MultiplayerMode {
    AS_GUEST = 'as_guest',
    AS_OWNER = 'as_owner',
}

export enum ColonyState {
    OPEN = 'open',
    CLOSED = 'closed',
}

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    TRACE = 'trace',
}

export enum ParseMethod {
    JSON = 'json',
    TEXT = 'text',
    BLOB = 'blob',
    ARRAYBUFFER = 'arrayBuffer',
    NONE = 'none',
}
export interface ArbitraryResponseDefinition<H extends { [key: string]: any }> {
    bodyParseMethod: ParseMethod;
    headers: H;
}

export type ApplicationContext = {
    multiplayer: Readonly<IMultiplayerIntegration>;
    backend: Readonly<BackendIntegration>;
    events: Readonly<IEventMultiplexer>;
    logger: Readonly<Logger>;
    vitec: Readonly<VitecIntegration>;
    text: Readonly<InternationalizationService>;
    env: Readonly<ENV>;
    nav: Readonly<URSANav>;
};
