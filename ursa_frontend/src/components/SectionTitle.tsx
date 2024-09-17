import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";

interface SectionTitleProps {
    children: JSX.Element;
}

export default function SectionTitle(props: SectionTitleProps): JSX.Element {
    return (
        <div class={gameTitleStyle}>{props.children}</div>
    )
}

const gameTitleStyle = css`
    color: white;
    margin: 2rem;
    font-size: 5rem;
    letter-spacing: 1rem;
    font-family: system-ui;
    text-shadow: .75rem .3rem .3rem rgba(255, 255, 255, .3);
`