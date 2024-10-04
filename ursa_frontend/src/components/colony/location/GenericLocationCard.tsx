import { Component } from "solid-js";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "../../../ts/types";
import { LocationInfoResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";

export interface GenericLocationCardProps extends IBufferBased, IBackendBased, IInternationalized, IRegistering<string>{
    info: LocationInfoResponseDTO
}

const GenericLocationCard: Component<GenericLocationCardProps> = (props) => {
    return (
        <div class={cardContainerStyle} id={"location-card-" + props.info.name}>
            {props.text.Title(props.info.name)({})}
            {props.text.SubTitle(props.info.description)({})}
        </div>
    )
}
export default GenericLocationCard;

const cardContainerStyle = css`
`