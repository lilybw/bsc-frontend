import { Component, createSignal, Setter } from 'solid-js';
import { IEventMultiplexer } from '../../integrations/multiplayer_backend/eventMultiplexer';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../../ts/actionContext';
import { css } from '@emotion/css';
import { DifficultyConfirmedForMinigameMessageDTO, PLAYER_ABORTING_MINIGAME_EVENT, PLAYER_JOIN_ACTIVITY_EVENT } from '../../integrations/multiplayer_backend/EventSpecifications';
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

const HandPlacementCheck: Component<HandplacementCheckProps> = (props) => {
    const subscribers = createArrayStore<BufferSubscriber<string>>();
    const [buffer, setBuffer] = createSignal<string>('');
    const [currentlyHighlighted, setCurrentlyHighlighted] = createSignal<string[]>(["f", "j"]);
    const [sequenceIndex, setSequenceIndex] = createSignal(0);

    setInterval(() => {
        switch(sequenceIndex() % 3) {
            case 0: setCurrentlyHighlighted(["f", "j"]); break;
            case 1: setCurrentlyHighlighted(["d", "k"]); break;
            case 2: setCurrentlyHighlighted(["s", "l"]); break;
        }
        setSequenceIndex(prev => prev + 1);
    }, 1000)

    const onCheckDeclined = () => {
        props.events.emit(PLAYER_ABORTING_MINIGAME_EVENT, {
            id: props.backend.player.local.id,
            ign: props.backend.player.local.firstName,
        })
        props.clearSelf();
    }

    const onCheckPassed = () => {
        props.events.emit(PLAYER_JOIN_ACTIVITY_EVENT, {
            id: props.backend.player.local.id,
            ign: props.backend.player.local.firstName,
        })
        props.goToWaitingScreen();
    }

    const getKeyboardLayout = (): KeyElement[][] => {
        switch (props.text.language()) {
            case LanguagePreference.Danish: return DK_KEYBOARD_LAYOUT;
            case LanguagePreference.English: return EN_GB_KEYBOARD_LAYOUT;
            default: return EN_GB_KEYBOARD_LAYOUT;    
        }
    }

    return (
        <div class={overlayStyle}>
            <BufferBasedButton
                buffer={buffer}
                register={subscribers.add}
                onActivation={onCheckDeclined}
                name={props.text.get("COLONY.UI_BUTTON.LEAVE").get()}
                styleOverwrite={leaveButtonStyle}
                charBaseStyleOverwrite={css`color: rgba(150, 0, 0, 1); text-shadow: 0 0 1rem rgba(255, 50, 50, 1); filter: none;`}
            />
            <div class={gamePreviewContainer}>
                <div class={titleStyleMod}>{props.nameOfMinigame}</div>
                <div class={hasBeenStartedByStyle}>{props.text.get("HANDPLACEMENT.PREVIEW.HAS_BEEN_STARTED").get()}</div>
                <div class={nameOfOwnerStyle}>{props.nameOfOwner}</div>
                <div class={css`display: flex; flex-direction: row; gap: 1rem;`}>
                    <div class={css`${difficultyTextStyle} color: white; text-transform: none;`}>
                        {props.text.get("MINIGAME.DIFFICULTY").get()}
                    </div>
                    <div class={difficultyTextStyle}>{props.gameToBeMounted.difficultyName}</div>
                </div>
            </div>
            <OnScreenKeyboard
                layout={getKeyboardLayout()}
                showIntendedFingerUseForKey
                fingeringSchemeFocused={0} 
                styleOverwrite={keyboardStyle}
                ignoreMathKeys
                ignoreGrammarKeys
                ignoreSpecialKeys
                ignoreNumericKeys
                highlighted={currentlyHighlighted}
            />
            <div class={checkExplanationAcceptStyle}>{props.text.get("HANDPLACEMENT_CHECK.DESCRIPTION_ACCEPT").get()}</div>
            <div class={checkExplanationDeclineStyle}>{props.text.get("HANDPLACEMENT_CHECK.DESCRIPTION_DECLINE").get()}</div>
            <ActionInput 
                actionContext={() => ActionContext.INTERACTION}
                setInputBuffer={setBuffer}
                subscribers={subscribers}
                inputBuffer={buffer}
                text={props.text}
                backend={props.backend}
            />
        </div>
    );
};
export default HandPlacementCheck;

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
`
const checkExplanationAcceptStyle = css`
    ${checkExplanationStyle}
    left: var(--inset);
`
const checkExplanationDeclineStyle = css`
    ${checkExplanationStyle}
    right: var(--inset);
`

const keyboardStyle = css`
    width: 80vw;
    height: 40vh;
    background-image: none;
    background-color: transparent;
    transition: all 0.2s ease-out;
`

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
`

const titleStyleMod = css`
    ${Styles.TITLE}
    font-size: 3rem;
    color: black;
    text-shadow: 0 0 .5rem rgba(60, 140, 255, 1);
`
const hasBeenStartedByStyle = css`
    ${Styles.TITLE}
    text-shadow: none;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
    text-transform: none;
`
const nameOfOwnerStyle = css`
    ${Styles.TITLE}
    text-shadow: none;
    font-size: 2.5rem;
    letter-spacing: 0.2rem;
`
const difficultyTextStyle = css`
    ${Styles.SUB_TITLE}
    text-shadow: none;
    color: hsl(30, 80%, 50%);
    text-transform: uppercase;
`

const leaveButtonStyle = css`
    position: absolute;

    top: 1vh;
    right: 1vh;
    z-index: 1;
`

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

