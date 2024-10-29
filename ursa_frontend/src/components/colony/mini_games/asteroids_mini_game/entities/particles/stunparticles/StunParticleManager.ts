import BaseParticle from '../BaseParticle';
import StunParticle from './StunParticle';
import { EntityRef } from '../../../types/EntityTypes';
import { getEntityRefKey, getTargetCenterPosition } from '../../../utils/GameUtils';

/**
 * Manages the lifecycle and state of stun effect particles
 */
export class StunParticleManager {
    private particles: Map<number, BaseParticle>;
    private nextId: number;
    private updateCallback: () => void;
    private playerId: number;
    private elementRefs: Map<string, EntityRef>;

    /**
     * Creates a new StunParticleManager instance
     */
    constructor(
        updateCallback: () => void,
        playerId: number,
        elementRefs: Map<string, EntityRef>
    ) {
        this.particles = new Map();
        this.nextId = 0;
        this.updateCallback = updateCallback;
        this.playerId = playerId;
        this.elementRefs = elementRefs;
    }

    /**
     * Creates and starts tracking a new stun particle
     */
    public createStunParticle(): number {
        const id = this.nextId++;

        const playerKey = getEntityRefKey.player(this.playerId);
        const centerPos = getTargetCenterPosition(playerKey, this.elementRefs);

        console.log('[STUNPARTICLE] Creating particle:', {
            id,
            playerKey,
            centerPos,
            elementRef: this.elementRefs.get(playerKey)
        });

        if (!centerPos) {
            console.error('[STUNPARTICLE] Could not get player center position');
            return id;
        }

        const particle = new StunParticle({
            id,
            x: centerPos.x,
            y: centerPos.y,
            duration: 4000,
            onComplete: () => {
                console.log(`[STUNPARTICLE] Particle ${id} completed`);
                this.removeParticle(id);
            }
        });

        this.addParticle(particle);
        return id;
    }

    /**
     * Adds a particle to the manager
     * @param particle The particle to add
     */
    public addParticle(particle: BaseParticle): void {
        this.particles.set(particle.id, particle);
        this.notifyUpdate();
    }

    /**
     * Removes a particle by ID
     * @param id The ID of the particle to remove
     */
    public removeParticle(id: number): void {
        if (this.particles.has(id)) {
            this.particles.delete(id);
            this.notifyUpdate();
        }
    }

    /**
     * Gets all active particles
     */
    public getParticles(): BaseParticle[] {
        return Array.from(this.particles.values());
    }

    /**
     * Gets the count of active particles
     */
    public getParticleCount(): number {
        return this.particles.size;
    }

    /**
     * Updates all particles and removes expired ones
     * Should be called regularly
     */
    public update(): void {
        const expiredParticles = Array.from(this.particles.values())
            .filter(particle => particle.isExpired());

        if (expiredParticles.length > 0) {
            expiredParticles.forEach(particle => {
                console.log(`Removing expired particle ${particle.id}`);
                this.removeParticle(particle.id);
            });
        }
    }

    /**
     * Clears all particles
     */
    public clear(): void {
        console.log('Clearing all particles');
        this.particles.forEach(particle => particle.destroy());
        this.particles.clear();
        this.notifyUpdate();
    }

    /**
     * Notifies that particles have been updated
     * @private
     */
    private notifyUpdate(): void {
        if (this.updateCallback) {
            this.updateCallback();
        }
    }
}

export default StunParticleManager;