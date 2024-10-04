import { Accessor, Component, createMemo, createSignal } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import { IEventMultiplexer } from "../../../integrations/multiplayer_backend/eventMultiplexer";
import { createSign } from "crypto";
import { PLAYER_MOVE_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications-v0.0.7";

interface LocationProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    colonyLocation: ColonyLocationInformation;
    location: LocationInfoResponseDTO;
    emit: IEventMultiplexer['emit'];
    /**
     * Distance normalization vector
     */
    dns: Accessor<{x: number, y: number}>;
    /**
     * Graphical Asset Scalar
     */
    gas: Accessor<number>;
}

const Location: Component<LocationProps> = (props) => {
    const [userIsHere, setUserIsHere] = createSignal(false);
    props.register(v => {
        console.log("[delete me] moving to: " + props.colonyLocation);
        const translatedLocationName = props.text.get(props.location.name).get();
        if (v === translatedLocationName) {
            setUserIsHere(true);
            props.emit(PLAYER_MOVE_EVENT, {
                playerID: props.backend.localPlayer.id,
                locationID: props.colonyLocation.locationID,
            });
        }
        return {
            consumed: v === translatedLocationName,
        }
    })

    const computedContainerStyle = createMemo(() => css`${locationContainerStyle} ${props.styleOverwrite}`);
    return (
        <div class={computedContainerStyle()}>
            Location
        </div>
    )
}
export default Location;

const locationContainerStyle = css`
`