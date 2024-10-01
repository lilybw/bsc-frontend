import { Component } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased } from "../../ts/types";

interface LocationCardProps extends IBackendBased, IBufferBased {
    location: ColonyLocationInformation;
}

const LocationCard: Component<LocationCardProps> = (props) => {
    
}
export default LocationCard;