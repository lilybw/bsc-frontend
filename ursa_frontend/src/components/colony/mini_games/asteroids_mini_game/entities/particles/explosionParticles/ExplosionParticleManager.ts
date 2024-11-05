import { EntityRef } from '../../../types/gameTypes';
import { getEntityRefKey, getTargetCenterPosition } from '../../../utils/gameUtils';
import { BaseParticleManager } from '../BaseParticleManager';
import ExplosionParticle from './ExplosionParticle';

export interface ExplosionConfig {
    size: number;
    particleCount: number;
    duration: number;
    spread: number;
    entityId: number;  // ID of the entity that exploded
    entityType: 'asteroid' | 'player';  // Type of entity that exploded
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

        if (!centerPos) {
            console.error(`[EXPLOSION] Could not get ${this.entityType} center position for ID:`, this.entityId);
            return -1;
        }

        const {
            size = 1,
            particleCount = Math.floor(20 * size),
            duration = 2000,
            spread = 100 * size
        } = config;

        let createdParticles = 0;

        // Create particles in a circular pattern
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
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
                initialSpeed: spread / 20,
                deceleration: 1.5,
                onComplete: () => {
                    if (!this.isCleaningUp) {
                        this.removeParticle(particle.id);
                    }
                },
            });

            this.addParticle(particle);
            createdParticles++;
        }

        console.log(`[EXPLOSION] Created ${createdParticles} particles for ${this.entityType} ${this.entityId}`);
        return createdParticles;
    }
}

export default ExplosionParticleManager;