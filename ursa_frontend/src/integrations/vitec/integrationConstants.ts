import { VitecIntegrationInformation } from './vitecDTOs';

/** Single source of truth: this */
export const SOLIDJS_MOUNT_ELEMENT_ID = 'solidjs-inlay-root';
export type URSAInitializationFunction = (vitecInfo: VitecIntegrationInformation) => (() => void) | null;
export const URSA_INITIALIZATION_FUNCTION_NAME = 'initializeURSABundle';

/** Single source of truth: The 10-finger angular project: ./src/app/app-routing.module.ts */
export enum SubURLs {
    MENU = '',
    TUTORIAL = '/tutorial',
    COLONY = '/colony',
}
export const VITEC_BASE_SUB_URL = '/games/ursa';
