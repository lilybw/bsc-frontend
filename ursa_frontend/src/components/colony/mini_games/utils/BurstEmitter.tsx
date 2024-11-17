import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";
import { Styles } from "@/styles/sharedCSS";
import { normalizeVec2, Vec2, Vec2_ZERO } from "@/ts/geometry";
import { GlobalHashPool, GlobalRandom } from "@/ts/ursaMath";
import { css } from "@emotion/css";
import { For, JSX } from "solid-js";

export interface BurstEmitterProps {
    /** Where to show the explosion */
    coords: Vec2;
    /** Duration of the explosion in milliseconds 
     * @default 500
    */
    durationMS?: number;
    /** Number of particles @default 10 */
    particleCount?: number;
    /** Base size of particle in percent of emitter size as a range from 0 to 1 @default .1 */
    particleSize?: number;
    /** A reduction in scale by up to the given variance @default .5 */
    particleSizeVariance?: number;
    /** Overall size of explosion, calculated in amounts of view width (vw) */
    size?: number;
    /** As percent of emitter size (0-1). How far the particles should spread from the center.
     * Where 1 (100%) is to the edge of the emitter element.
     * @default .5
     */
    spread?: number;
    /** Up to how much to randomly reduce the spread for each child. Given here as a 0-1 value which corresponds to
     * reducing final spread by up to 100%.
     * @default 0.3
     */
    spreadVariance?: number;
    /** Direction from which to generally spread away from. Must be normalized (or results may be unpredictable)
     * @default { x: 0, y: 0 } 
     */
    incomingNormalized?: Vec2;
    /** How much the incoming vector (if provided) should influence the direction of child particles
     * @default 1
     */
    incomingWeight?: number;
    /** How much to delay the animation of each particle in milliseconds @default 0 */
    staggerMS?: number;
    /** Up to how much to randomly reduce the stagger for each particle in percent (0-1)
     * Duly note that stagger is "additive" in terms of time, and by default, the entire thing 
     * (emitter, particles, ...) will fade out. 
     *  @default 0 */
    staggerVariance?: number;
    /** For providing precomputed / cached / pooled particles.
     * Completely circumvents anything else. So if youre unsure how to use it. Dont.
    */
    preComputedParticles?: JSX.Element[];
    /** Function to generate the child elements. 
     * @param computedAnimationStyle The computed style for the child element, including the animation
     * @default ```tsx
     *  (index, animation, children) => <div class={animation}>{children}</div>
     * ```
     * */
    particleGeneratorFunc?: (index: number, computedAnimationStyle: string, children: JSX.Element) => JSX.Element;
    /** Additional content to include for each child particle */
    additionalChildContent?: () => JSX.Element;
    /** Show emitter outline */
    showEmitterOutline?: boolean;
}

interface ParticleData {
    /** In pre-formatted % (0-100) */
    x: number;
    /** In pre-formatted % (0-100) */
    y: number;
    computedDelayMS: number;
    scale: number;
    randHash: string;
}

export const NULL_JSX: JSX.Element = <></>;
const defaultGenerator: Required<BurstEmitterProps>["particleGeneratorFunc"] = (i, a, c) => <div class={a}>{c}</div>;
const defaults: Omit<Required<BurstEmitterProps>, 'preComputedParticles'> & Partial<Pick<BurstEmitterProps, 'preComputedParticles'>> = {
    coords: Vec2_ZERO,
    durationMS: 500,
    particleCount: 10,
    particleSize: .1,
    particleSizeVariance: .5,
    size: 20,
    spread: .5,
    spreadVariance: .3,
    incomingNormalized: Vec2_ZERO,
    incomingWeight: 1,
    staggerMS: 0,
    staggerVariance: 0,
    showEmitterOutline: false,
    additionalChildContent: () => NULL_JSX,
    particleGeneratorFunc: defaultGenerator,
}
/** Simple explosion-like effect */
export default function BurstEmitter(
    // these props are destructured and thus not reactive. They are not meant to be reactive any way.
    rawProps: BurstEmitterProps) 
{
    // According to Claude, this is more performant than "{...defaults, ...rawProps}"
    const props = Object.assign({}, defaults, rawProps);
    const generateParticles = () => {
        //Takes 8ms for 50 particles on good hardware, i.e. not the bottleneck
        const particles: JSX.Element[] = [];
        for (let i = 0; i < props.particleCount; i++) {
            const normalizedRandomDirection = normalizeVec2({ 
                x: (GlobalRandom.next() - .5) + (props.incomingNormalized.x * props.incomingWeight), 
                y: (GlobalRandom.next() - .5) + (props.incomingNormalized.y * props.incomingWeight)
            });
            const variedSpread = props.spread * (1 - GlobalRandom.next() * props.spreadVariance);
            const endState: ParticleData = {
                x: 50 + (normalizedRandomDirection.x * variedSpread * 100),
                y: 50 + (normalizedRandomDirection.y * variedSpread * 100),
                scale: props.particleSize * ( 1 - GlobalRandom.next() * props.particleSizeVariance ),
                computedDelayMS: props.staggerMS * (1 - GlobalRandom.next() * props.staggerVariance ),
                randHash: GlobalHashPool.next(),
            }
            particles.push(
                props.particleGeneratorFunc(
                    i, 
                    computeParticleAnimation(endState, props.durationMS), 
                    props.additionalChildContent()
                )
            );
        }
        return particles;
    }
    const children: JSX.Element[] = props.preComputedParticles ?? generateParticles();

    return (
        <div
            class={css`${baseContainerStyle}
                width: ${props.size}vw; 
                height: ${props.size}vw; 
                top: ${props.coords.y}px; 
                left: ${props.coords.x}px;
                ${props.showEmitterOutline ? "border: 1px solid red;" : ""}
                ${Styles.ANIM.FADE_OUT(props.durationMS / 900, "ease-out")}` //Slightly slower than duration
            }
        >{children}</div>
    );
}

const baseContainerStyle = css`
    position: absolute;
    contain: paint;
    background: radial-gradient(circle, rgba(0,0,0,1), transparent 70%);
    will-change: contents;
    transform: translate(-50%, -50%);
`;

const computeParticleAnimation = (data: ParticleData, durationMS: number) => css`
    position: absolute;
    will-change: left, top;
    top: 50%;
    left: 50%;
    width: ${data.scale * 100}%;
    height: ${data.scale * 100}%;
    ${Styles.POSITION.TRANSFORM_CENTER}
    transform: translate(-50%, -50%);
    z-index: 1;
    animation: particleMove-${data.randHash} ${durationMS / 1000}s ease-out;
    animation-delay: ${data.computedDelayMS}ms;
    @keyframes particleMove-${data.randHash} {
        from {
            left: 50%;
            top: 50%;
        }
        to {
            left: ${data.x}%;
            top: ${data.y}%;
        }
    }
`;