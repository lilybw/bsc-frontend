import { css } from '@emotion/css';
import { Accessor, Component, createEffect, createSignal, onCleanup, onMount, Setter } from 'solid-js';
import { BufferSubscriber, TypeIconTuple } from '../../ts/actionContext';
import { IBackendBased, IInternationalized, IStyleOverwritable } from '../../ts/types';
import { ArrayStore } from '../../ts/arrayStore';
import NTAwait from '../util/NoThrowAwait';
import GraphicalAsset from '../base/GraphicalAsset';
import { Styles } from '@/styles/sharedCSS';

interface ActionInputProps extends IStyleOverwritable, IBackendBased, IInternationalized {
    actionContext: Accessor<TypeIconTuple>;

    setInputBuffer: Setter<string>;

    inputBuffer: Accessor<string>;

    subscribers: ArrayStore<BufferSubscriber<string>>;

    demoMode?: boolean;

    manTriggerEnter?: Accessor<number>;

    manTriggerEnterAnimation?: Accessor<number>;

    manTriggerShake?: Accessor<number>;

    maintainFocus?: boolean;

    disabled?: Accessor<boolean>;
}

const ActionInput: Component<ActionInputProps> = (props) => {
    const [isVisible, setIsVisible] = createSignal(false);
    const [isShaking, setIsShaking] = createSignal(false);
    const [enterWasJustPressed, setEnterWasJustPressed] = createSignal(false);
    const [enterSuccessfullyPressed, setEnterSuccessfullyPressed] = createSignal(false);
    const [focusPull, triggerFocusPull] = createSignal(0);
    let inputRef: HTMLInputElement | undefined;
    let focusIntervalId: NodeJS.Timeout | undefined;
    createEffect(() => {
        if (props.maintainFocus !== false && !props.demoMode) {
            // Clear any existing interval first
            if (focusIntervalId) {
                clearInterval(focusIntervalId);
            }
            // Start new interval for focus maintenance
            focusIntervalId = setInterval(() => {
                if (props.disabled && props.disabled()) return;
                triggerFocusPull(k => k + 1)
            }, 100);
        } else if (focusIntervalId) {
            clearInterval(focusIntervalId);
            focusIntervalId = undefined;
        }
    });
    createEffect(() => {
        if (focusPull() === 0) return;
        inputRef?.focus();
    });
    createEffect(() => {
        if (isVisible() && !props.demoMode) {
            inputRef?.focus();
        }
    });
    if (props.manTriggerShake) {
        createEffect(() => {
            if (props.manTriggerShake!() === 0) return;
            triggerShake();
        });
    }
    if (props.manTriggerEnter) {
        createEffect(() => {
            if (props.manTriggerEnter!() === 0) return;
            handleEnter();
        });
    }
    if (props.manTriggerEnterAnimation) {
        createEffect(() => {
            if (props.manTriggerEnterAnimation!() === 0) return;
            triggerEnterAnimation();
        });
    }
    // Lifecycle hooks
    onMount(() => {
        if (!props.demoMode) {
            inputRef?.focus();
        }
    });
    onCleanup(() => {
        if (focusIntervalId) {
            clearInterval(focusIntervalId);
        }
    });
    const onKeyDown = (e: KeyboardEvent) => {
        if (props.demoMode) return;

        if (e.key !== 'Enter') {
            setTimeout(() => {
                const value = (e.target as HTMLInputElement).value;
                props.setInputBuffer(value);
            }, 0);
        } else {
            handleEnter();
        }
    };
    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), shakeTimeS * 1000);
    };
    const handleEnter = async () => {
        let consumed = false;
        setEnterWasJustPressed(true);
        setTimeout(() => setEnterWasJustPressed(false), 3000);

        if (props.demoMode) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        for (const subscriber of props.subscribers.get) {
            const result = subscriber(props.inputBuffer());
            if (result.consumed) {
                consumed = true;
                break;
            }
        }

        if (consumed) {
            if (inputRef) inputRef.value = '';
            props.setInputBuffer('');
            triggerEnterAnimation();
        } else {
            triggerShake();
        }
    };
    const triggerEnterAnimation = () => {
        setEnterSuccessfullyPressed(true);
        setTimeout(() => setEnterSuccessfullyPressed(false), confirmTimeS * 1000);
    };

    return (
        <div
            class={css`${actionInputContainerStyle} ${props.styleOverwrite}`}
            id="the-action-input"
        >
            {enterWasJustPressed() && props.demoMode && (
                <NTAwait func={() => props.backend.assets.getMetadata(1011)}>
                    {(asset) => (
                        <GraphicalAsset
                            metadata={asset}
                            backend={props.backend}
                            styleOverwrite={demoEnterIconStyleOverwrite}
                        />
                    )}
                </NTAwait>
            )}

            <svg
                xmlns="http://www.w3.org/2000/svg"
                class={backgroundTrapezoidStyle}
                viewBox="0 0 300 50"
                fill="hsla(0,0%,0%,.5)"
                stroke="white"
            >
                <path d="M0 50 L40 0 L260 0 L300 50 Z" />
            </svg>

            <div
                class={css`
                    ${inputContainerStyle}
                    ${isShaking() ? Styles.ANIM.COLOR_SHAKE({
                    seconds: shakeTimeS,
                    interpolation: "linear",
                    retainedProperties: { transform: "translate(-50%, 50%)" }
                }) : ''}
                    ${enterSuccessfullyPressed() ? enterAnimation : ''}
                `}
                id="main-input-container"
            >
                <div class={actionContextIconStyle}>
                    {props.actionContext().icon({
                        styleOverwrite: actionContextIconStyle,
                        backend: props.backend
                    })}
                </div>
                <input
                    type="text"
                    class={css`
                        background-color: transparent;
                        color: white;
                        border: none;
                        outline: none;
                        width: 88%;
                        font-size: 1.5rem;
                        font-family: 'Orbitron', sans-serif;
                        ${props.disabled?.() ?? false ?
                            `cursor: not-allowed; 
                            pointer-events: none;
                            background-image: repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 10px,
                                rgba(128, 128, 128, 0.5) 10px,
                                rgba(128, 128, 128, 0.5) 20px
                            );
                            background-size: 28.28px 28.28px;
                            `
                            : ''}
                    `}
                    onKeyDown={onKeyDown}
                    value={props.inputBuffer()}
                    disabled={props.demoMode}
                    placeholder={props.text.get('ACTION_INPUT.WRITE_HERE').get()}
                    autofocus={!props.demoMode}
                    ref={inputRef}
                    id="main-input-field"
                    autocomplete="off"
                />
            </div>
        </div>
    );
};

