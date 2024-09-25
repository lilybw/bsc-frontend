import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { IInternationalized, IStyleOverwritable } from "../../src/ts/types";

interface TutorialCompletePageProps extends IInternationalized, IStyleOverwritable {
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