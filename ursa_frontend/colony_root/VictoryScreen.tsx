import BufferBasedButton from "@/components/base/BufferBasedButton";
import { getMinigameName } from "@/components/colony/mini_games/miniGame";
import { MinigameWonMessageDTO } from "@/integrations/multiplayer_backend/EventSpecifications";
import { Styles } from "@/styles/sharedCSS";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "@/ts/types";
import { css } from "@emotion/css";
import { Component } from "solid-js";

interface VictoryScreenProps extends IBackendBased, IRegistering<string>, IInternationalized, IBufferBased {
    data: MinigameWonMessageDTO;
    clearSelf: () => void;
}

const VictoryScreen: Component<VictoryScreenProps> = (props) => {
    return (
        <div class={postGameScreenContainerStyles}>
            {props.text.Title("MINIGAME.VICTORY")({styleOverwrite: css`color: orange; position: absolute; top: 1vh; font-size: 5rem;`})}
            <div class={Styles.MINIGAME.TITLE}>{getMinigameName(props.data.minigameID)}</div>
            <div class={difficultySubsection}>
                <div>{props.text.SubTitle("MINIGAME.DIFFICULTY")({})}</div>
                <div>{props.text.SubTitle(props.data.difficultyName)({styleOverwrite: Styles.MINIGAME.DIFFICULTY_NAME})}</div>
            </div>
            <BufferBasedButton 
                onActivation={props.clearSelf}
                name={props.text.get("COLONY.UI_BUTTON.CLOSE").get}
                buffer={props.buffer}
                register={props.register}
                styleOverwrite={css`position: absolute; bottom: 1vh;`}
            />
        </div>
    );
};
export default VictoryScreen;

const difficultySubsection = css`
display: flex; 
flex-direction: row; 
justify-content: space-evenly;
width: 50%;
`
export const postGameScreenContainerStyles = css`
${Styles.OVERLAY.CENTERED_QUARTER}
justify-content: center;
${Styles.FANCY_BORDER}
${Styles.GLASS.FAINT_BACKGROUND}
z-index: 1000000;
`