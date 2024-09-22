import { Accessor, Component, For } from "solid-js";
import { IStyleOverwritable } from "../ts/types";
import { css } from "@emotion/css";

interface LocationNameProps extends IStyleOverwritable {
    name: string;
    inputBuffer: Accessor<string>;
    charHighlightOverwrite?: string;
    charBaseStyleOverwrite?: string;
}

const LocationName: Component<LocationNameProps> = (props) => {

    const computedCharBaseStyle = css`${singleCharStyle} ${props.charBaseStyleOverwrite}`;
    const computedCharHighlightStyle = css`${computedCharBaseStyle} ${singleCharHighlightStyle} ${props.charHighlightOverwrite}`;

    const getCharStyle = (index: Accessor<number>, charInName: string) => {
        if (props.inputBuffer().charAt(index()) === charInName) {
            return computedCharHighlightStyle;
        }
        return computedCharBaseStyle;
    }

    return (
        <div class={css`${locationNameContainerStyle} ${props.styleOverwrite}`}>
            <For each={props.name.split('')}>{(char, index) => (
                <div class={getCharStyle(index, char)}>{char}</div>
            )}</For>
        </div>
    );
}
export default LocationName;

const singleCharStyle = css`
    display: inline-block;
    font-size: 2rem;
    margin: 0 0.5rem;
    transition: color 0.5s;
`

const singleCharHighlightStyle = css`
    color: yellow;
`

const locationNameContainerStyle = css`

`