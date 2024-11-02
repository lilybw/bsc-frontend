import { Component, createEffect, createMemo, createSignal, Setter, untrack } from 'solid-js';
import { IEventMultiplexer } from '../../integrations/multiplayer_backend/eventMultiplexer';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../../ts/actionContext';
import { css } from '@emotion/css';
import {
    DifficultyConfirmedForMinigameMessageDTO,
    PLAYER_ABORTING_MINIGAME_EVENT,
    PLAYER_JOIN_ACTIVITY_EVENT,
} from '../../integrations/multiplayer_backend/EventSpecifications';
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from '../../ts/types';
import BufferBasedButton from '../base/BufferBasedButton';
import { Styles } from '../../sharedCSS';
import { createArrayStore } from '../../ts/arrayStore';
import ActionInput from './MainActionInput';
import OnScreenKeyboard from '../base/OnScreenKeyboard';
import { DK_KEYBOARD_LAYOUT, EN_GB_KEYBOARD_LAYOUT, KeyElement } from '../../ts/keyBoardLayouts';
import { LanguagePreference } from '../../integrations/vitec/vitecDTOs';

interface HandplacementCheckProps extends IBackendBased, IInternationalized {
    gameToBeMounted: DifficultyConfirmedForMinigameMessageDTO;
    events: IEventMultiplexer;
    nameOfOwner: string;
    nameOfMinigame: string;
    goToWaitingScreen: () => void;
    clearSelf: () => void;
}

