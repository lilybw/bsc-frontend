import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";

interface TutorialCompletePageProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function TutorialCompletePage(props: TutorialCompletePageProps): JSX.Element {
    return (
        <div class="tutorial-complete-page">
            <StarryBackground />
            <h1>Tutorial Complete</h1>
            <p>
                You have completed the tutorial.
            </p>
            <p>
                Click the "Next" button to continue.
            </p>
        </div>
    )
}