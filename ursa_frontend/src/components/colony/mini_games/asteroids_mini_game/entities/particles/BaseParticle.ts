import BaseEntity from '../BaseEntity';

export interface ParticleProps {
    id: number;
    x: number;
    y: number;
    duration: number;
    onComplete?: () => void;
}

/**
 * Base class for all particle effects
 * Handles common properties and behaviors shared between different particle types
 */
export class BaseParticle extends BaseEntity {
    protected duration: number;
    protected startTime: number;
    protected onComplete?: () => void;

    constructor(props: ParticleProps) {
        super(props.id, props.x, props.y);
        this.duration = props.duration;
        this.startTime = Date.now();
        this.onComplete = props.onComplete;
    }

    /**
     * Checks if the particle has exceeded its lifetime
     */
    public isExpired(): boolean {
        return Date.now() - this.startTime >= this.duration;
    }

    /**
     * Gets the CSS styles for rendering this particle
     * Should be overridden by child classes
     */
    public getStyle(): Record<string, string> {
        return {};
    }

    /**
     * Destroys the particle and triggers completion callback
     */
    destroy(): void {
        if (this.onComplete) {
            this.onComplete();
        }
        this.cleanup();
    }

    /**
     * Gets the elapsed time since particle creation
     */
    protected getElapsedTime(): number {
        return Date.now() - this.startTime;
    }

    /**
     * Gets the remaining time until particle expiration
     */
    protected getRemainingTime(): number {
        return Math.max(0, this.duration - this.getElapsedTime());
    }
}

export default BaseParticle;