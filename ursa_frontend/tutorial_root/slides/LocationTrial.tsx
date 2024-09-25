import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { IInternationalized, IStyleOverwritable } from "../../src/ts/types";

interface LocationTrialProps extends IInternationalized, IStyleOverwritable {
    onSlideCompleted: () => void;
}

export default function LocationTrial(props: LocationTrialProps): JSX.Element {
    return (
        <div class="location-trial">
            <StarryBackground />
            <h1>Location Trial</h1>
            <p>
                This is a trial of a location component.
            </p>
            <p>
                Click the "Next" button to continue.
            </p>
        </div>
    )
}