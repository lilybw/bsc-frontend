import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { css } from "@emotion/css";
import ActionInput from "../../src/components/MainActionInput";
import { ActionContext } from "../../src/ts/actionContext";
import { createEffect, createSignal } from "solid-js";
import BufferHighlightedName from "../../src/components/BufferHighlightedName";

interface NavigationDemoProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function NavigationDemo(props: NavigationDemoProps): JSX.Element {
    const [inputBuffer, setInputBuffer] = createSignal<string>('');

    createEffect(() => {
        console.log('Input buffer changed:', inputBuffer());
    });

    setTimeout(() => {
        props.onSlideCompleted();
    }, 10_000);

    return (
        <div class="navigation-demo">
            <StarryBackground />
            <div class={videoDemoFrameStyle} />
            <ActionInput actionContext={ActionContext.NAVIGATION} setInputBuffer={setInputBuffer}/>
            <BufferHighlightedName name={"Agriculture Center"} buffer={inputBuffer} /> 
        </div>
    )
}
const videoDemoFrameStyle = css`

`