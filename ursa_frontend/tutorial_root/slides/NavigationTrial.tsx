import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "../../src/ts/types";
import { createMemo, createSignal } from "solid-js";
import ActionInput from "../../src/components/MainActionInput";
import { ActionContext, BufferSubscriber } from "../../src/ts/actionContext";
import { createArrayStore } from "../../src/ts/wrappedStore";

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
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({})}
            {props.text.SubTitle('TUTORIAL.NAVIGATION_TRIAL.DESCRIPTION')({})}
            <ActionInput actionContext={createMemo(() => ActionContext.NAVIGATION)}
                subscribers={bufferSubscribers.get} 
                text={props.text} 
                backend={props.backend} 
                setInputBuffer={setBuffer} 
                inputBuffer={buffer} 
                demoMode={false}
            />
            <h1>Navigation Trial</h1>
            <p>
                This is a trial of a navigation component.
            </p>
            <p>
                Click the "Next" button to continue.
            </p>
        </div>
    )
}