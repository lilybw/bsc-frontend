import BaseParticle from '../BaseParticle';
import StunParticle from './StunParticle';
import { EntityRef } from '../../../types/EntityTypes';
import { getEntityRefKey, getTargetCenterPosition } from '../../../utils/GameUtils';

export class StunParticleManager {
    private particles: Map<number, BaseParticle>;
    private nextId: number;
    private updateCallback: () => void;
    private playerId: number;
    private elementRefs: Map<string, EntityRef>;
    private isCleaningUp: boolean = false;

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

    public createStunParticle(): number {
        if (this.isCleaningUp) return -1;

        const id = this.nextId++;
        const playerKey = getEntityRefKey.player(this.playerId);
        const centerPos = getTargetCenterPosition(playerKey, this.elementRefs);

        if (!centerPos) {
            console.error('[STUNPARTICLE] Could not get player center position');
            return id;
        }

        const particle = new StunParticle({
            id,
            x: centerPos.x,
            y: centerPos.y,
            duration: 4000, // Increased duration
            onComplete: () => {
                if (!this.isCleaningUp) {
                    this.removeParticle(id);
                }
            }
        });

        this.addParticle(particle);
        return id;
    }

    public getParticles(): BaseParticle[] {
        return Array.from(this.particles.values());
    }

    public addParticle(particle: BaseParticle): void {
        if (!this.isCleaningUp) {
            this.particles.set(particle.id, particle);
            this.notifyUpdate();
        }
    }

    public removeParticle(id: number): void {
        if (this.particles.has(id) && !this.isCleaningUp) {
            this.particles.delete(id);
            this.notifyUpdate();
        }
    }

    public update(): void {
        if (this.isCleaningUp) return;

        const expiredParticles = Array.from(this.particles.values())
            .filter(particle => particle.isExpired());

        if (expiredParticles.length > 0) {
            expiredParticles.forEach(particle => {
                this.removeParticle(particle.id);
            });
        }
    }

    public clear(): void {
        this.isCleaningUp = true;
        console.log('[STUNPARTICLE] Starting cleanup');

        // Allow current particles to finish their animations
        setTimeout(() => {
            this.particles.clear();
            this.notifyUpdate();
            this.isCleaningUp = false;
            console.log('[STUNPARTICLE] Cleanup complete');
        }, 50);
    }

    private notifyUpdate(): void {
        if (this.updateCallback && !this.isCleaningUp) {
            this.updateCallback();
        }
    }
}

export default StunParticleManager;