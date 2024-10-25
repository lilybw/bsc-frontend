import { Component, createMemo, JSX } from "solid-js";
import { ColonyInfoResponseDTO, ColonyLocationInformation, LocationInfoResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import NTAwait from "../../util/NoThrowAwait";
import GenericLocationCard from "./GenericLocationCard";
import { KnownLocations } from "../../../integrations/main_backend/constants";
import SpacePortLocationCard from "./SpacePortLocationCard";
import HomeLocationCard from "./HomeLocationCard";
import { IEventMultiplexer } from "../../../integrations/multiplayer_backend/eventMultiplexer";
import { IMultiplayerIntegration } from "../../../integrations/multiplayer_backend/multiplayerBackend";

export interface LocationCardProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    colony: ColonyInfoResponseDTO;
    colonyLocation: ColonyLocationInformation;
    location: LocationInfoResponseDTO;
    events: IEventMultiplexer;
    multiplayer: IMultiplayerIntegration;
    onClose: () => void;
}


const LocationCard: Component<LocationCardProps> = (props) => {

    const renderCardOfType = (locationInfo: LocationInfoResponseDTO): JSX.Element => {
        switch (locationInfo.id) {
            case KnownLocations.Home:
                return (
                    <HomeLocationCard 
                        events={props.events}
                        colonyLocation={props.colonyLocation}
                        closeCard={props.onClose}
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
                        multiplayer={props.multiplayer}
                        colony={props.colony}
                        events={props.events}
                        colonyLocation={props.colonyLocation}
                        closeCard={props.onClose} 
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
                        events={props.events}
                        colonyLocation={props.colonyLocation}
                        closeCard={props.onClose}
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
z-index: 10000;
position: fixed;
display: flex;

width: 50%;
height: 66%;

top: 50%;
left: 50%;
transform: translate(-50%, -50%);

background-color: transparent;
border-radius: 1rem;
box-shadow: 0 0 1rem 0.5rem rgba(0, 0, 0, 0.5);
`