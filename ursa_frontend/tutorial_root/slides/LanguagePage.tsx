import { JSX } from 'solid-js/jsx-runtime';
import { createMemo, createResource, For, Show } from 'solid-js';
import { css } from '@emotion/css';
import BigMenuButton from '@/components/base/BigMenuButton';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import SectionSubTitle from '@/components/base/SectionSubTitle';
import Spinner from '@/components/base/SimpleLoadingSpinner';
import SomethingWentWrongIcon from '@/components/base/SomethingWentWrongIcon';
import StarryBackground from '@/components/base/StarryBackground';
import NTAwait from '@/components/util/NoThrowAwait';
import { AvailableLanguagesResponseDTO, PreferenceKeys } from '@/integrations/main_backend/mainBackendDTOs';
import { LanguagePreference } from '@/integrations/vitec/vitecDTOs';
import { assureUniformLanguageCode } from '@/integrations/vitec/vitecIntegration';
import { ResCodeErr } from '@/meta/types';
import { IBackendBased, IInternationalized, IStyleOverwritable } from '@/ts/types';

interface LanguagePageProps extends IBackendBased, IStyleOverwritable, IInternationalized {
    onSlideCompleted: () => void;
    onLanguageSelected: (language: LanguagePreference) => void;
}

export default function LanguagePage(props: LanguagePageProps): JSX.Element {
    const [availableLanguages, { mutate, refetch }] = createResource<ResCodeErr<AvailableLanguagesResponseDTO>>(props.backend.getAvailableLanguages);

    const onLanguageSelected = (language: string) => {
        let preference;
        const res = assureUniformLanguageCode(language);
        if (res.err === null) {
            preference = res.res;
            props.onSlideCompleted();
            props.onLanguageSelected(preference);
            props.backend.player.setPreference(PreferenceKeys.LANGUAGE, preference);
        } else {
            preference = LanguagePreference.UNKNOWN;
        }
    };

    return (
        <div class="language-tutorial-page">
            <StarryBackground />
            <div class={languageListStyle}>
                <For each={props.text.getAvailableLanguages()}>
                    {(language) => (
                        <BigMenuButton onClick={() => onLanguageSelected(language.code)} enable={createMemo(() => language.coverage > 0.9)}>
                            <SectionSubTitle>{language.commonName}</SectionSubTitle>
                            <NTAwait func={() => props.backend.assets.getMetadata(language.icon)}>
                                {(metadata) => <GraphicalAsset styleOverwrite={imageOverwrite} metadata={metadata} backend={props.backend} />}
                            </NTAwait>
                        </BigMenuButton>
                    )}
                </For>
            </div>
        </div>
    );
}

const imageOverwrite = css`
    width: 100%;
`;

const languageListStyle = css`
    display: grid;
    position: relative;

    left: 50%;
    transform: translateX(-50%);

    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    justify-items: center;
    align-items: center;
    max-height: 20vh;
    width: 80vw;
`;
