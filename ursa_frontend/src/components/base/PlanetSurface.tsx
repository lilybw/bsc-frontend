import { Component } from 'solid-js';
import { css } from '@emotion/css';
import GraphicalAsset from './GraphicalAsset';
import NTAwait from '../util/NoThrowAwait';
import { IBackendBased, IStyleOverwritable } from '@/ts/types';

interface PlanetSurfaceProps extends IStyleOverwritable, IBackendBased {}

const PlanetSurface: Component<PlanetSurfaceProps> = (props) => {
    return (
        <div class={css([containerStyle, props.styleOverwrite])} id="planet-surface-container">
        <NTAwait func={() => props.backend.assets.getMetadata(7005)}>{ asset => 
            <GraphicalAsset
                backend={props.backend}
                metadata={asset}
                styleOverwrite={css(imageStyle)}
            />
        }</NTAwait>
        </div>
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

const containerStyle = css({
    position: "absolute",
    width: "100%",
    height: "65%",
    bottom: 0,
})

const imageStyle = css({
    filter: getRandomFilter(),
    objectFit: "cover",
    width: "100%",
    height: "100%",
});