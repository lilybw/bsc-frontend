/**
 * Base class for all game entities
 * Handles common properties and behaviors shared between Asteroids, Players, and LazerBeams
 */
export abstract class BaseEntity {
    id: number;
    x: number;
    y: number;
    element: HTMLDivElement | null;

    constructor(id: number, x: number = 0, y: number = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.element = null;
    }

    /**
     * Updates the entity's position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.updateElementPosition();
    }

    /**
     * Updates the DOM element's position if it exists
     */
    protected updateElementPosition(): void {
        if (this.element) {
            this.element.style.left = `${this.x * 100}%`;
            this.element.style.top = `${this.y * 100}%`;
        }
    }

    /**
     * Sets the DOM element reference
     */
    setElement(element: HTMLDivElement): void {
        this.element = element;
    }

    /**
     * Gets the current position of the entity
     */
    getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    /**
     * Abstract method for destroying the entity
     * Must be implemented by child classes
     */
    abstract destroy(): void;

    /**
     * Checks if this entity collides with another entity
     * Basic implementation using rectangular collision
     */
    collidesWith(other: BaseEntity): boolean {
        if (!this.element || !other.element) return false;

        const rect1 = this.element.getBoundingClientRect();
        const rect2 = other.element.getBoundingClientRect();

        return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);
    }

    /**
     * Gets the center position of the entity in viewport coordinates
     */
    getCenterPosition(): { x: number; y: number } | null {
        if (!this.element) return null;

        const rect = this.element.getBoundingClientRect();
        return {
            x: (rect.left + rect.right) / 2 / window.innerWidth,
            y: (rect.top + rect.bottom) / 2 / window.innerHeight
        };
    }

    /**
     * Optional cleanup method
     * Override in child classes if needed
     */
    cleanup(): void {
        this.element = null;
    }
}

/**
 * Base interface for entities that can take damage
 */
export interface Damageable {
    health: number;
    maxHealth: number;
    takeDamage(amount: number): void;
    isDestroyed(): boolean;
}

/**
 * Base interface for entities that can move
 */
export interface Moveable {
    speed: number;
    move(deltaTime: number): void;
}

/**
 * Base interface for entities that can have status effects
 */
export interface StatusEffectable {
    isStunned: boolean;
    isDisabled: boolean;
    stun(): void;
    disable(): void;
}

/**
 * Base interface for entities that can be targeted
 */
export interface Targetable {
    charCode: string;
    getCharCode(): string;
}

/**
 * Utility type for entity creation options
 */
export type EntityCreationOptions = {
    id: number;
    x?: number;
    y?: number;
    element?: HTMLDivElement;
};

/**
 * Type for entity removal callback function
 */
export type EntityRemovalCallback = () => void;

/**
 * Type for entity position
 */
export type Position = {
    x: number;
    y: number;
};

export default BaseEntity;