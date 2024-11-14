import { GlobalHashPool } from "@/ts/ursaMath";
import { css } from "@emotion/css";
import { RetainedProperties } from "./sharedCSS";


interface ShakeOptions {
    seconds?: number;
    strength?: number;
    interpolation?: string;
    /** To be retained when animation is active */
    retainedProperties?: RetainedProperties;
}

export const defaultAnimations = {
    FADE_OUT: (seconds: number, interpolation: string = "linear") => {
        const randHash = GlobalHashPool.next();
        return css`
            opacity: 1;
            animation: fadeOut-${randHash} ${seconds}s ${interpolation};
            @keyframes fadeOut-${randHash} {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
    `},
    FADE_IN: (seconds: number, interpolation: string = "linear") => {
        const randHash = GlobalHashPool.next();
        return css`
        opacity: 0;
        animation: fadeIn-${randHash} ${seconds}s ${interpolation};
        @keyframes fadeIn-${randHash} {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    `},
    SHAKE: ({
        seconds = .5, 
        interpolation = "linear", 
        strength = 1,
        retainedProperties = { transform: "" }
    }: ShakeOptions) => {
        const randHash = GlobalHashPool.next();
        return css`
            animation: shake-${randHash} ${seconds}s ${interpolation};
            transform:  ${retainedProperties.transform} translate3d(0, 0, 0);
            @keyframes shake-${randHash} {
                10%,
                90% {
                    transform: ${retainedProperties.transform} translate3d(-${strength}px, 0, 0);
                }
                20%,
                80%,
                100% {
                    transform: ${retainedProperties.transform} translate3d(${2 * strength}px, 0, 0);
                }
                30%,
                50%,
                70% {
                    transform: ${retainedProperties.transform} translate3d(-${4 * strength}px, 0, 0);
                }
                40%,
                60%,
                0% {
                    transform: ${retainedProperties.transform} translate3d(${4 * strength}px, 0, 0);
                }
            }
        `;
    },
    /**
     * @param transformProperties overwrites the transform field, so include any previous properties.
     */
    COLOR_SHAKE: ({
            seconds = .5, 
            interpolation = "linear", 
            strength = 1,
            retainedProperties = { transform: "", filter: "" }
        }: ShakeOptions) => {
        const randHash = GlobalHashPool.next();
        return css`
            animation: shake-${randHash} ${seconds}s ${interpolation};
            transform:  ${retainedProperties.transform} translate3d(0, 0, 0);
            --color-shadow-offset: -0.5rem;
            --color-shadow-size: 0.1rem;
            --color-shadow-color-2: hsla(360, 100%, 54%, 1);
            --color-shadow-color-1: hsla(198, 100%, 50%, 0.7);
            --color-shadow-color-3: hsla(36, 100%, 50%, 0.7);
            --color-shadow-color-4: hsla(26, 100%, 50%, 0.7);

            @keyframes shake-${randHash} {
                10%,
                90% {
                    transform: ${retainedProperties.transform} translate3d(-${strength}px, 0, 0);
                    filter: ${retainedProperties.filter} drop-shadow(calc(-1 * var(--color-shadow-offset)) 0 var(--color-shadow-size) var(--color-shadow-color-1));
                }
                20%,
                80%,
                100% {
                    transform: ${retainedProperties.transform} translate3d(${2 * strength}px, 0, 0);
                    filter: ${retainedProperties.filter} drop-shadow(var(--color-shadow-offset) 0 var(--color-shadow-size) var(--color-shadow-color-2));
                }
                30%,
                50%,
                70% {
                    transform: ${retainedProperties.transform} translate3d(-${4 * strength}px, 0, 0);
                    filter: ${retainedProperties.filter} drop-shadow(
                        calc(-1 * var(--color-shadow-offset)) calc(-1 * var(--color-shadow-offset)) var(--color-shadow-size) var(--color-shadow-color-4)
                    );
                }
                40%,
                60%,
                0% {
                    transform: ${retainedProperties.transform} translate3d(${4 * strength}px, 0, 0);
                    filter: ${retainedProperties.filter} drop-shadow(var(--color-shadow-offset) var(--color-shadow-offset) var(--color-shadow-size) var(--color-shadow-color-3));
                }
            }
        `;
    }
}