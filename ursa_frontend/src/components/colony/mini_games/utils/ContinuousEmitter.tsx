import { Styles } from "@/styles/sharedCSS";
import { createArrayStore } from "@/ts/arrayStore";
import { normalizeVec2, Vec2, Vec2_TWENTY, Vec2_ZERO } from "@/ts/geometry";
import { GlobalHashPool, GlobalRandom } from "@/ts/ursaMath";
import { css } from "@emotion/css";
import { Accessor, createEffect, createMemo, For } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

interface ContinuousEmitterProps {
    /** Where on the screen to place the emitter */
    coords: Vec2;
    /** Whether or not the emitter is on. Reactive. If not provided, the emitter is on. 
     * When turned off, any remaining particles will finish their animation and then be removed.
    */
    active?: Accessor<boolean>;
    /** size of emitter on each axis in vw @default {x: 20, y: 20} */
    size?: Vec2;
    /** Particles per second 
     * @default 10
    */
    spawnRate?: number;
    /** in percent of emitter size (0-1) on all axis @default .05 */
    particleSize?: number;
    /** Up to how much to randomly subtract from particleSize where 0 is 0% and 1 is 100%
     * @default .1 */
    particleSizeVariance?: number;
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
    /** Up to how much to randomly offset the starting position of each particle
     * along the orthogonal to the direction vector, in percent of emitter size (0-1) @default 0
     */
    spawnOffsetVariance?: number;
    /** How many particles to pre-compute and pool for later use. 
     * May increase performance or make performance more consistent.
     * However, any pre-computed particles will not be reactive to changes in settings.
     * @default 0 (disabled) */
    particlePoolSize?: number;
    showEmitterOutline?: boolean;
    /** EXPENSIVE. Additional content to include for each particle */
    additionalParticleContent?: (particle: ComputeData) => JSX.Element;
    /** EXPENSIVE. For each particle, for each unit of time, generate some additional/alternative
     * styling to apply to the particle. For clarification: The overall computed animation is applied
     * to a parent of each particle and cannot be interferred with.*/
    particleModulator?: (data: ModulatorData) => string;
}

/** Data pertaining to some particle to be used for a continuous modulator */
interface ModulatorData {
    /** particle index */
    index: number;
    /** how far the particle is in its lifetime in percent 0-1. */
    completion: number;
}

interface ComputeData {
    travelTimeS: number;
    sizePercentOfParent: number;
    fadeoutStartPercentOfTime: number;
    startPercent: Vec2;
    endPercent: Vec2;
    randHash: string;
}
interface ParticleData {
    preComputed: ComputeData;
    element?: HTMLElement;
    parentAnimation: string;
}

export const NULL_JSX: JSX.Element = <></>;
const defaults: Omit<Required<ContinuousEmitterProps>, 'particleModulator'> & Partial<Pick<ContinuousEmitterProps, 'particleModulator'>> = {
    coords: Vec2_ZERO,
    active: () => true,
    size: Vec2_TWENTY,
    spawnRate: 10,
    particleSize: .05,
    particleSizeVariance: .1,
    direction: { x: 0, y: -1 },
    spread: .2,
    travelTime: 5,
    travelTimeVariance: .3,
    travelLength: 1,
    travelLengthVariance: .3,
    fadeoutStart: .3,
    fadeoutStartVariance: .1,
    spawnOffsetVariance: 0,
    showEmitterOutline: false,
    particlePoolSize: 0,
    additionalParticleContent: () => NULL_JSX,
}

export default function ContinuousEmitter(rawProps: ContinuousEmitterProps) {
    const props = Object.assign({}, defaults, rawProps);
    const particles = createArrayStore<ParticleData>([]);

    // As memo so that direction can be reactive in the future
    const orthogonal = createMemo(() => ({
        x: -1 * props.direction.y,
        y: props.direction.x
    }))

    const generateParticle = () => {
        const lengthPercentOfParent = props.travelLength * (1 - GlobalRandom.next() * props.travelLengthVariance);
        const travelSpeedS = props.travelTime * (1 - GlobalRandom.next() * props.travelTimeVariance);
        const sizePercentOfParent = props.particleSize * (1 - GlobalRandom.next() * props.particleSizeVariance);
        const fadeoutStartPercentOfTime = props.fadeoutStart * (1 - GlobalRandom.next() * props.fadeoutStartVariance);
        const computedDirection = normalizeVec2({
            x: props.direction.x + (GlobalRandom.next() - .5) * props.spread,
            y: props.direction.y + (GlobalRandom.next() - .5) * props.spread
        })
        const orth = orthogonal();
        const spawnOffsetRelative = { //Intentionally not normalized
            x: orth.x * (1 - GlobalRandom.next() * props.spawnOffsetVariance),
            y: orth.y * (1 - GlobalRandom.next() * props.spawnOffsetVariance)
        }
        const endPositionAbsoluteRelativeToParentVW = {
            x: spawnOffsetRelative.x + computedDirection.x * lengthPercentOfParent * props.size.x,
            y: spawnOffsetRelative.y + computedDirection.y * lengthPercentOfParent * props.size.y
        }

        const computeData: ComputeData = {
            travelTimeS: travelSpeedS,
            sizePercentOfParent,
            fadeoutStartPercentOfTime,
            startPercent: spawnOffsetRelative,
            endPercent: endPositionAbsoluteRelativeToParentVW,
            randHash: GlobalHashPool.next()
        }

        const animation = computeParticleStyles(computeData);
        const particle: ParticleData = {
            preComputed: computeData,
            parentAnimation: animation
        }

        const removeFunc = particles.add(particle);
        setTimeout(removeFunc, travelSpeedS * 1000);
    }

    let interval: NodeJS.Timeout | undefined;
    createEffect(() => {
        const active = props.active();
        if (active) {
            interval = setInterval(generateParticle, 1000 / props.spawnRate);
        } else {
            clearInterval(interval);
            interval = undefined;
        }
    })

    return (
        <div class={css`${baseContainerStyle}
            width: ${props.size.x}vw; 
            height: ${props.size.y}vw; 
            top: ${props.coords.y}px; 
            left: ${props.coords.x}px;
            ${props.showEmitterOutline ? "border: 1px solid red;" : ""}` //Slightly slower than duration
        }>
            <For each={particles.get}>{ particle => 
                <div class={particle.parentAnimation}></div>
            }</For>
        </div>
    );
}

const computeParticleStyles = (data: ComputeData) => css`
    position: absolute;
    will-change: left, top, opacity;
    top: ${data.startPercent.y * 100}%;
    left: ${data.startPercent.x * 100}%;
    ${Styles.POSITION.TRANSFORM_CENTER}
    width: ${data.sizePercentOfParent * 100}%;
    height: ${data.sizePercentOfParent * 100}%;
    background: white;
    z-index: 1;
    opacity: 1;
    animation-name: particleMove-${data.randHash}, particleFade-${data.randHash};
    animation-delay: 0s, ${data.travelTimeS * data.fadeoutStartPercentOfTime}s;
    animation-duration: ${data.travelTimeS}s, ${data.travelTimeS * (1 - data.fadeoutStartPercentOfTime)}s;
    @keyframes particleMove-${data.randHash} {
        from {
            left: ${data.startPercent.x * 100}%;
            top: ${data.startPercent.y * 100}%;
        }
        to {
            left: ${data.endPercent.x * 100}%;
            top: ${data.endPercent.y * 100}%;
        }
    }
    @keyframes particleFade-${data.randHash} {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`

const baseContainerStyle = css`
    position: absolute;
    contain: paint;
    will-change: contents;
    transform: translate(-50%, -50%);
`;