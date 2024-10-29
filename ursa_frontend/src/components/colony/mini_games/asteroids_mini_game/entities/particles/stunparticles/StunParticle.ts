import BaseParticle, { ParticleProps } from '../BaseParticle';

export interface StunParticleProps extends ParticleProps {
    size?: number;
}

/**
 * Particle class for stun effect
 * Creates rising, fading particles for the stun animation
 */
export class StunParticle extends BaseParticle {
    private size: number;

    constructor(props: StunParticleProps) {
        super(props);
        this.size = props.size || 2.5;
        // Calculate random position within middle third once at creation
    }

    /**
     * Gets the CSS styles for rendering the stun particle
     * Includes position, size, and animation properties
     */
    public getStyle(): Record<string, string> {
        // Size variation to particles
        const sizeVariation = 0.8 + Math.random() * 0.4;

        console.log('[STUNPARTICLE] Getting style:', {
            id: this.id,
            position: { x: this.x, y: this.y },
            calculatedStyle: {
                position: 'absolute',
                left: `${this.x * 100}%`,
                top: `${this.y * 100}%`,
                transform: 'translate(-50%, -50%)'
            }
        });

        return {
            position: 'absolute',
            left: `${(this.x * 100) - ((this.size / 2.0) * sizeVariation)}%`,  // Use exact center position minus the particle size
            top: `${this.y * 100}%`,
            transform: 'translate(-50%, -50%)', // Center the particle on this point
            width: `${this.size * sizeVariation}em`,
            height: `${this.size * sizeVariation}em`,
            animation: `stunRise ${4 + Math.random()}s ease-out forwards`,
            'z-index': '1000',
            opacity: '0',
            'border-radius': '50%',
            'mix-blend-mode': 'screen',
            'pointer-events': 'none',
            filter: `blur(${0.15 * sizeVariation}em)`,
            'background-image': `radial-gradient(
                rgba(255, ${200 + Math.random() * 55}, 0, 1) 10%,
                rgba(255, ${100 + Math.random() * 55}, 0, 0.8) 30%,
                rgba(255, ${50 + Math.random() * 30}, 0, 0.6) 50%,
                rgba(255, 30, 0, 0) 70%
            )`,
            'box-shadow': `
                0 0 1em 0.2em rgba(255, 200, 0, 0.5),
                0 0 2em 0.5em rgba(255, 100, 0, 0.3)
            `
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
