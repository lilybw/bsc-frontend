import { css } from "@emotion/css";
import { Component, JSX } from "solid-js";
import { initializeEnvironment } from "./environment/manager";

interface GlobalContainerProps {
    children: JSX.Element | JSX.Element[];
}

export default function GlobalContainer(props: GlobalContainerProps): JSX.Element {
    console.log("[delete me] GlobalContainer mounted")
    const environment = initializeEnvironment();
    console.log(environment);

    //Time to do auth and stuff
    return (
        <div class={appContainerStyle}>
            {props.children}
        </div>
    );
}


const appContainerStyle = css`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
`