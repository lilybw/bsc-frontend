import { css } from "@emotion/css";
import { JSX } from "solid-js/jsx-runtime";

interface ErrorPageProps {
    title?: string;
    content: any;
}

export default function ErrorPage(props: ErrorPageProps): JSX.Element {
    return (
        <div class={errorPageStyle}>
            <h1>{props.title ?? "Oh no!"}</h1>
            <p>{props.content}</p>
        </div>
    )
}

const errorPageStyle = css`
    display: flex;
    flex-direction: column; 
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    background-color: black;
    color: white;
    text-shadow: 2px 2px 4px white;
`