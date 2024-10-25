import { css } from "@emotion/css";
import { Accessor, createEffect, For } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { SetStoreFunction, Store } from "solid-js/store";
import { SlideEntry } from "./TutorialApp";
import SlideIcon from "./SlideIcon";
import GraphicalAsset from '../src/components/GraphicalAsset';
import NTAwait from '../src/components/util/NoThrowAwait';
import { IBackendBased } from "../src/ts/types";
import { BackendIntegration } from "../src/integrations/main_backend/mainBackend";

interface ProgressTrackerProps extends IBackendBased {
    currentSlide: Accessor<number>;
    previousSlide: Accessor<number>;
    slideStore: Store<SlideEntry[]>;
    setSlideStore: SetStoreFunction<SlideEntry[]>;
    styleOverwrite?: string;
    backend: BackendIntegration;  // Add this line. Replace 'any' with the actual type of your backend
}

export default function ProgressTracker(props: ProgressTrackerProps): JSX.Element {
    createEffect(() => {
        if (!props.slideStore[props.currentSlide()].hasCompleted) {
            props.setSlideStore((prev) => {
                prev[props.currentSlide()].hasCompleted = true;
                return prev;
            });
        }
    });

    return (
        <div class={css`${progressTrackerStyle} ${props.styleOverwrite}`} id="tutorial-progress-tracker">
            <div
                class={animatedOutlineStyle}
                style={{
                    transform: `translateX(${props.currentSlide() * 100 / props.slideStore.length}vw) translateY(-50%)`
                }}
            />
            <For each={props.slideStore}>{(elem, index) => (
                <div class={iconContainerStyle}>
                    <NTAwait func={() => props.backend.assets.getMetadata(elem.iconId)}>
                        {(asset) => (
                            <GraphicalAsset 
                                styleOverwrite={iconStyleOverwrite} 
                                metadata={asset} 
                                backend={props.backend}
                            />
                        )}
                    </NTAwait>
                </div>
            )}
            </For>
        </div>
    );
}

const animatedOutlineStyle = css`
position: absolute;
top: 50%;
left: calc(5.15vw - .5rem);
--radius: 3.5rem;
width: var(--radius);
height: var(--radius);
border: 2px solid white;
border-radius: 50%;
transform: translateY(-50%);
transition: transform 1s ease-in-out;
pointer-events: none;
`;
const iconContainerStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
`;

const iconStyleOverwrite = css`
    width: 2.5rem;
    height: 2.5rem;
    padding: .2rem;
    transition: all 0.3s ease-out;
    z-index: 1;
    border-radius: 50%;
`;

const progressTrackerStyle = css`
    position: relative;
    top: 0;
    width: 100%;
    height: 4rem;
    padding: .5rem;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
`;