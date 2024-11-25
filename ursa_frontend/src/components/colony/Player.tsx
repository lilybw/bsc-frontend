import { Accessor, Component, createEffect, createMemo, createSignal } from 'solid-js';
import { TransformDTO, uint32 } from '../../integrations/main_backend/mainBackendDTOs';
import { css } from '@emotion/css';
import { Styles } from '../../styles/sharedCSS';
import { ClientDTO } from '../../integrations/multiplayer_backend/multiplayerDTO';
import { WrappedSignal } from '../../ts/wrappedSignal';
import { IBackendBased, IStyleOverwritable } from '../../ts/types';
import { ObjectURL } from '../../integrations/main_backend/objectUrlCache';
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

const getHueRotatedColor = async (url: ObjectURL, hue: number): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';

    const img = new Image();
    img.src = url;

    const promise = new Promise<string>((resolve, reject) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = `hue-rotate(${hue}deg)`;
            ctx.drawImage(img, 0, 0);

            const avgCanvas = document.createElement('canvas');
            const avgCtx = avgCanvas.getContext('2d');
            if (!avgCtx) {
                canvas.remove();
                resolve('#ffffff');
                return;
            }

            avgCanvas.width = 1;
            avgCanvas.height = 1;
            avgCtx.drawImage(canvas, 0, 0, img.width, img.height, 0, 0, 1, 1);

            const [r, g, b] = avgCtx.getImageData(0, 0, 1, 1).data;
            const color = `rgb(${r}, ${g}, ${b})`;

            canvas.remove();
            avgCanvas.remove();
            resolve(color);
        };
        img.onerror = () => {
            canvas.remove();
            resolve('#ffffff');
        };
    });

    return await promise;
};

const Player: Component<PlayerProps> = (props) => {
    const [currentTransform, setCurrentTransform] = createSignal<TransformDTO>(UNIT_TRANSFORM);
    const [averageColor, setAverageColor] = createSignal('#ffffff');

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

    return (
        <div
            class={css`
                ${containerBase}
                ${Styles.POSITION.transformToCSSVariables(currentTransform())}
                ${Styles.POSITION.TRANSFORM_APPLICATOR}
                ${props.styleOverwrite}
                transition:
                    top 0.5s ease-in-out,
                    left 0.5s ease-in-out;
            `}
            id={'player-' + props.client.IGN}
        >
            <div class={css`filter: hue-rotate(${computedHue()}deg);`}>
                <NTAwait func={() => props.backend.assets.getMetadata(4002)}>
                    {(asset) => {
                        if (asset.LODs[0]) {
                            props.backend.objectUrlCache.getByLODID(asset.LODs[0].id)
                                .then(urlResult => {
                                    if (!urlResult.err && urlResult.res) {
                                        getHueRotatedColor(urlResult.res, computedHue())
                                            .then(color => setAverageColor(color));
                                    }
                                });
                        }

                        return (
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
                                    filter: drop-shadow(0 0 8px ${averageColor()});
                                `}
                            />
                        );
                    }}
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

const containerBase = css`
    --GAS: 1;
    z-index: 200;
    width: calc(50px * var(--GAS));
    height: calc(50px * var(--GAS));
    position: relative;
`;

const namePlateStyle = css`
    position: absolute;
    bottom: -7vh;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 1.5rem;
    text-shadow: 0 0 5px black;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;

export default Player;