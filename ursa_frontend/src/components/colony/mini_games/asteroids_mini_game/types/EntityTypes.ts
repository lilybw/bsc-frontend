import { Position } from "../entities/BaseEntity";
import { AsteroidsSettingsDTO } from "./GameTypes";

/**
 * Basic entity type identifiers
 */
export type EntityType = 'asteroid' | 'player' | 'lazer';

/**
 * Entity reference for DOM elements
 */
export interface EntityRef {
    type: EntityType;
    element: HTMLDivElement;
}

/**
 * Base entity properties shared across all entity types
 */
export interface BaseEntityProps {
    id: number;
    position: Position;
    element: HTMLDivElement | null;
    isActive: boolean;
    createdAt: number;
}

/**
 * Asteroid entity specific properties
 */
export interface AsteroidProps extends BaseEntityProps {
    charCode: string;
    health: number;
    maxHealth: number;
    timeUntilImpact: number;
    speed: number;
    startPosition: Position;
    endPosition: Position;
    rotationSpeed: number;
}

/**
 * Player entity specific properties
 */
export interface PlayerProps extends BaseEntityProps {
    code: string;
    firstName: string;
    isStunned: boolean;
    isDisabled: boolean;
    stunDuration: number;
    friendlyFirePenalty: number;
    lastShotTime: number;
    consecutiveFriendlyFire: number;
}

/**
 * LazerBeam entity specific properties
 */
export interface LazerBeamProps extends BaseEntityProps {
    startPosition: Position;
    endPosition: Position;
    opacity: number;
    duration: number;
    fadeSpeed: number;
}

/**
 * Entity creation options interfaces
 */
export interface CreateAsteroidOptions {
    settings: AsteroidsSettingsDTO;
    position?: Position;
    health?: number;
    timeUntilImpact?: number;
}

export interface CreatePlayerOptions {
    position: Position;
    code: string;
    firstName: string;
    settings: AsteroidsSettingsDTO;
}

export interface CreateLazerBeamOptions {
    startPosition: Position;
    endPosition: Position;
    duration?: number;
    fadeSpeed?: number;
}

/**
 * Entity state update interfaces
 */
export interface EntityStateUpdate {
    id: number;
    type: EntityType;
    changes: Partial<AsteroidProps | PlayerProps | LazerBeamProps>;
}

/**
 * Entity collision data
 */
export interface CollisionData {
    entity1: {
        id: number;
        type: EntityType;
        position: Position;
    };
    entity2: {
        id: number;
        type: EntityType;
        position: Position;
    };
    collisionPoint: Position;
    timestamp: number;
}

/**
 * Entity animation states
 */
export interface EntityAnimationState {
    isAnimating: boolean;
    startTime: number;
    duration: number;
    startPosition: Position;
    endPosition: Position;
    easingFunction?: (t: number) => number;
}

/**
 * Entity event handlers
 */
export interface EntityEventHandlers {
    onDestroy?: () => void;
    onCollision?: (collision: CollisionData) => void;
    onStateChange?: (update: EntityStateUpdate) => void;
    onAnimationComplete?: () => void;
}

/**
 * Entity manager interface
 */
export interface EntityManager {
    createEntity: (type: EntityType, options: any) => number;
    removeEntity: (id: number) => void;
    getEntity: (id: number) => BaseEntityProps | null;
    updateEntity: (update: EntityStateUpdate) => void;
    getEntitiesByType: (type: EntityType) => BaseEntityProps[];
}

/**
 * Entity pool configuration
 */
export interface EntityPoolConfig {
    maxAsteroids: number;
    maxLazerBeams: number;
    maxPlayers: number;
    preloadCount: number;
}

/**
 * Entity factory interface
 */
export interface EntityFactory {
    createAsteroid: (options: CreateAsteroidOptions) => number;
    createPlayer: (options: CreatePlayerOptions) => number;
    createLazerBeam: (options: CreateLazerBeamOptions) => number;
}

/**
 * Type guards for entity properties
 */
export const isAsteroidProps = (props: BaseEntityProps): props is AsteroidProps => {
    return 'charCode' in props && 'health' in props && 'timeUntilImpact' in props;
};

export const isPlayerProps = (props: BaseEntityProps): props is PlayerProps => {
    return 'code' in props && 'firstName' in props && 'isStunned' in props;
};

export const isLazerBeamProps = (props: BaseEntityProps): props is LazerBeamProps => {
    return 'startPosition' in props && 'endPosition' in props && 'opacity' in props;
};

/**
 * Entity state validation
 */
export interface EntityValidation {
    isValidPosition: (position: Position) => boolean;
    isValidHealth: (health: number) => boolean;
    isValidCode: (code: string) => boolean;
    isValidDuration: (duration: number) => boolean;
}

/**
 * Entity update batch processing
 */
export interface EntityUpdateBatch {
    timestamp: number;
    updates: EntityStateUpdate[];
}

/**
 * Entity render properties
 */
export interface EntityRenderProps {
    scale: number;
    opacity: number;
    rotation: number;
    effects: string[];
    zIndex: number;
}

/**
 * Container for active entities
 */
export class EntityContainer {
    private asteroids: Map<number, AsteroidProps>;
    private players: Map<number, PlayerProps>;
    private lazerBeams: Map<number, LazerBeamProps>;

    constructor() {
        this.asteroids = new Map();
        this.players = new Map();
        this.lazerBeams = new Map();
    }

    getAsteroid(id: number): AsteroidProps | undefined {
        return this.asteroids.get(id);
    }

    getPlayer(id: number): PlayerProps | undefined {
        return this.players.get(id);
    }

    getLazerBeam(id: number): LazerBeamProps | undefined {
        return this.lazerBeams.get(id);
    }

    addEntity(type: EntityType, id: number, props: BaseEntityProps): void {
        switch (type) {
            case 'asteroid':
                if (isAsteroidProps(props)) this.asteroids.set(id, props);
                break;
            case 'player':
                if (isPlayerProps(props)) this.players.set(id, props);
                break;
            case 'lazer':
                if (isLazerBeamProps(props)) this.lazerBeams.set(id, props);
                break;
        }
    }

    removeEntity(type: EntityType, id: number): void {
        switch (type) {
            case 'asteroid':
                this.asteroids.delete(id);
                break;
            case 'player':
                this.players.delete(id);
                break;
            case 'lazer':
                this.lazerBeams.delete(id);
                break;
        }
    }

    getAllEntities(): BaseEntityProps[] {
        return [
            ...Array.from(this.asteroids.values()),
            ...Array.from(this.players.values()),
            ...Array.from(this.lazerBeams.values())
        ];
    }
}

export default {
    EntityContainer,
    isAsteroidProps,
    isPlayerProps,
    isLazerBeamProps
};