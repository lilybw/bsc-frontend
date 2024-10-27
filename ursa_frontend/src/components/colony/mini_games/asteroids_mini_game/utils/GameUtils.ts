import { Position } from '../entities/BaseEntity';
import { Player } from '../entities/Player';
import { EntityRef } from '../types/EntityTypes';

// Constants for game calculations
const ASTEROID_SIZE_VW = 18;
const WALL_IMPACT_START = 0.33;
const WALL_IMPACT_END = 0.67;

/**
 * Handles the destruction of an asteroid by its ID
 */
export const handleAsteroidDestruction = (
    asteroidID: number,
    elementRefs: Map<number, EntityRef>,
    asteroidsRemoveFuncs: Map<number, () => void>
): void => {
    elementRefs.delete(asteroidID);
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
    const impactY = WALL_IMPACT_START + (Math.random() * (WALL_IMPACT_END - WALL_IMPACT_START));
    return {
        x: 0,
        y: impactY
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
export const generateSpawnPosition = (windowSize: { width: number, height: number }): Position => {
    const minSpawnDistance = calculateMinSpawnDistance(windowSize.width);
    const angleRange = Math.PI / 2;
    const baseAngle = -Math.PI / 4;
    const randomAngle = baseAngle + (Math.random() * angleRange);
    const spawnDistance = minSpawnDistance + (Math.random() * minSpawnDistance * 0.5);

    return {
        x: 1 + (Math.cos(randomAngle) * spawnDistance / windowSize.width),
        y: 0 + (Math.sin(randomAngle) * spawnDistance / windowSize.height)
    };
};

/**
 * Calculates player positions
 */
export const calculatePlayerPositions = (players: Player[]): Map<number, Position> => {
    const positions = new Map<number, Position>();
    const totalPlayers = players.length;
    const margin = 0.1;
    const availableWidth = 1 - (2 * margin);
    const spacing = totalPlayers > 1 ? availableWidth / (totalPlayers - 1) : 0;

    players.forEach((player, index) => {
        positions.set(player.id, {
            x: totalPlayers > 1 ? margin + (spacing * index) : 0.5,
            y: 0.9
        });
    });

    return positions;
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
export const getAnimatedPosition = (
    entityId: number,
    elementRefs: Map<number, EntityRef>
): Position | null => {
    const entityRef = elementRefs.get(entityId);
    if (!entityRef) return null;

    const element = entityRef.element;
    const computedStyle = window.getComputedStyle(element);
    const matrix = new DOMMatrix(computedStyle.transform);
    const rect = element.getBoundingClientRect();

    const contentWidth = rect.width;
    const contentHeight = rect.height;
    const centerX = rect.left + (contentWidth / 2);
    const centerY = rect.top + (contentHeight / 2);
    const transformedX = centerX + matrix.m41;
    const transformedY = centerY + matrix.m42;

    return {
        x: transformedX / window.innerWidth,
        y: transformedY / window.innerHeight
    };
};

/**
 * Gets the center position of an entity
 */
export const getTargetCenterPosition = (
    entityId: number,
    elementRefs: Map<number, EntityRef>
): Position | null => {
    const entityRef = elementRefs.get(entityId);
    if (!entityRef) return null;

    const element = entityRef.element;
    const imageElement = element.querySelector('img');
    if (!imageElement) return null;

    const imageRect = imageElement.getBoundingClientRect();
    return {
        x: (imageRect.left + imageRect.width / 2) / window.innerWidth,
        y: (imageRect.top + imageRect.height / 2) / window.innerHeight
    };
};

/**
 * Converts percentage position to pixels
 */
export const getPixelPosition = (position: Position): Position => ({
    x: position.x * window.innerWidth,
    y: position.y * window.innerHeight
});

export default {
    handleAsteroidDestruction,
    generateImpactPosition,
    calculateMinSpawnDistance,
    generateSpawnPosition,
    calculatePlayerPositions,
    getRandomRotationSpeed,
    getAnimatedPosition,
    getTargetCenterPosition,
    getPixelPosition
};