// Animation timing constants
const confirmTimeS = 0.25;
const shakeTimeS = 0.5;

export default ActionInput;

const demoEnterIconStyleOverwrite = css`
    position: absolute;
    z-index: 1000;
    --enter-icon-size: 10vw;
    width: var(--enter-icon-size);
    height: var(--enter-icon-size);
    left: 50%;
    top: -20vh;
    transform: translateX(-50%);
    animation: shimmer2 1s linear;
    animation-delay: 1s;

    @keyframes shimmer2 {
        0% {
            filter: drop-shadow(0 0 0.5rem white);
        }
        100% {
            filter: drop-shadow(0 0 5rem white);
        }
    }
`;

const enterAnimation = css`
    animation: confirm ${confirmTimeS}s ease-in;
    --color-1: hsla(138, 100%, 50%, 0.8);
    --color-2: hsla(118, 96%, 30%, 0.5);
    --color-3: var(--color-1);
    --step-offset: 1vw;

    @keyframes confirm {
        from {
            filter: drop-shadow(0 0 0.1rem var(--color-1));
        }
        to {
            filter: drop-shadow(0 0 0.5rem var(--color-1));
        }
    }
`;

const actionContextIconStyle = css`
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: center;

    --aci-size: 4.2vh;
    width: var(--aci-size);
    height: var(--aci-size);
    margin-left: -1.8rem;

    border-radius: 50%;
    border: 2px solid white;

    box-shadow: inset 0 0 0.3rem white;
    background-color: black;
`;

const actionInputContainerStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    justify-content: flex-start;
    z-index: 1000;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    background-color: transparent;
`;

const inputContainerStyle = css`
    position: absolute;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;

    z-index: 2;
    bottom: 50%;
    left: 51%;
    height: 3vh;
    width: 15vw;
    max-width: 12vw;
    padding: 0.5rem;

    column-gap: 0.7rem;
    transform: translate(-50%, 50%);

    border: 1px solid white;
    border-radius: 1rem;
    cursor: pointer;

    color: white;
    text-shadow: none;
    background-color: rgba(0, 0, 0, 0.5);
    box-shadow: inset 0 0 0.3rem white;
`;

const backgroundTrapezoidStyle = css`
    position: relative;

    z-index: 1;
    width: 100%;
    min-width: 5rem;
    height: auto; /* Let the height be determined by the SVG content */
    min-height: 5rem;

    filter: drop-shadow(0 0 0.5rem black);
`;