import BaseEntity from './BaseEntity';
import { Position } from './BaseEntity';

/**
 * Interface for laser beam creation options
 */
export interface LazerBeamProps {
    id: number;
    startPosition: Position;
    endPosition: Position;
    duration?: number;
    fadeSpeed?: number;
    onComplete?: () => void;
}

/**
 * LazerBeam entity class
 * Represents a visual beam effect for shots fired in the game
 */
export class LazerBeam extends BaseEntity {
    private startPosition: Position;
    private endPosition: Position;
    private _opacity: number;
    private fadeSpeed: number;
    private _duration: number;
    private onCompleteCallback?: () => void;

    constructor(props: LazerBeamProps) {
        super(props.id);
        this.startPosition = props.startPosition;
        this.endPosition = props.endPosition;
        this._opacity = 1;
        this.fadeSpeed = props.fadeSpeed || 0.1;
        this._duration = props.duration || 1000;
        this.onCompleteCallback = props.onComplete;

        // Start the fade-out after initialization
        setTimeout(() => this.startFadeOut(), this._duration);
    }

    // Position getters
    get startX(): number {
        return this.startPosition.x;
    }

    get startY(): number {
        return this.startPosition.y;
    }

    get endX(): number {
        return this.endPosition.x;
    }

    get endY(): number {
        return this.endPosition.y;
    }

    // Opacity getter and setter
    get opacity(): number {
        return this._opacity;
    }

    set opacity(value: number) {
        this._opacity = Math.max(0, Math.min(1, value));
    }

    get duration(): number {
        return this._duration;
    }

    /**
     * Starts the fade out animation
     */
    private startFadeOut(): void {
        this._opacity = 0; // Set opacity to 0 instantly
        this.onCompleteCallback?.();
        this.cleanup();
    }

    /**
     * Checks if the beam is still active
     */
    public isActive(): boolean {
        return this._opacity > 0;
    }

    /**
     * Converts a percentage position to pixel coordinates
     */
    private getPixelPosition(position: Position): Position {
        return {
            x: position.x * window.innerWidth,
            y: position.y * window.innerHeight
        };
    }

    /**
     * Gets the current beam properties
     */
    public getBeamProperties(): BeamProperties {
        return {
            startPosition: this.startPosition,
            endPosition: this.endPosition,
            opacity: this._opacity,
            duration: this._duration,
            elapsed: this._duration - (this._opacity / this.fadeSpeed) * 1000
        };
    }

    /**
     * Destroys the laser beam
     */
    destroy(): void {
        this.onCompleteCallback?.();
        this.cleanup();
    }

    /**
     * Cleans up resources
     */
    cleanup(): void {
        this.onCompleteCallback = undefined;
        super.cleanup();
    }
}

/**
 * Interface for beam properties
 */
export interface BeamProperties {
    startPosition: Position;
    endPosition: Position;
    opacity: number;
    duration: number;
    elapsed: number;
}

export default LazerBeam;