const maxTimeBetweenInputsMS = 1000; //ms
const successAnimationTimeMS = 1000; //ms
const HandPlacementCheck: Component<HandplacementCheckProps> = (props) => {
    const subscribers = createArrayStore<BufferSubscriber<string>>();
    const [buffer, setBuffer] = createSignal<string>('');
    const [sequenceIndex, setSequenceIndex] = createSignal(0);
    const [manualShakeTrigger, setManualShakeTrigger] = createSignal(0);
    const [manualEnterAnimTrigger, setManualEnterAnimTrigger] = createSignal(0);
    const log = props.backend.logger.copyFor('hand check');
    const leaveButtonName = props.text.get('COLONY.UI_BUTTON.LEAVE').get();
    const sequenceLength = 3;

    const currentlyHighlighted = createMemo(() => {
        switch (
            sequenceIndex() //Reactive on sequenceIndex
        ) {
            case 0:
                return ['f', 'j'];
            case 1:
                return ['d', 'k'];
            case 2:
                return ['s', 'l'];
            default:
                return [];
        }
    });

    let timestampOfLastChange = -1; //Intentionally not reactive
    createEffect(() => {
        const currentBuffer = buffer();
        if (currentBuffer === '') return;

        const now = Date.now();
        if (timestampOfLastChange === -1) {
            timestampOfLastChange = now;
        }
        //Challenge lost due to timeout
        if (
            now - timestampOfLastChange > maxTimeBetweenInputsMS &&
            !leaveButtonName.includes(currentBuffer) //If the user is trying to decline
        ) {
            resetCheck();
            return;
        }
        //At this point, a change has occurred within the time limit

        //If the buffer contains both expected elements of this part in the sequence
        const highlighted = untrack(currentlyHighlighted);
        let currentSequenceIndex = -1;
        if (currentBuffer.includes(highlighted[0]) && currentBuffer.includes(highlighted[1]) && currentBuffer.length === 2) {
            setBuffer(''); //Clear buffer
            setSequenceIndex((prev) => {
                currentSequenceIndex = prev + 1;
                log.subtrace('sequence index' + currentSequenceIndex);
                return currentSequenceIndex;
            }); //Advance sequence
            setManualEnterAnimTrigger((prev) => prev + 1); //Trigger enter animation
            timestampOfLastChange = now;
            retriggerTimeBarAnimation(); //Restart timebar animation
            startOrRestartTimedInvalidationCheck();
        }

        if (currentSequenceIndex >= sequenceLength) {
            //If the sequence has been completed
            onCheckPassed();
        }
    });

    let invalidationTimeout: NodeJS.Timeout | undefined;
    const startOrRestartTimedInvalidationCheck = () => {
        if (invalidationTimeout) clearTimeout(invalidationTimeout);
        invalidationTimeout = setTimeout(() => {
            resetCheck();
        }, maxTimeBetweenInputsMS);
    };
    const resetCheck = () => {
        log.trace('resetting check');
        timestampOfLastChange = -1; //reset timestamp
        setSequenceIndex(0); //reset sequence index
        setManualShakeTrigger((prev) => prev + 1); //trigger input shake
        cancelTimeBarAnimation();
        setBuffer(''); //clear buffer
    };

    const onCheckDeclined = () => {
        props.events.emit(PLAYER_ABORTING_MINIGAME_EVENT, {
            id: props.backend.player.local.id,
            ign: props.backend.player.local.firstName,
        });
        props.clearSelf();
        log.trace('Player declined participation');
    };

    const onCheckPassed = () => {
        log.trace('Player accepted participation');
        setComputedKeyboardStyle(css`
            ${keyboardStyle} ${keyboardShimmerAnim}
        `);
        cancelTimeBarAnimation();
        clearTimeout(invalidationTimeout);
        setTimeout(() => {
            log.trace('Animation complete, proceeding');
            setComputedKeyboardStyle(keyboardStyle);
            props.events.emit(PLAYER_JOIN_ACTIVITY_EVENT, {
                id: props.backend.player.local.id,
                ign: props.backend.player.local.firstName,
            });
            props.goToWaitingScreen();
        }, successAnimationTimeMS);
    };

    const getKeyboardLayout = (): KeyElement[][] => {
        switch (props.text.language()) {
            case LanguagePreference.Danish:
                return DK_KEYBOARD_LAYOUT;
            case LanguagePreference.English:
                return EN_GB_KEYBOARD_LAYOUT;
            default:
                return EN_GB_KEYBOARD_LAYOUT;
        }
    };

    const [timeBarStyle, setTimeBarStyle] = createSignal(timeLimitBarStyle);
    const retriggerTimeBarAnimation = () => {
        setTimeBarStyle(timeLimitBarStyle);
        setTimeout(() => {
            setTimeBarStyle(css`
                ${timeLimitBarStyle} ${animTimeBarShrink}
            `);
        }, 0);
    };
    const cancelTimeBarAnimation = () => {
        setTimeBarStyle(timeLimitBarStyle);
    };

    const [computedKeyboardStyle, setComputedKeyboardStyle] = createSignal<string>(keyboardStyle);

    return (
        <div class={overlayStyle}>
            <BufferBasedButton
                buffer={buffer}
                register={subscribers.add}
                onActivation={onCheckDeclined}
                name={leaveButtonName}
                styleOverwrite={leaveButtonStyle}
                charBaseStyleOverwrite={css`
                    color: rgba(150, 0, 0, 1);
                    text-shadow: 0 0 1rem rgba(255, 50, 50, 1);
                    filter: none;
                `}
            />
            <div class={gamePreviewContainer}>
                <div class={Styles.MINIGAME.TITLE}>{props.nameOfMinigame}</div>
                <div class={hasBeenStartedByStyle}>{props.text.get('HANDPLACEMENT.PREVIEW.HAS_BEEN_STARTED').get()}</div>
                <div class={nameOfOwnerStyle}>{props.nameOfOwner}</div>
                <div
                    class={css`
                        display: flex;
                        flex-direction: row;
                        gap: 1rem;
                    `}
                >
                    <div
                        class={css`
                            ${Styles.MINIGAME.DIFFICULTY_NAME} color: white;
                            text-transform: none;
                        `}
                    >
                        {props.text.get('MINIGAME.DIFFICULTY').get()}
                    </div>
                    <div class={Styles.MINIGAME.DIFFICULTY_NAME}>{props.text.get(props.gameToBeMounted.difficultyName).get()}</div>
                </div>
            </div>
            <OnScreenKeyboard
                layout={getKeyboardLayout()}
                showIntendedFingerUseForKey
                fingeringSchemeFocused={0}
                styleOverwrite={computedKeyboardStyle}
                ignoreMathKeys
                ignoreGrammarKeys
                ignoreSpecialKeys
                ignoreNumericKeys
                highlighted={currentlyHighlighted}
            />
            <div class={timeBarStyle()}></div>
            <div class={checkExplanationAcceptStyle}>{props.text.get('HANDPLACEMENT_CHECK.DESCRIPTION_ACCEPT').get()}</div>
            <div class={checkExplanationDeclineStyle}>{props.text.get('HANDPLACEMENT_CHECK.DESCRIPTION_DECLINE').get()}</div>
            <ActionInput
                actionContext={() => ActionContext.INTERACTION}
                setInputBuffer={setBuffer}
                subscribers={subscribers}
                inputBuffer={buffer}
                text={props.text}
                backend={props.backend}
                manTriggerShake={manualShakeTrigger}
                manTriggerEnterAnimation={manualEnterAnimTrigger}
            />
        </div>
    );
};
export default HandPlacementCheck;

