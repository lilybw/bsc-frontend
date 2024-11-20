import { Component } from 'solid-js';
import { css } from '@emotion/css';
import GraphicalAsset from './GraphicalAsset';
import NTAwait from '../util/NoThrowAwait';
import { IBackendBased, IStyleOverwritable } from '@/ts/types';

interface PlanetSurfaceProps extends IStyleOverwritable, IBackendBased { }

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

const currentFilter = getRandomFilter();

const imageStyle = css({
    filter: currentFilter,
    objectFit: "fill",
    width: "100%",
    height: "50%",
    position: "absolute",
    bottom: 0,
    zIndex: -1
});

const gradientStyle = css({
    position: "absolute",
    width: "100%",
    height: "100%",
    bottom: 0,
    pointerEvents: "none",
    filter: currentFilter,
    backgroundImage: `
        linear-gradient(
            transparent 35%,
            rgba(255, 235, 220, 0.1) 42%,
            rgba(255, 235, 220, 0.2) 45%,
            rgba(255, 235, 220, 0.3) 47%,
            rgba(255, 245, 235, 0.5) 49%,
            rgba(255, 250, 245, 0.7) 50%,
            transparent 60%
        ),
        linear-gradient(
            transparent 40%,
            rgba(244, 164, 96, 0.05) 45%,
            rgba(244, 164, 96, 0.15) 48%,
            rgba(244, 164, 96, 0.2) 50%,
            transparent 60%
        )
    `
});

const PlanetSurface: Component<PlanetSurfaceProps> = (props) => {
    return (
        <div class={css([{
            position: "absolute",
            width: "100%",
            height: "100%",
            bottom: 0
        }, props.styleOverwrite])} id="planet-surface-container">
            <NTAwait func={() => props.backend.assets.getMetadata(7005)}>{asset =>
                <GraphicalAsset
                    backend={props.backend}
                    metadata={asset}
                    styleOverwrite={css(imageStyle)}
                />
            }</NTAwait>
            <div class={gradientStyle} />
        </div>
    );
};

export default PlanetSurface;