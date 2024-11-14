// src/styles/tutorialStyles.ts

import { css } from '@emotion/css';
import { Styles } from '@/styles/sharedCSS';

export const tutorialStyles = {
    layout: {
        container: css`
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            overflow: visible;
        `,

        camera: css`
            position: absolute;
            top: 0;
            left: 0;
            overflow: visible;
            transition: all 0.5s ease-in-out;
        `,

        locationContainer: css`
            position: absolute;
            left: 0;
            top: 0;
        `
    },

    typography: {
        title: css`
            position: absolute;
            font-size: 4rem;
            letter-spacing: 0;
            z-index: 100;
            left: 50%;
            top: 10%;
            transform: translateX(-50%);
        `,

        subtitle: css`
            position: absolute;
            bottom: 10vh;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            z-index: 100;
        `,

        nameplate: css`
            ${Styles.GLASS.FAINT_BACKGROUND}
            text-shadow: 5px 5px 10px black;
        `
    },

    elements: {
        localPlayer: css`
            position: absolute;
            z-index: 200;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 32px;
            height: 32px;
            background-color: #ef4444;
            border-radius: 50%;
        `,

        movementPath: css`
            border-bottom: 1px dashed white;
            height: 66%;
            width: 50%;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
        `,
        characterBase: css`
            position: absolute;
            --edge-offset: 5vw;
            bottom: 20vh;
            --dude-size: 8vw;
            width: var(--dude-size);
            height: var(--dude-size);
        `,

        characterContainer: css`
            position: absolute;
            --edge-offset: 5vw;
            bottom: 20vh;
        `,

        locationPin: css`
            position: absolute;
            --edge-offset: 5vw;
            bottom: 20vh;
            right: var(--edge-offset);
        `,
    },

    components: {
        videoFrame: css`
            margin-top: 2rem;
        `
    },

    // Style generators for dynamic styles
    generators: {
        locationStyle: (params: {
            position: { x: number; y: number };
            zIndex: number;
            isCurrentLocation: boolean;
            canMoveTo: boolean;
            isVisited: boolean;
        }) => css`
            position: absolute;
            width: 64px;
            height: 64px;
            transform: translate(-50%, -50%);
            left: ${params.position.x}px;
            top: ${params.position.y}px;
            z-index: ${params.zIndex};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 50%;
            background-color: black;
            ${params.isCurrentLocation ? 'border: 3px solid #3b82f6;' : ''}
            ${params.canMoveTo ? 'border: 2px solid rgba(59, 130, 246, 0.5);' : ''}
            ${params.isVisited ? 'box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);' : ''}
            transition: all 0.3s ease-in-out;
        `,

        locationButton: (params: {
            position: { x: number; y: number };
            zIndex: number
        }) => css`
            position: absolute;
            left: ${params.position.x}px;
            top: ${params.position.y - 50}px;
            transform: translate(-50%, -50%);
            z-index: ${params.zIndex + 1};
        `,

        pathLine: (params: {
            length: number;
            angle: number;
            position: { x: number; y: number };
            isGlow?: boolean;
        }) => css`
            position: absolute;
            width: ${params.length}px;
            height: ${params.isGlow ? '16px' : '12px'};
            left: ${params.position.x * window.innerWidth}px;
            top: ${params.position.y * window.innerHeight}px;
            transform-origin: 0 50%;
            transform: rotate(${params.angle}deg);
            z-index: 1;
            pointer-events: none;
            background: linear-gradient(
                to top,
                transparent 0%,
                rgba(255, 255, 255, ${params.isGlow ? '0.6' : '0.8'}) 50%,
                transparent 100%
            );
            ${params.isGlow ? `
                opacity: 0.3;
                filter: blur(4px);
            ` : `
                box-shadow: 
                    0 0 10px rgba(255, 255, 255, 0.3),
                    0 0 20px rgba(255, 255, 255, 0.2);
            `}
            border-radius: 6px;
        `,

        cameraTransform: (offset: { x: number; y: number }) => css`
            transform: translate(${offset.x}px, ${offset.y}px);
        `,

        locationAsset: (isVisited: boolean) => css`
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: ${isVisited ? 1 : 0.7};
        `,

        characterTransition: (params: { isAtLocation: boolean; startPosition: string; endPosition: string }) => css`
        transition: all 2s;
        ${params.isAtLocation ? `left: ${params.endPosition};` : `left: ${params.startPosition};`};
        `,

        playerCharacter: (isAtLocation: boolean) => css`
        position: absolute;
        --dude-size: 8vw;
        width: var(--dude-size);
        height: var(--dude-size);
        transition: left 2s;
        left: ${isAtLocation ? '70%' : '5vw'};
        bottom: 20vh;
        `
    }
};