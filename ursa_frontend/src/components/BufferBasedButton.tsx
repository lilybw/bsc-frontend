import { Accessor, Component, createSignal, onCleanup, onMount, createMemo } from "solid-js";
import { css } from "@emotion/css";
import BufferHighlightedName, { BufferHighlightedNameProps } from "./BufferHighlightedName";
import { AddRetainRemoveFunc } from "../ts/wrappedStore";
import { BufferSubscriber } from "../ts/actionContext";
import { IParenting } from "../ts/types";

export interface BufferBasedButtonProps extends BufferHighlightedNameProps, IParenting {
    onActivation: () => void;
    register: AddRetainRemoveFunc<BufferSubscriber<string>>;
}

const BufferBasedButton: Component<BufferBasedButtonProps> = (props) => {
    const [activated, setActivated] = createSignal(false);

    const combinedCharBaseStyle = createMemo(() => {
        return css`
            ${props.charBaseStyleOverwrite || ''}
            ${activated() ? onActivatedBaseNameStyleOverwrite : ''}
        `;
    });

    onMount(() => {
        const removeFunc = props.register((v) => {
            if (v === props.name) {
                setActivated(true);
                setTimeout(() => {
                    props.onActivation();
                    setActivated(false);
                }, shimmerTimeS * 1000);
                return { consumed: true };
            }
            return { consumed: false };
        });

        onCleanup(removeFunc);
    });

    return (
        <button class={css`
            ${baseStyle} 
            ${props.styleOverwrite} 
            ${activated() ? onActivationShimmerAnim : ''}
        `} 
            id={"buffer-based-button-"+props.name}
        >
            <BufferHighlightedName 
                buffer={props.buffer} 
                name={props.name} 
                charHighlightOverwrite={props.charHighlightOverwrite}
                charBaseStyleOverwrite={combinedCharBaseStyle()}
                nameCompleteOverwrite={props.nameCompleteOverwrite}
            />
            {props.children}
        </button>
    );
}

export default BufferBasedButton;

const shimmerTimeS = .5;
const shimmerColor = 'hsla(29, 100%, 63%, 1)';

const onActivatedBaseNameStyleOverwrite = css`
color: white;
text-shadow: 0 0 1rem ${shimmerColor};
text-decoration: underline;
`

const onActivationShimmerAnim = css`
    animation: shimmer ${shimmerTimeS}s linear;
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

const baseStyle = css`
    pointer-events: none;
    background-color: transparent;
    border: none;
`