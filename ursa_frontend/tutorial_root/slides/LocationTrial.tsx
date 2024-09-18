import { JSX } from "solid-js/jsx-runtime";

interface LocationTrialProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function LocationTrial(props: LocationTrialProps): JSX.Element {
    return (
        <div class="location-trial">
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