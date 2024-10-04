import { Component } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

type IfProps = {
    condition: boolean;
    children: [JSX.Element, JSX.Element?];
}
/**
 * Takes up to 2 children, the first one is rendered if the condition is true, the second one is optional and rendered if the condition is false.
 */
const If: Component<IfProps> = (props: IfProps) => {
    return props.condition ? props.children[0] : (props.children[1]);
}
export default If;