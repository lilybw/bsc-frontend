import { Component, createEffect, createMemo, createSignal } from 'solid-js';
import { TransformDTO, uint32 } from '../../integrations/main_backend/mainBackendDTOs';
import { css } from '@emotion/css';
import { Styles } from '../../sharedCSS';
import { ClientDTO } from '../../integrations/multiplayer_backend/multiplayerDTO';
import { WrappedSignal } from '../../ts/wrappedSignal';
import { IBackendBased, IStyleOverwritable } from '../../ts/types';

interface PlayerProps extends IStyleOverwritable, IBackendBased {
    client: ClientDTO;
    transformMap: Map<uint32, WrappedSignal<TransformDTO>>;
    showNamePlate?: boolean;
    isLocalPlayer?: boolean;
}

const UNIT_TRANSFORM: TransformDTO = { xOffset: 0, yOffset: 0, zIndex: 0, xScale: 0, yScale: 1 };

const Player: Component<PlayerProps> = (props) => {
    const [currentTransform, setCurrentTransform] = createSignal<TransformDTO>(UNIT_TRANSFORM);

    createEffect(() => {
        //Somehow this is reactive. The client is a proxy object from a store, so I guess thats why
        const currentLoc = props.client.state.lastKnownPosition;
        const transform = props.transformMap.get(currentLoc);
        if (transform) {
            setCurrentTransform(transform.get());
        }
    });

    const computedContainerStyles = createMemo(
        () => css`
            ${playerContainer}
            ${props.isLocalPlayer ? localPlayerStyleOverwrite : ''}
            ${Styles.transformToCSSVariables(currentTransform())}
            ${Styles.TRANSFORM_APPLICATOR}
            ${props.styleOverwrite}
        `,
    );

    const appendNamePlate = () => {
        if (props.showNamePlate) {
            return <div class={namePlateStyle}>{props.client.IGN}</div>;
        }
    };

    return (
        <div class={computedContainerStyles()} id={'player-' + props.client.IGN}>
            {appendNamePlate()}
        </div>
    );
};
export default Player;

const localPlayerStyleOverwrite = css`
    background-color: green;
`;

const namePlateStyle = css`
    position: absolute;
    display: flex;

    z-index: 201;
    bottom: -7vh;
    left: 50%;
    height: 5vh;
    width: fit-content;
    transform: translateX(-50%);
    padding: 0.1rem;

    color: white;
    font-size: 1.5rem;
    text-align: center;
    text-shadow: 0 0 5px black;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;

const playerContainer = css`
    z-index: 200;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: blue;
    box-shadow: 0 0 10px 0 rgba(255, 255, 255, 0.5);
    transition:
        top 0.5s ease-in-out,
        left 0.5s ease-in-out;
`;
