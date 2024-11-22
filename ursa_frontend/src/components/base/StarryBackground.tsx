import { Component, JSX, Show } from 'solid-js';
import { css } from '@emotion/css';
import { IBackendBased, IStyleOverwritable } from '@/ts/types';
import NTAwait from '../util/NoThrowAwait';
import GraphicalAsset from './GraphicalAsset';

interface SpaceBackgroundProps extends Partial<IBackendBased>, IStyleOverwritable {
    quality?: 'low' | 'medium' | 'high';
}

const DEFAULT_IMAGE = "https://img.itch.zone/aW1hZ2UvNTQzNDMyLzY1MDQwMzAucG5n/original/aRTU1s.png";

const getRandomAssetId = () => {
    return Math.floor(Math.random() * (3029 - 3008 + 1)) + 3008;
};

const SpaceBackground: Component<SpaceBackgroundProps> = (props) => {
    const assetId = getRandomAssetId();
    const quality = props.quality || 'high';

    return (
        <div class={css([containerStyle, props.styleOverwrite])} id="space-background">
            <Show
                when={props.backend}
                fallback={
                    <div class={backgroundContainer}>
                        <div class={imageWrapper}>
                            <img src={DEFAULT_IMAGE} class={css([imageStyle, getQualityStyle(quality)])} />
                        </div>
                        <div class={imageWrapperSecond}>
                            <img src={DEFAULT_IMAGE} class={css([imageStyle, getQualityStyle(quality)])} />
                        </div>
                    </div>
                }
            >
                <NTAwait func={() => props.backend!.assets.getMetadata(assetId)} whilestLoading={<></>}>
                    {asset => (
                        <div class={backgroundContainer}>
                            <div class={imageWrapper}>
                                <GraphicalAsset
                                    backend={props.backend!}
                                    metadata={asset}
                                    styleOverwrite={css([imageStyle, getQualityStyle(quality)])}
                                />
                            </div>
                            <div class={imageWrapperSecond}>
                                <GraphicalAsset
                                    backend={props.backend!}
                                    metadata={asset}
                                    styleOverwrite={css([imageStyle, getQualityStyle(quality)])}
                                />
                            </div>
                        </div>
                    )}
                </NTAwait>
            </Show>
        </div>
    );
};

export default SpaceBackground;

const getQualityStyle = (quality: 'low' | 'medium' | 'high') => {
    switch (quality) {
        case 'low':
            return css`
                image-rendering: auto;
                filter: blur(1px) brightness(0.95);
            `;
        case 'medium':
            return css`
                image-rendering: -webkit-optimize-contrast;
                filter: blur(0.5px) brightness(0.98);
                transform: scale(1.01);
            `;
        case 'high':
            return css`
                image-rendering: -webkit-optimize-contrast;
                backface-visibility: hidden;
                transform: translateZ(0);
                will-change: transform;
            `;
    }
};

const backgroundContainer = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 100%;
    animation: scrollBackground 1000s linear infinite;
    font-size: 0; /* Removes any potential inline-block spacing */
    
    @keyframes scrollBackground {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-50%);
        }
    }
`;

const imageWrapper = css`
    position: relative;
    height: 100%;
    width: 50%;
    display: inline-block;
    overflow: hidden;
    margin-right: -1px; /* Negative margin to prevent gaps */
`;

const imageWrapperSecond = css`
    position: relative;
    height: 100%;
    width: 50%;
    display: inline-block;
    overflow: hidden;
    margin-left: -1px; /* Negative margin to prevent gaps */
`;

const containerStyle = css`
    position: fixed;
    top: -1px;
    left: -1px;
    width: calc(101% + 2px); /* Add 2px to account for the negative margins */
    height: calc(101% + 2px);
    overflow: hidden;
    z-index: -10000000;
`;

const imageStyle = css`
    height: 100%;
    width: calc(100% + 2px); /* Slight overlap */
    object-fit: cover;
    display: block;
    margin: 0 -1px; /* Negative margin to prevent gaps */
`;