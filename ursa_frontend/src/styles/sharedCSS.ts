import { css } from '@emotion/css';
import { TransformDTO } from '../integrations/main_backend/mainBackendDTOs';
import { GlobalHashPool } from '../ts/ursaMath';
import { defaultAnimations } from './animations';
import { subTitleBase, titleBase } from './text';
import { positionalStyles } from './positional';
import { themeBackgroundStyles } from './theme';

/** Properties to apply to all fields otherwise overwritten by the generated style */
export interface RetainedProperties {
    [key: string]: string;
}
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
    OVERLAY: {
        CENTERED_QUARTER: css({
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly",

            top: "50vh",
            left: "50vw",
            width: "50vw",
            height: "50vh",
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
    POSITION: positionalStyles,
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
    ANIM: defaultAnimations,
    GLASS: themeBackgroundStyles,
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
    font-family: 'Be Vietnam Pro', sans-serif;


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
