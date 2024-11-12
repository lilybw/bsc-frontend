import { Component, JSX, createSignal } from 'solid-js';
import { css } from '@emotion/css';
import GraphicalAsset from './GraphicalAsset';
import { AssetResponseDTO } from '../../integrations/main_backend/mainBackendDTOs';
import NTAwait from '../util/NoThrowAwait';
import { ApplicationContext } from '@/meta/types';
import { IBackendBased, IStyleOverwritable } from '@/ts/types';

interface PlanetSurfaceProps extends IStyleOverwritable, IBackendBased{}

const PlanetSurface: Component<PlanetSurfaceProps> = (props) => {
    return (
        <NTAwait func={() => props.backend.assets.getMetadata(7005)}>
            {(asset: AssetResponseDTO) => (
                <GraphicalAsset
                    backend={props.backend}
                    metadata={asset}
                    styleOverwrite={css`${surfaceStyle} ${props.styleOverwrite}`}
                />
            )}
        </NTAwait>
    );
};
export default PlanetSurface;

const colorSchemes = [
    'hue-rotate(210deg) saturate(20%) brightness(95%)',
    'hue-rotate(0deg) saturate(140%) brightness(85%)',
    'hue-rotate(180deg) saturate(30%) brightness(110%)',
    'hue-rotate(30deg) saturate(120%) brightness(90%)',
    'hue-rotate(30deg) saturate(40%) brightness(80%)',
];

const getRandomFilter = () => {
    return colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
};

const surfaceStyle = css`
    position: absolute;
    display: flex;
    bottom: 0;
    width: 100vw;
    height: 65vh;
    filter: ${getRandomFilter()};
    z-index: -1;
`;