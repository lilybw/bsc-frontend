import { JSX } from "solid-js/jsx-runtime";

interface NavigationTrialProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function NavigationTrial(props: NavigationTrialProps): JSX.Element {
    return (
        <div class="navigation-trial">
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