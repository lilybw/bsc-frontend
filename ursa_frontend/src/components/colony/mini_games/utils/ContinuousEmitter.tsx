import { createArrayStore } from "@/ts/arrayStore";
import { Vec2, Vec2_ZERO } from "@/ts/geometry";
import { css } from "@emotion/css";
import { Accessor } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

interface ContinuousEmitterProps {
    /** Where on the screen to place the emitter */
    coords: Vec2;
    /** Whether or not the emitter is on. Reactive. If not provided, the emitter is on. 
     * When turned off, any remaining particles will finish their animation and then be removed.
    */
    active?: Accessor<boolean>;
    /** size of emitter on both axis in vw @default 20 */
    size?: number;
    /** Particles per second 
     * @default 10
    */
    spawnRate?: number;
    /** in percent of emitter size (0-1) on all axis @default .05 */
    particleSize?: number;
    /** Normalized direction @default {x: 0 y: -1} (upwards) */
    direction?: Vec2;
    /** Up to how much to randomly vary the direction vector, in percent (0-1). 
     * Treated as randomly adding some rotation clock-wise or counter-clock-wise @default .2 */
    spread?: number;
    /** How fast should the particle reach the end of its animation, in seconds @default 5 */
    travelTime?: number;
    /** Up to how much to reduce travelTime in percent (0-1) per particle @default .3 */
    travelTimeVariance?: number;
    /** How far should each particle travel as percent of emitter size (0-1) @default 1 */
    travelLength?: number;
    /** Up to how much to randomly reduce travelLength in percent (0-1) per particle @default .3 */
    travelLengthVariance?: number;
    /** In percent of travel time: When to begin fading out the individual particle. @default .3 */
    fadeoutStart?: number;
    /** Up to how much to randomly vary fadeoutStart @default .1 */
    fadeoutStartVariance?: number;
    showEmitterOutline?: boolean;
    /** EXPENSIVE. Additional content to include for each particle */
    additionalParticleContent?: (particle: ParticleData) => JSX.Element;
    /** EXPENSIVE. For each particle, for each unit of time, generate some additional/alternative
     * styling to apply to the particle. */
    particleModulator?: (data: ModulatorData) => string;
    /** 
     * @param computedStyles The computed styles for the particle including animation
     */
    baseParticleGenerator?: (index: number, animation: string, children: JSX.Element) => JSX.Element;
}

/** Data pertaining to some particle to be used for a continuous modulator */
interface ModulatorData {
    /** particle index */
    index: number;
    /** how far the particle is in its lifetime in percent 0-1. */
    completion: number;
}

interface ParticleData {
    element: HTMLElement;
}

export const NULL_JSX: JSX.Element = <></>;
const defaultGenerator: Required<ContinuousEmitterProps>["baseParticleGenerator"] = (i, a, c) => <div class={a}>{c}</div>;
const defaults: Omit<Required<ContinuousEmitterProps>, 'particleModulator'> & Partial<Pick<ContinuousEmitterProps, 'particleModulator'>> = {
    coords: Vec2_ZERO,
    active: () => true,
    size: 20,
    spawnRate: 10,
    particleSize: .05,
    direction: { x: 0, y: -1 },
    spread: .2,
    travelTime: 5,
    travelTimeVariance: .3,
    travelLength: 1,
    travelLengthVariance: .3,
    fadeoutStart: .3,
    fadeoutStartVariance: .1,
    showEmitterOutline: false,
    additionalParticleContent: () => NULL_JSX,
    baseParticleGenerator: defaultGenerator,
}

export default function ContinuousEmitter(rawProps: ContinuousEmitterProps) {
    const props = Object.assign({}, defaults, rawProps);
    const particles = createArrayStore<ParticleData>([]);

    const generateParticle = () => {}

    return (
        <div 
            class={css`${baseContainerStyle}
                width: ${props.size}vw; 
                height: ${props.size}vw; 
                top: ${props.coords.y}px; 
                left: ${props.coords.x}px;
                ${props.showEmitterOutline ? "border: 1px solid red;" : ""}` //Slightly slower than duration
            }>
        </div>
    );
}

const baseContainerStyle = css`
    position: absolute;
    contain: paint;
    background: radial-gradient(circle, rgba(0,0,0,1), transparent 70%);
    will-change: contents;
    transform: translate(-50%, -50%);
`;