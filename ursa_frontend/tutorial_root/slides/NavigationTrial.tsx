import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { IInternationalized, IStyleOverwritable } from "../../src/ts/types";

interface NavigationTrialProps extends IStyleOverwritable, IInternationalized {
    onSlideCompleted: () => void;
}

export default function NavigationTrial(props: NavigationTrialProps): JSX.Element {
    return (
        <div class="navigation-trial">
            <StarryBackground />
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