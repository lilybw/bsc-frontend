import { JSX } from "solid-js/jsx-runtime";
import { css } from '@emotion/css';
import { KeyElement, SymbolType, DK_KEYBOARD_LAYOUT } from '../../ts/keyBoardLayouts';
import { Component, createMemo, For, mergeProps } from "solid-js";
import { IStyleOverwritable } from "../../ts/types";

interface OnScreenKeyboardProps extends IStyleOverwritable {
    /**
     * Keys that should be highlighted.
     * @default []
     */
    highlighted?: string[];
    /**
     * Keys that should be ignored. See the shorthand properties for ignoring specific types of keys.
     * @default []
     */
    ignored?: string[];
    /**
     * Show hand handplacement on the keyboard.
     * @default false
     */
    showHands?: boolean;
    /**
     * Show intended finger use for each key by coloring each key accordingly.
     * @default true
     */
    showIntendedFingerUseForKey?: boolean;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * Hard shade the key with the gradient of the finger(s) available for the key.
     * (Constant / no interpolation of colors vs. linear gradient)
     * @default true
     */
    hardShadeMultiFingerKeyGradients?: boolean;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * The intensity of the colorization. 0 is no colorization, 1 is full colorization.
     * @default 1
     */
    colorizationIntensity?: number;
    /**
     * Relates to the showIntendedFingerUseForKey property.
     * When set, the keyboard will highlight only the intended finger use for the given fingering scheme.
     * @default -1 (disabled)
     */
    fingeringSchemeFocused?: number;
    /**
     * Keys like CMD, ALT, SHIFT, etc. that are not printable characters.
     * @default false
     */
    ignoreSpecialKeys?: boolean;
    /**
     * Numeric keys 0-9 and ½.
     * @default false
     */
    ignoreNumericKeys?: boolean;
    /**
     * Alphabetic keys a-z and special language specific characters like: æ ø å.
     * @default false
     */
    ignoreAlphabeticKeys?: boolean;
    /**
     * Grammatical symbols like: , . ! ?.
     * @default false
     */
    ignoreGrammarKeys?: boolean;
    /**
     * Math keys like: + - * / =.
     * @default false
     */
    ignoreMathKeys?: boolean;
    /**
     * The layout of the keyboard. Each row is an array of KeyElement objects.
     * @default DK_KEYBOARD_LAYOUT
     */
    layout?: KeyElement[][];
    keyBaseStyleOverride?: string;
}
interface NormalizedOnScreenKeyboardProps extends IStyleOverwritable {
    /**
     * Keys that should be highlighted.
     * @default []
     */
    highlighted: string[];
    /**
     * Keys that should be ignored. See the shorthand properties for ignoring specific types of keys.
     * @default []
     */
    ignored: string[];
    /**
     * Show hand handplacement on the keyboard.
     * @default false
     */
    showHands: boolean;
    /**
     * Show intended finger use for each key by coloring each key accordingly.
     * @default true
     */
    showIntendedFingerUseForKey: boolean;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * Hard shade the key with the gradient of the finger(s) available for the key.
     * (Constant / no interpolation of colors vs. linear gradient)
     * @default true
     */
    hardShadeMultiFingerKeyGradients: boolean;
    /**
     * Relates to the "showIntendedFingerUseForKey" property
     * The intensity of the colorization. 0 is no colorization, 1 is full colorization.
     * @default 1
     */
    colorizationIntensity: number;
    /**
     * Relates to the showIntendedFingerUseForKey property.
     * When set, the keyboard will highlight only the intended finger use for the given fingering scheme.
     * @default -1 (disabled)
     */
    fingeringSchemeFocused: number;
    /**
     * Keys like CMD, ALT, SHIFT, etc. that are not printable characters.
     * @default false
     */
    ignoreSpecialKeys: boolean;
    /**
     * Numeric keys 0-9 and ½.
     * @default false
     */
    ignoreNumericKeys: boolean;
    /**
     * Alphabetic keys a-z and special language specific characters like: æ ø å.
     * @default false
     */
    ignoreAlphabeticKeys: boolean;
    /**
     * Grammatical symbols like: , . ! ?.
     * @default false
     */
    ignoreGrammarKeys: boolean;
    /**
     * Math keys like: + - * / =.
     * @default false
     */
    ignoreMathKeys: boolean;
    /**
     * The layout of the keyboard. Each row is an array of KeyElement objects.
     * @default DK_KEYBOARD_LAYOUT
     */
    layout: KeyElement[][];
    keyBaseStyleOverride?: string;
}
const DEFAULTS: NormalizedOnScreenKeyboardProps = {
    highlighted: [],
    ignored: [],
    showHands: false,
    showIntendedFingerUseForKey: true,
    hardShadeMultiFingerKeyGradients: true,
    colorizationIntensity: .7,
    fingeringSchemeFocused: -1,
    ignoreSpecialKeys: false,
    ignoreNumericKeys: false,
    ignoreAlphabeticKeys: false,
    ignoreGrammarKeys: false,
    ignoreMathKeys: false,
    layout: DK_KEYBOARD_LAYOUT,
};
const normalizeProps = (props: OnScreenKeyboardProps): NormalizedOnScreenKeyboardProps => {
    return mergeProps(DEFAULTS, props);
}
const keySpacing = ".25rem";

