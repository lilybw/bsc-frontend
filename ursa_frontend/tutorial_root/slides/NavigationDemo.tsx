import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { css } from "@emotion/css";
import ActionInput from "../../src/components/MainActionInput";
import { ActionContext, ActionTriggerResult, BufferSubscriber, TypeIconTuple } from "../../src/ts/actionContext";
import { createEffect, createSignal } from "solid-js";
import BufferHighlightedName from "../../src/components/BufferHighlightedName";
import BufferBasedButton from "../../src/components/BufferBasedButton";
import { createStore } from "solid-js/store";
import { createArrayStore } from "../../src/ts/wrappedStore";
import ManagedAsset from "../../src/components/ManagedAsset";
import { BackendIntegration } from "../../src/integrations/main_backend/mainBackend";

interface NavigationDemoProps {
    styleOverwrite?: string;
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

    return (
        <div class="navigation-demo">
            <StarryBackground />
            <div class={videoDemoFrameStyle} />
            <ActionInput subscribers={bufferSubscribers.get} 
                actionContext={actionContext} 
                setInputBuffer={setInputBuffer}
                inputBuffer={inputBuffer}
            />
            <BufferBasedButton register={bufferSubscribers.add} 
                name={"Center"} 
                buffer={inputBuffer} 
                onActivation={() => console.log("button triggered")} 
            /> 
            <ManagedAsset asset={3} backend={props.backend} />
        </div>
    )
}
const videoDemoFrameStyle = css`

`