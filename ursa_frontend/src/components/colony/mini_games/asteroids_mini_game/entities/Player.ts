import BaseEntity, { Targetable, StatusEffectable } from './BaseEntity';
import { AsteroidsAssignPlayerDataMessageDTO } from '../../../../../integrations/multiplayer_backend/EventSpecifications';

/**
 * Interface representing the current state of a player
 */
interface PlayerState {
    isStunned: boolean;
    isDisabled: boolean;
}

/**
 * Interface for player creation options
 */
export interface PlayerCreationOptions extends AsteroidsAssignPlayerDataMessageDTO {
    element: HTMLDivElement | null;
    stunDuration: number;
    friendlyFirePenalty: number;
    penaltyMultiplier: number;
    isLocal?: boolean;
    onStateChange?: (stunned: boolean, disabled: boolean) => void; // Add this
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
    public readonly isLocal: boolean;

    // Status effect properties
    private _isStunned: boolean = false;
    private _isDisabled: boolean = false;
    private readonly stunDuration: number;
    private readonly friendlyFirePenalty: number;
    private readonly penaltyMultiplier: number;
    private stunTimer: NodeJS.Timeout | null = null;
    private disableTimer: NodeJS.Timeout | null = null;
    private updateButtonState?: (disabled: boolean) => void;
    private readonly onStateChange?: (stunned: boolean, disabled: boolean) => void;

    /**
     * Creates a new Player instance
     * @param options Player creation options including position, status durations, and local player flag
     */
    constructor(options: PlayerCreationOptions) {
        super(options.id, options.x, options.y);

        this.code = options.code;
        this.charCode = options.code;
        this.firstName = options.id.toString();
        this.stunDuration = options.stunDuration;
        this.friendlyFirePenalty = options.friendlyFirePenalty;
        this.penaltyMultiplier = options.penaltyMultiplier;
        this.isLocal = options.isLocal || false;
        this.onStateChange = options.onStateChange; // Store the callback

        if (options.element) {
            this.setElement(options.element);
        }
    }

    /**
     * Updates both button state and notifies state changes
     * @private
     */
    private updateState(): void {
        const isDisabled = this._isStunned || this._isDisabled;

        // Update button state
        if (this.updateButtonState) {
            this.updateButtonState(isDisabled);
        }

        // Notify state change
        if (this.onStateChange) {
            this.onStateChange(this._isStunned, this._isDisabled);
        }
    }

    /**
     * Sets the callback function for updating button state
     * Used for the local player to control UI button states
     * @param updater Function to update button enabled/disabled state
     */
    setButtonStateUpdater(updater: (disabled: boolean) => void): void {
        this.updateButtonState = updater;
        // Initial state update
        this.updateButtonState(this._isStunned || this._isDisabled);
    }

    /**
     * Gets the current state of the player
     */
    get state(): PlayerState {
        return {
            isStunned: this._isStunned,
            isDisabled: this._isDisabled,
        };
    }

    get isStunned(): boolean {
        return this._isStunned;
    }

    get isDisabled(): boolean {
        return this._isDisabled;
    }

    /**
     * Gets the character code used for targeting this player
     */
    getCharCode(): string {
        return this.charCode;
    }

    /**
     * Applies stun effect to the player
     * Prevents the player from shooting for the duration
     */
    stun(): void {
        if (this.stunTimer) {
            clearTimeout(this.stunTimer);
        }

        this._isStunned = true;
        this.updateState();

        this.stunTimer = setTimeout(() => {
            this.removeStun();
        }, this.stunDuration * 1000);
    }

    /**
     * Removes stun effect from the player
     * @private
     */
    private removeStun(): void {
        this._isStunned = false;
        this.updateState();

        if (this.stunTimer) {
            clearTimeout(this.stunTimer);
            this.stunTimer = null;
        }
    }

    /**
     * Applies disable effect to the player
     * Triggered when player hits another player (friendly fire)
     */
    disable(): void {
        if (this.disableTimer) {
            clearTimeout(this.disableTimer);
        }

        this._isDisabled = true;
        this.updateState();
        const penaltyDuration = this.friendlyFirePenalty * this.penaltyMultiplier;

        this.disableTimer = setTimeout(() => {
            this.removeDisable();
        }, penaltyDuration * 1000);
    }

    /**
     * Removes disable effect from the player
     * @private
     */
    private removeDisable(): void {
        this._isDisabled = false;
        this.updateState();

        if (this.disableTimer) {
            clearTimeout(this.disableTimer);
            this.disableTimer = null;
        }
    }

    /**
     * Checks if the player can currently shoot
     * @returns boolean indicating if player can shoot
     */
    canShoot(): boolean {
        return !this._isStunned && !this._isDisabled;
    }

    /**
     * Destroys the player entity and cleans up resources
     */
    destroy(): void {
        this.cleanup();
    }

    /**
     * Cleans up timers and resources
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
        this.updateButtonState = undefined;
        super.cleanup();
    }
}

export default Player;
