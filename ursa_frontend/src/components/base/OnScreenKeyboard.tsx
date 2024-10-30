import { JSX } from 'solid-js/jsx-runtime';
import { css } from '@emotion/css';
import { KeyElement, SymbolType, DK_KEYBOARD_LAYOUT, EN_GB_KEYBOARD_LAYOUT } from '../../ts/keyBoardLayouts';
import { Accessor, Component, createMemo, For, mergeProps } from 'solid-js';
import { IStyleOverwritable } from '../../ts/types';

interface OnScreenKeyboardProps {
    /**
     * Keys that should be highlighted.
     * @default []
     */
    highlighted?: Accessor<string[]> | string[];
    /**
     * Keys that should be ignored. See the shorthand properties for ignoring specific types of keys.
     * @default []
     */
    ignored?: Accessor<string[]> | string[];
    /**
     * Show hand handplacement on the keyboard.
     * @default false
     */
    showHands?: Accessor<boolean> | boolean;
    /**
     * Show intended finger use for each key by coloring each key accordingly.
     * @default true
     */
    showIntendedFingerUseForKey?: Accessor<boolean> | boolean;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * Hard shade the key with the gradient of the finger(s) available for the key.
     * (Constant / no interpolation of colors vs. linear gradient)
     * @default true
     */
    hardShadeMultiFingerKeyGradients?: Accessor<boolean> | boolean;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * The intensity of the colorization. 0 is no colorization, 1 is full colorization.
     * @default 1
     */
    colorizationIntensity?: Accessor<number> | number;
    /**
     * Relates to the showIntendedFingerUseForKey property.
     * When set, the keyboard will highlight only the intended finger use for the given fingering scheme.
     * @default -1 (disabled)
     */
    fingeringSchemeFocused?: Accessor<number> | number;
    /**
     * Keys like CMD, ALT, SHIFT, etc. that are not printable characters.
     * @default false
     */
    ignoreSpecialKeys?: Accessor<boolean> | boolean;
    /**
     * Numeric keys 0-9 and ½.
     * @default false
     */
    ignoreNumericKeys?: Accessor<boolean> | boolean;
    /**
     * Alphabetic keys a-z and special language specific characters like: æ ø å.
     * @default false
     */
    ignoreAlphabeticKeys?: Accessor<boolean> | boolean;
    /**
     * Grammatical symbols like: , . ! ?.
     * @default false
     */
    ignoreGrammarKeys?: Accessor<boolean> | boolean;
    /**
     * Math keys like: + - * / =.
     * @default false
     */
    ignoreMathKeys?: Accessor<boolean> | boolean;
    /**
     * The layout of the keyboard. Each row is an array of KeyElement objects.
     * @default DK_KEYBOARD_LAYOUT
     */
    layout?: KeyElement[][];
    keyBaseStyleOverride?: Accessor<string> | string;
    textStyleOverride?: Accessor<string> | string;
    styleOverwrite?: Accessor<string> | string;
}
interface NormalizedOnScreenKeyboardProps {
    /**
     * Keys that should be highlighted.
     * @default []
     */
    highlighted: Accessor<string[]>;
    /**
     * Keys that should be ignored. See the shorthand properties for ignoring specific types of keys.
     * @default []
     */
    ignored: Accessor<string[]>;
    /**
     * Show hand handplacement on the keyboard.
     * @default false
     */
    showHands: Accessor<boolean>;
    /**
     * Show intended finger use for each key by coloring each key accordingly.
     * @default true
     */
    showIntendedFingerUseForKey: Accessor<boolean>;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * Hard shade the key with the gradient of the finger(s) available for the key.
     * (Constant / no interpolation of colors vs. linear gradient)
     * @default true
     */
    hardShadeMultiFingerKeyGradients: Accessor<boolean>;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * The intensity of the colorization. 0 is no colorization, 1 is full colorization.
     * @default 1
     */
    colorizationIntensity: Accessor<number>;
    /**
     * Relates to the showIntendedFingerUseForKey property.
     * When set, the keyboard will highlight only the intended finger use for the given fingering scheme.
     * @default -1 (disabled)
     */
    fingeringSchemeFocused: Accessor<number>;
    /**
     * Keys like CMD, ALT, SHIFT, etc. that are not printable characters.
     * @default false
     */
    ignoreSpecialKeys: Accessor<boolean>;
    /**
     * Numeric keys 0-9 and ½.
     * @default false
     */
    ignoreNumericKeys: Accessor<boolean>;
    /**
     * Alphabetic keys a-z and special language specific characters like: æ ø å.
     * @default false
     */
    ignoreAlphabeticKeys: Accessor<boolean>;
    /**
     * Grammatical symbols like: , . ! ?.
     * @default false
     */
    ignoreGrammarKeys: Accessor<boolean>;
    /**
     * Math keys like: + - * / =.
     * @default false
     */
    ignoreMathKeys: Accessor<boolean>;
    /**
     * The layout of the keyboard. Each row is an array of KeyElement objects.
     * @default DK_KEYBOARD_LAYOUT
     */
    layout: KeyElement[][];
    keyBaseStyleOverride: Accessor<string>;
    textStyleOverride: Accessor<string>;
    styleOverwrite: Accessor<string>;
}
const NOOP_EMP_ARR = () => [];
const NOOP_FALSE = () => false;
const NOOP_TRUE = () => true;
const NOOP_EMP_STR = () => '';
const DEFAULTS: NormalizedOnScreenKeyboardProps = {
    highlighted: NOOP_EMP_ARR,
    ignored: NOOP_EMP_ARR,
    showHands: () => false,
    showIntendedFingerUseForKey: NOOP_FALSE,
    hardShadeMultiFingerKeyGradients: NOOP_TRUE,
    colorizationIntensity: () => 0.7,
    fingeringSchemeFocused: () => -1,
    ignoreSpecialKeys: NOOP_FALSE,
    ignoreNumericKeys: NOOP_FALSE,
    ignoreAlphabeticKeys: NOOP_FALSE,
    ignoreGrammarKeys: NOOP_FALSE,
    ignoreMathKeys: NOOP_FALSE,
    layout: EN_GB_KEYBOARD_LAYOUT,
    keyBaseStyleOverride: NOOP_EMP_STR,
    textStyleOverride: NOOP_EMP_STR,
    styleOverwrite: NOOP_EMP_STR
};

