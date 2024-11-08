import { EntityRef } from "../../types/gameTypes";
import BaseParticle from "./BaseParticle";


export abstract class BaseParticleManager<T extends BaseParticle = BaseParticle> {
    protected particles: Map<number, T>;
    protected nextId: number;
    protected updateCallback: () => void;
    protected elementRefs: Map<string, EntityRef>;
    protected isCleaningUp: boolean;

    constructor(updateCallback: () => void, elementRefs: Map<string, EntityRef>) {
        this.particles = new Map();
        this.nextId = 0;
        this.updateCallback = updateCallback;
        this.elementRefs = elementRefs;
        this.isCleaningUp = false;
    }

    public getParticles(): T[] {
        return Array.from(this.particles.values());
    }

    public getNextId(): number {
        return this.nextId++;
    }

    protected addParticle(particle: T): void {
        if (!this.isCleaningUp) {
            this.particles.set(particle.id, particle);
            this.notifyUpdate();
        }
    }

    protected removeParticle(id: number): void {
        if (this.particles.has(id) && !this.isCleaningUp) {
            this.particles.delete(id);
            this.notifyUpdate();
        }
    }

    public update(): void {
        if (this.isCleaningUp) return;

        // Update all particles (if they have an update method)
        this.particles.forEach(particle => {
            if ('update' in particle && typeof particle.update === 'function') {
                particle.update();
            }
        });

        // Remove expired particles
        const expiredParticles = Array.from(this.particles.values()).filter(particle => particle.isExpired());
        expiredParticles.forEach(particle => {
            this.removeParticle(particle.id);
        });

        this.notifyUpdate();
    }

    public clear(): void {
        this.isCleaningUp = true;

        // Allow current particles to finish their animations
        setTimeout(() => {
            this.particles.clear();
            this.notifyUpdate();
            this.isCleaningUp = false;
        }, 50);
    }

    protected notifyUpdate(): void {
        if (this.updateCallback && !this.isCleaningUp) {
            this.updateCallback();
        }
    }
}