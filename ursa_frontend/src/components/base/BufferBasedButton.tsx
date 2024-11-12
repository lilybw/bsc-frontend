import { Accessor, Component, createSignal, onCleanup, onMount, createMemo, createEffect, Setter } from 'solid-js';
import { css } from '@emotion/css';
import BufferHighlightedName, { BufferHighlightedNameProps } from './BufferHighlightedName';
import { Styles } from '../../sharedCSS';
import { IParenting, IRegistering, IStyleOverwritable } from '../../ts/types';

export interface BufferBasedButtonProps extends BufferHighlightedNameProps, IParenting, IRegistering<string> {
    onActivation: () => void;
    /** Signal-based, inverted disable. Will show a small animation after being re-enabled. */
    enable?: Accessor<boolean>;
    disabledStyleOverwrite?: string;
    /** Akin to onHover, however is active as long as the buffer input is a subset of the name and applied to the root level
     * container of the button */
    onHoverContainerStyle?: string;
    setElementRef?: Setter<HTMLButtonElement | undefined>;
    /** Delay for the input confirmation / rejection animation in milliseoncds.
     * Does not change the animation itself.
     * @default 500
     */
    activationDelay?: number;
}

const BufferBasedButton: Component<BufferBasedButtonProps> = (props) => {
    const [activated, setActivated] = createSignal(false);
    const [recentlyEnabled, setRecentlyEnabled] = createSignal(false);
    const [isHovered, setIsHovered] = createSignal(false);

    const disabledBuffer = createMemo(() => '');
    const onHoverBeginAppended = () => {
        setIsHovered(true);
        props.onHoverBegin && props.onHoverBegin();
    };
    const onHoverEndAppended = () => {
        setIsHovered(false);
        props.onHoverEnd && props.onHoverEnd();
    };

    const isDisabled = createMemo(() => {
        return props.enable ? !props.enable() : false;
    });
    const combinedCharBaseStyle = createMemo(() => {
        return css`
            ${props.charBaseStyleOverwrite || ''}
            ${activated() ? onActivatedBaseNameStyleOverwrite : ''}
            ${isDisabled() ? props.disabledStyleOverwrite || '' : ''}
        `;
    });
    const getNameValue = () => {
        return typeof props.name === 'function' ? props.name() : props.name;
    };

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


    onMount(() => {
        const removeFunc = props.register((v) => {
            if (v === getNameValue() && !isDisabled()) {
                setActivated(true);
                setTimeout(() => {
                    props.onActivation();
                    setActivated(false);
                }, props.activationDelay ? props.activationDelay : shimmerTimeS * 1000);
                return { consumed: true };
            }
            return { consumed: false };
        });
        onCleanup(removeFunc);
    });

    const computedContainerStyles = createMemo(() => {
        const disabled = isDisabled();
        const hover = isHovered();
        const recEnabled = recentlyEnabled();
        const isActivated = activated();
        return css`
            ${baseStyle}
            ${props.styleOverwrite}
                ${isActivated && !disabled ? onActivationShimmerAnim : ''}
                ${disabled ? Styles.CROSS_HATCH_GRADIENT : ''}
                ${recEnabled && !disabled ? onReEnabledAnim : ''}
                ${hover && !disabled ? props.onHoverContainerStyle : ''}
        `;
    });

    return (
        <button class={computedContainerStyles()} id={'buffer-based-button-' + getNameValue()} 
            disabled={isDisabled()} ref={r => {props.setElementRef && props.setElementRef(r);}}
        >
            <BufferHighlightedName
                buffer={isDisabled() ? disabledBuffer : props.buffer}
                name={props.name}
                charHighlightOverwrite={props.charHighlightOverwrite}
                charBaseStyleOverwrite={combinedCharBaseStyle()}
                nameCompleteOverwrite={props.nameCompleteOverwrite}
                onHoverBegin={onHoverBeginAppended}
                onHoverEnd={onHoverEndAppended}
            />
            {props.children}
        </button>
    );
};

export default BufferBasedButton;

const shimmerTimeS = 0.5;
const shimmerColor = 'hsla(29, 100%, 63%, 1)';

const onActivatedBaseNameStyleOverwrite = css`
    color: white;
    text-shadow: 0 0 1rem ${shimmerColor};
    text-decoration: underline;
`;

const onActivationShimmerAnim = css`
    animation: shimmer ${shimmerTimeS}s linear;
    --shimmer-color: ${shimmerColor};

    @keyframes shimmer {
        0% {
            filter: drop-shadow(0 0 0.1rem var(--shimmer-color));
        }
        100% {
            filter: drop-shadow(0 0 5rem var(--shimmer-color));
        }
    }
`;

const baseStyle = css`
    pointer-events: none;
    background-color: transparent;
    border: none;
    transition: all 0.3s ease;
`;

const onReEnabledAnim = css`
    animation: shimmer ${shimmerTimeS}s ease-in;
    --shimmer-color: ${shimmerColor};
    @keyframes shimmer {
        0% {
            filter: drop-shadow(0 0 0.1rem var(--shimmer-color));
        }
        100% {
            filter: drop-shadow(0 0 5rem var(--shimmer-color));
        }
    }
`;
