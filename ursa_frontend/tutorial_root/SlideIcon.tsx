import { css } from '@emotion/css';
import { Component } from 'solid-js';

export interface SlideIconProps {
    styleOverwrite?: string;
    iconSrc?: string;
}

const SlideIcon: Component<SlideIconProps> = (props: SlideIconProps) => {
    return (
        <div
            class={css`
                ${slideIconStyle} ${props.styleOverwrite}
            `}
        >
            {props.iconSrc ? <img src={props.iconSrc} alt="icon" /> : '?'}
        </div>
    );
};
export default SlideIcon;

const slideIconStyle = css`
    width: 5rem;
    height: 5rem;
    background-color: rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    box-shadow: 0.5rem 0.5rem 1rem rgba(0, 0, 0, 0.5);
    font-size: 2rem;
    color: white;
    font-weight: 700;
    text-shadow: 0.1rem 0.1rem 0.1rem rgba(0, 0, 0, 0.5);
`;
