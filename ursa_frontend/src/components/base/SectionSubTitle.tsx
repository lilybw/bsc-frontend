import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";
import { SectionTitleProps } from "./SectionTitle";

export interface SubSectionTitleProps extends SectionTitleProps {
}

export default function SectionSubTitle(props: SubSectionTitleProps): JSX.Element {
    return (
        <div class={css`${SUB_TITLE_STYLE} ${props.styleOverwrite}`}>{props.children}</div>
    )
}

export const SUB_TITLE_STYLE = css`
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