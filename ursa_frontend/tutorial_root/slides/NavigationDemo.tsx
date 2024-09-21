import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { css } from "@emotion/css";
import ActionInput from "../../src/components/MainActionInput";
import { ActionContext } from "../../src/ts/actionContext";
import { createEffect, createSignal } from "solid-js";

interface NavigationDemoProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function NavigationDemo(props: NavigationDemoProps): JSX.Element {
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [debouncedBuffer, setDebouncedBuffer] = createSignal("");

    // Debounce effect
    createEffect(() => {
        const timeoutId = setTimeout(() => {
            console.log('Debounced buffer:', inputBuffer());
            setDebouncedBuffer(inputBuffer());
        }, 100); // 100ms debounce time

        return () => clearTimeout(timeoutId);
    });

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
        </div>
    )
}
const videoDemoFrameStyle = css`

`