import { JSX } from "solid-js/jsx-runtime";

interface NavigationDemoProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function NavigationDemo(props: NavigationDemoProps): JSX.Element {
    setTimeout(() => {
        props.onSlideCompleted();
    }, 10_000);
    return (
        <div class="navigation-demo">
            <h1>Navigation Demo</h1>
            <p>
                This is a demo of a navigation component.
            </p>
            <p>
                Click the "Next" button to continue.
            </p>
        </div>
    )
}