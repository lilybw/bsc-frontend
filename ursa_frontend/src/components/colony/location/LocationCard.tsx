import { Component, createMemo, JSX } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import NTAwait from "../../util/NoThrowAwait";
import GenericLocationCard from "./GenericLocationCard";
import { KnownLocations } from "../../../integrations/main_backend/constants";
import SpacePortLocationCard from "../SpacePortLocationCard";

export interface LocationCardProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    location: ColonyLocationInformation;
}


const LocationCard: Component<LocationCardProps> = (props) => {

    const renderCardOfType = (locationInfo: LocationInfoResponseDTO): JSX.Element => {
        switch (locationInfo.id) {
            case KnownLocations.SpacePort:
                return (
                    <SpacePortLocationCard 
                        info={locationInfo}
                        buffer={props.buffer}
                        backend={props.backend}
                        text={props.text}
                    />
                )
            default:
                return (
                    <GenericLocationCard 
                        info={locationInfo}
                        buffer={props.buffer}
                        backend={props.backend}
                        text={props.text}  
                    />
                )
        }
    }

    const computedContainerStyle = createMemo(() => css`${locationCardContainerStyle} ${props.styleOverwrite}`);
    return (
        <div class={computedContainerStyle()}>
            <NTAwait func={() => props.backend.getLocationInfo(props.location.locationID)}>{renderCardOfType}</NTAwait>
        </div>
    )
}
export default LocationCard;

const locationCardContainerStyle = css`
`