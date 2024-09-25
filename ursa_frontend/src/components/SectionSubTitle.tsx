import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { IParenting, IStyleOverwritable } from "../ts/types";

interface SectionTitleProps extends IStyleOverwritable, IParenting {
}

export default function SectionSubTitle(props: SectionTitleProps): JSX.Element {
    return (
        <div class={css`${gameTitleStyle} ${props.styleOverwrite}`}>{props.children}</div>
    )
}

const gameTitleStyle = css`
text-align: center;
font-family: 'Orbitron', sans-serif;
font-weight: 700;
letter-spacing: 0;
color: hsla(0,0%,100%, .7);
margin: 2rem;
font-size: 2rem;
text-shadow: .15rem .15rem .3rem rgba(255, 255, 255, .3);
filter: drop-shadow(-.1rem -.2rem .2rem rgba(255, 255, 255, .5));
`