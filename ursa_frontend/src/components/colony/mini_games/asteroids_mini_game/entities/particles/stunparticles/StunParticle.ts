import BaseParticle, { ParticleProps } from '../BaseParticle';

export interface StunParticleProps extends ParticleProps {
    size?: number;
    spread?: number;
}

export class StunParticle extends BaseParticle {
    private static readonly defaultSpread = StunParticle.computeDefaultSpread();

    private static computeDefaultSpread(): number {
        return window.innerWidth / 20;
    }

    private size: number;
    private spread: number;

    constructor(props: StunParticleProps) {
        super(props);
        this.size = props.size || 2.5;
        this.spread = props.spread || StunParticle.defaultSpread;
    }

    public getStyle(): Record<string, string> {
        const sizeVariation = 0.8 + Math.random() * 0.4;
        const spreadRange = this.spread;
        const minSpread = 0;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const spreadX = direction * (minSpread + Math.random() * (spreadRange - minSpread));

        // Convert normalized coordinates to pixels
        const pixelX = this.x * window.innerWidth;
        const pixelY = this.y * window.innerHeight;

        return {
            'position': 'absolute',
            'top': `${pixelY}px`,
            'left': `${pixelX}px`,
            'transform': 'translate(-50%, -50%)',
            '--spread-x': `${spreadX}%`,
            '--particle-size': `${this.size * sizeVariation}em`,
            '--glow-color': `rgba(0, ${200 + Math.random() * 55}, 255)`,
            '--mid-color': `rgba(30, ${100 + Math.random() * 55}, 255)`,
            '--outer-color': `rgba(50, ${50 + Math.random() * 30}, 255)`,
            '--blur-amount': `${0.15 * sizeVariation}em`,
        };
    }
}

export default StunParticle;