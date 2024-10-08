import { Component } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";

interface SpacePortCardProps extends GenericLocationCardProps {}

const SpacePortLocationCard: Component<SpacePortCardProps> = (props) => {
    return (
        <div class={cardContainerStyle} id={"location-card-space-port"}>
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
export default SpacePortLocationCard;

const cardContainerStyle = css`
`
