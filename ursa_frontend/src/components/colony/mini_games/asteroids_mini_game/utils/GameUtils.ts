import { Position } from '../entities/BaseEntity';
import { Player } from '../entities/Player';
import { EntityRef } from '../types/entityTypes';

// Constants for game calculations
const ASTEROID_SIZE_VW = 18;
const WALL_IMPACT_START = 0.33;
const WALL_IMPACT_END = 0.67;

/**
 * Handles the destruction of an asteroid by its ID
 */
export const handleAsteroidDestruction = (
    asteroidID: number,
    elementRefs: Map<string, EntityRef>,
    asteroidsRemoveFuncs: Map<number, () => void>,
): void => {
    const asteroidKey = getAsteroidRefKey(asteroidID);
    elementRefs.delete(asteroidKey);
    const removeFunc = asteroidsRemoveFuncs.get(asteroidID);
    if (removeFunc) {
        removeFunc();
        asteroidsRemoveFuncs.delete(asteroidID);
    }
};

/**
 * Generates a random impact position within the middle third of the left wall
 */
export const generateImpactPosition = (): Position => {
    const impactY = WALL_IMPACT_START + Math.random() * (WALL_IMPACT_END - WALL_IMPACT_START);
    return {
        x: 0,
        y: impactY,
    };
};

/**
 * Calculates the minimum spawn distance needed
 */
export const calculateMinSpawnDistance = (windowWidth: number): number => {
    const asteroidSize = (ASTEROID_SIZE_VW / 100) * windowWidth;
    return Math.sqrt(2 * Math.pow(asteroidSize, 2));
};

/**
 * Generates a spawn position
 */
export const translateSpawnPosition = (windowSize: { width: number; height: number }): Position => {
    const minSpawnDistance = calculateMinSpawnDistance(windowSize.width);
    const angleRange = Math.PI / 2;
    const baseAngle = -Math.PI / 4;
    const randomAngle = baseAngle + Math.random() * angleRange;
    const spawnDistance = minSpawnDistance + Math.random() * minSpawnDistance * 0.5;

    return {
        x: 1 + (Math.cos(randomAngle) * spawnDistance) / windowSize.width,
        y: 0 + (Math.sin(randomAngle) * spawnDistance) / windowSize.height,
    };
};

/**
 * Gets a random rotation speed
 */
export const getRandomRotationSpeed = (): number => {
    return 2 + Math.random() * 3;
};

/**
 * Gets element position considering animations
 */
export const getAnimatedPosition = (entityId: number, elementRefs: Map<number, EntityRef>): Position | null => {
    const entityRef = elementRefs.get(entityId);
    if (!entityRef) return null;

    const element = entityRef.element;
    const computedStyle = window.getComputedStyle(element);
    const matrix = new DOMMatrix(computedStyle.transform);
    const rect = element.getBoundingClientRect();

    const contentWidth = rect.width;
    const contentHeight = rect.height;
    const centerX = rect.left + contentWidth / 2;
    const centerY = rect.top + contentHeight / 2;
    const transformedX = centerX + matrix.m41;
    const transformedY = centerY + matrix.m42;

    return {
        x: transformedX / window.innerWidth,
        y: transformedY / window.innerHeight,
    };
};

/**
 * Gets the center position of an entity
 */
export const getTargetCenterPosition = (entityKey: string, elementRefs: Map<string, EntityRef>): Position | null => {
    const entityRef = elementRefs.get(entityKey);
    if (!entityRef?.element) {
        console.log(`No valid entity ref found for ID: ${entityKey}`);
        return null;
    }

    // For both players and asteroids, find the actual visual element
    const visualElement = entityRef.type === 'player'
        ? (entityRef.element.querySelector('[class*="playerCharacterStyle"] img') ||
            entityRef.element.querySelector('img') ||
            entityRef.element)
        : (entityRef.element.querySelector('.asteroidImageContainerStyle img') ||
            entityRef.element.querySelector('img') ||
            entityRef.element);

    if (!visualElement) {
        console.log(`No visual element found for ${entityKey}`);
        return null;
    }

    return calculateElementPosition(visualElement as HTMLElement);
};

export const calculateElementPosition = (element: HTMLElement): Position => {
    const rect = element.getBoundingClientRect();
    return {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight
    };
};

export const normalizePosition = (position: Position): Position => {
    return {
        x: Math.max(0, Math.min(1, position.x)),
        y: Math.max(0, Math.min(1, position.y))
    };
}

/**
 * Converts percentage position to pixels
 */
export const getPixelPosition = (position: Position): Position => ({
    x: position.x * window.innerWidth,
    y: position.y * window.innerHeight,
});

/**
 * Helper functions for element references
 */
export const getPlayerRefKey = (playerId: number) => `player_${playerId}`;
export const getAsteroidRefKey = (asteroidId: number) => `asteroid_${asteroidId}`;

export const getEntityRefKey = {
    player: (id: number) => `player_${id}`,
    asteroid: (id: number) => `asteroid_${id}`,
};
