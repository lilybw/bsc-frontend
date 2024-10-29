import { Component, createSignal, createEffect, onCleanup, For, Show, Accessor } from 'solid-js';
import { ParticleManager, BaseParticle } from '../entities/particles';
import { particleContainerStyle, stunParticleStyle } from '../styles/ParticleStyles';

interface PlayerStunEffectProps {
    playerId: number;
    playerState: Accessor<{ isStunned: boolean; isDisabled: boolean; } | undefined>;
    stunDuration: number;
}

const PlayerStunEffect: Component<PlayerStunEffectProps> = (props) => {
    const [particles, setParticles] = createSignal<BaseParticle[]>([]);
    const [hasActiveParticles, setHasActiveParticles] = createSignal(false);
    const [hasStunEffect, setHasStunEffect] = createSignal(false);

    const particleManager = new ParticleManager(() => {
        const currentParticles = particleManager.getParticles();
        setParticles(currentParticles);
        setHasActiveParticles(currentParticles.length > 0);
    });

    // Track stun state and manage particles
    createEffect(() => {
        const state = props.playerState();
        if (state?.isStunned) {
            setHasStunEffect(true);
            console.log(`Player ${props.playerId} stunned - starting spawn phase`);
            setHasActiveParticles(true);

            // Spawn frequency
            const spawnInterval = setInterval(() => {
                const particleCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < particleCount; i++) {
                    particleManager.createStunParticle();
                }
            }, 75);  // Interval for particles

            setTimeout(() => {
                console.log(`Stopping spawn phase for player ${props.playerId}`);
                clearInterval(spawnInterval);
            }, props.stunDuration * 1000);
        }
    });

    // Particle update logic
    createEffect(() => {
        if (hasActiveParticles()) {
            console.log(`Running particle updates for player ${props.playerId}`);
            const updateInterval = setInterval(() => {
                particleManager.update();
            }, 100);

            onCleanup(() => {
                clearInterval(updateInterval);
            });
        }
    });

    // Only cleanup when truly done
    onCleanup(() => {
        if (!hasActiveParticles()) {
            console.log(`Final cleanup for player ${props.playerId}`);
            particleManager.clear();
        }
    });

    // Only render if we have player state OR active effects
    return (
        <Show when={props.playerState() || hasStunEffect()}>
            <>
                <Show when={hasActiveParticles()}>
                    <div class={particleContainerStyle}>
                        <For each={particles()}>
                            {(particle) => (
                                <div
                                    class={stunParticleStyle}
                                    style={particle.getStyle()}
                                />
                            )}
                        </For>
                    </div>
                </Show>

                {/* Disable Effect */}
                <Show when={props.playerState()?.isDisabled}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        'background-color': 'rgba(255, 0, 0, 0.5)',
                        'z-index': 1000,
                        opacity: 0.8,
                        border: '3px solid white'
                    }} />
                </Show>
            </>
        </Show>
    );
};

export default PlayerStunEffect;