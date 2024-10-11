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
    plexer: IEventMultiplexer;
    actionContext: WrappedSignal<TypeIconTuple>;
    /**
     * Graphical Asset Scalar
     */
    gas: Accessor<number>;
    transform: WrappedSignal<TransformDTO>;
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
    const [previousActionContext, setPreviousActionContext] = createSignal(ActionContext.NAVIGATION);


    const currentDisplayText = createMemo(() => isUserHere() ?
        props.text.get("LOCATION.USER_ACTION.ENTER").get() :
        props.text.get(props.location.name).get()
    );

    const onButtonActivation = () => {
        if (isUserHere()) {
            console.log("[delete me] showing location card for: " + props.location.name);
            setShowLocationCard(true);
            setPreviousActionContext(props.actionContext.get());
            props.actionContext.set(ActionContext.INTERACTION);
            return;
        }

        console.log("[delete me] moving to: " + props.colonyLocation);
        setUserIsHere(true);
        props.plexer.emit(PLAYER_MOVE_EVENT, {
            playerID: props.backend.localPlayer.id,
            locationID: props.colonyLocation.id,
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

    const computedContainerStyle = createMemo(() => css`${locationContainerStyle} ${props.styleOverwrite}`);
    const computedButtonTransform = createMemo<TransformDTO>(() => {
        return {
            ...props.transform.get(),
            zIndex: props.transform.get().zIndex + 10, // Keep zIndex as is for layering
        }
    });

    return (
        <div class={computedContainerStyle()} id={"location-" + props.location.name + "-level-" + props.colonyLocation.level}>
            <BufferBasedButton
                styleOverwrite={css`
                    ${namePlateStyle}
                    ${Styles.transformToCSSVariables(computedButtonTransform())}
                    ${Styles.TRANSFORM_APPLICATOR}   
                `}
                onActivation={onButtonActivation}
                name={currentDisplayText} 
                buffer={props.buffer}
                register={props.register}
            />
            <AssetCollection 
                id={getCollectionForLevel(0, props.location).assetCollectionID}
                backend={props.backend}
                topLevelTransform={props.transform}
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