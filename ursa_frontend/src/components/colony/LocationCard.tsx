import { Component, createMemo } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IStyleOverwritable } from "../../ts/types";
import { css } from "@emotion/css";

interface LocationCardProps extends IBackendBased, IBufferBased, IStyleOverwritable {
    location: ColonyLocationInformation;
}

const LocationCard: Component<LocationCardProps> = (props) => {
 

    const computedContainerStyle = createMemo(() => css`${locationCardContainerStyle} ${props.styleOverwrite}`);
    return (
        <div class={computedContainerStyle()}>
            
        </div>
    )
}
export default LocationCard;

const locationCardContainerStyle = css`
`