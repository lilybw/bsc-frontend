import { Accessor, Component } from "solid-js";
import { MinigameDifficultyResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IEmitter, IInternationalized, IRegistering } from "../../../ts/types";
import { css, keyframes } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";
import { DIFFICULTY_SELECT_FOR_MINIGAME_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications";

interface MinigameDifficultyListEntryProps extends IBackendBased, IBufferBased, IRegistering<string>, IEmitter, IInternationalized {
    difficulty: MinigameDifficultyResponseDTO;
    minigameID: number;
    enabled: Accessor<boolean>;
    index: number;
}

const MinigameDifficultyListEntry: Component<MinigameDifficultyListEntryProps> = (props: MinigameDifficultyListEntryProps) => {
    return (
        <div class={containerStyles(props.index)}>
            <div class={contentStyles}>
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
                <div class={descriptionStyles}>{props.difficulty.description}</div>
            </div>
        </div>
    )
}

export default MinigameDifficultyListEntry;

const pulse = keyframes`
  0%, 100% {
    background-color: rgba(0, 0, 0, 0.5);
    box-shadow: 
      0 0 1rem rgba(0, 0, 0, 0.5) inset,
      0 0 1rem rgba(0, 0, 0, 0.5);
  }
  50% {
    background-color: rgba(var(--peak-color), 0.3);
    box-shadow: 
      0 0 1.5rem rgba(var(--peak-color), 0.4) inset,
      0 0 1.5rem rgba(var(--peak-color), 0.2);
  }
`;

const containerStyles = (index: number) => {
    const maxIndex = 5; // Adjust based on your maximum number of difficulty levels
    const blueColor = "0, 100, 200"; // Base blue color
    const redColor = "255, 0, 0";   // Peak red color

    const peakColor = `
        ${Math.round((maxIndex - index) / maxIndex * parseInt(blueColor.split(',')[0]) + index / maxIndex * parseInt(redColor.split(',')[0]))},
        ${Math.round((maxIndex - index) / maxIndex * parseInt(blueColor.split(',')[1]) + index / maxIndex * parseInt(redColor.split(',')[1]))},
        ${Math.round((maxIndex - index) / maxIndex * parseInt(blueColor.split(',')[2]) + index / maxIndex * parseInt(redColor.split(',')[2]))}
    `;

    return css`
        display: flex;
        justify-content: center;
        align-items: center;

        width: 100%;
        padding: 1rem;
        margin-bottom: 1rem;
        box-sizing: border-box;

        color: white;
        --peak-color: ${peakColor};

        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 5%;
        border: 0.25rem solid rgba(255, 255, 255, 0.2);
        border-left: 0px;
        border-right: 0px;

        backdrop-filter: blur(0.5rem);
        -webkit-backdrop-filter: blur(0.5rem); // For Safari support

        box-shadow: 
            0 0 1rem rgba(0, 0, 0, 0.5) inset,
            0 0 1rem rgba(0, 0, 0, 0.5);

        animation: ${pulse} 4s infinite;
        animation-delay: ${index * 0.5}s;

        transition: all 0.3s ease;
    `;
};

const contentStyles = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 80%; // Adjust this value to control the width of the centered content
`;

const descriptionStyles = css`
    text-align: center;
    margin-top: 0.5rem;
    width: 100%;
    word-wrap: break-word;
`;