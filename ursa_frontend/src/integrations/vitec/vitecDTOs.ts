import { ENV } from "../../environment/manager";
import { Logger } from "../../logging/filteredLogger";

/**
 * Single source of thruth: The 10-finger angular project: ./src/environments/environment.prod.ts
 */
export enum LanguagePreference {
    Danish = 'da-DK',
    NorwegianBokmal = 'nb-NO',
    NorwegianNynorsk = 'nn-NO',
    Swedish = 'sv-SE',
    Dutch = 'nl-NL',
    English = 'en-GB',
}

/**
 * Single source of truth: The 10-finger angular project: ./src/app/modules/games/ursa/ursa.integraton.component.ts
 */
export type VitecIntegrationInformation = {
    userIdentifier: string;
    /**
     * Username
     */
    IGN: string;
    languagePreference: LanguagePreference;
    locationUrl: string;
}
