import { JSX } from "solid-js/jsx-runtime";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "../../src/ts/types";
import { createMemo, createSignal } from "solid-js";
import ActionInput from "../../src/components/colony/MainActionInput";
import { ActionContext, BufferSubscriber } from "../../src/ts/actionContext";
import { createArrayStore } from "../../src/ts/arrayStore";
import { css } from "@emotion/css";
import StarryBackground from "../../src/components/base/StarryBackground";

interface NavigationTrialProps extends IStyleOverwritable, IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

export default function NavigationTrial(props: NavigationTrialProps): JSX.Element {
    const [buffer, setBuffer] = createSignal<string>('');
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    setTimeout(() => props.onSlideCompleted(), 50);
    return (
        <div class="navigation-trial">
            <StarryBackground />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({styleOverwrite: trialTitleStyleOverwrite})}
            {props.text.SubTitle('TUTORIAL.NAVIGATION_TRIAL.DESCRIPTION')({styleOverwrite: subtitleStyleOverwrite})}
            <ActionInput actionContext={createMemo(() => ActionContext.NAVIGATION)}
                subscribers={bufferSubscribers} 
                text={props.text} 
                backend={props.backend} 
                setInputBuffer={setBuffer} 
                inputBuffer={buffer} 
            />
        </div>
    )
}

export const trialTitleStyleOverwrite = css`
position: absolute;
font-size: 4rem;
letter-spacing: 0;
`

const subtitleStyleOverwrite = css`
position: absolute;
bottom: 10vh;
left: 50%;
transform: translateX(-50%);
width: 80%;
`