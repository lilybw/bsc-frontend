import { Component, createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { particleContainerStyle, stunParticleBaseStyle, stunParticleContentStyle } from "../styles/fireParticleStyles";
import { explosionParticleMovementStyle, explosionParticleContentStyle } from "../styles/explosionParticleStyles";
import { EntityRef } from "../types/entityTypes";
import BaseParticle from "../entities/particles/BaseParticle";
import { ExplosionParticleManager } from "../entities/particles/explosionParticles/ExplosionParticleManager";

interface ExplosionEffectProps {
    entityId: number;
    entityType: 'asteroid' | 'player';
    elementRefs: Map<string, EntityRef>;
    config?: {
        size?: number;         // Default: 1
        particleCount?: number; // Default: 1
        duration?: number;      // Default: 1000
    };
}

const ExplosionEffect: Component<ExplosionEffectProps> = (props) => {
    const [particles, setParticles] = createSignal<BaseParticle[]>([]);
    const [hasActiveParticles, setHasActiveParticles] = createSignal(false);

    const particleManager = new ExplosionParticleManager(
        () => {
            const currentParticles = particleManager.getParticles();
            setParticles(currentParticles);
            setHasActiveParticles(currentParticles.length > 0);
        },
        props.elementRefs
    );

    createEffect(() => {
        console.log(`[EXPLOSION] Creating explosion for ${props.entityType} ${props.entityId}`);

        // Create explosion immediately
        particleManager.createExplosion({
            entityId: props.entityId,
            entityType: props.entityType,
            ...props.config
        });

        const updateInterval = setInterval(() => {
            particleManager.update();
        }, 16);

        onCleanup(() => {
            console.log(`[EXPLOSION] Cleaning up explosion for ${props.entityType} ${props.entityId}`);
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
                            <div class={explosionParticleMovementStyle}>
                                <div class={explosionParticleContentStyle} />
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </Show>
    );
};

export default ExplosionEffect;