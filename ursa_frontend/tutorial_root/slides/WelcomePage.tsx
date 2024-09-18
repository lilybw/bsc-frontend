import { JSX } from "solid-js/jsx-runtime";
import SectionTitle from "../../src/components/SectionTitle";
import StarryBackground from "../../src/components/StarryBackground";

interface WelcomePageProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function WelcomePage(props: WelcomePageProps): JSX.Element {
    setTimeout(() => {
        props.onSlideCompleted();
    }, 5000);
    return (
        <div class="welcome-tutorial-page">
            <SectionTitle>WELCOME</SectionTitle>
            <h1>Welcome to the Tutorial</h1>
            <p>
                This tutorial will guide you through the basic features of the application.
            </p>
            <p>
                Click the "Next" button to start the tutorial.
            </p>
        </div>
    )
}