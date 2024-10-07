import { Accessor, Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO, TransformDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import { IEventMultiplexer } from "../../../integrations/multiplayer_backend/eventMultiplexer";
import { createSign } from "crypto";
import { DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, PLAYER_MOVE_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications-v0.0.7";
import BufferBasedButton from "../../BufferBasedButton";
import { Camera } from "../../../ts/camera";
import AssetCollection from "../AssetCollection";
import { Styles } from "../../../sharedCSS";
import LocationCard from "./LocationCard";

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
const calcNamePlatePosition = (y: number) => {
    //This output is Distance normalized (using props.dns) and is thus roughly in pixels, but might not be. 
    //However this should bring the nameplate towards the center of the location in case we're close to the top of the screen.
    return y < 200 ? -200 : 200;
}

const Location: Component<LocationProps> = (props) => {
    const [isUserHere, setUserIsHere] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [idOfDiffSelected, setIdOfDiffSelected] = createSignal(-1);

    const currentDisplayText = createMemo(() => isUserHere() ?
        props.text.get("LOCATION.USER_ACTION.ENTER").get() :
        props.text.get(props.location.name).get()
    );

    const onButtonActivation = () => {
        if (isUserHere()) {
            console.log("[delete me] showing location card for: " + props.location.name);
            setShowLocationCard(true);
            return;
        }

        console.log("[delete me] moving to: " + props.colonyLocation);
        setUserIsHere(true);
        props.plexer.emit(PLAYER_MOVE_EVENT, {
            playerID: props.backend.localPlayer.id,
            locationID: props.colonyLocation.locationID,
        });
    }

    onMount(() => {
        const playerMoveSubId = props.plexer.subscribe(PLAYER_MOVE_EVENT, (event) => {
            if (event.playerID !== props.backend.localPlayer.id) return;

            if (event.locationID === props.colonyLocation.locationID) setUserIsHere(true);
            else {
                setUserIsHere(false);
                setShowLocationCard(false);
            }            
        });
        const diffSelectSubId = props.plexer.subscribe(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, (event) => {
            setIdOfDiffSelected(event.difficultyID);
        });
        const diffConfirmedSubId = props.plexer.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, (event) => {
            setShowLocationCard(false);
        });
        onCleanup(() => props.plexer.unsubscribe(playerMoveSubId, diffSelectSubId, diffConfirmedSubId));
    })

    const getCollectionForLevel = (level: number, info: LocationInfoResponseDTO) => {
        const sorted = info.appearances.sort((a, b) => a.level - b.level);
        let appearance = sorted[sorted.length - 1];
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].level == level) {
                appearance = sorted[i];
                break;
            }
        }
        return appearance;
    }
    const appendCard = () => {
        if (showLocationCard()) {
            return (
                <LocationCard
                    colonyLocation={props.colonyLocation}
                    location={props.location}
                    buffer={props.buffer}
                    backend={props.backend}
                    text={props.text}
                    register={props.register}
                />
            )
        }
    }

    const computedContainerStyle = createMemo(() => css`${locationContainerStyle} ${props.styleOverwrite}`);
    const computedCollectionTransform = createMemo<TransformDTO>(() => {
        const transform = props.colonyLocation.transform;
        return {
            xOffset: transform.xOffset * props.dns().x + props.camera.get().x,
            yOffset: transform.yOffset * props.dns().y + props.camera.get().y,
            zIndex: transform.zIndex,
            xScale: transform.xScale * props.gas(),
            yScale: transform.yScale * props.gas(),
        }
    });
    const computedButtonTransform = createMemo<TransformDTO>(() => {
        const transform = props.colonyLocation.transform;
        return {
            xOffset: transform.xOffset * props.dns().x + props.camera.get().x,
            yOffset: (transform.yOffset + calcNamePlatePosition(transform.yOffset)) * props.dns().y + props.camera.get().y,
            zIndex: transform.zIndex + 10,
            xScale: transform.xScale * props.gas(),
            yScale: transform.yScale * props.gas(),
        }
    });
    return (
        <div class={computedContainerStyle()} id={"location-" + props.location.name + "-level-" + props.colonyLocation.level}>
            <BufferBasedButton
                styleOverwrite={css`
                    ${Styles.transformToCSSVariables(computedButtonTransform())}
                    ${Styles.TRANSFORM_APPLICATOR}   
                `}
                onActivation={onButtonActivation}
                name={currentDisplayText()} 
                buffer={props.buffer}
                register={props.register}
            />
            <AssetCollection 
                id={getCollectionForLevel(0, props.location).assetCollectionID}
                backend={props.backend}
                topLevelTransform={computedCollectionTransform()}
            />
            {appendCard()}
        </div>
    )
}
export default Location;

const locationContainerStyle = css`
`