const normalizeProps = (props: OnScreenKeyboardProps): NormalizedOnScreenKeyboardProps => {
    const semiNormalized = { ...props };  // Create a copy to modify

    if (Array.isArray(props.highlighted)) {
      const value = props.highlighted; // Capture the array value
      semiNormalized.highlighted = (() => value);  // Create an accessor function
    }
    if (Array.isArray(props.ignored)) {
      const value = props.ignored; // Capture the array value
      semiNormalized.ignored = (() => value);  // Create an accessor function
    }
    if (typeof props.showHands === "boolean") {
      const value = props.showHands; // Capture the boolean value
      semiNormalized.showHands = (() => value);  // Create an accessor function
    }
    if (typeof props.showIntendedFingerUseForKey === "boolean") {
      const value = props.showIntendedFingerUseForKey; // Capture the boolean value
      semiNormalized.showIntendedFingerUseForKey = (() => value);  // Create an accessor function
    }
    if (typeof props.hardShadeMultiFingerKeyGradients === "boolean") {
      const value = props.hardShadeMultiFingerKeyGradients; // Capture the boolean value
      semiNormalized.hardShadeMultiFingerKeyGradients = (() => value);  // Create an accessor function
    }
    if (typeof props.colorizationIntensity === "number") {
      const value = props.colorizationIntensity; // Capture the number value
      semiNormalized.colorizationIntensity = (() => value);  // Create an accessor function
    }
    if (typeof props.fingeringSchemeFocused === "number") {
      const value = props.fingeringSchemeFocused; // Capture the number value
      semiNormalized.fingeringSchemeFocused = (() => value);  // Create an accessor function
    }
    if (typeof props.ignoreSpecialKeys === "boolean") {
      const value = props.ignoreSpecialKeys; // Capture the boolean value
      semiNormalized.ignoreSpecialKeys = (() => value);  // Create an accessor function
    }
    if (typeof props.ignoreNumericKeys === "boolean") {
      const value = props.ignoreNumericKeys; // Capture the boolean value
      semiNormalized.ignoreNumericKeys = (() => value);  // Create an accessor function
    }
    if (typeof props.ignoreAlphabeticKeys === "boolean") {
      const value = props.ignoreAlphabeticKeys; // Capture the boolean value
      semiNormalized.ignoreAlphabeticKeys = (() => value);  // Create an accessor function
    }
    if (typeof props.ignoreGrammarKeys === "boolean") {
      const value = props.ignoreGrammarKeys; // Capture the boolean value
      semiNormalized.ignoreGrammarKeys = (() => value);  // Create an accessor function
    }
    if (typeof props.ignoreMathKeys === "boolean") {
      const value = props.ignoreMathKeys; // Capture the boolean value
      semiNormalized.ignoreMathKeys = (() => value);  // Create an accessor function
    }
    if (typeof props.keyBaseStyleOverride === "string") {
        const value = props.keyBaseStyleOverride; // Capture the string value
        semiNormalized.keyBaseStyleOverride = (() => value);  // Create an accessor function
    }
    if (typeof props.textStyleOverride === "string") {
        const value = props.textStyleOverride; // Capture the string value
        semiNormalized.textStyleOverride = (() => value);  // Create an accessor function
    }
    if (typeof props.styleOverwrite === "string") {
        const value = props.styleOverwrite; // Capture the string value
        semiNormalized.styleOverwrite = (() => value);  // Create an accessor function
    }
    // @ts-ignore
    return mergeProps(DEFAULTS, semiNormalized);
};
const keySpacing = '.25rem';

