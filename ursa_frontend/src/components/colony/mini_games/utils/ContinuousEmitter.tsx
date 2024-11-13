import { createArrayStore } from "@/ts/arrayStore";
import { Vec2 } from "@/ts/geometry";
import { Accessor } from "solid-js";
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
    /** in view width (vw) on all axis @default 5 */
    particleSize?: number;
    /** in milliseconds @default 1000 */
    particleLifetime?: number;
    /** in percent - deducted from total lifetime @default 100 */
    lifetimeVariance?: number;
    /** Normalized direction @default {x: 0 y: -1} */
    direction?: Vec2;
    /** How much to randomly vary the direction vector, in percent. Treated as randomly adding some rotation @default .2 */
    spread?: number;
    /** Particle travel speed in amounts of vw @default 10 */
    velocity?: number;
    /** As 0-1, 0-100%, random reduction of velocity @default .3 */
    velocityVariance?: number;
    activate?: Accessor<boolean>;
}

interface Particle {
    element: HTMLElement;
}

export default function ContinuousEmitter({ 
    baseParticleGenerator = s => <div class={s}></div>, 
    spawnRate = 10,
    particleSize = 5,
    particleLifetime = 1000,
    lifetimeVariance = 100,
    direction = { x: 0, y: -1 },
    spread = .2,
    velocity = .3,
    velocityVariance = .3
}: ContinuousEmitterProps) {
    const particles = createArrayStore<{}>([]);
    return (
        <div>
        </div>
    );
}