import { css } from "@emotion/css";
import { Component, JSX } from "solid-js";

interface BigMenuButtonProps {
    children: JSX.Element;
    styleOverwrite?: string;
    onClick?: () => void;
}

export default function BigMenuButton(props: BigMenuButtonProps): JSX.Element {
    return (
        <button class={css`${menuOptionStyle} ${props.styleOverwrite}`} onClick={props.onClick}>{props.children}</button>
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