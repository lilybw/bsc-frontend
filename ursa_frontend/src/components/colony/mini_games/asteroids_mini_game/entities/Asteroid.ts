import BaseEntity, { Damageable, Targetable, Position } from './BaseEntity';
import { AsteroidsAsteroidSpawnMessageDTO } from '../../../../../integrations/multiplayer_backend/EventSpecifications';

/**
 * Interface defining asteroid creation parameters
 */
export interface AsteroidCreationOptions extends AsteroidsAsteroidSpawnMessageDTO {
    speed: number;
    endX: number;
    endY: number;
    destroy: () => void;
    element: HTMLDivElement | null;
}

/**
 * Asteroid entity class
 * Represents an asteroid that moves towards the colony wall and can be destroyed
 */
export class Asteroid extends BaseEntity implements Damageable, Targetable {
    // Properties from AsteroidsAsteroidSpawnMessageDTO
    charCode: string;
    health: number;
    timeUntilImpact: number;

    // Additional properties
    maxHealth: number;
    speed: number;
    endX: number;
    endY: number;
    private destroyCallback: () => void;
    private startTime: number;

    constructor(options: AsteroidCreationOptions) {
        super(options.id, options.x, options.y);

        // Initialize properties from DTO
        this.charCode = options.charCode;
        this.health = options.health;
        this.timeUntilImpact = options.timeUntilImpact;

        // Initialize additional properties
        this.maxHealth = options.health;
        this.speed = options.speed;
        this.endX = options.endX;
        this.endY = options.endY;
        this.destroyCallback = options.destroy;
        this.startTime = Date.now();

        if (options.element) {
            this.setElement(options.element);
        }
    }

    /**
     * Gets the character code for targeting this asteroid
     */
    getCharCode(): string {
        return this.charCode;
    }

    /**
     * Applies damage to the asteroid
     */
    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
        if (this.isDestroyed()) {
            this.destroy();
        }
    }

    /**
     * Checks if the asteroid is destroyed
     */
    isDestroyed(): boolean {
        return this.health <= 0;
    }

    /**
     * Starts the asteroid's movement animation
     */
    startMovement(): void {
        if (this.element) {
            this.element.style.transition = 'none';
            this.element.style.left = `${this.x * 100}%`;
            this.element.style.top = `${this.y * 100}%`;
            this.element.style.transform = 'translate(-50%, -50%)';

            // Force reflow
            void this.element.offsetHeight;

            // Start animation
            requestAnimationFrame(() => {
                if (this.element) {
                    this.element.style.transition = `all ${this.timeUntilImpact / 1000}s linear`;
                    this.element.style.left = `${this.endX * 100}%`;
                    this.element.style.top = `${this.endY * 100}%`;
                }
            });
        }
    }

    /**
     * Destroys the asteroid
     */
    destroy(): void {
        if (this.element) {
            // Add destruction animation class if defined in styles
            this.element.classList.add('destroying');

            // Remove the element after animation
            setTimeout(() => {
                if (this.element) {
                    this.element.remove();
                }
            }, 100);
        }

        // Call the destroy callback
        this.destroyCallback();

        // Cleanup
        this.cleanup();
    }

    /**
     * Updates the asteroid's remaining time until impact
     */
    updateTimeUntilImpact(): void {
        const elapsedTime = Date.now() - this.startTime;
        this.timeUntilImpact = Math.max(0, this.timeUntilImpact - elapsedTime);
    }

    /**
     * Gets the progress of the asteroid's journey (0 to 1)
     */
    getProgress(): number {
        const elapsedTime = Date.now() - this.startTime;
        return Math.min(elapsedTime / this.timeUntilImpact, 1);
    }

    /**
     * Overrides base cleanup method
     */
    cleanup(): void {
        super.cleanup();
        this.destroyCallback = () => {}; // Clear the callback
    }

    /**
     * Gets the predicted impact position
     */
    getImpactPosition(): Position {
        return { x: this.endX, y: this.endY };
    }

    /**
     * Gets the time remaining until impact
     */
    getRemainingTime(): number {
        const elapsedTime = Date.now() - this.startTime;
        return Math.max(0, this.timeUntilImpact - elapsedTime);
    }
}

export default Asteroid;
