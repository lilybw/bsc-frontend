// src/utils/tutorialUtils.ts

import { css } from '@emotion/css';
import { Position } from '@/components/colony/mini_games/asteroids_mini_game/entities/BaseEntity';
import { MultiplayerMode, ColonyState } from '@/meta/types';
import { KnownLocations } from '@/integrations/main_backend/constants';
import { IMultiplayerIntegration } from '@/integrations/multiplayer_backend/multiplayerBackend';
import { IEventMultiplexer } from '@/integrations/multiplayer_backend/eventMultiplexer';
import { Location, LocationTransform } from './navigationUtils';

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

// Styles
export const sharedStyles = {
    container: css`
        position: absolute;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    `,

    movementPath: css`
        border-bottom: 1px dashed white;
        height: 66%;
        width: 50%;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    `,

    locationContainer: css`
        position: absolute;
        left: 0;
        top: 0;
    `,

    player: css`
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

    trialTitle: css`
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
    `
};

// Style generators
export const generateLocationStyle = (
    location: { id: number; scaledPosition: { x: number; y: number }; transform: { zIndex: number } },
    currentLocation: number,
    canMoveTo: boolean,
    isVisited: boolean
) => css`
    position: absolute;
    width: 64px;
    height: 64px;
    transform: translate(-50%, -50%);
    left: ${location.scaledPosition.x}px;
    top: ${location.scaledPosition.y}px;
    z-index: ${location.transform.zIndex};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 50%;
    background-color: black;
    ${location.id === currentLocation ? 'border: 3px solid #3b82f6;' : ''}
    ${canMoveTo ? 'border: 2px solid rgba(59, 130, 246, 0.5);' : ''}
    ${isVisited ? 'box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);' : ''}
    transition: all 0.3s ease-in-out;
`;

export const generateLineStyle = (path: { length: number; angle: number; fromPos: Position }) => css`
    position: absolute;
    width: ${path.length}px;
    height: 12px;
    left: ${path.fromPos.x * window.innerWidth}px;
    top: ${path.fromPos.y * window.innerHeight}px;
    transform-origin: 0 50%;
    transform: rotate(${path.angle}deg);
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(
        to top,
        transparent 0%,
        rgba(255, 255, 255, 0.8) 50%,
        transparent 100%
    );
    box-shadow: 
        0 0 10px rgba(255, 255, 255, 0.3),
        0 0 20px rgba(255, 255, 255, 0.2);
    border-radius: 6px;
`;

export const generateLineGlowStyle = (path: { length: number; angle: number; fromPos: Position }) => css`
    ${generateLineStyle(path)}
    opacity: 0.3;
    filter: blur(4px);
    height: 16px;
    background: linear-gradient(
        to top,
        transparent 0%,
        rgba(255, 255, 255, 0.6) 50%,
        transparent 100%
    );
`;

// Mock Data
export const createMockEvents = (): IEventMultiplexer => ({
    emit: () => Promise.resolve(0),
    subscribe: () => 0,
    unsubscribe: (..._ids: number[]) => true
});

export const createMockMultiplayer = (): IMultiplayerIntegration => ({
    connect: () => Promise.resolve(undefined),
    disconnect: () => Promise.resolve(),
    getMode: () => MultiplayerMode.AS_OWNER,
    getState: () => ColonyState.CLOSED,
    getCode: () => null,
    getServerStatus: async () => ({
        res: null,
        code: 200,
        err: "Tutorial mode"
    }),
    getLobbyState: async () => ({
        res: null,
        code: 200,
        err: "Tutorial mode"
    })
});

export const createMockColony = (locationID: number = KnownLocations.SpacePort) => ({
    id: 1,
    name: "Tutorial Colony",
    accLevel: 1,
    latestVisit: new Date().toISOString(),
    assets: [{
        assetCollectionID: 1,
        transform: {
            xOffset: 0,
            yOffset: 0,
            zIndex: 1,
            xScale: 1,
            yScale: 1
        }
    }],
    locations: [{
        id: 1,
        level: 0,
        locationID,
        transform: {
            xOffset: 0,
            yOffset: 0,
            zIndex: 1,
            xScale: 1,
            yScale: 1
        }
    }]
});

// Path Calculations
export const calculateScaledPositions = (
    locations: Location[],
    dns: { x: number; y: number }
) => {
    return locations.map(location => ({
        ...location,
        scaledPosition: {
            x: location.transform.xOffset * dns.x,
            y: location.transform.yOffset * dns.y
        }
    }));
};

export const calculatePaths = (
    paths: Array<{ from: number; to: number }>,
    getTargetCenterPosition: (id: string) => Position | null
) => {
    return paths.map(path => {
        const fromPosition = getTargetCenterPosition(path.from.toString());
        const toPosition = getTargetCenterPosition(path.to.toString());

        if (!fromPosition || !toPosition) return null;

        const dx = (toPosition.x - fromPosition.x) * window.innerWidth;
        const dy = (toPosition.y - fromPosition.y) * window.innerHeight;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        return {
            fromPos: fromPosition,
            toPos: toPosition,
            length,
            angle
        };
    }).filter(Boolean);
};

// Viewport calculations
export const calculateViewportScalars = (
    width: number,
    height: number
) => ({
    width,
    height,
    dns: {
        x: width / EXPECTED_WIDTH,
        y: height / EXPECTED_HEIGHT
    }
});

// Text typing utilities
export interface TypeTextOptions {
    text: string;
    delay: number;
    onType: (text: string) => void;
    onComplete?: () => void;
}

export interface LocationWithScale {
    scaledPosition: { x: number; y: number };
    transform: LocationTransform;
}

export const typeText = ({ text, delay, onType, onComplete }: TypeTextOptions): Promise<void> => {
    return new Promise((resolve) => {
        let currentIndex = 0;
        const intervalId = setInterval(() => {
            if (currentIndex < text.length) {
                onType(text.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(intervalId);
                if (onComplete) onComplete();
                resolve();
            }
        }, delay);
    });
};

// Location movement utilities
export const calculateLocationOffset = (
    location: LocationWithScale,
    viewport: { width: number; height: number }
) => ({
    x: viewport.width / 2 - location.scaledPosition.x,
    y: viewport.height / 2 - location.scaledPosition.y
});