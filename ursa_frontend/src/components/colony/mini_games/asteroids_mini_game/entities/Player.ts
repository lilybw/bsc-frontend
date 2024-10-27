import BaseEntity, { Targetable, StatusEffectable } from './BaseEntity';
import { AsteroidsAssignPlayerDataMessageDTO } from '../../../../../integrations/multiplayer_backend/EventSpecifications';

interface PlayerState {
    isStunned: boolean;
    isDisabled: boolean;
}

export interface PlayerCreationOptions extends AsteroidsAssignPlayerDataMessageDTO {
    x: number;
    y: number;
    element: HTMLDivElement | null;
    stunDuration: number;
    friendlyFirePenalty: number;
    penaltyMultiplier: number;
}

/**
 * Player entity class
 * Represents a player character that can shoot at asteroids and other players
 */
export class Player extends BaseEntity implements Targetable, StatusEffectable {
    // Properties from DTO
    public readonly charCode: string;
    public readonly code: string;
    public readonly firstName: string;

    // Status effect properties
    private _isStunned: boolean = false;
    private _isDisabled: boolean = false;
    private readonly stunDuration: number;
    private readonly friendlyFirePenalty: number;
    private readonly penaltyMultiplier: number;
    private stunTimer: NodeJS.Timeout | null = null;
    private disableTimer: NodeJS.Timeout | null = null;

    constructor(options: PlayerCreationOptions) {
        super(options.id, options.x, options.y);

        this.code = options.code;
        this.charCode = options.code;
        this.firstName = options.id.toString();
        this.stunDuration = options.stunDuration;
        this.friendlyFirePenalty = options.friendlyFirePenalty;
        this.penaltyMultiplier = options.penaltyMultiplier;

        if (options.element) {
            this.setElement(options.element);
        }
    }

    /**
     * Gets the current player state
     */
    get state(): PlayerState {
        return {
            isStunned: this._isStunned,
            isDisabled: this._isDisabled
        };
    }

    get isStunned(): boolean {
        return this._isStunned;
    }

    get isDisabled(): boolean {
        return this._isDisabled;
    }

    /**
     * Gets the character code for targeting this player
     */
    getCharCode(): string {
        return this.charCode;
    }

    /**
     * Applies stun effect to the player
     */
    stun(): void {
        if (this.stunTimer) {
            clearTimeout(this.stunTimer);
        }

        this._isStunned = true;
        if (this.element) {
            this.element.classList.add('stunned');
        }

        this.stunTimer = setTimeout(() => {
            this.removeStun();
        }, this.stunDuration);
    }

    /**
     * Removes stun effect from the player
     */
    private removeStun(): void {
        this._isStunned = false;
        if (this.element) {
            this.element.classList.remove('stunned');
        }
        if (this.stunTimer) {
            clearTimeout(this.stunTimer);
            this.stunTimer = null;
        }
    }

    /**
     * Applies disable effect to the player
     */
    disable(): void {
        if (this.disableTimer) {
            clearTimeout(this.disableTimer);
        }

        this._isDisabled = true;
        if (this.element) {
            this.element.classList.add('disabled');
        }

        const penaltyDuration = this.friendlyFirePenalty * this.penaltyMultiplier;
        this.disableTimer = setTimeout(() => {
            this.removeDisable();
        }, penaltyDuration);
    }

    /**
     * Removes disable effect from the player
     */
    private removeDisable(): void {
        this._isDisabled = false;
        if (this.element) {
            this.element.classList.remove('disabled');
        }
        if (this.disableTimer) {
            clearTimeout(this.disableTimer);
            this.disableTimer = null;
        }
    }

    /**
     * Checks if the player can shoot
     */
    canShoot(): boolean {
        return !this._isStunned && !this._isDisabled;
    }

    /**
     * Updates player position with animation
     */
    setPosition(x: number, y: number): void {
        if (this.element) {
            this.element.style.transition = 'transform 0.3s ease-out';
            this.element.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
        }
        super.setPosition(x, y);
    }

    /**
     * Destroys the player entity
     */
    destroy(): void {
        this.cleanup();
    }

    /**
     * Cleanup method for player entity
     */
    cleanup(): void {
        if (this.stunTimer) {
            clearTimeout(this.stunTimer);
            this.stunTimer = null;
        }
        if (this.disableTimer) {
            clearTimeout(this.disableTimer);
            this.disableTimer = null;
        }
        super.cleanup();
    }
}

export default Player;