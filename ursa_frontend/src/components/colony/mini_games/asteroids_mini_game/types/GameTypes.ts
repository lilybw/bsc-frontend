import { uint32 } from "../../../../../integrations/main_backend/mainBackendDTOs";
import { Position } from "../entities/BaseEntity";
import { Player } from "../entities/Player";
import { Asteroid } from "../entities/Asteroid";
import { LazerBeam } from "../entities/LazerBeam";

/**
 * Settings DTO for the Asteroids minigame
 * All time values are in seconds unless specified otherwise
 */
export interface AsteroidsSettingsDTO {
    minTimeTillImpactS: number;      // Minimum time for asteroid to reach impact point
    maxTimeTillImpactS: number;      // Maximum time for asteroid to reach impact point
    charCodeLength: uint32;          // Length of character codes for shooting
    asteroidsPerSecondAtStart: number; // Initial spawn rate
    asteroidsPerSecondAt80Percent: number; // Spawn rate at 80% game completion
    colonyHealth: uint32;            // Starting health of the colony
    asteroidMaxHealth: uint32;       // Maximum possible health of asteroids
    stunDurationS: number;           // How long players remain stunned
    friendlyFirePenaltyS: number;    // Base friendly fire penalty duration
    friendlyFirePenaltyMultiplier: number; // Multiplier for consecutive friendly fire
    timeBetweenShotsS: number;       // Cooldown between shots
    survivalTimeS: number;           // Total game duration
    spawnRateCoopModifier: number;   // Modifier for spawn rate in cooperative mode
}

/**
 * Game state interface
 */
export interface GameState {
    players: Map<number, Player>;
    asteroids: Map<number, Asteroid>;
    lazerBeams: Map<number, LazerBeam>;
    colonyHealth: number;
    gameTime: number;
    isGameOver: boolean;
    score: number;
}

/**
 * Event handler types
 */
export type EventHandler<T> = (data: T) => void;

/**
 * Game event types
 */
export enum GameEventType {
    PLAYER_SHOOT = 'PLAYER_SHOOT',
    ASTEROID_SPAWN = 'ASTEROID_SPAWN',
    ASTEROID_DESTROY = 'ASTEROID_DESTROY',
    PLAYER_HIT = 'PLAYER_HIT',
    COLONY_HIT = 'COLONY_HIT',
    GAME_OVER = 'GAME_OVER',
    GAME_WIN = 'GAME_WIN'
}

/**
 * Player action types
 */
export enum PlayerActionType {
    SHOOT = 'SHOOT',
    MOVE = 'MOVE',
    USE_POWERUP = 'USE_POWERUP'
}

/**
 * Game difficulty settings
 */
export interface DifficultySettings {
    spawnRate: number;
    asteroidHealth: number;
    asteroidSpeed: number;
    colonyHealth: number;
}

/**
 * Score calculation settings
 */
export interface ScoreSettings {
    asteroidDestroy: number;
    friendlyFire: number;
    colonyDamage: number;
    survival: number;
    timeBonus: number;
}

/**
 * Visual effect types
 */
export enum EffectType {
    EXPLOSION = 'EXPLOSION',
    SHIELD = 'SHIELD',
    STUN = 'STUN',
    POWERUP = 'POWERUP'
}

/**
 * Effect animation settings
 */
export interface EffectSettings {
    type: EffectType;
    duration: number;
    scale: number;
    opacity: number;
    color: string;
}

/**
 * Player input state
 */
export interface InputState {
    buffer: string;
    isEnabled: boolean;
    cooldown: number;
    lastInput: number;
}

/**
 * Entity reference types for DOM elements
 */
export interface EntityRef {
    type: 'asteroid' | 'player' | 'lazer';
    element: HTMLDivElement;
}

/**
 * Game statistics tracking
 */
export interface GameStats {
    shotsFired: number;
    shotsHit: number;
    asteroidsDestroyed: number;
    friendlyFireIncidents: number;
    colonyDamageTaken: number;
    survivalTime: number;
    finalScore: number;
}

/**
 * Power-up types and effects
 */
export enum PowerUpType {
    RAPID_FIRE = 'RAPID_FIRE',
    SHIELD = 'SHIELD',
    MULTI_SHOT = 'MULTI_SHOT',
    TIME_SLOW = 'TIME_SLOW'
}

export interface PowerUpEffect {
    type: PowerUpType;
    duration: number;
    strength: number;
}

/**
 * Animation state interface
 */
export interface AnimationState {
    isAnimating: boolean;
    startTime: number;
    duration: number;
    startPos: Position;
    endPos: Position;
}

/**
 * Game event payload interfaces
 */
export interface ShootEventPayload {
    playerId: number;
    targetCode: string;
    timestamp: number;
}

export interface HitEventPayload {
    sourceId: number;
    targetId: number;
    damage: number;
}

export interface SpawnEventPayload {
    entityId: number;
    position: Position;
    properties: any;
}

/**
 * Window size state
 */
export interface WindowSize {
    width: number;
    height: number;
}

/**
 * Game configuration options
 */
export interface GameConfig {
    settings: AsteroidsSettingsDTO;
    difficulty: DifficultySettings;
    scoring: ScoreSettings;
    effects: Map<EffectType, EffectSettings>;
    debug?: boolean;
}

/**
 * Error types for game-specific errors
 */
export enum GameErrorType {
    INVALID_INPUT = 'INVALID_INPUT',
    NETWORK_ERROR = 'NETWORK_ERROR',
    RESOURCE_ERROR = 'RESOURCE_ERROR',
    GAME_LOGIC_ERROR = 'GAME_LOGIC_ERROR'
}

export class GameError extends Error {
    constructor(
        public type: GameErrorType,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'GameError';
    }
}

/**
 * Type guards for runtime type checking
 */
export const isPosition = (obj: any): obj is Position => {
    return typeof obj === 'object' &&
        typeof obj.x === 'number' &&
        typeof obj.y === 'number';
};

export const isGameConfig = (obj: any): obj is GameConfig => {
    return typeof obj === 'object' &&
        obj.settings !== undefined &&
        obj.difficulty !== undefined &&
        obj.scoring !== undefined &&
        obj.effects instanceof Map;
};