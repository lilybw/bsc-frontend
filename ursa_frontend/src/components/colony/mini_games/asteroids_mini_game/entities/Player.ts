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
    isLocal?: boolean;  // Added isLocal as optional parameter
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
    public readonly isLocal: boolean;  // Added isLocal property

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
        this.isLocal = options.isLocal || false;  // Initialize isLocal with default false

        if (options.element) {
            this.setElement(options.element);
        }
    }

    // Rest of the class remains the same
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

    getCharCode(): string {
        return this.charCode;
    }

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

    canShoot(): boolean {
        return !this._isStunned && !this._isDisabled;
    }

    setPosition(x: number, y: number): void {
        if (this.element) {
            // Transform the element to its new position while keeping the centering transform
            const xPercent = x * 100;
            this.element.style.transition = 'left 0.3s ease-out';
            this.element.style.left = `${xPercent}%`;
            this.element.style.transform = `translateX(-50%)`;
        }
        super.setPosition(x, y);
    }

    destroy(): void {
        this.cleanup();
    }

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