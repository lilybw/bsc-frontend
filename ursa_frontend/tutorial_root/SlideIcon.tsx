import { css } from "@emotion/css";
import { Component } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

export interface SlideIconProps {
    styleOverwrite?: string;
    iconSrc?: string;
}

const SlideIcon: Component<SlideIconProps> = (props: SlideIconProps) => {
    return (
        <div class={css`${slideIconStyle} ${props.styleOverwrite}`}>
            {props.iconSrc ? <img src={props.iconSrc} alt="icon" /> : "?"}
        </div>
    );
}
export default SlideIcon;

const slideIconStyle = css`
    width: 5rem;
    height: 5rem;
    background-color: rgba(255, 255, 255, .3);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    box-shadow: .5rem .5rem 1rem rgba(0, 0, 0, .5);
    font-size: 2rem;
    color: white;
    font-weight: 700;
    text-shadow: .1rem .1rem .1rem rgba(0, 0, 0, .5);
`