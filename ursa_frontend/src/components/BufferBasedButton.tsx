import { Accessor, Component, createSignal, onCleanup, onMount } from "solid-js";
import { css } from "@emotion/css";
import BufferHighlightedName, { BufferHighlightedNameProps } from "./BufferHighlightedName";
import { AddRetainRemoveFunc } from "../ts/wrappedStore";
import { BufferSubscriber } from "../ts/actionContext";

interface BufferBasedButtonProps extends BufferHighlightedNameProps {
    onActivation: () => void;
    register: AddRetainRemoveFunc<BufferSubscriber<string>>;
}

const BufferBasedButton: Component<BufferBasedButtonProps> = (props) => {
    const [activated, setActivated] = createSignal(false);

    onMount(() => {
        const removeFunc = props.register((v) => {
            if (v === props.name) {
                setActivated(true);
                setTimeout(() => {
                    props.onActivation();
                }, shimmerTimeS);
                return { consumed: true };
            }
            return { consumed: false };
        });

        onCleanup(removeFunc);
    });

    return (
        <button class={css`${baseStyle} 
            ${props.styleOverwrite} 
            ${activated() ? onActivationShimmerAnim : ''}`} 
            id={"buffer-based-button-"+props.name}
        >
            <BufferHighlightedName 
                buffer={props.buffer} 
                name={props.name} 
                charHighlightOverwrite={props.charHighlightOverwrite}
                charBaseStyleOverwrite={
                    activated() ? 
                        css`${onActivatedNameBaseStyleOverwrite} ${props.charBaseStyleOverwrite}` 
                    : 
                        props.charBaseStyleOverwrite
                }
                nameCompleteOverwrite={props.nameCompleteOverwrite}
            />
        </button>
    );
}
export default BufferBasedButton;

const shimmerTimeS = .5;
const shimmerColor = 'hsl(29, 100%, 63%)';

const onActivatedNameBaseStyleOverwrite = css`
color: ${shimmerColor};
text-shadow: 0 0 1rem ${shimmerColor};
`

const onActivationShimmerAnim = css`
    animation: shimmer ${shimmerTimeS}s ease-in;
    --shimmer-color: ${shimmerColor};

    @keyframes shimmer {
        0% {
            filter: drop-shadow(0 0 5rem var(--shimmer-color));
        }
        100% {
            filter: drop-shadow(0 0 0.1rem var(--shimmer-color));
        }
    }
`

const baseStyle = css`
    pointer-events: none;
    background-color: transparent;
    border: none;
`