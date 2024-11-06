import BaseParticle, { ParticleProps } from '../BaseParticle';

interface ExplosionParticleProps extends ParticleProps {
    size?: number;
    velocity: {
        x: number;
        y: number;
    };
    initialSpeed: number;
}

export class ExplosionParticle extends BaseParticle {
    private static computeDefaultSpread(): number {
        return window.innerWidth / 5;
    }
    private static readonly defaultSpread = ExplosionParticle.computeDefaultSpread();


    private readonly size: number;
    private readonly velocity: { x: number; y: number };
    private readonly initialSpeed: number;

    constructor(props: ExplosionParticleProps) {
        super(props);
        this.size = props.size || 2.5;
        this.velocity = props.velocity;
        this.initialSpeed = props.initialSpeed || ExplosionParticle.defaultSpread;
    }

    public getStyle(): Record<string, string> {
        const sizeVariation = 0.8 + Math.random() * 0.4;

        return {
            'position': 'absolute',
            'left': `${this.x * 100}%`,
            'top': `${this.y * 100}%`,
            '--particle-size': `${this.size * sizeVariation}em`,
            '--glow-color': `rgba(255, ${200 + Math.random() * 55}, 0)`,
            '--mid-color': `rgba(255, ${100 + Math.random() * 55}, 0)`,
            '--outer-color': `rgba(255, ${50 + Math.random() * 30}, 0)`,
            '--blur-amount': `${0.15 * sizeVariation}em`,
            '--spread-x': `${this.velocity.x * this.initialSpeed * 2}%`,
            '--spread-y': `${this.velocity.y * this.initialSpeed * 2}%`,
        };
    }
}

export default ExplosionParticle;