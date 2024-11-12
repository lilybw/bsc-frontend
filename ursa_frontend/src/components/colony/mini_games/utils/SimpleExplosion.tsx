import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";
import { Styles } from "@/sharedCSS";
import { Vec2 } from "@/ts/geometry";
import { getRandHash } from "@/ts/ursaMath";
import { css } from "@emotion/css";
import { For } from "solid-js";

export interface SimpleExplosionProps {
    /** Where to show the explosion */
    coords: Vec2;
    preTransformStyleOverwrite?: string;
    /** Duration of the explosion in milliseconds */
    durationMS?: number;
    /** Number of particles */
    particleCount?: number;
    /** As percent of parent size */
    spread?: number;
    /** Direction from which to generally spread away from 
     * 
     * NOT IMPLEMENTED YET (should be easy, but wasn't. Thanks css)
    */
    incomingNormalized?: Vec2;
}
interface ParticleEndState {
    x: number,
    y: number,
    scale: number,
    randHash: string;
}

export default function SimpleExplosion(
    { coords, durationMS = 500, particleCount = 10, preTransformStyleOverwrite, spread = 50 }: SimpleExplosionProps) 
{
    const children = [];
    for (let i = 0; i < particleCount; i++) {
        const endState = {
            x: ((Math.random() - .5) ) * 2 * spread,
            y: ((Math.random() - .5) ) * 2 * spread,
            scale: .5,
            randHash: getRandHash(),
        }
        children.push(<div class={computeChildStyle(endState, durationMS)} />);
    }
    return (
        <div
            class={css([
                css({ width: "20vw", height: "20vw", backgroundImage: "radial-gradient(circle, rbga(0,0,0,.5), transparent)" }),
                preTransformStyleOverwrite,
                css({ position: "absolute", top: coords.y, left: coords.x }),
                Styles.ANIM.FADE_OUT(durationMS / 1000, "ease-out"),
            ])}
        >{children}</div>
    );
}

const computeChildStyle = (endState: ParticleEndState, durationMS: number) => css`
    width: 20%;
    height: 20%;
    ${Styles.TRANSFORM_CENTER}
    background-image: radial-gradient(circle, white, transparent);
    transform: scale(1);
    animation: particleMove-${endState.randHash} ${durationMS / 1000}s ease-out;
    @keyframes particleMove-${endState.randHash} {
        from {
            transform: scale(1) translate(-50%, -50%);
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