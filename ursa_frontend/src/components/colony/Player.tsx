import { Accessor, Component, createEffect, createMemo, createSignal } from 'solid-js';
import { TransformDTO, uint32 } from '../../integrations/main_backend/mainBackendDTOs';
import { css } from '@emotion/css';
import { Styles } from '../../styles/sharedCSS';
import { ClientDTO } from '../../integrations/multiplayer_backend/multiplayerDTO';
import { WrappedSignal } from '../../ts/wrappedSignal';
import { IBackendBased, IStyleOverwritable } from '../../ts/types';
import NTAwait from '../util/NoThrowAwait';
import GraphicalAsset from '../base/GraphicalAsset';

interface PlayerProps extends IStyleOverwritable, IBackendBased {
    client: ClientDTO;
    transformMap: Map<uint32, WrappedSignal<TransformDTO>>;
    GAS: Accessor<number>;
    showNamePlate?: boolean;
    isLocalPlayer?: boolean;
    totalClients: number;
    clientIndex?: number;
}

const UNIT_TRANSFORM: TransformDTO = { xOffset: 0, yOffset: 0, zIndex: 0, xScale: 0, yScale: 1 };
const MAX_HUE = 300;

const Player: Component<PlayerProps> = (props) => {
    const [currentTransform, setCurrentTransform] = createSignal<TransformDTO>(UNIT_TRANSFORM);

    createEffect(() => {
        const currentLoc = props.client.state.lastKnownPosition;
        const transform = props.transformMap.get(currentLoc);
        if (transform) {
            setCurrentTransform(transform.get());
        }
    });

    const computedHue = createMemo(() => {
        if (props.isLocalPlayer) return 0;
        if (!props.clientIndex) return 0;

        const nonLocalClients = props.totalClients - 1;
        if (nonLocalClients <= 0) return 0;

        const segmentSize = Math.floor(MAX_HUE / nonLocalClients);
        return segmentSize * (props.clientIndex - 1);
    });

    const computedContainerStyles = createMemo(
        () => css`
            --GAS: ${props.GAS()};
            ${playerContainer}
            ${Styles.POSITION.transformToCSSVariables(currentTransform())}
            ${Styles.POSITION.TRANSFORM_APPLICATOR}
            filter: hue-rotate(${computedHue()}deg);
            ${props.styleOverwrite}
        `,
    );

    return (
        <div class={computedContainerStyles()} id={'player-' + props.client.IGN}>
            <div class={imageContainer}>
                <NTAwait func={() => props.backend.assets.getMetadata(4002)}>
                    {(asset) => (
                        <GraphicalAsset
                            metadata={asset}
                            backend={props.backend}
                            transform={{
                                xOffset: 0,
                                yOffset: 0,
                                zIndex: 0,
                                xScale: props.GAS(),
                                yScale: props.GAS()
                            }}
                            styleOverwrite={css`
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                            `}
                        />
                    )}
                </NTAwait>
            </div>
            {props.showNamePlate && (
                <div class={namePlateStyle}>
                    {props.client.IGN}
                </div>
            )}
        </div>
    );
};

export default Player;

const imageContainer = css`
    position: relative;
    width: 100%;
    height: 100%;
`;

const namePlateStyle = css`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 201;
    bottom: -7vh;
    left: 50%;
    height: 5vh;
    width: max-content;
    padding: 0.5rem 1rem;
    transform: translateX(-50%);
    color: white;
    font-size: 1.5rem;
    text-align: center;
    text-shadow: 0 0 5px black;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;

const playerContainer = css`
    z-index: 200;
    width: calc(50px * var(--GAS));
    height: calc(50px * var(--GAS));
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition:
        top 0.5s ease-in-out,
        left 0.5s ease-in-out,
        filter 0.3s ease-in-out;
`;