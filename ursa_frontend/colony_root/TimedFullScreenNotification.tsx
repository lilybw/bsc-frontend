import BigMenuButton from '@/components/base/BigMenuButton';
import Countdown from '@/components/util/Countdown';
import { Styles } from '@/styles/sharedCSS';
import { IInternationalized, IParenting } from '@/ts/types';
import { css } from '@emotion/css';
import { Component, Show } from 'solid-js';

interface TimedFullScreenNotificationProps extends IInternationalized, IParenting {
    /** intl key */
    title: string;
    /** intl key */
    subTitle?: string;
    onClose?: () => void;
    /** Show a countdown, and do something on completion */
    onCompletion?: () => void;
    /** countdown time @default 5000 */
    durationMS?: number;
}

const TimedFullScreenNotification: Component<TimedFullScreenNotificationProps> = (props) => {
    return (
        <div class={closureNotificationContainer}>
            <div class={contentAreaStyle}>
                <Show when={props.title}>
                    {props.text.Title(props.title)({ styleOverwrite: titleStyle })} 
                </Show>
                <Show when={props.subTitle}>
                    {props.text.SubTitle(props.subTitle!)({ styleOverwrite: subTitleStyle })}
                </Show>
                <Show when={props.onCompletion}>
                    <Countdown duration={(props.durationMS ?? 5000) / 1000} onComplete={props.onCompletion} styleOverwrite={countDownStyle} />
                </Show>
                {props.children}
            </div>
            <Show when={props.onClose}>
                <BigMenuButton onClick={props.onClose} styleOverwrite={closeButtonStyle}>
                    X
                </BigMenuButton>
            </Show>
        </div>
    );
};
export default TimedFullScreenNotification;

const countDownStyle = css`
    ${Styles.TITLE}
    font-size: 3rem;
`;

const closeButtonStyle = css`
    position: absolute;
    width: 5vw;
    bottom: 1rem;
    z-index: 100000;
`;

const contentAreaStyle = css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    top: 50%;
    width: 100%;
    height: fit-content;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;

const titleStyle = css`
    font-size: 3rem;
`;
const subTitleStyle = css``;
const closureNotificationContainer = css`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 100000;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;
