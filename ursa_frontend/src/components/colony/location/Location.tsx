import { Accessor, Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { ColonyLocationInformation, LocationInfoResponseDTO, TransformDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";
import { IEventMultiplexer } from "../../../integrations/multiplayer_backend/eventMultiplexer";
import { DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, PLAYER_MOVE_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications";
import BufferBasedButton from "../../BufferBasedButton";
import AssetCollection from "../AssetCollection";
import { Styles } from "../../../sharedCSS";
import LocationCard from "./LocationCard";
import { WrappedSignal } from "../../../ts/wrappedSignal";
import { ActionContext, TypeIconTuple } from "../../../ts/actionContext";

interface LocationProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    colonyLocation: ColonyLocationInformation;
    location: LocationInfoResponseDTO;
    worldOffset: { x: number; y: number };
    plexer: IEventMultiplexer;
    actionContext: WrappedSignal<TypeIconTuple>;
    gas: Accessor<number>;
    dns: Accessor<{ x: number; y: number }>;
    setWorldOffset: (offset: { x: number; y: number }) => void;
    getCurrentLocationId: () => number;
}

const calcNamePlatePosition = (y: number) => {
    return y < 200 ? -200 : 200;
}

const Location: Component<LocationProps> = (props) => {
    const [isUserHere, setUserIsHere] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [idOfDiffSelected, setIdOfDiffSelected] = createSignal(-1);
    const [previousActionContext, setPreviousActionContext] = createSignal(ActionContext.NAVIGATION);

    const currentDisplayText = createMemo(() => isUserHere() ?
        props.text.get("LOCATION.USER_ACTION.ENTER").get() :
        props.text.get(props.location.name).get()
    );

    const computedTransform = createMemo<TransformDTO>(() => {
        const dns = props.dns();
        const gas = props.gas();
        return {
            xOffset: (props.colonyLocation.transform.xOffset * dns.x) + props.worldOffset.x,
            yOffset: (props.colonyLocation.transform.yOffset * dns.y) + props.worldOffset.y,
            xScale: props.colonyLocation.transform.xScale * gas,
            yScale: props.colonyLocation.transform.yScale * gas,
            zIndex: props.colonyLocation.transform.zIndex
        };
    });

    const onButtonActivation = () => {
        if (isUserHere()) {
            console.log("[delete me] showing location card for: " + props.location.name);
            setShowLocationCard(true);
            setPreviousActionContext(props.actionContext.get());
            props.actionContext.set(ActionContext.INTERACTION);
            return;
        }

        console.log("[delete me] moving to: " + props.colonyLocation.locationID);
        setUserIsHere(true);
        
        const currentLocationId = props.getCurrentLocationId();
        const currentLocation = props.colonyLocation
        const newLocation = props.colonyLocation;

        if (currentLocation && newLocation) {
            const movementVector = {
                x: currentLocation.transform.xOffset - newLocation.transform.xOffset,
                y: currentLocation.transform.yOffset - newLocation.transform.yOffset
            };

            props.setWorldOffset(movementVector);
        }

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
                props.actionContext.set(previousActionContext());
            }            
        });
        const diffSelectSubId = props.plexer.subscribe(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, (event) => {
            setIdOfDiffSelected(event.difficultyID);
        });
        const diffConfirmedSubId = props.plexer.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, (event) => {
            setShowLocationCard(false);
            props.actionContext.set(previousActionContext());
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
                    events={props.plexer}
                    colonyLocation={props.colonyLocation}
                    location={props.location}
                    buffer={props.buffer}
                    backend={props.backend}
                    text={props.text}
                    register={props.register}
                    onClose={() => {setShowLocationCard(false); console.log("[delete me] closing location card for: " + props.location.name)}}
                />
            )
        }
    }

    const computedContainerStyle = createMemo(() => css`
        ${locationContainerStyle}
        ${props.styleOverwrite}
        ${Styles.transformToCSSVariables(computedTransform())}
        ${Styles.TRANSFORM_APPLICATOR}
    `);

    const computedButtonTransform = createMemo<TransformDTO>(() => {
        return {
            ...computedTransform(),
            zIndex: computedTransform().zIndex + 10, // Keep zIndex as is for layering
        }
    });

    console.log('Location transform:', computedTransform());
    console.log('Button transform:', computedButtonTransform());
    console.log('GAS:', props.gas());
    console.log('DNS:', props.dns());
    console.log('World Offset:', props.worldOffset);

    return (
        <div class={computedContainerStyle()} id={"location-" + props.location.name + "-level-" + props.colonyLocation.level}>
            <BufferBasedButton
                styleOverwrite={css`
                    ${namePlateStyle}
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
                topLevelTransform={computedTransform()}
            />
            {appendCard()}
        </div>
    )
}

export default Location;

const locationContainerStyle = css`
    position: absolute;
    left: 0;
    top: 0;
`

const namePlateStyle = css`
    position: absolute;
    left: 0;
    top: 0;
`