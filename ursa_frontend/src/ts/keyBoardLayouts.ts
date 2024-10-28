export enum SymbolType {
    Numeric = 'Numeric',
    Special = 'Special',
    Alphabetic = 'Alphabetic',
    Grammar = 'Grammar',
    Math = 'Math',
}

type Finger = { name: string; color: string };

export const Fingers: { [key: string]: Finger } = {
    L_THUMB: { name: 'L_THUMB', color: '224, 255, 225' },
    L_INDEX: { name: 'L_INDEX', color: '12, 174, 59' },
    L_MIDDLE: { name: 'L_MIDDLE', color: '139, 255, 151' },
    L_RING: { name: 'L_RING', color: '0, 143, 45' },
    L_PINKY: { name: 'L_PINKY', color: '106, 236, 122' },

    R_THUMB: { name: 'R_THUMB', color: '0, 102, 30' },
    R_INDEX: { name: 'R_INDEX', color: '82, 215, 102' },
    R_MIDDLE: { name: 'R_MIDDLE', color: '0, 63, 15' },
    R_RING: { name: 'R_RING', color: '57, 194, 82' },
    R_PINKY: { name: 'R_PINKY', color: '0, 31, 4' },
};

export type KeyElement = {
    char: string;
    /** Some fraction of the total keyboard width */
    width: number;
    /** Arbitrary classification(s) for key */
    symbolTypes: SymbolType[];
    /** Intended finger use for key, may be multiple (as sources vary) */
    finger: Finger[];
};
//The following finger designations are based on this Medium article: https://medium.com/@akashshinde740/30-days-is-all-you-need-to-learn-touch-typing-5a7c7a84f906
//Simply because the illustration was nice
const kbFirstRowDK: KeyElement[] = [
    { char: '½', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_RING, Fingers.L_PINKY] },
    { char: '1', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_RING, Fingers.L_PINKY] },
    { char: '2', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_RING] },
    { char: '3', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_MIDDLE] },
    { char: '4', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_INDEX] },
    { char: '5', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_INDEX] },
    { char: '6', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_INDEX] },
    { char: '7', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_INDEX] },
    { char: '8', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_MIDDLE] },
    { char: '9', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_MIDDLE] },
    { char: '0', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_RING] },
    { char: '+', width: 1 / 16, symbolTypes: [SymbolType.Math], finger: [Fingers.R_RING, Fingers.R_PINKY] },
    { char: '´', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_PINKY] },
    { char: '<-', width: 3 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];
const kbSecondRowDK: KeyElement[] = [
    { char: 'Tab', width: 1.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'q', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_PINKY, Fingers.L_RING] },
    { char: 'w', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING, Fingers.L_MIDDLE] },
    { char: 'e', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE] },
    { char: 'r', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 't', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'y', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'u', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'i', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_MIDDLE] },
    { char: 'o', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING, Fingers.R_MIDDLE] },
    { char: 'p', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING] },
    { char: 'å', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_PINKY, Fingers.R_RING] },
    { char: '¨', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_PINKY] },
    { char: '⏎', width: 2.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];
const kbThirdRowDK: KeyElement[] = [
    { char: 'Caps', width: 1.75 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'a', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING, Fingers.L_PINKY] },
    { char: 's', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE] },
    { char: 'd', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE, Fingers.L_INDEX] },
    { char: 'f', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'g', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'h', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'j', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'k', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_MIDDLE] },
    { char: 'l', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING] },
    { char: 'æ', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING, Fingers.R_PINKY] },
    { char: 'ø', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_PINKY, Fingers.R_RING] },
    { char: "'", width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_PINKY] },
    { char: '⏎', width: 2.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];
const kbFourthRowDK: KeyElement[] = [
    { char: 'Shift', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: '>', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.L_PINKY] },
    { char: 'z', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING] },
    { char: 'x', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING, Fingers.L_MIDDLE] },
    { char: 'c', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE] },
    { char: 'v', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'b', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'n', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'm', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: ',', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_MIDDLE] },
    { char: '.', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING] },
    { char: '-', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING, Fingers.R_PINKY] },
    { char: 'Shift', width: 3.75 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];
