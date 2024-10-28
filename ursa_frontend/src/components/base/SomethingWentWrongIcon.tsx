import { css } from "@emotion/css";
import { Component } from "solid-js";
import { IStyleOverwritable } from "../../ts/types";

interface SomethingWentWrongIconProps extends IStyleOverwritable {
    message?: (string | null) | (string | null)[];
}

const SomethingWentWrongIcon: Component<SomethingWentWrongIconProps> = (props) => {
    const normalized = Array.isArray(props.message) ? props.message : [props.message];
    let combinedMessage = '';
    for (const item of normalized) {
        if (item !== null) {
            combinedMessage += item + ', ';
        }
    }
    return (
        <div class={css`${styles} ${props.styleOverwrite}`} title={combinedMessage}>?!</div>
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