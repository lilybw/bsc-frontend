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
        return {
            'position': 'absolute',
            'left': `${this.x * window.innerWidth}px`,
            'top': `${this.y * window.innerHeight}px`,
            'transform': 'translate(-50%, -50%)', // Center like the impact circle
            '--particle-size': `${this.size * (1 + Math.random() * 0.5)}em`,
            '--glow-color': `rgba(255, ${200 + Math.random() * 55}, 0)`,
            '--mid-color': `rgba(255, ${100 + Math.random() * 55}, 0)`,
            '--outer-color': `rgba(255, ${50 + Math.random() * 30}, 0)`,
            '--blur-amount': '0.15em',

            '--spread-x': `${this.velocity.x * this.initialSpeed * (1 + Math.random() * 0.5)}px`,
            '--spread-y': `${this.velocity.y * this.initialSpeed * (1 + Math.random() * 0.5)}px`,
        };
    }
}

export default ExplosionParticle;