const OnScreenKeyboard: Component<OnScreenKeyboardProps> = (_props) => {
    const normalizedProps = normalizeProps(_props);
    const kbKeyHtmlElementMap = new Map<string, HTMLElement>();

    const appendDotIfForJ = (key: KeyElement): JSX.Element => {
        if (key.char === 'f' || key.char === 'j') {
            return <div class={fjBumpStyle}></div>;
        }
        return <></>;
    }

    const colourizeTheButtonIfApplicable = (key: KeyElement, isIgnored: boolean, children: JSX.Element): JSX.Element => {
        if (!normalizedProps.showIntendedFingerUseForKey || isIgnored) {
            return <>{children}</>;
        }
        //In the case that a specific scheme is requested OR no alternative fingerings are available
        if(normalizedProps.fingeringSchemeFocused > -1 || key.finger.length == 1){
            let indexToUse = key.finger.length - 1;
            if(normalizedProps.fingeringSchemeFocused != -1){
                indexToUse = normalizedProps.fingeringSchemeFocused >= key.finger.length ? key.finger.length - 1 : normalizedProps.fingeringSchemeFocused;
            }
            const finger = key.finger[indexToUse];
            const constColor = `rgba(${finger.color}, ${normalizedProps.colorizationIntensity})`;
            //This little repition is needed as linear-gradient requires 2 or more colors inputted at all times.
            const computedGradient = `linear-gradient(90deg, ${constColor}, ${constColor});`;
         
            return <div class={colorOverlayStyle(computedGradient)}>{children}</div>;
        }

        //In the case that no specific scheme is requested
        let computedGradient = "linear-gradient(90deg, ";
        const stepSize = 100 / key.finger.length;
        for (let i = 0; i < key.finger.length; i++) {
            const finger = key.finger[i];
            const color = `rgba(${finger.color}, ${normalizedProps.colorizationIntensity})`;
            if(normalizedProps.hardShadeMultiFingerKeyGradients){
                computedGradient += `${color} ${stepSize * i}%, ${color} ${(stepSize * (i + 1)) - 1}%`;
            }else{
                computedGradient += `${color}`;
            }
            if (i < key.finger.length - 1) {
                computedGradient += ", ";
            }
        }
        computedGradient += ");";
        return <div class={colorOverlayStyle(computedGradient)}>{children}</div>;
    }

    const mapCharsToKeyElements = (keys: KeyElement[]): JSX.Element[] => {
        const elements: JSX.Element[] = [];
        keys.map((key, index) => {
            const isHighlighted = normalizedProps.highlighted.includes(key.char);
            const isIgnored = normalizedProps.ignored.includes(key.char)
                || (normalizedProps.ignoreSpecialKeys && key.symbolTypes.includes(SymbolType.Special))
                || (normalizedProps.ignoreNumericKeys && key.symbolTypes.includes(SymbolType.Numeric))
                || (normalizedProps.ignoreAlphabeticKeys && key.symbolTypes.includes(SymbolType.Alphabetic))
                || (normalizedProps.ignoreGrammarKeys && key.symbolTypes.includes(SymbolType.Grammar))
                || (normalizedProps.ignoreMathKeys && key.symbolTypes.includes(SymbolType.Math));

            let computedStyle = css`${keyBaseStyle} ${normalizedProps.keyBaseStyleOverride}`;
            if (isIgnored) {
                computedStyle = css`${computedStyle} ${keyIgnoredStyle}`;
            }
            if (isHighlighted) {
                computedStyle = css`${computedStyle} ${keyHighlightedStyle}`;
            }

            const children = (
                <>
                <div class={keyboardTextStyle}>{key.char}</div>
                {appendDotIfForJ(key)}
                </>
            );

            elements.push(
                <div class={computedStyle} id={"okb-" + key.char} ref={(el) => kbKeyHtmlElementMap.set(key.char, el)}>
                    {colourizeTheButtonIfApplicable(key, isIgnored && !isHighlighted, children)}
                </div>
            )
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
        computedColumns += ";"
        return css`
            height: 100%;
            display: grid;
            ${computedColumns}
        `;
    };

    const appendHands = () => {
        if(normalizedProps.showHands) {
            return (
                <div class={handsOverlayContainerStyle}>
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                        <path d={""} fill="black" stroke="black" stroke-width="1" />
                    </svg>
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; transform: scaleX(-1)">
                        <path d={""} fill="black" stroke="black" stroke-width="1" />
                    </svg>
                </div>
            )
        }
        return <></>;
    }

    const computedContainerStyle = createMemo(() => css`${containerStyle} ${normalizedProps.styleOverwrite}`);

    // Render
    return (
        <div class={computedContainerStyle()} id="on-screen-keyboard">
            <For each={normalizedProps.layout}>{(row, index) => (
                <div class={computeStylesForRow(row)} id={"okb-row-" + index()}>
                    {mapCharsToKeyElements(row)}
                </div>
            )}</For>
            {appendHands()}
        </div>
    )
}
export default OnScreenKeyboard;

const keyboardTextStyle = css`
    display: grid;
    align-items: center;
    justify-items: center;

    padding-bottom: .5rem;

    text-shadow: 0 0 .1rem white;
    font-size: 1.5rem;
    text-transform: uppercase;
    font-family: monospace;
    text-shadow: 0 0 .5rem white;

    &:hover {
      text-shadow: 0 0 .5rem black;
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
    border-radius: .5rem;
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
    padding: .25rem;
    padding-bottom: .5rem;
    border-radius: .5rem;
`;

const keyBaseStyle = css`
    width: calc(100% - ${keySpacing});
    height: 100%;
    border-radius: .5rem;
    color: #000;
    display: grid;
    align-items: center;
    background-image: linear-gradient(#555 0%, #AAA 5%, #AAA 80%, #333 100%);
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
`;

const keyIgnoredStyle = css`
    background-image: linear-gradient(#333 0%, #555 5%, #555 80%, #333 100%);
    color: #666;
    &:hover {
        color: #666;
        filter: none;
    }
`;

const fjBumpStyle = css`
    position: relative;
    width: 1rem;
    height: .25rem;
    border-radius: .5rem;
    background-image: linear-gradient(0deg, black, rgba(0, 0, 0, 0.1));
    z-index: 100;
    transform: translate(-50%, -100%);
    left: 50%;
`;