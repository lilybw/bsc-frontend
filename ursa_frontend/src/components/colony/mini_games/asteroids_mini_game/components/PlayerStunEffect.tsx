import { Accessor, Component, createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { particleContainerStyle, stunParticleBaseStyle, stunParticleVerticalStyle, stunParticleHorizontalStyle, stunParticleContentStyle } from "../styles/fireParticleStyles";
import { EntityRef } from "../types/entityTypes";
import BaseParticle from "../entities/particles/BaseParticle";
import { StunParticleManager } from "../entities/particles/stunparticles/StunParticleManager";

interface PlayerStunEffectProps {
    playerId: number;
    playerState: Accessor<{ isStunned: boolean; isDisabled: boolean } | undefined>;
    stunDuration: number;
    elementRefs: Map<string, EntityRef>;
}

const PlayerStunEffect: Component<PlayerStunEffectProps> = (props) => {
    const [particles, setParticles] = createSignal<BaseParticle[]>([]);
    const [hasActiveParticles, setHasActiveParticles] = createSignal(false);
    const [hasStunEffect, setHasStunEffect] = createSignal(false);

    // Create particle manager
    const particleManager = new StunParticleManager(
        () => {
            const currentParticles = particleManager.getParticles();
            setParticles(currentParticles);
            setHasActiveParticles(currentParticles.length > 0);
            setHasStunEffect(currentParticles.length > 0); // Update stun effect state
        },
        props.playerId,
        props.elementRefs,
    );

    // Track stun state and manage particles
    createEffect(() => {
        const state = props.playerState();
        if (state?.isStunned) {
            console.log(`[STUNPARTICLE] Player ${props.playerId} stunned - starting effect`);
            setHasStunEffect(true);
            let particleCount = 0;

            const spawnInterval = setInterval(() => {
                particleCount++;
                console.log(`[STUNPARTICLE] Creating particle ${particleCount} for player ${props.playerId}`);
                particleManager.createStunParticle();
            }, 50);

            // Start regular updates
            const updateInterval = setInterval(() => {
                particleManager.update();
            }, 50);

            // Stop spawning after stun duration
            setTimeout(() => {
                console.log(`Stopping spawn phase for player ${props.playerId}`);
                clearInterval(spawnInterval);
            }, props.stunDuration * 1000);

            // Cleanup both intervals when effect is re-run or component unmounts
            onCleanup(() => {
                console.log(`[STUNPARTICLE] Cleaning up effects for player ${props.playerId}`);
                clearInterval(spawnInterval);
                clearInterval(updateInterval);
            });
        }
    });

    // Main cleanup when component unmounts
    onCleanup(() => {
        console.log(`[STUNPARTICLE] Final cleanup for player ${props.playerId}`);
        particleManager.clear();
    });

    return (
        <Show when={props.playerState()?.isStunned || hasStunEffect()}>
            <Show when={hasActiveParticles()}>
                <div class={particleContainerStyle}>
                    <For each={particles()}>
                        {(particle) => (
                            // Base container
                            <div class={stunParticleBaseStyle} style={particle.getStyle()}>
                                {/* Vertical rise container */}
                                <div class={stunParticleVerticalStyle}>
                                    {/* Horizontal spread container */}
                                    <div class={stunParticleHorizontalStyle}>
                                        {/* Particle content */}
                                        <div class={stunParticleContentStyle} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </Show>
    );
};

export default PlayerStunEffect;
