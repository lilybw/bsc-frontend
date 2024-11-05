import { Accessor, Component, createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { particleContainerStyle, stunParticleBaseStyle, stunParticleContentStyle } from "../styles/particleStyles";
import { EntityRef } from "../types/entityTypes";
import BaseParticle from "../entities/particles/BaseParticle";
import { ExplosionConfig, ExplosionParticleManager } from "../entities/particles/explosionParticles/ExplosionParticleManager";

interface ExplosionEffectProps {
    x: number;
    y: number;
    config: ExplosionConfig;
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
        props.elementRefs
    );

    // Create explosion on mount
    createEffect(() => {
        particleManager.createExplosion(props.x, props.y, props.config);

        // Start regular updates
        const updateInterval = setInterval(() => {
            particleManager.update();
        }, 16); // 60fps update rate

        // Cleanup interval when component unmounts
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