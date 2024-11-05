import { BaseParticleManager } from '../BaseParticleManager';
import ExplosionParticle from './ExplosionParticle';

export interface ExplosionConfig {
    size: number;
    particleCount: number;
    duration: number;
    spread: number;
}

export class ExplosionParticleManager extends BaseParticleManager<ExplosionParticle> {
    public createExplosion(x: number, y: number, config: ExplosionConfig): void {
        if (this.isCleaningUp) return;

        const {
            size = 1,
            particleCount = Math.floor(20 * size),
            duration = 2000,
            spread = 100 * size
        } = config;

        // Create particles in a circular pattern
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            const particle = new ExplosionParticle({
                id: this.getNextId(),
                x,
                y,
                duration,
                size: 2.5 * Math.sqrt(size),
                velocity,
                initialSpeed: spread / 20,
                deceleration: 1.5,
                onComplete: () => {
                    if (!this.isCleaningUp) {
                        this.removeParticle(particle.id);
                    }
                },
            });

            this.addParticle(particle);
        }
    }
}