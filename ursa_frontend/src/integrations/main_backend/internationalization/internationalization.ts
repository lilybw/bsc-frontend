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
    language: Accessor<string>;
    setLanguage: (lang: LanguagePreference) => void;
}

class InternationalizationServiceImpl implements InternationalizationService {
    private internalCatalogue: { [key: string]: WrappedSignal<string> } = {};
    constructor(
        private backend: BackendIntegration, 
        private log: Logger, 
        private initialLanguage: LanguagePreference
    ) {}

    private getOrCreateEntry = (key: string, fallback?: string): WrappedSignal<string> => {
        let catalogueEntry = this.internalCatalogue[key];
        if (!catalogueEntry) {
            this.internalCatalogue[key] = createWrappedSignal(fallback ?? key);
            catalogueEntry = this.internalCatalogue[key];
        }
        return catalogueEntry;
    }
    
    Title = (key: string, fallback?: string) => {
        let catalogueEntry = this.getOrCreateEntry(key, fallback);
        return (props: SectionTitleProps) => I_SectionTitle({...props}, catalogueEntry.get);
    }

    SubTitle = (key: string, fallback?: string) => {
        let catalogueEntry = this.getOrCreateEntry(key, fallback);
        return (props: SubSectionTitleProps) => I_SectionSubTitle({...props}, catalogueEntry.get);
    }

    setLanguage = (lang: LanguagePreference): void => {
        this.initialLanguage = lang;
    };

    language = () => this.initialLanguage;

    public async loadInitialCatalogue(): Promise<Error | undefined> {
        this.log.trace('Loading initial catalogue, code: '+this.initialLanguage);
        const getCataglogueRes = await this.backend.getCatalogue(this.initialLanguage)
        if (getCataglogueRes.err != null) {
            return getCataglogueRes.err;
        }
        const catalogue = getCataglogueRes.res;
        for (const key in catalogue) {
            this.internalCatalogue[key] = createWrappedSignal(catalogue[key]);
        }
        return undefined;
    }
}

export const initializeInternationalizationService = async (backend: BackendIntegration, log: Logger, vitec: VitecIntegrationInformation): Promise<ResErr<InternationalizationService>> => {
    log.trace('Initializing internationalization service');
    const languageRes = assureUniformLanguageCode(vitec.languagePreference);
    if (languageRes.err != null) {
        return {res: null, err: languageRes.err};
    }

    const intergration = new InternationalizationServiceImpl(backend, log, languageRes.res);
    const initErr = await intergration.loadInitialCatalogue();
    if (initErr != null) {
        return {res: null, err: initErr};
    }

    return {res: intergration as unknown as InternationalizationService, err: null};
}

const assureUniformLanguageCode = (language: string): ResErr<LanguagePreference> => {
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