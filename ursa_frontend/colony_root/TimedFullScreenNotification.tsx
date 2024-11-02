import BigMenuButton from '@/components/base/BigMenuButton';
import Countdown from '@/components/util/Countdown';
import { Styles } from '@/sharedCSS';
import { IInternationalized, IParenting } from '@/ts/types';
import { css } from '@emotion/css';
import { Component } from 'solid-js';

interface TimedFullScreenNotificationProps extends IInternationalized, IParenting {
    /** intl key */
    reason: string;
    durationMS?: number;
    onClose?: () => void;
    onCompletion?: () => void;
}

const TimedFullScreenNotification: Component<TimedFullScreenNotificationProps> = (props) => {
    return (
        <div class={closureNotificationContainer}>
            <div class={contentAreaStyle}>
                {props.text.Title(props.reason)({ styleOverwrite: titleStyle })}
                {props.text.SubTitle('NOTIFICATION.RETURNING_TO_MENU_IN')({ styleOverwrite: subTitleStyle })}
                <Countdown duration={(props.durationMS ?? 5000) / 1000} onComplete={props.onCompletion} styleOverwrite={countDownStyle} />
                {props.children}
            </div>
            <BigMenuButton onClick={props.onClose} styleOverwrite={closeButtonStyle}>
                X
            </BigMenuButton>
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
