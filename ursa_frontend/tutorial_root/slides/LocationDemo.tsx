import { JSX } from "solid-js/jsx-runtime";

interface LocationDemoProps {
    styleOverwrite?: string;
    onSlideCompleted: () => void;
}

export default function LocationDemoPage(props: LocationDemoProps): JSX.Element {
    //Delay 10 seconds to let the demo play out, then mark slide complete
    setTimeout(() => {
        props.onSlideCompleted();
    }, 10_000);
    return (
        <div class="location-demo">
            <h1>Location Demo</h1>
            <p>
                This is a demo of a location component.
            </p>
            <p>
                Click the "Next" button to continue.
            </p>
        </div>
    )
}