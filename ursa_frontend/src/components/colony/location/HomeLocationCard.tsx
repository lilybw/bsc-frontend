import { Component } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css } from "@emotion/css";

interface HomeLocationCardProps extends GenericLocationCardProps {}

const HomeLocationCard: Component<HomeLocationCardProps> = (props) => {
    return (
        <div class={cardContainerStyle} id={"location-card-home"}>
            {props.text.Title(props.info.name)({})}
            {props.text.SubTitle(props.info.description)({})}
        </div>
    )
}
export default HomeLocationCard;

const cardContainerStyle = css`
`