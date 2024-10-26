import { css } from "@emotion/css";
import { Styles } from "../src/sharedCSS";
import { Component } from "solid-js";
import { IInternationalized, IParenting } from "../src/ts/types";

interface FulLScreenNotificationProps extends IInternationalized, IParenting {
    /** intl key */
    reason: string;
    durationMS?: number;
    onClose?: () => void;
}

const FullScreenNotification: Component<FulLScreenNotificationProps> = (props) => {
    setTimeout(() => {
        props.onClose && props.onClose();
    }, props.durationMS ?? 5000);
    return (
        <div class={closureNotificationContainer}>
            <div class={contentAreaStyle}>
                {props.text.Title(props.reason)({styleOverwrite: titleStyle})}
                {props.text.SubTitle("NOTIFICATION.RETURNING_TO_MENU_IN")({styleOverwrite: subTitleStyle})}
                {props.children}
            </div>
        </div>
    )
}
export default FullScreenNotification; 

const contentAreaStyle = css`
display: flex;
flex-direction: column;
top: 50%;
width: 100%;
height: fit-content;
${Styles.GLASS.FAINT_BACKGROUND}
`

const titleStyle = css`

`
const subTitleStyle = css`

`
const closureNotificationContainer = css`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 100000;
    ${Styles.GLASS.FAINT_BACKGROUND}
`