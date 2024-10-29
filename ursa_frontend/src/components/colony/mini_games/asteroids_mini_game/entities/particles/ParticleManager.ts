import BaseParticle from './BaseParticle';
import StunParticle from './StunParticle';

/**
 * Manages the lifecycle and state of all particles in the game
 */
export class ParticleManager {
    private particles: Map<number, BaseParticle>;
    private nextId: number;
    private updateCallback: () => void;

    /**
     * Creates a new ParticleManager instance
     * @param updateCallback Function to call when particle state changes
     */
    constructor(updateCallback: () => void) {
        this.particles = new Map();
        this.nextId = 0;
        this.updateCallback = updateCallback;
    }

    /**
     * Creates and starts tracking a new stun particle
     * @returns The ID of the created particle
     */
    public createStunParticle(): number {
        const id = this.nextId++;
        const particle = new StunParticle({
            id,
            x: 0,
            y: 0,
            duration: 6000,  // 6 seconds
            onComplete: () => {
                console.log(`Particle ${id} completed`);
                this.removeParticle(id);
            }
        });

        this.addParticle(particle);
        console.log(`Created particle ${id}, total particles:`, this.particles.size);
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

export default ParticleManager;