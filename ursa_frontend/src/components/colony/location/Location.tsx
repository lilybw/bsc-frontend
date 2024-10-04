import { Accessor, Component, createMemo, createSignal, onMount } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import { IEventMultiplexer } from "../../../integrations/multiplayer_backend/eventMultiplexer";
import { createSign } from "crypto";
import { PLAYER_MOVE_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications-v0.0.7";
import BufferBasedButton from "../../BufferBasedButton";
import { Camera } from "../../../ts/camera";

interface LocationProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    colonyLocation: ColonyLocationInformation;
    location: LocationInfoResponseDTO;
    plexer: IEventMultiplexer;
    camera: Camera;
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
    const [isUserHere, setUserIsHere] = createSignal(false);
    const [subscriptionID, setSubscriptionID] = createSignal<number>(-1);
    const currentDisplayText = createMemo(() => isUserHere() ?
        props.text.get("LOCATION.USER_ACTION.ENTER").get() :
        props.text.get(props.location.name).get()
    );

    const onPlayerMoveHere = () => {
        console.log("[delete me] moving to: " + props.colonyLocation);
        setUserIsHere(true);
        props.plexer.emit(PLAYER_MOVE_EVENT, {
            playerID: props.backend.localPlayer.id,
            locationID: props.colonyLocation.locationID,
        });
    }

    onMount(() => {
        const subscriptionID = props.plexer.subscribe(PLAYER_MOVE_EVENT, (event) => {
            if (
                event.playerID === props.backend.localPlayer.id
                && event.locationID === props.colonyLocation.locationID
            ) {
                setUserIsHere(true);
            }
        });
        setSubscriptionID(subscriptionID);
        return () => {
            props.plexer.unsubscribe(subscriptionID);
        }
    })

    const computedContainerStyle = createMemo(() => css`${locationContainerStyle} ${props.styleOverwrite}`);
    return (
        <div class={computedContainerStyle()}>
            <BufferBasedButton
                onActivation={onPlayerMoveHere}
                name={currentDisplayText()} 
                buffer={props.buffer} 
                register={props.register}
            />
            Location
        </div>
    )
}
export default Location;

const locationContainerStyle = css`
`