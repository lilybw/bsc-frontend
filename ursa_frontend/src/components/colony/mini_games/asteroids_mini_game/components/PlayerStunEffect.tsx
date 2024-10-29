import { Component, createSignal, createEffect, onCleanup, For } from 'solid-js';
import { ParticleManager, BaseParticle } from '../entities/particles';
import { particleContainerStyle, stunParticleStyle } from '../styles/ParticleStyles';

interface PlayerStunEffectProps {
    playerId: number;
    isStunned: boolean;
    stunDuration: number;
}

/**
 * Component that handles the stun particle effect for a player
 */
const PlayerStunEffect: Component<PlayerStunEffectProps> = (props) => {
    const [particles, setParticles] = createSignal<BaseParticle[]>([]);

    // Create particle manager for this player
    const particleManager = new ParticleManager(() => {
        console.log(`Updating particles for player ${props.playerId}, count:`, particleManager.getParticleCount());
        setParticles(particleManager.getParticles());
    });

    // Effect for particle creation and lifecycle
    createEffect(() => {
        if (props.isStunned) {
            console.log(`Player ${props.playerId} stunned - starting particle effect`);
            let particleCount = 0;

            // Only spawn particles during stun duration
            const spawnInterval = setInterval(() => {
                particleCount++;
                console.log(`Creating particle ${particleCount} for player ${props.playerId}`);
                particleManager.createStunParticle();
            }, 100);

            // Stop spawning after stun duration
            setTimeout(() => {
                console.log(`Stopping particle spawning for player ${props.playerId}`);
                clearInterval(spawnInterval);
            }, props.stunDuration * 1000);

            // Keep updating particles until they're all gone
            const updateInterval = setInterval(() => {
                particleManager.update();
                if (particleManager.getParticleCount() === 0) {
                    console.log('All particles completed, stopping updates');
                    clearInterval(updateInterval);
                }
            }, 100);

            // Cleanup only when component unmounts
            onCleanup(() => {
                console.log(`Cleaning up particle system for player ${props.playerId}`);
                clearInterval(spawnInterval);
                clearInterval(updateInterval);
                particleManager.clear();
            });
        }
    });

    return (
        <div
            class={particleContainerStyle}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                'z-index': 100,
                'pointer-events': 'none'
            }}
        >
            <For each={particles()}>
                {(particle) => (
                    <div
                        class={stunParticleStyle}
                        style={particle.getStyle()}
                    />
                )}
            </For>
        </div>
    );
};

export default PlayerStunEffect;