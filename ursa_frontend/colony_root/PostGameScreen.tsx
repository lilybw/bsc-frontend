// PostGameScreen.tsx
import { Component } from "solid-js";
import { css } from "@emotion/css";
import BufferBasedButton from "@/components/base/BufferBasedButton";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "@/ts/types";
import { Styles } from "@/styles/sharedCSS";
import NTAwait from "@/components/util/NoThrowAwait";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import { getMinigameName, KnownMinigames } from "@/components/colony/mini_games/miniGame";
import { STYLE_LOC_CARD_backgroundImageStyle, STYLE_LOC_CARD_cardContainerStyle, STYLE_LOC_CARD_descriptionStyleOverwrite, STYLE_LOC_CARD_lowerThirdWBackgroundStyle, STYLE_LOC_CARD_titleStyleOverwrite } from "@/components/colony/location/SpacePortLocationCard";

interface PostGameScreenProps extends IBackendBased, IRegistering<string>, IInternationalized, IBufferBased {
    title: string;
    titleColor: string;
    minigameID: number;
    minigameName: string;
    difficultyName: string;
    clearSelf: () => void;
}

const getBackgroundAssetId = (minigameID: number): number => {
    switch (minigameID) {
        case KnownMinigames.ASTEROIDS: // Asteroids
            return 5017;
        default:
            return 1007;
    }
};

const PostGameScreen: Component<PostGameScreenProps> = (props) => {
    return (
        <div class={locationCardContainerStyle}>
            <div class={STYLE_LOC_CARD_cardContainerStyle} id={`post-game-screen-${props.minigameName}`}>
                <NTAwait func={() => props.backend.assets.getMetadata(getBackgroundAssetId(props.minigameID))}>
                    {(asset) => (
                        <GraphicalAsset
                            styleOverwrite={STYLE_LOC_CARD_backgroundImageStyle}
                            backend={props.backend}
                            metadata={asset}
                        />
                    )}
                </NTAwait>

                {props.text.Title(props.title)({
                    styleOverwrite: css`
                        ${STYLE_LOC_CARD_titleStyleOverwrite}
                        color: ${props.titleColor};
                        font-size: 5rem;
                    `
                })}

                <div class={contentStyle}>
                    <div class={minigameNameStyle}>
                        {props.minigameName}
                    </div>

                    <div class={difficultyContainerStyle}>
                        {props.text.SubTitle("MINIGAME.DIFFICULTY")({
                            styleOverwrite: STYLE_LOC_CARD_descriptionStyleOverwrite
                        })}
                        {props.text.SubTitle(props.difficultyName)({
                            styleOverwrite: css`
                                ${STYLE_LOC_CARD_descriptionStyleOverwrite}
                                ${Styles.MINIGAME.DIFFICULTY_NAME}
                            `
                        })}
                    </div>
                </div>

                <div class={STYLE_LOC_CARD_lowerThirdWBackgroundStyle}>
                    <BufferBasedButton
                        onActivation={props.clearSelf}
                        name={props.text.get("COLONY.UI_BUTTON.CLOSE").get()}
                        buffer={props.buffer}
                        register={props.register}
                    />
                </div>
            </div>
        </div>
    );
};

const contentStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    ${Styles.GLASS.FAINT_BACKGROUND}
    border-radius: 1rem;
    padding: 2rem;
`;

const minigameNameStyle = css`
    ${Styles.MINIGAME.TITLE}
    font-size: 2.5rem;
    text-transform: uppercase;
    letter-spacing: 0.3rem;
    text-align: center;
`;

const difficultyContainerStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
`;

const locationCardContainerStyle = css`
    position: fixed;
    z-index: 10000;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50vw;
    height: 66vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    background-color: transparent;
    border-radius: 1rem;
    box-shadow: 0 0 1rem 0.5rem rgba(0, 0, 0, 0.5);
`;

export default PostGameScreen;