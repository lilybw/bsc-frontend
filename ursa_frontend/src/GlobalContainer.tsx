import { css } from "@emotion/css";
import { Component, createResource, createSignal, ErrorBoundary, JSX, Show } from "solid-js";
import { ApplicationContext, ResErr } from "./meta/types";
import { initContext } from "./setup";
import ErrorPage from "./ErrorPage";
import { Styles } from "./sharedCSS";
import SolarLoadingSpinner from "./components/SolarLoadingSpinner";
import { VitecIntegrationInformation } from "./integrations/vitec/vitecDTOs";
import { ApplicationProps } from "./ts/types";
import { BundleComponent } from "./meta/types";

interface GlobalContainerProps {
    app: BundleComponent<ApplicationProps>;
    vitecInfo: VitecIntegrationInformation;
}

const GlobalContainer: Component<GlobalContainerProps> = (props) => {
    const [contextResult, { mutate, refetch}] = createResource<ResErr<ApplicationContext>>(() => initContext(props.vitecInfo));
    const [latestError, setLatestError] = createSignal<string>("No error");

    //Time to do auth and stuff
    return (
        <div class={appContainerStyle} id="the-global-container">
            <Show when={contextResult.loading}>
                <SolarLoadingSpinner />
            </Show>
            <Show when={contextResult.state === "ready"}>
                <Show when={contextResult.latest?.err != null}>
                    <ErrorPage content={contextResult.latest?.err} />
                </Show>
                <Show when={contextResult.latest?.res != null}>
                    {props.app({context: contextResult.latest?.res!})}
                </Show>
            </Show> 
        </div>
    );
}
export default GlobalContainer;

const appContainerStyle = css`
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: black;
    ${Styles.NO_OVERFLOW}
`