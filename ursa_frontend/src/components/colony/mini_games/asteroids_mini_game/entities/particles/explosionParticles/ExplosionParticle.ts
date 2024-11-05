import BaseParticle, { ParticleProps } from '../BaseParticle';

export interface ExplosionParticleProps extends ParticleProps {
    size?: number;
    velocity: {
        x: number;
        y: number;
    };
    initialSpeed: number;
    deceleration: number;
}

export class ExplosionParticle extends BaseParticle {
    private size: number;
    private initialSpeed: number;

    constructor(props: ExplosionParticleProps) {
        super(props);
        this.size = props.size || 2.5;
        this.initialSpeed = props.initialSpeed;
    }

    public getStyle(): Record<string, string> {
        const sizeVariation = 0.8 + Math.random() * 0.4;

        // Calculate random angle for the particle
        const angle = Math.random() * Math.PI * 2;
        const spreadDistance = this.initialSpeed;

        // Calculate spread in both directions
        const spreadX = Math.cos(angle) * spreadDistance;
        const spreadY = Math.sin(angle) * spreadDistance;

        return {
            '--spread-x': `${spreadX}%`,
            '--spread-y': `${spreadY}%`,
            '--particle-size': `${this.size * sizeVariation}em`,
            '--glow-color': `rgba(255, ${200 + Math.random() * 55}, 0)`,
            '--mid-color': `rgba(255, ${100 + Math.random() * 55}, 0)`,
            '--outer-color': `rgba(255, ${50 + Math.random() * 30}, 0)`,
            '--blur-amount': `${0.15 * sizeVariation}em`,
        };
    }
}

export default ExplosionParticle;