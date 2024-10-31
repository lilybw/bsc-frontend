import BaseParticle, { ParticleProps } from '../BaseParticle';

export interface StunParticleProps extends ParticleProps {
    size?: number;
    spread?: number;
}

export class StunParticle extends BaseParticle {
    private static readonly defaultSpread = StunParticle.computeDefaultSpread();

    // Compute the spread only once for the class
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

        return {
            '--spread-x': `${spreadX}%`,
            '--particle-size': `${this.size * sizeVariation}em`,
            '--glow-color': `rgba(255, ${200 + Math.random() * 55}, 0)`,
            '--mid-color': `rgba(255, ${100 + Math.random() * 55}, 0)`,
            '--outer-color': `rgba(255, ${50 + Math.random() * 30}, 0)`,
            '--blur-amount': `${0.15 * sizeVariation}em`,
        };
    }
}

export default StunParticle;
