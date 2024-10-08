import { Accessor, Component } from "solid-js";
import { MinigameDifficultyResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IEmitter, IInternationalized, IRegistering } from "../../../ts/types";
import { css } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";
import { DIFFICULTY_SELECT_FOR_MINIGAME_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications";

interface MinigameDifficultyListEntryProps extends IBackendBased, IBufferBased, IRegistering<string>, IEmitter, IInternationalized{
    difficulty: MinigameDifficultyResponseDTO;
    minigameID: number;
    enabled: Accessor<boolean>;
}
const MinigameDifficultyListEntry: Component<MinigameDifficultyListEntryProps> = (props: MinigameDifficultyListEntryProps) => {
    return (
        <div class={containerStyles}>
            <BufferBasedButton 
                name={props.text.get(props.difficulty.name).get()}
                buffer={props.buffer}
                register={props.register}
                onActivation={() => {
                    props.emit(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, {
                        minigameID: props.minigameID,
                        difficultyID: props.difficulty.id,
                        difficultyName: props.difficulty.name
                    });
                }}
                enable={props.enabled}
            />
            <div>{props.difficulty.description}</div>
        </div>
    )
}
export default MinigameDifficultyListEntry;

const containerStyles = css`
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;

width: 100%;
height: 10vh;
border: 1px solid black;
border-radius: 5rem;

color: white;
background-color: transparent;
`