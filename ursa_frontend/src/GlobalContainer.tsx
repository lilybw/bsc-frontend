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
import NTAwait from "./components/util/NoThrowAwait";

interface GlobalContainerProps {
    app: BundleComponent<ApplicationProps>;
    vitecInfo: VitecIntegrationInformation;
}

const GlobalContainer: Component<GlobalContainerProps> = (props) => {
    return (
        <div class={appContainerStyle} id="the-global-container">
            <NTAwait func={() => initContext(props.vitecInfo)}
                fallback={(error) => <ErrorPage content={error} />}
                whilestLoading={<SolarLoadingSpinner />}    
            >
                { context => props.app({ context }) }
            </NTAwait>
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