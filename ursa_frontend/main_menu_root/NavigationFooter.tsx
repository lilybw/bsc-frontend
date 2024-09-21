import { css } from "@emotion/css";
import { Component } from "solid-js";
import { NamedVoidFunction } from "../src/meta/types";
import BigMenuButton from "../src/components/BigMenuButton";

interface NavigationFooterProps {
    goNext?: NamedVoidFunction;
    goBack?: NamedVoidFunction;
    cancelAll?: NamedVoidFunction;
}

const NavigationFooter: Component<NavigationFooterProps> = (props) => {
    return (
        <div class={footerStyles}>
            {props.goBack && (<BigMenuButton onClick={props.goBack.func}>{props.goBack.name}</BigMenuButton>)}
            {props.cancelAll && (<BigMenuButton onClick={props.cancelAll.func}>{props.cancelAll.name}</BigMenuButton>)}
            {props.goNext && (<BigMenuButton onClick={props.goNext.func}>{props.goNext.name}</BigMenuButton>)}
        </div>
    )
}
export default NavigationFooter;

const footerStyles = css`
    display: flex;
    justify-content: space-between;
    width: 33%;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
`