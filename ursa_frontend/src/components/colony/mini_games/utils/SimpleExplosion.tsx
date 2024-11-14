import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";
import { Styles } from "@/sharedCSS";
import { normalizeVec2, Vec2, Vec2_ZERO } from "@/ts/geometry";
import { GlobalHashPool, GlobalRandom } from "@/ts/ursaMath";
import { css } from "@emotion/css";
import { For, JSX } from "solid-js";

export interface SimpleExplosionProps {
    /** Where to show the explosion */
    coords: Vec2;
    /** Duration of the explosion in milliseconds 
     * @default 500
    */
    durationMS?: number;
    /** Number of particles 
     * @default 10
    */
    particleCount?: number;
    /** A reduction in scale by up to the given variance @default .5 */
    particleSizeVariance?: number;
    /** As percent of parent size. How far the particles should spread from the center
     * @default 50%
    */
    spread?: number;
    /** Up to how much to randomly reduce the spread for each child. Given here as a 0-1 value which corresponds to
     * reducing final spread by up to 100%.
     * @default 0.3
     */
    spreadVariance?: number;
    /** Direction from which to generally spread away from
     * @default { x: 0, y: 0 } 
    */
    incomingNormalized?: Vec2;
    /** How much the incoming vector should influence the direction of child particles
     * @default 1
     */
    incomingWeight?: number;
    preComputedParticles?: JSX.Element[];
    /** Function to generate the child elements. 
     * @param computedAnimationStyle The computed style for the child element, including the animation
     * @default ```tsx
     *  (animation, children) => <div class={animation}>{children}</div>
     * ```
     * */
    particleGeneratorFunc?: (index: number, computedAnimationStyle: string, children: JSX.Element) => JSX.Element;
    /** Additional content to include for each child particle */
    additionalChildContent?: () => JSX.Element;
}
interface ParticleEndState {
    x: number,
    y: number,
    scale: number,
    randHash: string;
}

export const NULL_JSX: Readonly<JSX.Element> = <></>;
const defaults: Omit<Required<SimpleExplosionProps>, 'preComputedParticles'> & Partial<Pick<SimpleExplosionProps, 'preComputedParticles'>> = {
    coords: Vec2_ZERO,
    durationMS: 500,
    particleCount: 10,
    particleSizeVariance: .5,
    spread: 50,
    spreadVariance: .3,
    incomingNormalized: Vec2_ZERO,
    incomingWeight: 1,
    additionalChildContent: (() => NULL_JSX) as () => JSX.Element,
    particleGeneratorFunc: (i, a, c) => <div class={a}>{c}</div>,
}
/** Simple explosion-like effect */
export default function SimpleExplosion(
    // these props are destructured and thus not reactive. They are not meant to be reactive any way.
    rawProps: SimpleExplosionProps) 
{
    const props = { ...defaults, ...rawProps };
    const generateParticles = () => {
        const particles: JSX.Element[] = [];
        for (let i = 0; i < props.particleCount; i++) {
            const normalizedRandomDirection = normalizeVec2({ 
                x: (GlobalRandom.next() - .5) + (props.incomingNormalized.x * props.incomingWeight), 
                y: (GlobalRandom.next() - .5) + (props.incomingNormalized.y * props.incomingWeight)
            });
            const variedSpread = props.spread * (1 - GlobalRandom.next() * props.spreadVariance);
            const endState = {
                x: normalizedRandomDirection.x * variedSpread,
                y: normalizedRandomDirection.y * variedSpread,
                scale: 1 - GlobalRandom.next() * props.particleSizeVariance,
                randHash: GlobalHashPool.next(),
            }
            particles.push(
                props.particleGeneratorFunc(i, 
                    computeParticleAnimation(endState, props.durationMS), props.additionalChildContent()
                )
            );
        }
        return particles;
    }
    const children: JSX.Element[] = props.preComputedParticles ?? generateParticles();

    return (
        <div
            class={css`${baseContainerStyle}
                top: ${props.coords.y}; left: ${props.coords.x};
                ${Styles.ANIM.FADE_OUT(props.durationMS / 1000, "ease-out")}`
            }
        >{children}</div>
    );
}

const baseContainerStyle = css`
    position: absolute;
    display: flex;
    width: 20vw; height: 20vw; 
    background-image: radial-gradient(circle, rbga(0,0,0,.5), transparent);
    contain: paint;
    transform: translate(-50%, -50%);
`;

const computeParticleAnimation = (endState: ParticleEndState, durationMS: number) => css`
    width: 20%;
    height: 20%;
    ${Styles.TRANSFORM_CENTER}
    transform: scale(${endState.scale}) translate(-50%, -50%);
    will-change: transform, left, top;
    animation: particleMove-${endState.randHash} ${durationMS / 1000}s ease-out;
    @keyframes particleMove-${endState.randHash} {
        from {
            transform: scale(${endState.scale}) translate(-50%, -50%);
            left: 50%;
            top: 50%;
        }
        to {
            transform: scale(${endState.scale}) translate(-50%, -50%);
            left: calc(50% + ${endState.x}%);
            top: calc(50% + ${endState.y}%);
        }
    }
`;