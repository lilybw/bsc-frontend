/**
 * Base class for all game entities
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
    getPosition(): Position {
        return { x: this.x, y: this.y };
    }

    /**
     * Abstract method for destroying the entity
     */
    abstract destroy(): void;

    /**
     * Optional cleanup method
     */
    cleanup(): void {
        this.element = null;
    }
}

/**
 * Interfaces for entity capabilities
 */
export interface Damageable {
    health: number;
    maxHealth: number;
    takeDamage(amount: number): void;
    isDestroyed(): boolean;
}

export interface StatusEffectable {
    isStunned: boolean;
    isDisabled: boolean;
    stun(): void;
    disable(): void;
}

export interface Targetable {
    charCode: string;
    getCharCode(): string;
}

/**
 * Position type
 */
export type Position = {
    x: number;
    y: number;
};

export default BaseEntity;
