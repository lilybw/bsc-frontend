import { css } from '@emotion/css';
import { TransformDTO } from './integrations/main_backend/mainBackendDTOs';

const titleBase = css`
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    letter-spacing: 1rem;
    text-transform: uppercase;
    color: white;
    font-size: 8rem;
    text-shadow: 0.75rem 0.3rem 0.3rem rgba(255, 255, 255, 0.3);
    filter: drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5));
`

const subTitleBase = css`
    text-align: center;
    font-family: 'Orbitron', sans-serif;

    font-weight: 700;
    letter-spacing: 0;
    color: hsla(0, 0%, 100%, 0.7);

    font-size: 2rem;
    text-shadow: 0.15rem 0.15rem 0.3rem rgba(255, 255, 255, 0.3);
    filter: drop-shadow(-0.1rem -0.2rem 0.2rem rgba(255, 255, 255, 0.5));
`

/**
 * Small style fragments
 */
export const Styles = {
    NO_OVERFLOW: css`
        overflow: hidden !important;
    `,
    NO_SHOW: css`
        display: none !important;
    `,
    OVERLAY: {
        CENTERED_QUARTER: css`
            position: absolute;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-evenly;

            top: 50%;
            left: 50%;
            width: 50%;
            height: 50%;
            transform: translate(-50%, -50%);
        `
    },
    MINIGAME: {
        TITLE: css`
            ${titleBase}
            font-size: 3rem;
            color: black;
            text-shadow: 0 0 0.5rem rgba(60, 140, 255, 1);
        `,
        DIFFICULTY_NAME: css`
            ${subTitleBase}
            text-shadow: none;
            color: hsl(30, 80%, 50%);
            text-transform: uppercase;
        `
    },
    TRANSFORM_CENTER: css`
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    `,
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
    CROSS_HATCH_GRADIENT: css`
        background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(128, 128, 128, 0.5) 10px,
            rgba(128, 128, 128, 0.5) 20px
        );
        background-size: 28.28px 28.28px;
    `,
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
    TRANSFORM_APPLICATOR: css`
        position: absolute;
        left: var(--transform-x);
        top: var(--transform-y);
        z-index: var(--transform-index);
        transform: scale(var(--transform-xScale), var(--transform-yScale)) translate(-50%, -50%);
    `,
    FANCY_BORDER: css`
        border-radius: 5vh;
        border: 0.25rem solid white;
        border-left: 0px;
        border-right: 0px;

        backdrop-filter: blur(0.5rem);
        -webkit-backdrop-filter: blur(0.5rem); // For Safari support
        box-shadow:
            0 0 1rem rgba(255, 255, 255, 0.2) inset,
            0 0 1rem black;
    `,
    ANIM_FADE_OUT: (seconds: number) => css`
        opacity: 1;
        animation: fadeOut ${seconds}s linear;
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `,
    GLASS: {
        FAINT_BACKGROUND: css`
            background-color: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(0.3rem);
        `,
        BACKGROUND: css`
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(0.5rem);
        `,
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
