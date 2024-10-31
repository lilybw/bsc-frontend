import { Component, createMemo } from 'solid-js';
import { css } from '@emotion/css';
import Planet from './Planet';
import { AssetID } from '../../integrations/main_backend/mainBackendDTOs';
import { IBackendBased, IStyleOverwritable } from '../../ts/types';
import NTAwait from '../util/NoThrowAwait';

interface PlanetWithMoonProps extends IBackendBased, IStyleOverwritable {
    moonAssetOverwrite?: AssetID;
    planetAssetOverwrite?: AssetID;
    size?: number;
}

const PlanetWithMoon: Component<PlanetWithMoonProps> = (props) => {
    const cssvars = css`
        --pvm-size: ${props.size ?? 10}vh;
    `;

    const computedStyles = createMemo(
        () => css`
            ${cssvars}
            position: relative;
            width: var(--pvm-size);
            height: var(--pvm-size);
            ${props.styleOverwrite}
        `,
    );
    return (
        <div class={computedStyles()}>
            <NTAwait func={() => props.backend.assets.getMetadata(props.planetAssetOverwrite ?? 3001)}>
                {(asset) => (
                    <Planet useShadow={true} styleOverwrite={planetStyle(cssvars)} metadata={asset} backend={props.backend}>
                        <NTAwait func={() => props.backend.assets.getMetadata(props.moonAssetOverwrite ?? 3003)}>
                            {(moonAsset) => (
                                <Planet useShadow={false} styleOverwrite={moonOrbitStyle(cssvars)} metadata={moonAsset} backend={props.backend} />
                            )}
                        </NTAwait>
                    </Planet>
                )}
            </NTAwait>
        </div>
    );
};

export default PlanetWithMoon;

const planetStyle = (cssvars: string) => css``;

const moonOrbitStyle = (cssvars: string) => css`
    top: 100%;
`;

const moonStyle = (cssvars: string) => css`
    width: 6%;
    height: 6%;
    position: absolute;
    --base-moon-left: 50%;

    animation: orbit 6s infinite ease-in-out;

    --orbit-radius: 50%;
    @keyframes orbit {
        0% {
            z-index: 1;
            left: calc(var(--orbit-radius) * -1 + var(--base-moon-left));
        }
        49% {
            z-index: 1;
            left: calc(var(--orbit-radius) + var(--base-moon-left));
        }
        50% {
            z-index: -1;
            left: calc(var(--orbit-radius) + var(--base-moon-left));
        }
        99% {
            z-index: -1;
            left: calc(var(--orbit-radius) * -1 + var(--base-moon-left));
        }
        100% {
            left: calc(var(--orbit-radius) * -1 + var(--base-moon-left));
            z-index: 1;
        }
    }
`;
