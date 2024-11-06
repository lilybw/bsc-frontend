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
    private entityId: number;
    private entityType: 'asteroid' | 'player';

    constructor(
        updateCallback: () => void,
        entityId: number,
        entityType: 'asteroid' | 'player',
        elementRefs: Map<string, EntityRef>
    ) {
        super(updateCallback, elementRefs);
        this.entityId = entityId;
        this.entityType = entityType;
    }

    public createExplosion(config: ExplosionConfig): number {
        if (this.isCleaningUp) return -1;

        const entityKey = this.entityType === 'asteroid'
            ? getEntityRefKey.asteroid(this.entityId)
            : getEntityRefKey.player(this.entityId);

        const centerPos = getTargetCenterPosition(entityKey, this.elementRefs);
        console.log(`[EXPLOSION] Creating explosion at position:`, centerPos);

        if (!centerPos) {
            console.error(`[EXPLOSION] Could not get ${this.entityType} center position for ID:`, this.entityId);
            return -1;
        }

        // Apply defaults
        const size = config.size ?? DEFAULT_SIZE;
        const {
            particleCount = DEFAULT_SIZE,
            duration = DEFAULT_DURATION_MS,
            spread = size * 100  // Default spread is proportional to size
        } = config;

        // Calculate actual particle count using base count and multiplier
        const actualParticleCount = Math.floor(DEFAULT_BASE_PARTICLE_COUNT * particleCount);

        let createdParticles = 0;

        console.log('[EXPLOSION] Center position:', centerPos);
        console.log('[EXPLOSION] Particle count:', actualParticleCount);

        // Create particles in a circular pattern
        for (let i = 0; i < actualParticleCount; i++) {
            const angle = (i / actualParticleCount) * Math.PI * 2 + Math.random() * 0.5;
            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            const particle = new ExplosionParticle({
                id: this.getNextId(),
                x: centerPos.x,
                y: centerPos.y,
                duration,
                size: 2.5 * Math.sqrt(size),
                velocity,
                initialSpeed: spread,
                onComplete: () => {
                    if (!this.isCleaningUp) {
                        this.removeParticle(particle.id);
                    }
                },
            });

            this.addParticle(particle);
            createdParticles++;
        }

        console.log(`[EXPLOSION] Created ${createdParticles} particles for ${this.entityType} ${this.entityId} (size: ${size}, spread: ${spread})`);
        return createdParticles;
    }
}

export default ExplosionParticleManager;