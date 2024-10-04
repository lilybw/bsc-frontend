import { Component, createMemo, JSX } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import NTAwait from "../../util/NoThrowAwait";
import GenericLocationCard from "./GenericLocationCard";
import { KnownLocations } from "../../../integrations/main_backend/constants";
import SpacePortLocationCard from "./SpacePortLocationCard";
import HomeLocationCard from "./HomeLocationCard";

export interface LocationCardProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    colonyLocation: ColonyLocationInformation;
    location: LocationInfoResponseDTO;
}


const LocationCard: Component<LocationCardProps> = (props) => {

    const renderCardOfType = (locationInfo: LocationInfoResponseDTO): JSX.Element => {
        switch (locationInfo.id) {
            case KnownLocations.Home:
                return (
                    <HomeLocationCard 
                        info={locationInfo}
                        buffer={props.buffer}
                        backend={props.backend}
                        text={props.text}
                        register={props.register}
                    />
                )
            case KnownLocations.SpacePort:
                return (
                    <SpacePortLocationCard 
                        info={locationInfo}
                        buffer={props.buffer}
                        backend={props.backend}
                        text={props.text}
                        register={props.register}
                    />
                )
            default:
                return (
                    <GenericLocationCard 
                        info={locationInfo}
                        buffer={props.buffer}
                        backend={props.backend}
                        text={props.text}
                        register={props.register}  
                    />
                )
        }
    }

    const computedContainerStyle = createMemo(() => css`${locationCardContainerStyle} ${props.styleOverwrite}`);
    return (
        <div class={computedContainerStyle()}>
            {renderCardOfType(props.location)}
        </div>
    )
}
export default LocationCard;

const locationCardContainerStyle = css`
`