/**
 * Base interface for all particle effect properties
 */
export interface ParticleProps {
    id: number;
    x: number;
    y: number;
    duration: number;
    onComplete?: () => void;
}

/**
 * Properties specific to stun particles
 */
export interface StunParticleProps extends ParticleProps {
    size?: number;
}

/**
 * Enums for particle types - can be expanded for other effects
 */
export enum ParticleType {
    STUN = 'STUN',
    DISABLE = 'DISABLE',
}

/**
 * Interface for particle style properties
 */
export interface ParticleStyle {
    [key: string]: string | number;
}

/**
 * Interface for particle state
 */
export interface ParticleState {
    id: number;
    type: ParticleType;
    startTime: number;
    duration: number;
    isExpired: boolean;
}

/**
 * Type for particle update callback function
 */
export type ParticleUpdateCallback = () => void;

/**
 * Interface for particle creation options
 */
export interface ParticleCreationOptions {
    type: ParticleType;
    duration?: number;
    size?: number;
    onComplete?: () => void;
}
