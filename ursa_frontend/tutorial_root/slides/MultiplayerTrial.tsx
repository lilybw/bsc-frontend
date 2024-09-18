import { JSX } from "solid-js/jsx-runtime";

interface MultiplayerTrialProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function MultiplayerTrial(props: MultiplayerTrialProps): JSX.Element {
    return (
        <div class="multiplayer-trial">
            <h1>Multiplayer Trial</h1>
            <p>
                This is a trial of a multiplayer component.
            </p>
            <p>
                Click the "Next" button to continue.
            </p>
        </div>
    )
}