import BufferBasedButton from "@/components/base/BufferBasedButton";
import { MinigameWonMessageDTO } from "@/integrations/multiplayer_backend/EventSpecifications";
import { Styles } from "@/sharedCSS";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "@/ts/types";
import { css } from "@emotion/css";
import { Component } from "solid-js";

interface VictoryScreenProps extends IBackendBased, IRegistering<string>, IInternationalized, IBufferBased {
    data: MinigameWonMessageDTO;
    clearSelf: () => void;
}

const VictoryScreen: Component<VictoryScreenProps> = (props) => {
    return (
        <div class={containerStyles}>
            {props.text.Title("MINIGAME.VICTORY")({styleOverwrite: titleStyle})}
            <div class={css`display: flex; flex-direction: column; align-items: center;`}>
                <div>{props.text.SubTitle("MINIGAME.DIFFICULTY")({})}</div>
                <div>{props.text.SubTitle(props.data.difficultyName)({})}</div>
            </div>
            <BufferBasedButton 
                onActivation={props.clearSelf}
                name={props.text.get("MINIGAME.CONTINUE").get}
                buffer={props.buffer}
                register={props.register}
            />
        </div>
    );
};
export default VictoryScreen;

const titleStyle = css`
color: orange;

`

const containerStyles = css`
position: absolute;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;

top: 50%;
left: 50%;
width: 50%;
height: 50%;
transform: translate(-50%, -50%);

${Styles.FANCY_BORDER}
${Styles.GLASS.FAINT_BACKGROUND}
`