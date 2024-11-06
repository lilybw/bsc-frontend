import { Component, createSignal, createEffect, onCleanup, Show, For, Accessor } from "solid-js";
import { particleContainerStyle, stunParticleBaseStyle, stunParticleVerticalStyle, stunParticleHorizontalStyle, stunParticleContentStyle } from "../styles/fireParticleStyles";
import { EntityRef } from "../types/entityTypes";
import BaseParticle from "../entities/particles/BaseParticle";
import { StunParticleManager } from "../entities/particles/stunparticles/StunParticleManager";
import { Portal } from "solid-js/web";

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

    const particleManager = new StunParticleManager(
        () => {
            const currentParticles = particleManager.getParticles();
            setParticles(currentParticles);
            setHasActiveParticles(currentParticles.length > 0);
            setHasStunEffect(currentParticles.length > 0);
        },
        props.playerId,
        props.elementRefs,
    );

    createEffect(() => {
        const state = props.playerState();
        if (state?.isStunned) {
            console.log(`[STUNPARTICLE] Player ${props.playerId} stunned - starting effect`);
            setHasStunEffect(true);
            let particleCount = 0;

            const spawnInterval = setInterval(() => {
                particleCount++;
                particleManager.createStunParticle();
            }, 50);

            const updateInterval = setInterval(() => {
                particleManager.update();
            }, 50);

            setTimeout(() => {
                clearInterval(spawnInterval);
            }, props.stunDuration * 1000);

            onCleanup(() => {
                clearInterval(spawnInterval);
                clearInterval(updateInterval);
            });
        }
    });

    onCleanup(() => {
        console.log(`[STUNPARTICLE] Final cleanup for player ${props.playerId}`);
        particleManager.clear();
    });

    return (
        <Show when={props.playerState()?.isStunned || hasStunEffect()}>
            {/* Move this container to the root level by creating a portal */}
            <Portal>
                <Show when={hasActiveParticles()}>
                    <div class={particleContainerStyle}>
                        <For each={particles()}>
                            {(particle) => (
                                <div class={stunParticleBaseStyle} style={particle.getStyle()}>
                                    <div class={stunParticleVerticalStyle}>
                                        <div class={stunParticleHorizontalStyle}>
                                            <div class={stunParticleContentStyle} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </Portal>
        </Show>
    );
};

export default PlayerStunEffect;