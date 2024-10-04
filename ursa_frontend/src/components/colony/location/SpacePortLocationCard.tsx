import { Component } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css } from "@emotion/css";

interface SpacePortCardProps extends GenericLocationCardProps {}

const SpacePortLocationCard: Component<SpacePortCardProps> = (props) => {
    return (
        <div class={cardContainerStyle} id={"location-card-space-port"}>
            {props.text.Title(props.info.name)({})}
            {props.text.SubTitle(props.info.description)({})}
        </div>
    )
}
export default SpacePortLocationCard;

const cardContainerStyle = css`
`
