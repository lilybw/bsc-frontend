import { css } from "@emotion/css";
import { Accessor, Component, createEffect, createSignal, onMount, Setter } from "solid-js"
import { BufferSubscriber, TypeIconTuple } from "../ts/actionContext";
import { IStyleOverwritable } from "../ts/types";
import { ArrayStore } from "../ts/wrappedStore";

interface ActionInputProps extends IStyleOverwritable {
    actionContext: Accessor<TypeIconTuple>;
    setInputBuffer: Setter<string>;
    inputBuffer: Accessor<string>;
    /**
     * Store of all subscribers to the input buffer.
     * Each will be invoked on 'Enter' key press.
     */
    subscribers: Accessor<BufferSubscriber<string>[]>;
    /**
     * If true, the input will be not be auto focused and be uninteractible by the user.
     * Also, on 'Enter' a giant floating Enter is shown.
     */
    demoMode?: boolean;
    triggerEnter?: Setter<() => void>;
}

const ActionInput: Component<ActionInputProps> = (props) => {
    const [isVisible, setIsVisible] = createSignal(false);
    const [isShaking, setIsShaking] = createSignal(false);
    const [enterWasJustPressed, setEnterWasJustPressed] = createSignal(false);
    let inputRef: HTMLInputElement | undefined;

    createEffect(() => {
        if (isVisible() && !props.demoMode) {
            inputRef?.focus();
        }
    });

    onMount(() => {
        if (props.demoMode) return;
        inputRef?.focus();
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

    const handleEnter = () => {
        let consumed = false;
        for (const subscriber of props.subscribers()) {
            const result = subscriber(props.inputBuffer());
            if (result.consumed) {
                consumed = true;
                break;
            }
        }
        if (consumed) {
            if (inputRef) inputRef.value = '';
            props.setInputBuffer('');
            setEnterWasJustPressed(true);
            setTimeout(() => setEnterWasJustPressed(false), confirmTimeS * 1000);
        } else {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), shakeTimeS * 1000);
        }
    };

    // Expose the triggerEnter function to the parent component
    if (props.triggerEnter) {
        props.triggerEnter(prev => (() => handleEnter()));
    }
    
    return (
        <div class={css`${actionInputContainerStyle} ${props.styleOverwrite}`} id="the-action-input">
            <svg xmlns="http://www.w3.org/2000/svg" class={backgroundTrapezoidStyle} viewBox="0 0 300 50" 
                fill="black" stroke="white">
                <path d="M0 50 L40 0 L260 0 L300 50 Z"/>
            </svg>
            <div class={css`${inputContainerStyle} ${isShaking() ? shakeAnimation : ''} ${enterWasJustPressed() ? enterAnimation : ''}`} id="main-input-container">
                {props.actionContext().icon({styleOverwrite: actionContextIconStyle})}
                <input type="text" class={inputFieldStyle}  
                    onKeyDown={onKeyDown}
                    value={props.inputBuffer()}
                    disabled={props.demoMode}
                    placeholder="Type here..." autofocus={!props.demoMode} ref={inputRef}
                    id="main-input-field"
                />
            </div>
        </div>
    )
}
export default ActionInput;

const confirmTimeS = .25;
const shakeTimeS = .5;

const enterAnimation = css`
animation: confirm ${confirmTimeS}s ease-in;
--color-1: hsla(138, 100%, 50%, .3);
--color-2: hsla(118, 96%, 30%, .5);
--color-3: var(--color-1);
--step-offset: 1vw;
filter: 
    drop-shadow(calc(1vw + 0.5 * var(--step-offset)) 0 .1rem var(--color-1))
    drop-shadow(calc(1vw + 1 * var(--step-offset)) 0 .1rem var(--color-2))
    drop-shadow(calc(1vw + 1.5 * var(--step-offset)) 0 .1rem var(--color-3))
;

@keyframes confirm {
    0% {
        --step-offset: -1vw;
    }
    10% {
        --step-offset: -.8vw;
    }
    20% {
        --step-offset: -.6vw;
    }
    30% {
        --step-offset: -.4vw;
    }
    40% {
        --step-offset: -.2vw;
    }
    50% {
        --step-offset: 0vw;
    }
    60% {
        --step-offset: .2vw;
    }
    70% {
        --step-offset: .4vw;
    }
    80% {
        --step-offset: .6vw;
    }    
    90% {
        --step-offset: .8vw;
    }
    100% {
        --step-offset: 1vw;
    }
}
`

const shakeAnimation = css`
animation: shake ${shakeTimeS}s ease-in-out;
transform: translate(-50%, 50%) translate3d(0, 0, 0);
--color-shadow-offset: -.5rem;
--color-shadow-size: .1rem;
--color-shadow-color-2: hsla(360, 100%, 54%, 1);
--color-shadow-color-1: hsla(198, 100%, 50%, .7);
--color-shadow-color-3: hsla(36, 100%, 50%, .7);
--color-shadow-color-4: hsla(26, 100%, 50%, .7);

@keyframes shake {
    10%, 90% {
        transform: translate(-50%, 50%) translate3d(-1px, 0, 0);
        filter: drop-shadow(calc(-1 * var(--color-shadow-offset)) 0 var(--color-shadow-size) var(--color-shadow-color-1));
    }
    20%, 80%, 100% {
        transform: translate(-50%, 50%) translate3d(2px, 0, 0);
        filter: drop-shadow(var(--color-shadow-offset) 0 var(--color-shadow-size) var(--color-shadow-color-2));
    }
    30%, 50%, 70% {
        transform: translate(-50%, 50%) translate3d(-4px, 0, 0);
        filter: drop-shadow(calc(-1 * var(--color-shadow-offset)) calc(-1 * var(--color-shadow-offset)) var(--color-shadow-size) var(--color-shadow-color-4));
    }
    40%, 60%, 0% {
        transform: translate(-50%, 50%) translate3d(4px, 0, 0);
        filter: drop-shadow(var(--color-shadow-offset) var(--color-shadow-offset) var(--color-shadow-size) var(--color-shadow-color-3));
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
`

const actionContextIconStyle = css`
border-radius: 50%;
border: 2px solid white;
align-content: center;
align-items: center;
text-align: center;
--aci-size: 4.2vh;
width: var(--aci-size);
height: var(--aci-size);
box-shadow: inset 0 0 .3rem white;
background-color: black;
margin-left: -1.8rem;
`

const actionInputContainerStyle = css`
position: absolute;
display: flex;
flex-direction: column-reverse;
align-items: center;
justify-content: flex-start;
z-index: 1;
left: 50%;
bottom: 0;
transform: translateX(-50%);
background-color: transparent;
`

const inputContainerStyle = css`
position: absolute;
display: flex;
flex-direction: row;
column-gap: .7rem;
align-items: center;
justify-content: flex-start;
z-index: 2;
color: white;
border-radius: 1rem;
border: 1px solid white;
width: 15vw;
max-width: 12vw;
height: 3vh;
bottom: 50%;
left: 51%;
transform: translate(-50%, 50%);
padding: .5rem;
box-shadow: inset 0 0 .3rem white;
cursor: pointer;
text-shadow: none;
`

const backgroundTrapezoidStyle = css`
position: relative;
z-index: 1;
width: 100%;
min-width: 5rem;
height: auto; /* Let the height be determined by the SVG content */
min-height: 5rem;
`