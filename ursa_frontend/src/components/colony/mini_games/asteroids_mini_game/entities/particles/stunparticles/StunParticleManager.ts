import { EntityRef } from '../../../types/gameTypes';
import { getEntityRefKey, getTargetCenterPosition } from '../../../utils/gameUtils';
import { BaseParticleManager } from '../BaseParticleManager';
import StunParticle from './StunParticle';

export class StunParticleManager extends BaseParticleManager<StunParticle> {
    private playerId: number;

    constructor(updateCallback: () => void, playerId: number, elementRefs: Map<string, EntityRef>) {
        super(updateCallback, elementRefs);
        this.playerId = playerId;
    }

    public createStunParticle(): number {
        if (this.isCleaningUp) return -1;

        const id = this.getNextId();
        const playerKey = getEntityRefKey.player(this.playerId);
        console.log('[STUNPARTICLE] Creating particle - player key:', playerKey);

        const centerPos = getTargetCenterPosition(playerKey, this.elementRefs);
        console.log('[STUNPARTICLE] Initial center pos:', centerPos);

        if (!centerPos) {
            console.error('[STUNPARTICLE] Could not get player center position');
            return id;
        }

        const particle = new StunParticle({
            id,
            size: 3,
            x: centerPos.x,
            y: centerPos.y,
            duration: 4000,
            onComplete: () => {
                if (!this.isCleaningUp) {
                    this.removeParticle(id);
                }
            },
        });

        console.log('[STUNPARTICLE] Created particle with position:', {
            id,
            x: particle.x,
            y: particle.y
        });

        this.addParticle(particle);
        return id;
    }
}

export default StunParticleManager;