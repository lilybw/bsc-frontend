import { css } from '@emotion/css';
import { Accessor, Component, createEffect, createSignal, onCleanup, onMount, Setter } from 'solid-js';
import { BufferSubscriber, TypeIconTuple } from '../../ts/actionContext';
import { IBackendBased, IInternationalized, IStyleOverwritable } from '../../ts/types';
import { ArrayStore } from '../../ts/arrayStore';
import NTAwait from '../util/NoThrowAwait';
import GraphicalAsset from '../base/GraphicalAsset';
import { Styles } from '@/styles/sharedCSS';

/**
 * Props interface for the ActionInput component.
 * @interface ActionInputProps
 * @extends {IStyleOverwritable} - Allows custom CSS styling
 * @extends {IBackendBased} - Provides backend connectivity
 * @extends {IInternationalized} - Provides internationalization support
 */
interface ActionInputProps extends IStyleOverwritable, IBackendBased, IInternationalized {
    /** Current action context accessor providing type and icon information */
    actionContext: Accessor<TypeIconTuple>;

    /** Setter function for the input buffer value */
    setInputBuffer: Setter<string>;

    /** Accessor for the current input buffer value */
    inputBuffer: Accessor<string>;

    /** 
     * Store of subscribers that process the input buffer on Enter key press.
     * Each subscriber can consume the input, preventing further processing.
     */
    subscribers: ArrayStore<BufferSubscriber<string>>;

    /**
     * When true, disables user interaction and auto-focus.
     * Shows a giant floating Enter animation instead.
     * @default false
     */
    demoMode?: boolean;

    /**
     * Counter signal that triggers an Enter key simulation when changed.
     */
    manTriggerEnter?: Accessor<number>;

    /**
     * Counter signal that triggers the Enter animation when changed.
     */
    manTriggerEnterAnimation?: Accessor<number>;

    /**
     * Counter signal that triggers the shake animation when changed.
     */
    manTriggerShake?: Accessor<number>;

    /**
     * Controls whether focus pulling is active.
     * When true, the input will maintain focus with an internal interval.
     * When false, focus must be managed externally.
     * @default true
     */
    maintainFocus?: boolean;
}

/**
 * ActionInput component provides a stylized input field with context-aware
 * functionality, focus management, and input processing capabilities.
 * 
 * Features:
 * - Automatic focus maintenance (configurable)
 * - Context-aware styling and icon display
 * - Input buffer management with subscriber pattern
 * - Enter key handling with success/error animations
 * - Demo mode for tutorials
 * 
 * @component
 * @example
 * ```tsx
 * <ActionInput
 *   actionContext={createMemo(() => someContext)}
 *   setInputBuffer={setBuffer}
 *   inputBuffer={buffer}
 *   subscribers={subscribers}
 *   maintainFocus={true}
 *   backend={backend}
 *   text={i18n}
 * />
 * ```
 */
const ActionInput: Component<ActionInputProps> = (props) => {
    // Internal state management
    const [isVisible, setIsVisible] = createSignal(false);
    const [isShaking, setIsShaking] = createSignal(false);
    const [enterWasJustPressed, setEnterWasJustPressed] = createSignal(false);
    const [enterSuccessfullyPressed, setEnterSuccessfullyPressed] = createSignal(false);

    // Focus management
    const [focusPull, triggerFocusPull] = createSignal(0);
    let inputRef: HTMLInputElement | undefined;
    let focusIntervalId: NodeJS.Timeout | undefined;

    /**
     * Sets up or tears down the focus maintenance interval based on props.
     * The interval will pull focus back to the input field periodically.
     */
    createEffect(() => {
        if (props.maintainFocus !== false && !props.demoMode) {
            // Clear any existing interval first
            if (focusIntervalId) {
                clearInterval(focusIntervalId);
            }
            // Start new interval for focus maintenance
            focusIntervalId = setInterval(() => triggerFocusPull(k => k + 1), 100);
        } else if (focusIntervalId) {
            clearInterval(focusIntervalId);
            focusIntervalId = undefined;
        }
    });

    /**
     * Handles focus pulling when the counter changes.
     * Skips the initial value (0) to avoid unnecessary focus.
     */
    createEffect(() => {
        if (focusPull() === 0) return;
        inputRef?.focus();
    });

    /**
     * Handles initial visibility-based focus.
     */
    createEffect(() => {
        if (isVisible() && !props.demoMode) {
            inputRef?.focus();
        }
    });

    /**
     * Sets up external trigger effects for animations and actions.
     */
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

    /**
     * Handles keyboard input events.
     * Processes Enter key specially, updates input buffer for other keys.
     */
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

    /**
     * Triggers the error shake animation.
     * Used when input cannot be consumed by any subscriber.
     */
    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), shakeTimeS * 1000);
    };

    /**
     * Processes an Enter key press event.
     * Attempts to process input through all subscribers until consumed.
     */
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

    /**
     * Triggers the success animation.
     * Used when input is successfully consumed by a subscriber.
     */
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
                    class={inputFieldStyle}
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

const inputFieldStyle = css`
    background-color: transparent;
    color: white;
    border: none;
    outline: none;
    width: 88%;
    font-size: 1.5rem;
    font-family: 'Orbitron', sans-serif;
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