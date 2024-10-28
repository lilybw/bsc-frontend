import { css } from "@emotion/css";
import { Component, createSignal } from "solid-js";
import { RuntimeMode } from "./meta/types";
import { initContext } from "./setup";
import ErrorPage from "./ErrorPage";
import { Styles } from "./sharedCSS";
import { VitecIntegrationInformation } from "./integrations/vitec/vitecDTOs";
import { ApplicationProps } from "./ts/types";
import { BundleComponent } from "./meta/types";
import NTAwait from "./components/util/NoThrowAwait";
import DevOverlay from "./components/util/DevOverlay";
import SolarLoadingSpinner from "./components/base/SolarLoadingSpinner";

interface GlobalContainerProps {
    app: BundleComponent<ApplicationProps>;
    vitecInfo: VitecIntegrationInformation;
}

const GlobalContainer: Component<GlobalContainerProps> = (props) => {
    const [showDevOverlay, setShowDevOverlay] = createSignal(false);

    return (
        <div class={appContainerStyle} id="the-global-container">
            <NTAwait func={() => initContext(props.vitecInfo)}
                fallback={(error) => <ErrorPage content={error} />}
                whilestLoading={<SolarLoadingSpinner />}    
            >{ 
                context => {
                    const log = context.logger.copyFor('glob cont');
                    if (context.env.runtimeMode !== RuntimeMode.PRODUCTION) {
                        log.info('Internal Dev Tools available. Toggle with ctrl + F3')
                        document.addEventListener('keydown', e => {
                            if (e.key === 'F3' && e.ctrlKey) {
                                log.subtrace('toggling on dev tools');
                                setShowDevOverlay(prev => !prev);
                            }
                        })
                        return (
                            <>
                            {showDevOverlay() && <DevOverlay context={context} hide={() => setShowDevOverlay(false)} />}
                            {props.app({ context })}
                            </>
                        )
                    }
                    return props.app({ context })
                } 
            }</NTAwait>
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