import { Accessor, Component, createEffect, createMemo, createSignal, For } from 'solid-js';
import { css } from '@emotion/css';
import { IStyleOverwritable, IBufferBased } from '../../ts/types';
import SectionTitle from './SectionTitle';

export interface BufferHighlightedNameProps extends IStyleOverwritable, IBufferBased {
    /** Not translated */
    name: Accessor<string> | string;
    nameCompleteOverwrite?: string;
    charHighlightOverwrite?: string;
    charBaseStyleOverwrite?: string;
    /** Akin to MouseEnter, however, called when the current buffer input is a subset of the name */
    onHoverBegin?: () => void;
    /** Akin to MouseLeave, however, called when the current buffer input is not a subset of the name */
    onHoverEnd?: () => void;
}

const BufferHighlightedName: Component<BufferHighlightedNameProps> = (props) => {
    const [hasBeenMissed, setHasBeenMissed] = createSignal(false);

    const computedCharBaseStyle = createMemo(
        () => css`
            ${singleCharStyle} ${props.charBaseStyleOverwrite}
        `,
    );
    const computedCharHighlightStyle = createMemo(
        () => css`
            ${computedCharBaseStyle()} ${singleCharHighlightStyle} ${props.charHighlightOverwrite}
        `,
    );
    const computedNameCompleteStyle = createMemo(
        () => css`
            ${computedCharHighlightStyle()} ${nameCompleteStyle} ${props.nameCompleteOverwrite}
        `,
    );

    const getNameValue = () => {
        return typeof props.name === 'function' ? props.name() : props.name;
    };

    createEffect(() => {
        const currentName = getNameValue();
        const currentBuffer = props.buffer();
        if (currentName.includes(currentBuffer) && currentBuffer !== '') {
            setHasBeenMissed(false);
        } else {
            setHasBeenMissed(true);
        }
    });

    createEffect(() => {
        if (hasBeenMissed()) {
            if (props.onHoverEnd) {
                props.onHoverEnd();
            }
        } else {
            if (props.onHoverBegin) {
                props.onHoverBegin();
            }
        }
    });

    const getCharStyle = (index: Accessor<number>, charInName: string) => {
        if (hasBeenMissed()) {
            return computedCharBaseStyle();
        }
        if (props.buffer() === getNameValue()) {
            return computedNameCompleteStyle();
        }
        if (props.buffer().charAt(index()) === charInName) {
            return computedCharHighlightStyle();
        }
        return computedCharBaseStyle();
    };

    const splitString = (name: Accessor<string> | string) => {
        return getNameValue().split('');
    };

    return (
        <div
            class={css`
                ${locationNameContainerStyle} ${props.styleOverwrite}
            `}
            id={'buffer-highlighted-name-' + getNameValue()}
        >
            <For each={splitString(props.name)}>
                {(char, index) => <SectionTitle styleOverwrite={getCharStyle(index, char)}>{char}</SectionTitle>}
            </For>
        </div>
    );
};
export default BufferHighlightedName;

const singleCharStyle = css`
    font-family: 'JetBrains Mono', sans-serif;
    text-transform: none;
    margin: 0;
    font-size: 2rem;
    letter-spacing: 0;
    min-width: 0.5rem;
    color: cyan;
    text-shadow: none;
    text-decoration: none;
`;

const singleCharHighlightStyle = css`
    color: white;
    text-shadow: 0 0 0.4rem hsla(0, 0%, 100%, 0.5);
    text-decoration: underline;
`;

const nameCompleteStyle = css`
    color: green;
    text-shadow: 0 0 0.4rem black;
`;

const locationNameContainerStyle = css`
    display: flex;
    flex-direction: row;
    border-radius: 10px;
`;
