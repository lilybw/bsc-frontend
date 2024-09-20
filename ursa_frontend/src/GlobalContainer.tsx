import { css } from "@emotion/css";
import { Component, createResource, createSignal, ErrorBoundary, JSX, Show } from "solid-js";
import { ApplicationContext, ResErr } from "./meta/types";
import { initContext } from "./setup";
import ErrorPage from "./ErrorPage";
import { Styles } from "./sharedCSS";
import LoadingSpinner from "./components/LoadingSpinner";
import { VitecIntegrationInformation } from "./integrations/vitec/vitecIntegration";

interface GlobalContainerProps {
    app: (context: ApplicationContext) => JSX.Element;
    vitecInfo: VitecIntegrationInformation;
}

const GlobalContainer: Component<GlobalContainerProps> = (props) => {
    console.log("[delete me] GlobalContainer mounted")
    const [contextResult, { mutate, refetch}] = createResource<ResErr<ApplicationContext>>(() => initContext(props.vitecInfo));
    const [latestError, setLatestError] = createSignal<string>("No error");

    //Time to do auth and stuff
    return (
        <div class={appContainerStyle} id="the-global-container">
            <ErrorBoundary fallback={(error) => <ErrorPage content={JSON.stringify(error)} />}>
                <Show when={contextResult.loading}>
                    <LoadingSpinner />
                </Show>
                <Show when={contextResult.error}>
                    <ErrorPage content={contextResult.latest?.err} />
                </Show>
                <Show when={contextResult.state === "ready"}>
                    {props.app(contextResult.latest?.res!)}
                </Show> 
            </ErrorBoundary>
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