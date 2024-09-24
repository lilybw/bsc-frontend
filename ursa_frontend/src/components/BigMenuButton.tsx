import { css } from "@emotion/css";
import { Component, createEffect, createSignal, JSX } from "solid-js";
import { IStyleOverwritable } from "../ts/types";
import { Styles } from "../sharedCSS";

interface BigMenuButtonProps extends IStyleOverwritable {
    children: JSX.Element;
    onClick?: () => void;
    disable?: boolean;
}

export default function BigMenuButton(props: BigMenuButtonProps): JSX.Element {
    const [isDisabled, setIsDisabled] = createSignal(props.disable || false);
    
    createEffect(() => {
        if (props.disable !== isDisabled()) {
            setIsDisabled(props.disable || false);
            if (props.disable) {
                console.log("Button disabled");
                // Add your disable animation logic here
            } else {
                console.log("Button enabled");
                // Add your enable animation logic here
            }
        }
    });

    return (
        <button class={css`${menuOptionStyle} ${props.styleOverwrite} ${props.disable && Styles.CROSS_HATCH_GRADIENT}`} 
            disabled={isDisabled()}
            onMouseDown={props.onClick}>
            {props.children}
        </button>
    );
}

const menuOptionStyle = css`
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 2rem;
    padding: 1rem;
    margin: 1rem;
    border-radius: 1rem;
    border: 1px solid black;
    box-shadow: inset 0 0 4px white;  
    cursor: pointer;
    text-shadow: none;
    scale: 1;
    transition: all 0.3s ease-out;
    &:hover {
        scale: 1.1;
        border: 1px solid white;
        box-shadow: inset 0 0 10px white;
        background-color: rgba(0, 0, 0, 0.7);
        text-shadow: 2px 2px 4px white;
    }
`