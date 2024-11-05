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
    private velocity: { x: number; y: number };
    private initialSpeed: number;
    private deceleration: number;
    private currentPosition: { x: number; y: number };
    private startPosition: { x: number; y: number };

    constructor(props: ExplosionParticleProps) {
        super(props);
        this.size = props.size || 2.5;
        this.velocity = props.velocity;
        this.initialSpeed = props.initialSpeed;
        this.deceleration = props.deceleration;
        this.startPosition = { x: props.x, y: props.y };
        this.currentPosition = { x: props.x, y: props.y };
    }

    public update(): void {
        const elapsed = this.getElapsedTime();
        const speedFactor = Math.max(0, 1 - (elapsed / this.duration) * this.deceleration);

        // Update position based on velocity and time
        this.currentPosition.x += this.velocity.x * this.initialSpeed * speedFactor;
        this.currentPosition.y += this.velocity.y * this.initialSpeed * speedFactor;
    }

    public getStyle(): Record<string, string> {
        const progress = this.getElapsedTime() / this.duration;
        const sizeVariation = 0.8 + Math.random() * 0.4;
        const fadeOut = Math.max(0, 1 - progress * 1.5);

        // Calculate position relative to start position
        const translateX = this.currentPosition.x - this.startPosition.x;
        const translateY = this.currentPosition.y - this.startPosition.y;

        return {
            '--particle-size': `${this.size * sizeVariation}em`,
            '--glow-color': `rgba(255, ${200 + Math.random() * 55}, 0, ${fadeOut})`,
            '--mid-color': `rgba(255, ${100 + Math.random() * 55}, 0, ${fadeOut})`,
            '--outer-color': `rgba(255, ${50 + Math.random() * 30}, 0, ${fadeOut})`,
            '--blur-amount': `${0.15 * sizeVariation}em`,
            'transform': `translate(${translateX}px, ${translateY}px)`,
            'transition': 'none',
        };
    }
}

export default ExplosionParticle;