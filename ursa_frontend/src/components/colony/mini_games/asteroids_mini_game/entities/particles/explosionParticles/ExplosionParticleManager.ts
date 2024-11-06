import { EntityRef } from '../../../types/gameTypes';
import { getEntityRefKey, getTargetCenterPosition } from '../../../utils/gameUtils';
import { BaseParticleManager } from '../BaseParticleManager';
import ExplosionParticle from './ExplosionParticle';

// Constants for default values
const DEFAULT_BASE_PARTICLE_COUNT = 25;
const DEFAULT_DURATION_MS = 1000;
const DEFAULT_SIZE = 1;

export interface ExplosionConfig {
    // Required properties
    entityId: number;
    entityType: 'asteroid' | 'player';

    // Optional properties with defaults
    size?: number;           // Default: 1
    particleCount?: number;  // Default: 1 (multiplier for BASE_PARTICLE_COUNT)
    duration?: number;       // Default: 1 (seconds)
    spread?: number;         // Default: size * 100
}

export interface ExplosionData {
    id: number;
    entityId: number;
    entityType: 'asteroid' | 'player';
    config?: {
        size?: number;
        particleCount?: number;
        duration?: number;
    };
}

export class ExplosionParticleManager extends BaseParticleManager<ExplosionParticle> {
    constructor(
        updateCallback: () => void,
        elementRefs: Map<string, EntityRef>
    ) {
        super(updateCallback, elementRefs);
    }

    public createExplosion(config: ExplosionConfig): number {
        const entityKey = config.entityType === 'asteroid'
            ? getEntityRefKey.asteroid(config.entityId)
            : getEntityRefKey.player(config.entityId);

        // Use the same position calculation as LazerBeam
        const centerPos = getTargetCenterPosition(entityKey, this.elementRefs);
        if (!centerPos) return -1;

        const actualParticleCount = Math.floor(DEFAULT_BASE_PARTICLE_COUNT * (config.particleCount ?? DEFAULT_SIZE));
        let createdParticles = 0;

        for (let i = 0; i < actualParticleCount; i++) {
            const angle = (i / actualParticleCount) * Math.PI * 2 + Math.random() * 0.5;
            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            const particle = new ExplosionParticle({
                id: this.getNextId(),
                // Use the exact same position as LazerBeam's impact
                x: centerPos.x,
                y: centerPos.y,
                duration: config.duration ?? DEFAULT_DURATION_MS,
                size: 2.5 * Math.sqrt(config.size ?? DEFAULT_SIZE),
                velocity,
                initialSpeed: (config.spread ?? (config.size ?? DEFAULT_SIZE) * 100),
                onComplete: () => {
                    if (!this.isCleaningUp) {
                        this.removeParticle(particle.id);
                    }
                },
            });

            this.addParticle(particle);
            createdParticles++;
        }

        return createdParticles;
    }
}

export default ExplosionParticleManager;