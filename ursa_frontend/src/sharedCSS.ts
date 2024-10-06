import { css } from '@emotion/css';
import { TransformDTO } from './integrations/main_backend/mainBackendDTOs';

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
    TRANSFORM_CENTER: css`
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    `,
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
     * NOT CSS TRANSFORM, but rather using various CSS fields to apply some game transform.
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
        transform: scale(var(--transform-xScale), var(--transform-yScale));
    `
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