const OnScreenKeyboard: Component<OnScreenKeyboardProps> = (_props) => {
    const normalizedProps = normalizeProps(_props);
    const kbKeyHtmlElementMap = new Map<string, HTMLElement>();

    const appendDotIfForJ = (key: KeyElement): JSX.Element => {
        if (key.char === 'f' || key.char === 'j') {
            return <div class={fjBumpStyle}></div>;
        }
        return <></>;
    };

    const colourizeTheButtonIfApplicable = (key: KeyElement, isIgnored: boolean, children: JSX.Element): JSX.Element => {
        if (!normalizedProps.showIntendedFingerUseForKey() || isIgnored) {
            return <>{children}</>;
        }
        //In the case that a specific scheme is requested OR no alternative fingerings are available
        if (normalizedProps.fingeringSchemeFocused() > -1 || key.finger.length == 1) {
            let indexToUse = key.finger.length - 1;
            if (normalizedProps.fingeringSchemeFocused() != -1) {
                indexToUse = normalizedProps.fingeringSchemeFocused() >= key.finger.length ? 
                    key.finger.length - 1 : normalizedProps.fingeringSchemeFocused();
            }
            const finger = key.finger[indexToUse];
            const constColor = `rgba(${finger.color}, ${normalizedProps.colorizationIntensity()})`;
            //This little repition is needed as linear-gradient requires 2 or more colors inputted at all times.
            const computedGradient = `linear-gradient(90deg, ${constColor}, ${constColor});`;

            return <div class={colorOverlayStyle(computedGradient)}>{children}</div>;
        }

        //In the case that no specific scheme is requested
        let computedGradient = 'linear-gradient(90deg, ';
        const stepSize = 100 / key.finger.length;
        for (let i = 0; i < key.finger.length; i++) {
            const finger = key.finger[i];
            const color = `rgba(${finger.color}, ${normalizedProps.colorizationIntensity()})`;
            if (normalizedProps.hardShadeMultiFingerKeyGradients()) {
                computedGradient += `${color} ${stepSize * i}%, ${color} ${stepSize * (i + 1) - 1}%`;
            } else {
                computedGradient += `${color}`;
            }
            if (i < key.finger.length - 1) {
                computedGradient += ', ';
            }
        }
        computedGradient += ');';
        return <div class={colorOverlayStyle(computedGradient)}>{children}</div>;
    };

    const mapCharsToKeyElements = (keys: KeyElement[]): JSX.Element[] => {
        const elements: JSX.Element[] = [];
        keys.map((key, index) => {
            const isHighlighted = normalizedProps.highlighted().includes(key.char);
            const isIgnored =
                normalizedProps.ignored().includes(key.char) ||
                (normalizedProps.ignoreSpecialKeys() && key.symbolTypes.includes(SymbolType.Special)) ||
                (normalizedProps.ignoreNumericKeys() && key.symbolTypes.includes(SymbolType.Numeric)) ||
                (normalizedProps.ignoreAlphabeticKeys() && key.symbolTypes.includes(SymbolType.Alphabetic)) ||
                (normalizedProps.ignoreGrammarKeys() && key.symbolTypes.includes(SymbolType.Grammar)) ||
                (normalizedProps.ignoreMathKeys() && key.symbolTypes.includes(SymbolType.Math));

            let computedStyle = css`
                ${keyBaseStyle}
            `;
            if (isIgnored) {
                computedStyle = css`
                    ${computedStyle} ${keyIgnoredStyle}
                `;
            }
            if (isHighlighted) {
                computedStyle = css`
                    ${computedStyle} ${keyHighlightedStyle}
                `;
            }
            computedStyle = css`${computedStyle} ${normalizedProps.keyBaseStyleOverride()}`;

            const children = (
                <>
                    <div class={css`${keyboardTextStyle} ${normalizedProps.textStyleOverride()}`}>{key.char}</div>
                    {appendDotIfForJ(key)}
                </>
            );

            elements.push(
                <div class={computedStyle} id={'okb-' + key.char} ref={(el) => kbKeyHtmlElementMap.set(key.char, el)}>
                    {colourizeTheButtonIfApplicable(key, isIgnored && !isHighlighted, children)}
                </div>,
            );
        });
        return elements;
    };

    const computeStylesForRow = (row: KeyElement[]): string => {
        let computedColumns = 'grid-template-columns: ';
        for (let i = 0; i < row.length; i++) {
            computedColumns += `${row[i].width}fr`;
            if (i < row.length - 1) {
                computedColumns += ' ';
            }
        }
        computedColumns += ';';
        return css`
            height: 100%;
            display: grid;
            ${computedColumns}
        `;
    };

    const appendHands = () => {
        if (normalizedProps.showHands()) {
            return (
                <div class={handsOverlayContainerStyle}>
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                        <path d={''} fill="black" stroke="black" stroke-width="1" />
                    </svg>
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: scaleX(-1)">
                        <path d={''} fill="black" stroke="black" stroke-width="1" />
                    </svg>
                </div>
            );
        }
        return <></>;
    };

    const computedContainerStyle = createMemo(
        () => css`
            ${containerStyle} ${normalizedProps.styleOverwrite()}
        `,
    );

    // Render
    return (
        <div class={computedContainerStyle()} id="on-screen-keyboard">
            <For each={normalizedProps.layout}>
                {(row, index) => (
                    <div class={computeStylesForRow(row)} id={'okb-row-' + index()}>
                        {mapCharsToKeyElements(row)}
                    </div>
                )}
            </For>
            {appendHands()}
        </div>
    );
};
export default OnScreenKeyboard;

