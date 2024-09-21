import { css } from "@emotion/css";
import { Component, createEffect, createSignal, onMount, Setter } from "solid-js"
import { TypeIconTuple } from "../ts/actionContext";

interface ActionInputProps {
    styleOverwrite?: string;
    actionContext: TypeIconTuple;
    setInputBuffer: Setter<string>;
}

const ActionInput: Component<ActionInputProps> = (props) => {
    const [isVisible, setIsVisible] = createSignal(false);
    let inputRef: HTMLInputElement | undefined;

    createEffect(() => {
        if (isVisible()) {
            inputRef?.focus();
        }
    });

    onMount(() => {
        inputRef?.focus();
    });

    const onInput = (e: Event) => {
        setTimeout(() => {
            const value = (e.target as HTMLInputElement).value;
            props.setInputBuffer(value);
        }, 0);
    };
    
    return (
        <div class={css`${actionInputContainerStyle} ${props.styleOverwrite}`} id="the-action-input">
            <svg xmlns="http://www.w3.org/2000/svg" class={backgroundTrapezoidStyle} viewBox="0 0 300 50" 
                fill="black" stroke="white">
                <path d="M0 50 L40 0 L260 0 L300 50 Z"/>
            </svg>
            <div class={inputContainerStyle} id="main-input-container">
                {props.actionContext.icon({styleOverwrite: actionContextIconStyle})}
                <input type="text" class={inputFieldStyle}  
                    onKeyDown={onInput}
                    placeholder="Type here..." autofocus ref={inputRef}
                    id="main-input-field"
                />
            </div>
        </div>
    )
}
export default ActionInput;

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
width: 3.35rem;
aspect-ratio: 1/1;
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
width: 43%;
height: 6rem;
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
width: 52%;
height: 2.5rem;
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