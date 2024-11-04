import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import { IBackendBased, IInternationalized } from '../../ts/types';
import { css } from '@emotion/css';
import NTAwait from '../util/NoThrowAwait';
import BigMenuButton from './BigMenuButton';
import { Styles } from '../../sharedCSS';
import { assureUniformLanguageCode } from '../../integrations/vitec/vitecIntegration';
import { PreferenceKeys } from '../../integrations/main_backend/mainBackendDTOs';
import GraphicalAsset from './GraphicalAsset';

interface LanguageSelectProps extends IInternationalized, IBackendBased {}

const LanguageSelectInlay: Component<LanguageSelectProps> = (props: LanguageSelectProps) => {
    const [mouseIsHere, setMouseIsHere] = createSignal(false);

    const onLangSelect = (code: string) => {
        const res = assureUniformLanguageCode(code);
        if (res.err != null) {
            props.backend.logger.error('Tried to change language, but got: ' + res.err);
        } else {
            props.text.setLanguage(res.res);
            props.backend.player.setPreference(PreferenceKeys.LANGUAGE, res.res);
        }
    };

    const computedContainerStyle = createMemo(
        () => css`
            ${containerStyle}
            ${mouseIsHere() ? whilestveHovered : ''}
        `,
    );
    const computedSubButtonStyle = createMemo(
        () => css`
            ${subButton}
            ${mouseIsHere() ? '' : Styles.NO_SHOW}
        `,
    );
    return (
        <BigMenuButton styleOverwrite={computedContainerStyle()} onMouseEnter={() => setMouseIsHere(true)} onMouseLeave={() => setMouseIsHere(false)}>
            <NTAwait func={() => props.backend.assets.getMetadata(1022)}>
                {(asset) => <GraphicalAsset styleOverwrite={imageStyleOverwrite} metadata={asset} backend={props.backend} />}
            </NTAwait>
            <For each={props.text.getAvailableLanguages()}>
                {(language) => (
                    language.coverage > 0.9 && (
                        <BigMenuButton styleOverwrite={computedSubButtonStyle()} onClick={() => onLangSelect(language.code)}>
                            <NTAwait func={() => props.backend.assets.getMetadata(language.icon)}>
                                {(asset) => <GraphicalAsset styleOverwrite={imageStyleOverwrite} metadata={asset} backend={props.backend} />}
                            </NTAwait>
                        </BigMenuButton>
                    )
                )}
            </For>
        </BigMenuButton>
    );
};
export default LanguageSelectInlay;

const whilestveHovered = css`
    height: 26vh;
    justify-content: flex-start;
    padding-top: 0.5rem;
`;

const subButton = css`
    position: relative;
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: fit-content;
`;

const imageStyleOverwrite = css`
    height: 7vh;
    width: 7vh;
`;

const containerStyle = css`
    position: absolute;
    top: 0;
    right: 0;
    height: 8vh;
    width: 8vh;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    row-gap: 1vh;
    border: none;
    padding: 1rem;
    padding-top: 0;
    padding-bottom: 0;
    transition: all 0.5s ease-in-out;
`;
