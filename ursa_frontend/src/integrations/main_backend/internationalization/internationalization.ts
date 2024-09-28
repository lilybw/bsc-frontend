import { Accessor, Component, createEffect, createSignal, Setter } from "solid-js";
import { BackendIntegration } from "../mainBackend";
import { Logger } from "../../../logging/filteredLogger";
import { LanguagePreference, LanguagePreferenceAliases, VitecIntegrationInformation } from "../../vitec/vitecDTOs";
import SectionTitle, { SectionTitleProps } from "../../../components/SectionTitle";
import { Error, ResErr } from "../../../meta/types";
import { VitecIntegration } from "../../vitec/vitecIntegration";
import { createWrappedSignal, WrappedSignal } from "../../../ts/wrappedSignal";
import I_SectionTitle from "./I_SectionTitle";
import I_SectionSubTitle from "./I_SectionSubTitle";
import { SubSectionTitleProps } from "../../../components/SectionSubTitle";

export interface InternationalizationService {
    Title: (key: string, fallback?: string) => Component<SectionTitleProps>;
    SubTitle: (key: string, fallback?: string) => Component<SectionTitleProps>;
    
    language: Accessor<LanguagePreference>;
    setLanguage: (lang: LanguagePreference) => void;

    get(key: string): WrappedSignal<string>;
}

class InternationalizationServiceImpl implements InternationalizationService {
    private internalCatalogue: { [key: string]: WrappedSignal<string> } = {};
    constructor(
        private backend: BackendIntegration, 
        private log: Logger, 
        private currentLanguage: LanguagePreference
    ) {}
    
    Title = (key: string, fallback?: string) => {
        let catalogueEntry = this.getOrCreateEntry(key, fallback);
        return (props: SectionTitleProps) => I_SectionTitle({...props}, catalogueEntry.get);
    }

    SubTitle = (key: string, fallback?: string) => {
        let catalogueEntry = this.getOrCreateEntry(key, fallback);
        return (props: SubSectionTitleProps) => I_SectionSubTitle({...props}, catalogueEntry.get);
    }

    setLanguage = (lang: LanguagePreference): void => {
        if(lang === this.currentLanguage || lang === LanguagePreference.UNKNOWN) {
            return;
        }
        this.loadCatalogue(lang).then(err => {
            if (err != null) {
                this.log.error(`Failed to load catalogue for language: ${lang}, error: ${err}`);
            } else {
                this.currentLanguage = lang;
            }
        })
    };

    language = () => this.currentLanguage;

    get = (key: string): WrappedSignal<string> => {
        return this.getOrCreateEntry(key);
    }

    private loadCatalogue = async (lang: LanguagePreference): Promise<Error | undefined> => {
        this.log.trace('Loading catalogue, code: '+lang);
        const getCataglogueRes = await this.backend.getCatalogue(lang)
        if (getCataglogueRes.err != null) {
            return getCataglogueRes.err;
        }
        const catalogue = getCataglogueRes.res;
        for (const key in catalogue) {
            let value = catalogue[key];
            if (!value || value === '') {
                value = "(" + lang + ") " + key;
            }
            if (!this.internalCatalogue[key]) {
                this.internalCatalogue[key] = createWrappedSignal(value);
            }
            this.internalCatalogue[key].set(value);
        }
        return undefined;
    }

    private getOrCreateEntry = (key: string, fallback?: string): WrappedSignal<string> => {
        let catalogueEntry = this.internalCatalogue[key];
        if (!catalogueEntry) {
            this.internalCatalogue[key] = createWrappedSignal(fallback ?? key);
            catalogueEntry = this.internalCatalogue[key];
        }
        return catalogueEntry;
    }

    public async loadInitialCatalogue(): Promise<Error | undefined> {
        return this.loadCatalogue(this.currentLanguage);
    }
}

export const initializeInternationalizationService = async (backend: BackendIntegration, log: Logger, vitec: VitecIntegrationInformation): Promise<ResErr<InternationalizationService>> => {
    log.trace('[faux i18] Initializing internationalization service');
    const languageRes = assureUniformLanguageCode(vitec.languagePreference);
    if (languageRes.err != null) {
        return {res: null, err: languageRes.err};
    }

    const intergration = new InternationalizationServiceImpl(backend, log, languageRes.res);
    const initErr = await intergration.loadInitialCatalogue();
    if (initErr != null) {
        return {res: null, err: initErr};
    }

    log.trace('[faux i18] Internationalization service initialized');
    return {res: intergration, err: null};
}

export const assureUniformLanguageCode = (language: string): ResErr<LanguagePreference> => {
    const languageLowerCased = language.toLocaleLowerCase();
    for (const key in LanguagePreferenceAliases) {
        for (const alias of LanguagePreferenceAliases[key as LanguagePreference]) {
            if (alias.toLocaleLowerCase() === languageLowerCased) {
                return {res: key as LanguagePreference, err: null};
            }
        }
    }
    return {res: null, err: `Language code ${language} has no registered aliases`};
}