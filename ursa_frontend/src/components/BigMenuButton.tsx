import { css } from "@emotion/css";
import { Accessor, Component, createEffect, createMemo, createSignal, JSX } from "solid-js";
import { IStyleOverwritable } from "../ts/types";
import { Styles } from "../sharedCSS";

interface BigMenuButtonProps extends IStyleOverwritable {
    children: JSX.Element;
    onClick?: () => void;
    enable?: Accessor<boolean>;
}

const BigMenuButton: Component<BigMenuButtonProps> = (props) => {
    const [recentlyEnabled, setRecentlyEnabled] = createSignal(false);
    
    const isDisabled = createMemo(() => {
        return props.enable ? !props.enable() : false;
    });

    createEffect(() => {
        const currentlyDisabled = isDisabled();
        if (!currentlyDisabled && recentlyEnabled()) {
            console.log("Button re-enabled");
            setTimeout(() => {
                setRecentlyEnabled(false);
            }, 1000);
        } else if (currentlyDisabled) {
            setRecentlyEnabled(true);
        }
    });

    return (
        <button class={css`
                ${menuOptionStyle} 
                ${props.styleOverwrite} 
                ${isDisabled() ? Styles.CROSS_HATCH_GRADIENT : ''}
                ${recentlyEnabled() && !isDisabled() ? onReEnabledAnim : ''}
            `} 
            disabled={isDisabled()}
            onMouseDown={props.onClick}>
            {props.children}
        </button>
    );
}
export default BigMenuButton;
const shimmerTimeS = .5;
const shimmerColor = 'hsla(29, 100%, 100%, 1)';

const onReEnabledAnim = css`
    animation: shimmer ${shimmerTimeS}s ease-in;
    --shimmer-color: ${shimmerColor};

    @keyframes shimmer {
        0% {
            filter: drop-shadow(0 0 .1rem var(--shimmer-color));
        }
        100% {
            filter: drop-shadow(0 0 5rem var(--shimmer-color));
        }
    }
`

const menuOptionStyle = css`
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 2rem;
    padding: 1rem;
    margin: 1rem;
    border-radius: 1rem;
    border: 1px solid black;
    box-shadow: inset 0 0 4px white;  
    cursor: pointer;
    text-shadow: none;
    scale: 1;
    transition: all 0.3s ease-out;

    &:not(:disabled) {
        &:hover {
        scale: 1.1;
        border: 1px solid white;
        box-shadow: inset 0 0 10px white;
        background-color: rgba(0, 0, 0, 0.7);
        text-shadow: 2px 2px 4px white;
        }
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`