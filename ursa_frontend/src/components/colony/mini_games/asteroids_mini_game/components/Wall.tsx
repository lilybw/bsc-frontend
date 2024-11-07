import { Accessor, Component, createEffect } from 'solid-js';
import { css } from '@emotion/css';
import NTAwait from '@/components/util/NoThrowAwait';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import { IBackendBased } from '@/ts/types';
import { ApplicationContext } from '@/meta/types';

interface WallProps {
    context: ApplicationContext
    health: Accessor<number>;
}

const Wall: Component<WallProps> = (props) => {
    createEffect(() => {
        const currentHealth = props.health();
    });

    const textureContainerStyle = css`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        
        img {
            width: auto !important;
            height: auto !important;
            object-fit: none !important;
            position: absolute;
            top: 0;
            left: 0;
            image-rendering: pixelated;
            transform: none !important;
        }
    `;

    return (
        <div class={wallContainerStyle} id="Outer-Wall">
            <NTAwait func={() => props.context.backend.assets.getMetadata(7003)}>
                {(asset) => (
                    <div class={textureContainerStyle}>
                        {/* Main wall texture */}
                        <GraphicalAsset
                            styleOverwrite={wallTextureStyle}
                            backend={props.context.backend}
                            metadata={asset}
                        />
                        {/* Crack overlay containers */}
                        <div class={crackContainer}>
                            <GraphicalAsset
                                styleOverwrite={crackLayer1}
                                backend={props.context.backend}
                                metadata={asset}
                            />
                        </div>
                        <div class={crackContainer}>
                            <GraphicalAsset
                                styleOverwrite={crackLayer2}
                                backend={props.context.backend}
                                metadata={asset}
                            />
                        </div>
                        <div class={crackContainer}>
                            <GraphicalAsset
                                styleOverwrite={crackLayer3}
                                backend={props.context.backend}
                                metadata={asset}
                            />
                        </div>
                        <div class={crackContainer}>
                            <GraphicalAsset
                                styleOverwrite={crackLayer4}
                                backend={props.context.backend}
                                metadata={asset}
                            />
                        </div>
                    </div>
                )}
            </NTAwait>
            <div class={gradientOverlayStyle}></div>
        </div>
    );
};

export default Wall;

const wallContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 4vw;
    height: 100vh;
    overflow: hidden;
    transform-style: preserve-3d;
`;

const crackContainer = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
`;

const wallTextureStyle = css`
    background-repeat: repeat;
`;

const crackLayer1 = css`
    clip-path: polygon(
        0 20%, 20% 0,
        50% 40%, 80% 20%,
        100% 40%, 100% 100%,
        0 100%
    );
    transform: translateZ(-1px);
    opacity: 0.9;
`;

const crackLayer2 = css`
    clip-path: polygon(
        30% 0, 70% 20%,
        90% 40%, 100% 60%,
        100% 100%, 60% 100%,
        20% 80%
    );
    transform: translateZ(-2px);
    opacity: 0.8;
`;

const crackLayer3 = css`
    clip-path: polygon(
        0 40%, 40% 30%,
        60% 50%, 80% 70%,
        100% 80%, 100% 100%,
        0 100%
    );
    transform: translateZ(-3px);
    opacity: 0.7;
`;

const crackLayer4 = css`
    clip-path: polygon(
        20% 0, 60% 20%,
        80% 40%, 90% 60%,
        100% 80%, 100% 100%,
        40% 100%, 0 80%
    );
    transform: translateZ(-4px);
    opacity: 0.6;
`;

const gradientOverlayStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        to right,
        rgba(30, 30, 30, 0.8) 0%,
        rgba(200, 200, 200, 0.5) 100%
    );
    pointer-events: none;
    z-index: 1;
`;