import { uint32 } from '../../../../../integrations/main_backend/mainBackendDTOs';

/**
 * Settings DTO for the Asteroids minigame
 * All time values are in seconds unless specified otherwise
 */
export interface AsteroidsSettingsDTO {
    minTimeTillImpactS: number; // Minimum time for asteroid to reach impact point
    maxTimeTillImpactS: number; // Maximum time for asteroid to reach impact point
    charCodeLength: uint32; // Length of character codes for shooting
    asteroidsPerSecondAtStart: number; // Initial spawn rate
    asteroidsPerSecondAt80Percent: number; // Spawn rate at 80% game completion
    colonyHealth: uint32; // Starting health of the colony
    asteroidMaxHealth: uint32; // Maximum possible health of asteroids
    stunDurationS: number; // How long players remain stunned
    friendlyFirePenaltyS: number; // Base friendly fire penalty duration
    friendlyFirePenaltyMultiplier: number; // Multiplier for consecutive friendly fire
    timeBetweenShotsS: number; // Cooldown between shots
    survivalTimeS: number; // Total game duration
    spawnRateCoopModifier: number; // Modifier for spawn rate in cooperative mode
}

/**
 * Entity reference types for DOM elements
 */
export interface EntityRef {
    type: 'asteroid' | 'player';
    element: HTMLDivElement;
}

/**
 * Window size state
 */
export interface WindowSize {
    width: number;
    height: number;
}
