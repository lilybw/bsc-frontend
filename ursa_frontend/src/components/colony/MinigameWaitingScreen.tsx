import { Component } from "solid-js";
import { Styles } from "../../sharedCSS";
import { css } from "@emotion/css";
import { ArrayStore } from "../../ts/arrayStore";
import { PlayerMinigameParticipationResponse } from "./mini_games/ClientTracker";

interface MinigameWaitingScreenProps {
    clientResponses: ArrayStore<PlayerMinigameParticipationResponse>;
}

const MinigameWaitingScreen: Component<MinigameWaitingScreenProps> = (props) => {

    return (
        <div class={containerStyle}>
            <h1>Waiting for other players...</h1>
        </div>
    );
}
export default MinigameWaitingScreen;

const containerStyle = css`
position: absolute;

width: 66vw;
height: 50vh;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);

${Styles.FANCY_BORDER}
${Styles.GLASS.FAINT_BACKGROUND}
`