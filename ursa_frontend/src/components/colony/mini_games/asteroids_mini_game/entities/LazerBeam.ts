import BaseEntity from './BaseEntity';
import { Position } from './BaseEntity';

export interface LazerBeamProps {
    id: number;
    startPosition: Position;
    endPosition: Position;
    duration?: number;
    fadeSpeed?: number;
    onComplete?: () => void;
}

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

    // Public getter for opacity
    get opacity(): number {
        return this._opacity;
    }

    // Starts the fade-out animation
    private startFadeOut(): void {
        const fadeInterval = setInterval(() => {
            this._opacity -= this.fadeSpeed;
            if (this._opacity <= 0) {
                clearInterval(fadeInterval);
                this.onCompleteCallback?.();
                this.cleanup();
            }
        }, 100); // adjust the interval time as needed
    }

    // Method to calculate the width of the laser beam based on start and end positions
    public getBeamWidth(): string {
        const width = Math.hypot(
            this.endPosition.x * window.innerWidth - this.startPosition.x * window.innerWidth,
            this.endPosition.y * window.innerHeight - this.startPosition.y * window.innerHeight
        );
        return `${width}px`;
    }

    // Method to calculate the rotation angle of the laser beam in radians
    public getBeamRotation(): string {
        const angle = Math.atan2(
            (this.endPosition.y - this.startPosition.y) * window.innerHeight,
            (this.endPosition.x - this.startPosition.x) * window.innerWidth
        );
        return `${angle}rad`;
    }

    // Method to get CSS-compatible position for the start of the laser beam
    public getStartCSSPosition(): { left: string; top: string } {
        return {
            left: `${this.startPosition.x * window.innerWidth}px`,
            top: `${this.startPosition.y * window.innerHeight}px`
        };
    }

    // Method to get CSS-compatible position for the impact circle
    public getEndCSSPosition(): { left: string; top: string } {
        return {
            left: `${this.endPosition.x * window.innerWidth}px`,
            top: `${this.endPosition.y * window.innerHeight}px`
        };
    }

    // Destroys the laser beam, calling any onComplete callback
    destroy(): void {
        this.onCompleteCallback?.();
        this.cleanup();
    }

    // Cleans up resources associated with the laser beam
    cleanup(): void {
        this.onCompleteCallback = undefined;
        super.cleanup();
    }
}

export default LazerBeam;
