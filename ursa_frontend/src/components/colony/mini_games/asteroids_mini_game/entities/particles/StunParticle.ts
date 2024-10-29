import BaseParticle, { ParticleProps } from './BaseParticle';

export interface StunParticleProps extends ParticleProps {
    size?: number;
}

/**
 * Particle class for stun effect
 * Creates rising, fading particles for the stun animation
 */
export class StunParticle extends BaseParticle {
    private size: number;
    private readonly horizontalPosition: number;

    constructor(props: StunParticleProps) {
        super(props);
        this.size = props.size || 2.5;
        // Calculate random position within middle third once at creation
        this.horizontalPosition = 33 + Math.random() * 33;
    }

    /**
     * Gets the CSS styles for rendering the stun particle
     * Includes position, size, and animation properties
     */
    public getStyle(): Record<string, string> {
        return {
            position: 'absolute',
            bottom: '0',
            left: `${33 + (Math.random() * 33)}%`,  // Middle third of container
            width: `${2 + Math.random()}em`,
            height: `${2 + Math.random()}em`,
            animation: 'stunRise 6s ease-out forwards',
            'z-index': '1000',
            'border-radius': '50%',
            'mix-blend-mode': 'screen',
            'pointer-events': 'none',
            'background-image': `radial-gradient(
                rgba(255, 255, 0, 0.8) 20%,
                rgba(255, 255, 150, 0.4) 40%,
                rgba(255, 255, 0, 0) 70%
            )`
        };
    }

    /**
     * Gets the opacity based on elapsed time
     * Could be used for custom fade effects
     */
    private getOpacity(): number {
        const elapsed = this.getElapsedTime();
        const progress = elapsed / this.duration;

        if (progress < 0.1) {
            return progress * 10; // Fade in
        } else if (progress > 0.8) {
            return 1 - (progress - 0.8) * 5; // Fade out
        }
        return 1;
    }
}

export default StunParticle;
