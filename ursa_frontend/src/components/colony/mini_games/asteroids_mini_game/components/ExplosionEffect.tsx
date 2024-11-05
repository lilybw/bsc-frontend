// ExplosionEffect.tsx
import { Accessor, Component, createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { ExplosionParticleManager, ExplosionConfig } from "../entities/particles/explosionParticles/ExplosionParticleManager";
import { particleContainerStyle, stunParticleBaseStyle, stunParticleContentStyle } from "../styles/particleStyles";
import { EntityRef } from "../types/entityTypes";
import BaseParticle from "../entities/particles/BaseParticle";

interface ExplosionEffectProps {
    entityId: number;
    entityType: 'asteroid' | 'player';
    config: Omit<ExplosionConfig, 'entityId' | 'entityType'>;
    elementRefs: Map<string, EntityRef>;
}

const ExplosionEffect: Component<ExplosionEffectProps> = (props) => {
    const [particles, setParticles] = createSignal<BaseParticle[]>([]);
    const [hasActiveParticles, setHasActiveParticles] = createSignal(false);

    // Create particle manager
    const particleManager = new ExplosionParticleManager(
        () => {
            const currentParticles = particleManager.getParticles();
            setParticles(currentParticles);
            setHasActiveParticles(currentParticles.length > 0);
        },
        props.entityId,
        props.entityType,
        props.elementRefs
    );

    // Create explosion on mount
    createEffect(() => {
        particleManager.createExplosion({
            ...props.config,
            entityId: props.entityId,
            entityType: props.entityType
        });

        // Regular updates
        const updateInterval = setInterval(() => {
            particleManager.update();
        }, 16); // 60fps update rate

        // Cleanup
        onCleanup(() => {
            clearInterval(updateInterval);
            particleManager.clear();
        });
    });

    return (
        <Show when={hasActiveParticles()}>
            <div class={particleContainerStyle}>
                <For each={particles()}>
                    {(particle) => (
                        <div class={stunParticleBaseStyle} style={particle.getStyle()}>
                            <div class={stunParticleContentStyle} />
                        </div>
                    )}
                </For>
            </div>
        </Show>
    );
};

export default ExplosionEffect;