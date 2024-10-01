import { css } from "@emotion/css";
import { Accessor, Component, createEffect, createMemo, createSignal, JSX } from "solid-js";
import { IStyleOverwritable } from "../ts/types";
import { BigButtonStyle, Styles } from "../sharedCSS";

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
            setTimeout(() => {
                setRecentlyEnabled(false);
            }, 1000);
        } else if (currentlyDisabled) {
            setRecentlyEnabled(true);
        }
    });

    return (
        <button class={css`
                ${BigButtonStyle}
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