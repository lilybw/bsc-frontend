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
    private startTime: number;
    private animationFrame: number | null;
    private impactElement: HTMLDivElement | null;
    private onCompleteCallback?: () => void;

    constructor(props: LazerBeamProps) {
        super(props.id);
        this.startPosition = props.startPosition;
        this.endPosition = props.endPosition;
        this._opacity = 1;
        this.fadeSpeed = props.fadeSpeed || 0.1;
        this._duration = props.duration || 1000;
        this.startTime = Date.now();
        this.animationFrame = null;
        this.impactElement = null;
        this.onCompleteCallback = props.onComplete;
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
     * Initializes the laser beam elements
     */
    initialize(): void {
        // Create main beam element
        const beamElement = document.createElement('div');
        beamElement.classList.add('lazer-beam');
        this.setElement(beamElement);

        // Create impact effect element
        this.impactElement = document.createElement('div');
        this.impactElement.classList.add('impact-circle');

        // Add elements to DOM
        document.body.appendChild(beamElement);
        document.body.appendChild(this.impactElement);

        // Start animation
        this.updateBeam();
        this.startFadeOut();
    }

    /**
     * Updates the beam's visual properties
     */
    private updateBeam(): void {
        if (!this.element || !this.impactElement) return;

        // Convert positions to pixel coordinates
        const startPx = this.getPixelPosition(this.startPosition);
        const endPx = this.getPixelPosition(this.endPosition);

        // Calculate beam length and angle
        const dx = endPx.x - startPx.x;
        const dy = endPx.y - startPx.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Update beam element
        this.element.style.left = `${startPx.x}px`;
        this.element.style.top = `${startPx.y}px`;
        this.element.style.width = `${length}px`;
        this.element.style.transform = `rotate(${angle}rad)`;
        this.element.style.opacity = this._opacity.toString();

        // Update impact element
        this.impactElement.style.left = `${endPx.x}px`;
        this.impactElement.style.top = `${endPx.y}px`;
        this.impactElement.style.opacity = this._opacity.toString();
    }

    /**
     * Starts the fade out animation
     */
    private startFadeOut(): void {
        const animate = () => {
            const elapsed = Date.now() - this.startTime;

            if (elapsed >= this._duration) {
                this.destroy();
                return;
            }

            this._opacity = Math.max(0, 1 - (elapsed / this._duration));
            this.updateBeam();

            this.animationFrame = requestAnimationFrame(animate);
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    /**
     * Checks if the beam is still active
     */
    public isActive(): boolean {
        return this._opacity > 0 && (Date.now() - this.startTime) < this._duration;
    }

    /**
     * Applies fade effect to the beam
     */
    public fade(): void {
        const elapsed = Date.now() - this.startTime;
        this._opacity = Math.max(0, 1 - (elapsed / this._duration));
        this.updateBeam();
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
            elapsed: Date.now() - this.startTime
        };
    }

    /**
     * Updates the beam's end position (for tracking moving targets)
     */
    public updateEndPosition(x: number, y: number): void {
        this.endPosition = { x, y };
        this.updateBeam();
    }

    /**
     * Handles window resize events
     */
    public handleResize(): void {
        this.updateBeam();
    }

    /**
     * Destroys the laser beam
     */
    destroy(): void {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.element) {
            this.element.remove();
        }

        if (this.impactElement) {
            this.impactElement.remove();
        }

        this.onCompleteCallback?.();
        this.cleanup();
    }

    /**
     * Cleans up resources
     */
    cleanup(): void {
        this.element = null;
        this.impactElement = null;
        this.animationFrame = null;
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