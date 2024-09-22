import { JSX } from "solid-js/jsx-runtime";
import { IBufferBased, IStyleOverwritable } from "../ts/types";
import { Accessor, Component } from "solid-js";
import { css } from "@emotion/css";
import BufferHighlightedName, { BufferHighlightedNameProps } from "./BufferHighlightedName";

interface BufferBasedButtonProps extends BufferHighlightedNameProps {
    onActivation: () => void;
}

const BufferBasedButton: Component<BufferBasedButtonProps> = (props) => {
    return (
        <button class={css`${baseStyle} ${props.styleOverwrite}`} id={"buffer-based-button-"+props.name}>
            <BufferHighlightedName buffer={props.buffer} name={props.name} />
        </button>
    );
}
export default BufferBasedButton;

const baseStyle = css`
    pointer-events: none;
`