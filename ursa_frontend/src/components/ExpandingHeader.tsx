import { Component, createSignal } from "solid-js";
import { IParenting } from "../ts/types";
import { css } from "@emotion/css";
import SectionSubTitle from "./SectionSubTitle";
import BigMenuButton from "./BigMenuButton";

interface ExpandingHeaderProps extends IParenting {
    name: string;
}

const ExpandingHeader: Component<ExpandingHeaderProps> = (props) => {
    const [expanded, setExpanded] = createSignal(false);

    const getContent = () => {
        if (!expanded()) return (<></>);
        return props.children;
    }

    return (
        <div class={expandingHeaderContainer}>
            <BigMenuButton onClick={() => setExpanded(prev => !prev)}>{props.name + (expanded() ? " v" : " >")}</BigMenuButton>
            {getContent()}
        </div>
    )
}
export default ExpandingHeader;

const expandingHeaderContainer = css`

`