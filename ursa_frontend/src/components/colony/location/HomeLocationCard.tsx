import { Component } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";

interface HomeLocationCardProps extends GenericLocationCardProps {}

const HomeLocationCard: Component<HomeLocationCardProps> = (props) => {
    return (
        <div class={cardContainerStyle} id={"location-card-home"}>
            {props.text.Title(props.info.name)({})}
            {props.text.SubTitle(props.info.description)({})}
            <BufferBasedButton 
                name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                buffer={props.buffer}
                register={props.register}
                onActivation={props.closeCard}
            />
        </div>
    )
}
export default HomeLocationCard;

const cardContainerStyle = css`
`