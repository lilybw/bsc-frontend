import { Accessor, Component, createMemo, createSignal, onCleanup } from 'solid-js';
import { MinigameDifficultyResponseDTO } from '../../../integrations/main_backend/mainBackendDTOs';
import { IBackendBased, IBufferBased, IEmitter, IInternationalized, IRegistering } from '../../../ts/types';
import { css, keyframes } from '@emotion/css';
import { DIFFICULTY_SELECT_FOR_MINIGAME_EVENT } from '../../../integrations/multiplayer_backend/EventSpecifications';
import BufferBasedButton from '../../base/BufferBasedButton';
import { Styles } from '../../../sharedCSS';

interface MinigameDifficultyListEntryProps extends IBackendBased, IBufferBased, IRegistering<string>, IEmitter, IInternationalized {
    difficulty: MinigameDifficultyResponseDTO;
    minigameID: number;
    enabled: Accessor<boolean>;
}

const MinigameDifficultyListEntry: Component<MinigameDifficultyListEntryProps> = (props: MinigameDifficultyListEntryProps) => {
    const [hasBeenActivated, setHasBeenActivated] = createSignal(false);
    const [isHovered, setIsHovered] = createSignal(false);
    onCleanup(() => setHasBeenActivated(false));

    const computedContainerStyles = createMemo(() => {
        return css`
            ${containerStyles}
            ${isHovered()
                ? css`
                      left: 5vw;
                  `
                : ''}
            ${!props.enabled() ? Styles.CROSS_HATCH_GRADIENT : ''}
            ${hasBeenActivated() ? highlightedOptionStyle : ''}
        `;
    });

    return (
        <div class={computedContainerStyles()}>
            <BufferBasedButton
                name={props.text.get(props.difficulty.name).get()}
                buffer={props.buffer}
                register={props.register}
                onActivation={() => {
                    setHasBeenActivated(true);
                    props.emit(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, {
                        minigameID: props.minigameID,
                        difficultyID: props.difficulty.id,
                        difficultyName: props.difficulty.name,
                    });
                }}
                enable={props.enabled}
                onHoverBegin={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            />
            <div class={descriptionStyles}>{props.difficulty.description}</div>
        </div>
    );
};
export default MinigameDifficultyListEntry;

const highlightedOptionStyle = css`
    background-image: linear-gradient(rgba(0, 150, 0, 0.5), rgba(0, 255, 0, 0.5), rgba(0, 150, 0, 0.5));
    border-color: white;
    box-shadow:
        0 0 1rem rgba(0, 150, 0, 0.5) inset,
        0 0 1rem rgba(0, 255, 0, 0.5);
`;

const containerStyles = css`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    width: 100%;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;

    ${Styles.GLASS.FAINT_BACKGROUND}
    border-radius: 1rem;
    border: 0.25rem solid rgba(255, 255, 255, 0.5);
    border-left: 0px;
    border-right: 0px;

    box-shadow:
        0 0 1rem rgba(0, 0, 0, 0.5) inset,
        0 0 1rem rgba(0, 0, 0, 0.5);

    transition: all 0.3s ease;
`;

const descriptionStyles = css`
    text-align: center;
    width: 100%;
    word-wrap: break-word;
`;