const timeLimitBarStyle = css`
    position: absolute;

    left: 50%;
    top: 71%;
    height: 1vh;
    transform: translateX(-50%);
    --base-width: 80vw;
    --min-anim-width: 5vw;
    width: var(--base-width);
    border-radius: 0.5rem;

    --base-color: hsl(180, 80%, 50%);
    background-color: var(--base-color);
    filter: drop-shadow(0 0.3rem 0.5rem rgba(255, 255, 255, 0.5));
`;

const animTimeBarShrink = css`
    animation: timeBarShrink ${maxTimeBetweenInputsMS / 1000}s linear forwards;
    @keyframes timeBarShrink {
        0% {
            width: var(--base-width);
        }
        100% {
            width: var(--min-anim-width);
        }
    }
`;

const keyboardShimmerAnim = css`
    animation: keyboardShimmer ${successAnimationTimeMS / 1000}s linear;
    @keyframes keyboardShimmer {
        0% {
            filter: drop-shadow(0 0 0.5rem white);
        }
        100% {
            filter: drop-shadow(0 0 5rem white);
        }
    }
`;

const checkExplanationStyle = css`
    ${Styles.SUB_TITLE}
    position: absolute;

    top: 80vh;
    width: 30vw;
    --inset: 3vw;
    padding: 1rem;
    border-radius: 1rem;

    filter: none;
    font-size: 1.85rem;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;
const checkExplanationAcceptStyle = css`
    ${checkExplanationStyle}
    left: var(--inset);
`;
const checkExplanationDeclineStyle = css`
    ${checkExplanationStyle}
    right: var(--inset);
`;

const keyboardStyle = css`
    width: 80vw;
    height: 40vh;
    border-radius: 1rem;
    background: none;
    background-image: none;
    background-color: transparent;
    ${Styles.GLASS.FAINT_BACKGROUND}
    transition: all 0.2s ease-out;
`;

const gamePreviewContainer = css`
    position: absolute;
    display: flex;
    flex-direction: column;

    top: 0;
    left: 0;
    height: 19vh;
    width: fit-content;
    padding: 1rem;
    row-gap: 0.5rem;

    ${Styles.FANCY_BORDER}
    border-top: 0;
    border-bottom: 0;
    border-top-right-radius: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    ${Styles.GLASS.FAINT_BACKGROUND}
    background-image: linear-gradient(90deg, black, transparent)
`;
const hasBeenStartedByStyle = css`
    ${Styles.TITLE}
    text-shadow: none;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
    text-transform: none;
`;
const nameOfOwnerStyle = css`
    ${Styles.TITLE}
    text-shadow: none;
    font-size: 2.5rem;
    letter-spacing: 0.2rem;
`;

const leaveButtonStyle = css`
    position: absolute;

    top: 1vh;
    right: 1vh;
    z-index: 1;
`;

const overlayStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    ${Styles.GLASS.FAINT_BACKGROUND}
    z-index: 1000000;
`;
