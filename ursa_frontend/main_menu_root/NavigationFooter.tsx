import { css } from "@emotion/css";
import { Accessor, Component } from "solid-js";
import { NamedVoidFunction } from "../src/meta/types";
import BigMenuButton from "../src/components/BigMenuButton";

interface NavigationFooterProps {
    goNext?: NamedVoidFunction;
    goNextEnabled?: Accessor<boolean>;
    goBack?: NamedVoidFunction;
    goBackEnabled?: Accessor<boolean>;
    cancelAll?: NamedVoidFunction;
    cancelAllEnabled?: Accessor<boolean>;
}

const NavigationFooter: Component<NavigationFooterProps> = (props) => {

    return (
        <div class={footerStyles}>
        {props.goBack && (<BigMenuButton 
            onClick={props.goBack?.func} 
            
            enable={props.goBackEnabled}
        >
            {props.goBack?.name || "Back"}
        </BigMenuButton>)}

        {props.cancelAll && (<BigMenuButton 
            onClick={props.cancelAll?.func} 
            enable={props.cancelAllEnabled}
        >
            {props.cancelAll?.name || "Cancel"}
        </BigMenuButton>)}

        {props.goNext && (<BigMenuButton 
            onClick={props.goNext?.func} 
            enable={props.goNextEnabled}
        >
            {props.goNext?.name || "Next"}
        </BigMenuButton>)}
        </div>
    )
}
export default NavigationFooter;

const footerStyles = css`
    display: flex;
    justify-content: space-between;
    width: 33%;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
`