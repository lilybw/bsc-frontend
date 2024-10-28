import { css } from "@emotion/css";
import { Accessor, Component, createEffect, createSignal, onMount, Setter } from "solid-js"
import { BufferSubscriber, TypeIconTuple } from "../../ts/actionContext";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "../../ts/types";
import { ArrayStore } from "../../ts/arrayStore";
import NTAwait from "../util/NoThrowAwait";
import GraphicalAsset from "../base/GraphicalAsset";

interface ActionInputProps extends IStyleOverwritable, IBackendBased, IInternationalized {
    actionContext: Accessor<TypeIconTuple>;
    setInputBuffer: Setter<string>;
    inputBuffer: Accessor<string>;
    /**
     * Store of all subscribers to the input buffer.
     * Each will be invoked on 'Enter' key press.
     */
    subscribers: ArrayStore<BufferSubscriber<string>>;
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
    const [enterSuccessfullyPressed, setEnterSuccessfullyPressed] = createSignal(false);
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

    const handleEnter = async () => {
        let consumed = false;
        setEnterWasJustPressed(true);
        setTimeout(() => setEnterWasJustPressed(false), 3000);
        if(props.demoMode) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
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
            setEnterSuccessfullyPressed(true);
            setTimeout(() => setEnterSuccessfullyPressed(false),  confirmTimeS * 1000);
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
            {enterWasJustPressed() && props.demoMode &&
                <NTAwait func={() => props.backend.assets.getMetadata(1011)}>
                    {(asset) => (
                        <GraphicalAsset metadata={asset} backend={props.backend} styleOverwrite={demoEnterIconStyleOverwrite} />
                    )}
                </NTAwait>
            }
            <svg xmlns="http://www.w3.org/2000/svg" class={backgroundTrapezoidStyle} viewBox="0 0 300 50" 
                fill="hsla(0,0%,0%,.5)" stroke="white">
                <path d="M0 50 L40 0 L260 0 L300 50 Z"/>
            </svg>
            <div class={css`${inputContainerStyle} ${isShaking() ? shakeAnimation : ''} ${enterSuccessfullyPressed() ? enterAnimation : ''}`} id="main-input-container">
                <div class={actionContextIconStyle} >
                    {props.actionContext().icon({styleOverwrite: actionContextIconStyle, backend: props.backend})}
                </div>
                <input type="text" class={inputFieldStyle}  
                    onKeyDown={onKeyDown}
                    value={props.inputBuffer()}
                    disabled={props.demoMode}
                    placeholder={props.text.get('ACTION_INPUT.WRITE_HERE').get()} autofocus={!props.demoMode} ref={inputRef}
                    id="main-input-field"
                />
            </div>
        </div>
    )
}
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
        filter: drop-shadow(0 0 .5rem white);
    }
    100% {
        filter: drop-shadow(0 0 5rem white);
    }
}
`

const confirmTimeS = .25;
const shakeTimeS = .5;

const enterAnimation = css`
animation: confirm ${confirmTimeS}s ease-in;
--color-1: hsla(138, 100%, 50%, .8);
--color-2: hsla(118, 96%, 30%, .5);
--color-3: var(--color-1);
--step-offset: 1vw;

@keyframes confirm {
    from {
        filter: 
            drop-shadow(0 0 .1rem var(--color-1))
        ;
    }
    to {
        filter:
            drop-shadow(0 0 .5rem var(--color-1))
        ;
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

box-shadow: inset 0 0 .3rem white;
background-color: black;
`

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
`

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
padding: .5rem;

column-gap: .7rem;
transform: translate(-50%, 50%);

border: 1px solid white;
border-radius: 1rem;
cursor: pointer;

color: white;
text-shadow: none;
background-color: rgba(0,0,0,.5);
box-shadow: inset 0 0 .3rem white;
`

const backgroundTrapezoidStyle = css`
position: relative;

z-index: 1;
width: 100%;
min-width: 5rem;
height: auto; /* Let the height be determined by the SVG content */
min-height: 5rem;

filter: drop-shadow(0 0 .5rem black);
`