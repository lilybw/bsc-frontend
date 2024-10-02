import { ENV } from '../../environment/manager';
import { Logger } from '../../logging/filteredLogger';
import { Bundle } from '../../meta/types';

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
    German = 'de-DE',
    UNKNOWN = 'unknown',
}
export const LanguagePreferenceAliases: { [key in LanguagePreference]: string[] } = {
    [LanguagePreference.Danish]: ['da', 'da-DK', 'DK'],
    [LanguagePreference.NorwegianBokmal]: ['nb', 'nb-NO', 'NO'],
    [LanguagePreference.NorwegianNynorsk]: ['nn', 'nn-NO', 'NO'],
    [LanguagePreference.Swedish]: ['sv', 'sv-SE', 'SE'],
    [LanguagePreference.Dutch]: ['nl', 'nl-NL'],
    [LanguagePreference.English]: ['en', 'en-GB', 'GB', 'UK'],
    [LanguagePreference.German]: ['de', 'de-DE', 'DE'],
    [LanguagePreference.UNKNOWN]: [],
};

/**
 * Single source of truth: The 10-finger angular project: ./src/app/modules/games/ursa/ursa.integraton.component.ts
 */
export type VitecIntegrationInformation = {
    userIdentifier: string;
    /**
     * Username
     */
    firstName: string;
    lastName: string;
    languagePreference: string;
    locationUrl: string;
    currentSubUrl: string;
    bundleRequested: Bundle;
};
