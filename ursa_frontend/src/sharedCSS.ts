import { css } from '@emotion/css';
import { TransformDTO } from './integrations/main_backend/mainBackendDTOs';
import { getRandHash } from './ts/ursaMath';

const titleBase = css({
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    letterSpacing: "1rem",
    textTransform: "uppercase",
    color: "white",
    fontSize: "8rem",
    textShadow: "0.75rem 0.3rem 0.3rem rgba(255, 255, 255, 0.3)",
    filter: "drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5))",
})

const subTitleBase = css({
    textAlign: "center",
    fontFamily: "'Orbitron', sans-serif",

    fontWeight: 700,
    letterSpacing: 0,
    color: "hsla(0, 0%, 100%, 0.7)",

    fontSize: "2rem",
    textShadow: "0.15rem 0.15rem 0.3rem rgba(255, 255, 255, 0.3)",
    filter: "drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5))",
})

/**
 * Small style fragments
 */
export const Styles = {
    NO_OVERFLOW: css({
        overflow: "hidden",
    }),
    NO_SHOW: css({
        display: "none",
    }),
    FULL_SCREEN: css({
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
    }),
    OVERLAY: {
        CENTERED_QUARTER: css({
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",

            top: "50%",
            left: "50%",
            width: "50%",
            height: "50%",
            transform: "translate(-50%, -50%)",
        }),
    },
    MINIGAME: {
        TITLE: css([titleBase, {  
            fontSize: "3rem",
            color: "black",
            textShadow: "0 0 0.5rem rgba(60, 140, 255, 1)",
        }]),
        DIFFICULTY_NAME: css([subTitleBase, {
            textShadow: "none",
            color: "hsl(30, 80%, 50%)",
            textTransform: "uppercase",
        }])
    },
    TRANSFORM_CENTER_X: css({
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
    }),
    TRANSFORM_CENTER_Y: css({
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
    }),
    TRANSFORM_CENTER: css({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
    }),
    TITLE: titleBase,
    SUB_TITLE: subTitleBase,
    MENU_INPUT: css`
        position: relative;
        border-radius: 1rem;
        width: 50%;
        height: 2rem;
        justify-content: center;
        padding: 0.5rem;
        background-color: transparent;
        border: 0.15rem solid white;
        color: white;
        text-align: center;
        font-size: 1.5rem;

        &:focus {
            outline: none;
            filter: drop-shadow(0 0 0.5rem white);
        }

        &::placeholder {
            color: white;
            opacity: 0.5;
            font-style: italic;
        }

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    `,
    CROSS_HATCH_GRADIENT: css({
        backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(128, 128, 128, 0.5) 10px,
            rgba(128, 128, 128, 0.5) 20px
        )`,
        backgroundSize: "28.28px 28.28px",
    }),
    transformToCSSVariables: (transform?: TransformDTO) => css`
        --transform-x: ${transform ? transform.xOffset : 0}px;
        --transform-y: ${transform ? transform.yOffset : 0}px;
        --transform-index: ${transform ? transform.zIndex : 1};
        --transform-xScale: ${transform ? transform.xScale : 1};
        --transform-yScale: ${transform ? transform.yScale : 1};
    `,
    /**
     * NOT CSS TRANSFORM, but rather using various CSS fields to apply some in-world transform.
     *
     * Expects variables:
     * * --transform-x: x position, in pixels
     * * --transform-y: y position, in pixels
     * * --transform-index: z-index, any numeric value
     * * --transform-xScale: x scale, any float
     * * --transform-yScale: y scale, any float
     */
    TRANSFORM_APPLICATOR: css({
        position: "absolute",
        left: "var(--transform-x)",
        top: "var(--transform-y)",
        zIndex: "var(--transform-index)",
        transform: "scale(var(--transform-xScale), var(--transform-yScale)) translate(-50%, -50%)",
    }),
    FANCY_BORDER: css({
        borderRadius: "5vh",
        border: "0.25rem solid white",
        borderLeft: "0px",
        borderRight: "0px",

        backdropFilter: "blur(0.5rem)",
        boxShadow: `
            0 0 1rem rgba(255, 255, 255, 0.2) inset,
            0 0 1rem black
            `,
    }),
    ANIM:{
        FADE_OUT: (seconds: number, interpolation: string = "linear") => {
            const randHash = getRandHash();
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
            const randHash = getRandHash();
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
        /**
         * @param transformProperties overwrites the transform field, so include any previous properties.
         */
        SHAKE: (seconds: number, interpolation: string = "linear", transformProperties: string = "") => {
            const randHash = getRandHash();
            return css`
                animation: shake-${randHash} ${seconds}s ${interpolation};
                transform:  ${transformProperties} translate3d(0, 0, 0);
                --color-shadow-offset: -0.5rem;
                --color-shadow-size: 0.1rem;
                --color-shadow-color-2: hsla(360, 100%, 54%, 1);
                --color-shadow-color-1: hsla(198, 100%, 50%, 0.7);
                --color-shadow-color-3: hsla(36, 100%, 50%, 0.7);
                --color-shadow-color-4: hsla(26, 100%, 50%, 0.7);

                @keyframes shake-${randHash} {
                    10%,
                    90% {
                        transform: ${transformProperties} translate3d(-1px, 0, 0);
                        filter: drop-shadow(calc(-1 * var(--color-shadow-offset)) 0 var(--color-shadow-size) var(--color-shadow-color-1));
                    }
                    20%,
                    80%,
                    100% {
                        transform: ${transformProperties} translate3d(2px, 0, 0);
                        filter: drop-shadow(var(--color-shadow-offset) 0 var(--color-shadow-size) var(--color-shadow-color-2));
                    }
                    30%,
                    50%,
                    70% {
                        transform: ${transformProperties} translate3d(-4px, 0, 0);
                        filter: drop-shadow(
                            calc(-1 * var(--color-shadow-offset)) calc(-1 * var(--color-shadow-offset)) var(--color-shadow-size) var(--color-shadow-color-4)
                        );
                    }
                    40%,
                    60%,
                    0% {
                        transform: ${transformProperties} translate3d(4px, 0, 0);
                        filter: drop-shadow(var(--color-shadow-offset) var(--color-shadow-offset) var(--color-shadow-size) var(--color-shadow-color-3));
                    }
                }
            `;
        }
    },
    GLASS: {
        FAINT_BACKGROUND: css({
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(0.3rem)",
        }),
        BACKGROUND: css({
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(0.5rem)",
        }),
    },
};
export const BigButtonStyle = css`
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
`;
