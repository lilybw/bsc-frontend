import { createArrayStore } from "@/ts/arrayStore";
import { JSX } from "solid-js/jsx-runtime";

interface ContinuousEmitterProps {
    /** 
     * @param computedStyles The computed styles for the particle including animation
     */
    baseParticleGenerator?: (computedStyles: string) => JSX.Element;
    /** Particles per second 
     * @default 10
    */
    spawnRate?: number;
    /** in view width (vw) on all axis @default 500 */
    particleSize?: number;
    /** in milliseconds @default 1000 */
    particleLifetime?: number;
    /** in percent - deducted from total lifetime @default 100 */
    lifetimeVariance?: number;
}

export default function ContinuousEmitter({ 
    baseParticleGenerator = s => <div class={s}></div>, 
}: ContinuousEmitterProps) {
    const particles = createArrayStore<{}>([]);
    return (
        <div>
        </div>
    );
}