import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { IParenting, IStyleOverwritable } from "../../ts/types";

export interface SectionTitleProps extends IStyleOverwritable, IParenting {
}

export default function SectionTitle(props: SectionTitleProps): JSX.Element {
    return (
        <div class={css`${TITLE_STYLE} ${props.styleOverwrite}`}>{props.children}</div>
    )
}


export const TITLE_STYLE = css`
font-family: 'Orbitron', sans-serif;
font-weight: 700;
letter-spacing: 1rem;
text-transform: uppercase;
color: white;
margin: 2rem;
font-size: 8rem;
text-shadow: .75rem .3rem .3rem rgba(255, 255, 255, .3);
filter: drop-shadow(-.1rem -.2rem .2rem rgba(255, 255, 255, .5));
`