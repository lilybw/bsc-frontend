import { css } from '@emotion/css'

/**
 * Small style fragments
 */
export const Styles = {
    NO_OVERFLOW: css`
        overflow: hidden !important;
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
    `
}

export const SHARED_CSS_STR =`
body {
    margin: 0;
    background-color: #000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
        monospace;
}
`
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
`

export const SHARED_CSS = css`${SHARED_CSS_STR}`