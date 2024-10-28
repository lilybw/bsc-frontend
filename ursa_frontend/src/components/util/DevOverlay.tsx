import { Component } from 'solid-js';
import { ApplicationContext } from '../../meta/types';
import { css } from '@emotion/css';
import { Styles } from '../../sharedCSS';
import BigMenuButton from '../base/BigMenuButton';
import ExpandingHeader from '../base/ExpandingHeader';

interface DevOverlayProps {
    context: ApplicationContext;
    hide: () => void;
}

/**
 * Compact optional view access on ctrl + f3 when runtime mode is dev
 */
const DevOverlay: Component<DevOverlayProps> = (props) => {
    return (
        <div class={devOverlayContainer}>
            <ExpandingHeader name="Multiplayer">
                <AttributeDisplay name="State" value={props.context.multiplayer.getState()} />
                <AttributeDisplay name="Mode" value={props.context.multiplayer.getMode()} />
                <AttributeDisplay name="Code" value={props.context.multiplayer.getCode()} />
            </ExpandingHeader>

            <BigMenuButton styleOverwrite={closeButtonStyle} onClick={props.hide}>
                X
            </BigMenuButton>
        </div>
    );
};
export default DevOverlay;

const AttributeDisplay: Component<{ name: string; value: any }> = (props) => {
    return (
        <div
            class={css`
                display: flex;
                flex-direction: row;
                justify-content: space-evenly;
            `}
        >
            <div class={attributeNameStyle}>{props.name}</div>
            <div class={attributeValueStyle}>{props.value}</div>
        </div>
    );
};

const attributeNameStyle = css`
    color: white;
    font-size: 1.5rem;
`;
const attributeValueStyle = css`
    ${attributeNameStyle}
    color: orange;
`;

const closeButtonStyle = css`
    bottom: 0;
    width: 5vw;
`;

const devOverlayContainer = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;

    row-gap: 1rem;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 0 1rem 0.5rem rgba(0, 0, 0, 0.2);

    width: 66%;
    height: 80%;
    z-index: 1000000000;

    overflow-y: clip;
    overflow-x: auto;

    ${Styles.GLASS.BACKGROUND}
`;
