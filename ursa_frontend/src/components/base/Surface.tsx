import { Component, JSX, createSignal } from 'solid-js';
import { css } from '@emotion/css';
import GraphicalAsset from './GraphicalAsset';
import { AssetResponseDTO } from '../../integrations/main_backend/mainBackendDTOs';
import NTAwait from '../util/NoThrowAwait';
import { ApplicationContext } from '@/meta/types';
import { IStyleOverwritable } from '@/ts/types';

interface PlanetSurfaceProps extends IStyleOverwritable {
    context: ApplicationContext
}

const colorSchemes = [
    // Lunar greys with slight blue tint
    'hue-rotate(210deg) saturate(20%) brightness(95%)',
    // Mars reddish-brown
    'hue-rotate(0deg) saturate(140%) brightness(85%)',
    // Europa ice blues
    'hue-rotate(180deg) saturate(30%) brightness(110%)',
    // Titan orangish
    'hue-rotate(30deg) saturate(120%) brightness(90%)',
    // Mercury brownish-grey
    'hue-rotate(30deg) saturate(40%) brightness(80%)',
];

const getRandomFilter = () => {
    return colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
};

const PlanetSurface: Component<PlanetSurfaceProps> = (props) => {
    const [containerRef, setContainerRef] = createSignal<HTMLDivElement | null>(null);
    const initialColorFilter = getRandomFilter();

    const surfaceStyle = css`
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-size: 100% 65%;
        background-position: bottom center;
        background-repeat: no-repeat;
        filter: ${initialColorFilter};
        z-index: -1;
    `;

    const containerStyle = css`
        ${surfaceStyle}
        ${props.styleOverwrite || ''}
    `;

    return (
        <div class={containerStyle} ref={setContainerRef}>
            <NTAwait func={() => props.context.backend.assets.getMetadata(7005)}>
                {(asset: AssetResponseDTO) => (
                    <div style={{ display: 'none' }}>
                        <GraphicalAsset
                            backend={props.context.backend}
                            metadata={asset}
                            onImageLoad={(img) => {
                                const container = containerRef();
                                if (container) {
                                    container.style.backgroundImage = `url(${img.src})`;
                                }
                            }}
                        />
                    </div>
                )}
            </NTAwait>
        </div>
    );
};

export default PlanetSurface;