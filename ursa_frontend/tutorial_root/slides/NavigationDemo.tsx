import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { css } from "@emotion/css";
import ActionInput from "../../src/components/MainActionInput";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../src/ts/actionContext";
import { createSignal } from "solid-js";
import BufferBasedButton from "../../src/components/BufferBasedButton";
import { createArrayStore } from "../../src/ts/wrappedStore";
import ManagedAsset from "../../src/components/ManagedAsset";
import { BackendIntegration } from "../../src/integrations/main_backend/mainBackend";
import VideoFrame from "./VideoFrame";

interface NavigationDemoProps {
    onSlideCompleted: () => void;
    backend: BackendIntegration;
}

export default function NavigationDemo(props: NavigationDemoProps): JSX.Element {
    const [inputBuffer, setInputBuffer] = createSignal<string>('');
    const [actionContext, setActionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    setTimeout(() => {
        props.onSlideCompleted();
    }, 10_000);

    const nameOfLocation = "Outer Walls";
    for (let i = 0; i < nameOfLocation.length; i++) {
        setTimeout(() => {
            setInputBuffer(inputBuffer() + nameOfLocation[i]);
        }, 1000 + i * 500);
    }

    return (
        <div class="navigation-demo">
            <StarryBackground />
            <div class={videoDemoFrameStyle} />
            <VideoFrame backend={props.backend}> 
                <ActionInput subscribers={bufferSubscribers.get} 
                    actionContext={actionContext} 
                    setInputBuffer={setInputBuffer}
                    inputBuffer={inputBuffer}
                    demoMode={true}
                />
                <BufferBasedButton
                    styleOverwrite={locationPinStyleOverwrite}
                    register={bufferSubscribers.add} 
                    name={nameOfLocation} 
                    buffer={inputBuffer}
                    onActivation={() => console.log("button triggered")} 
                /> 
                <ManagedAsset styleOverwrite={locationPinStyleOverwrite} asset={3} backend={props.backend} />
                <ManagedAsset styleOverwrite={playerCharStyleOverwrite} asset={8} backend={props.backend} />
            </VideoFrame>
            
        </div>
    )
}
const shared = css`
position: absolute;
top: 50%;
transform: translateY(-50%);
--edge-offset: 5vw;
`

const playerCharStyleOverwrite = css`
${shared}
left: var(--edge-offset);
`
const locationPinStyleOverwrite = css`
${shared}
right: var(--edge-offset);
`

const videoDemoFrameStyle = css`

`