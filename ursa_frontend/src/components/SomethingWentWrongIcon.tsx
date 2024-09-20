import { css } from "@emotion/css";
import { Component } from "solid-js";

interface SomethingWentWrongIconProps {
    message?: string;
    styleOverwrite?: string;
}

const SomethingWentWrongIcon: Component<SomethingWentWrongIconProps> = (props) => {
    return (
        <div class={css`${styles} ${props.styleOverwrite}`} title={props.message}>?!</div>
    );
}
export default SomethingWentWrongIcon;

const styles = css`
    display: block;
    color: red;
    font-size: 2rem;
    text-shadow: 0 0 5px black;
    padding: 0.5rem;
    transform: scaleY(.8);
    cursor: help;
`