const kbFifthRowDK: KeyElement[] = [
    { char: 'Ctrl', width: 1.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'OS', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_RING] },
    { char: 'Alt', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_THUMB] },
    { char: 'Space', width: 8 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_THUMB, Fingers.R_THUMB] },
    { char: 'Alt', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_THUMB] },
    { char: 'OS', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_RING] },
    { char: 'Ctrl', width: 1.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];
export const DK_KEYBOARD_LAYOUT: KeyElement[][] = [kbFirstRowDK, kbSecondRowDK, kbThirdRowDK, kbFourthRowDK, kbFifthRowDK];

const kbFirstRowENGB: KeyElement[] = [
    { char: '´', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.L_RING, Fingers.L_PINKY] },
    { char: '1', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_RING, Fingers.L_PINKY] },
    { char: '2', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_RING] },
    { char: '3', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_MIDDLE] },
    { char: '4', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_INDEX] },
    { char: '5', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.L_INDEX] },
    { char: '6', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_INDEX] },
    { char: '7', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_INDEX] },
    { char: '8', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_MIDDLE] },
    { char: '9', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_MIDDLE] },
    { char: '0', width: 1 / 16, symbolTypes: [SymbolType.Numeric], finger: [Fingers.R_RING] },
    { char: '-', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING] },
    { char: '=', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_PINKY] },
    { char: '<-', width: 3 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];

const kbSecondRowENGB: KeyElement[] = [
    { char: 'Tab', width: 1.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'q', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_PINKY, Fingers.L_RING] },
    { char: 'w', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING, Fingers.L_MIDDLE] },
    { char: 'e', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE] },
    { char: 'r', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 't', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'y', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'u', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'i', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_MIDDLE] },
    { char: 'o', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING, Fingers.R_MIDDLE] },
    { char: 'p', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING] },
    { char: '[', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING, Fingers.R_PINKY] },
    { char: ']', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_PINKY] },
    { char: '⏎', width: 2.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];

const kbThirdRowENGB: KeyElement[] = [
    { char: 'Caps', width: 1.75 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'a', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING, Fingers.L_PINKY] },
    { char: 's', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE] },
    { char: 'd', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_MIDDLE, Fingers.L_INDEX] },
    { char: 'f', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'g', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'h', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'j', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'k', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_MIDDLE] },
    { char: 'l', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_RING] },
    { char: ';', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING, Fingers.R_PINKY] },
    { char: "'", width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_PINKY, Fingers.R_RING] },
    { char: '#', width: 1 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
    { char: '⏎', width: 2.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];

const kbFourthRowENGB: KeyElement[] = [
    { char: 'Shift', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: '\\', width: 1 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'z', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING] },
    { char: 'x', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_RING, Fingers.L_MIDDLE] },
    { char: 'c', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX, Fingers.L_MIDDLE] },
    { char: 'v', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'b', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_INDEX] },
    { char: 'n', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: 'm', width: 1 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.R_INDEX] },
    { char: ',', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_MIDDLE] },
    { char: '.', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING] },
    { char: '/', width: 1 / 16, symbolTypes: [SymbolType.Grammar], finger: [Fingers.R_RING, Fingers.R_PINKY] },
    { char: 'Shift', width: 3.75 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];

const kbFifthRowENGB: KeyElement[] = [
    { char: 'Ctrl', width: 1.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_PINKY] },
    { char: 'OS', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_RING] },
    { char: 'Alt', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.L_THUMB] },
    { char: 'Space', width: 8 / 16, symbolTypes: [SymbolType.Alphabetic], finger: [Fingers.L_THUMB, Fingers.R_THUMB] },
    { char: 'Alt', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_THUMB] },
    { char: 'OS', width: 1.25 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_RING] },
    { char: 'Ctrl', width: 1.5 / 16, symbolTypes: [SymbolType.Special], finger: [Fingers.R_PINKY] },
];

// Taken from: https://keyshorts.com/blogs/blog/us-keyboard-layout-everything-you-need-to-know
// Which is actually the US keyboard, but used as en-GB for now. The article also states that the only difference is
// the pound symbol being on shift + 3, and this layout only shows the base symbols anyways
// No depiction will be 100% accurate anyway as manufacturers may vary
export const EN_GB_KEYBOARD_LAYOUT: KeyElement[][] = [kbFirstRowENGB, kbSecondRowENGB, kbThirdRowENGB, kbFourthRowENGB, kbFifthRowENGB];
