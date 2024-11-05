import BufferBasedButton from "@/components/base/BufferBasedButton";
import { MinigameLostMessageDTO } from "@/integrations/multiplayer_backend/EventSpecifications";
import { Styles } from "@/sharedCSS";
import { IBackendBased, IRegistering, IInternationalized, IBufferBased } from "@/ts/types";
import { css } from "@emotion/css";
import { Component } from "solid-js";
import { postGameScreenContainerStyles } from "./VictoryScreen";
import { getMinigameName } from "@/components/colony/mini_games/miniGame";

interface DefeatScreenProps extends IBackendBased, IRegistering<string>, IInternationalized, IBufferBased {
    data: MinigameLostMessageDTO;
    clearSelf: () => void;
}

const DefeatScreen: Component<DefeatScreenProps> = (props) => {
    return (
        <div class={postGameScreenContainerStyles}>
            {props.text.Title("MINIGAME.DEFEAT")({styleOverwrite: css`color: red; position: absolute; top: 1vh; font-size: 5rem;`})}
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
export default DefeatScreen;

const difficultySubsection = css`
display: flex; 
flex-direction: row; 
justify-content: space-evenly;
width: 50%;
`