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
                <BufferBasedButton register={bufferSubscribers.add} 
                    name={nameOfLocation} 
                    buffer={inputBuffer}
                    onActivation={() => console.log("button triggered")} 
                /> 
                <ManagedAsset asset={3} backend={props.backend} />
                <ManagedAsset asset={8} backend={props.backend} />
                <ManagedAsset asset={5} backend={props.backend} />
            </VideoFrame>
            
        </div>
    )
}



const videoDemoFrameStyle = css`

`