import { JSX } from "solid-js/jsx-runtime";
import BigMenuButton from "../../src/components/BigMenuButton";
import { createResource, For, Show } from "solid-js";
import StarryBackground from "../../src/components/StarryBackground";
import { IBackendBased } from "../../src/ts/types";
import { AvailableLanguagesResponseDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { ResCodeErr } from "../../src/meta/types";
import Spinner from "../../src/components/SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../../src/components/SomethingWentWrongIcon";
import ManagedAsset from "../../src/components/ManagedAsset";
import SectionSubTitle from "../../src/components/SectionSubTitle";
import { css } from "@emotion/css";

interface LanguagePageProps extends IBackendBased {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
    onLanguageSelected: (language: string) => void;
}

export default function LanguagePage(props: LanguagePageProps): JSX.Element {
    const [availableLanguages, {mutate, refetch}] = createResource<ResCodeErr<AvailableLanguagesResponseDTO>>(props.backend.getAvailableLanguages);

    const onLanguageSelected = (language: string) => {
        props.onSlideCompleted();
        props.onLanguageSelected(language);
    }

    return (
        <div class="language-tutorial-page">
            <StarryBackground />
            <Show when={availableLanguages.loading}>
                <Spinner />
            </Show>
            <Show when={availableLanguages.error}>
                <SomethingWentWrongIcon message={availableLanguages.latest?.err} />
            </Show>
            <Show when={availableLanguages.state === "ready"}>
                <div class={languageListStyle}>
                    <For each={availableLanguages.latest!.res?.languages}>{(language) => (
                        <BigMenuButton onClick={() => onLanguageSelected(language.code)}>
                            <SectionSubTitle>{language.commonName}</SectionSubTitle>
                            <ManagedAsset styleOverwrite={imageOverwrite} backend={props.backend} asset={language.icon} />
                        </BigMenuButton>
                    )}</For>
                </div>
            </Show>
        </div>
    )
}

const imageOverwrite = css`
width: 100%;
`

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
`