const keyboardTextStyle = css`
    display: grid;
    align-items: center;
    justify-items: center;

    padding-bottom: 0.5rem;

    text-shadow: 0 0 0.1rem white;
    font-size: 1.5rem;
    text-transform: uppercase;
    font-family: monospace;
    text-shadow: 0 0 0.5rem white;
    transition: all 0.3s ease;

    &:hover {
        text-shadow: 0 0 0.5rem black;
        color: white;
    }
`;

const colorOverlayStyle = (color: string) => css`
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: grid;
    align-items: center;
    background: ${color};
    border-radius: 0.5rem;
`;

const handsOverlayContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
`;

const containerStyle = css`
    background-image: linear-gradient(70deg, #333, #666, #333, #666, #333);
    display: grid;
    grid-template-rows: repeat(5, 1fr);
    row-gap: ${keySpacing};
    height: 100%;
    width: 100%;
    max-width: 100%;
    padding: 0.25rem;
    padding-bottom: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
`;

const keyBaseStyle = css`
    width: calc(100% - ${keySpacing});
    height: 100%;
    border-radius: 0.5rem;
    color: #000;
    display: grid;
    align-items: center;
    background-image: linear-gradient(#555 0%, #aaa 5%, #aaa 80%, #333 100%);
    transition: all 0.3s ease;
    &:hover {
        color: white;
        filter: drop-shadow(0 0 1rem white);
    }
`;

const keyHighlightedStyle = css`
    background-image: linear-gradient(#111 0%, #333 5%, #333 80%, #111 100%);
    outline: 2px solid white;
    color: white;
    filter: drop-shadow(0 0 1rem white);
    transition: all 0.3s ease;
`;

const keyIgnoredStyle = css`
    background-image: linear-gradient(#333 0%, #555 5%, #555 80%, #333 100%);
    color: transparent;
    text-shadow: none;
    filter: none;
    transition: all 0.3s ease;
    &:hover {
        color: #666;
        filter: none;
        text-shadow: none;
        filter: none;
    }
`;

const fjBumpStyle = css`
    position: relative;
    width: 1rem;
    height: 0.25rem;
    border-radius: 0.5rem;
    background-image: linear-gradient(0deg, black, rgba(0, 0, 0, 0.1));
    z-index: 100;
    transform: translate(-50%, -100%);
    left: 50%;
    transition: all 0.3s ease;
`;
