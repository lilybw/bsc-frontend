import { Accessor, Component, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import {
    ColonyInfoResponseDTO,
    ColonyLocationInformation,
    LocationInfoResponseDTO,
    TransformDTO,
} from '../../../integrations/main_backend/mainBackendDTOs';
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from '../../../ts/types';
import { css } from '@emotion/css';
import { IEventMultiplexer } from '../../../integrations/multiplayer_backend/eventMultiplexer';
import {
    DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
    DIFFICULTY_SELECT_FOR_MINIGAME_EVENT,
    ENTER_LOCATION_EVENT,
    PLAYER_MOVE_EVENT,
} from '../../../integrations/multiplayer_backend/EventSpecifications';
import AssetCollection from '../AssetCollection';
import { Styles } from '../../../styles/sharedCSS';
import LocationCard from './LocationCard';
import { WrappedSignal } from '../../../ts/wrappedSignal';
import { ActionContext, TypeIconTuple } from '../../../ts/actionContext';
import { IMultiplayerIntegration } from '../../../integrations/multiplayer_backend/multiplayerBackend';
import BufferBasedButton from '../../base/BufferBasedButton';

interface LocationProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string>, IInternationalized {
    colony: ColonyInfoResponseDTO;
    colonyLocation: ColonyLocationInformation;
    location: LocationInfoResponseDTO;
    plexer: IEventMultiplexer;
    actionContext: WrappedSignal<TypeIconTuple>;
    multiplayer: IMultiplayerIntegration;
    /**
     * Graphical Asset Scalar
     */
    gas: Accessor<number>;
    transform: WrappedSignal<TransformDTO>;
    enable: Accessor<boolean>;
}

const calcNamePlatePosition = (y: number) => {
    //However this should bring the nameplate towards the center of the location in case we're close to the top of the screen.
    return y < 100 ? y + 100 : y - 50;
};

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
};

const Location: Component<LocationProps> = (props) => {
    const [isUserHere, setUserIsHere] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [idOfDiffSelected, setIdOfDiffSelected] = createSignal(-1);
    const [previousActionContext, setPreviousActionContext] = createSignal(ActionContext.NAVIGATION);
    const log = props.backend.logger.copyFor('loc ' + props.colonyLocation.id);
    const internalOrigin = "location-"+props.colonyLocation.id;

    const currentDisplayText = createMemo(() =>
        isUserHere() ? props.text.get('LOCATION.USER_ACTION.ENTER').get() : props.text.get(props.location.name).get(),
    );

    const onButtonActivation = () => {
        if (isUserHere()) {
            setShowLocationCard(true);
            setPreviousActionContext(props.actionContext.get());
            props.actionContext.set(ActionContext.INTERACTION);
            props.plexer.emit(ENTER_LOCATION_EVENT, {
                id: props.colonyLocation.id,
            }, internalOrigin);
            return;
        }

        props.plexer.emit(PLAYER_MOVE_EVENT, {
            playerID: props.backend.player.local.id,
            colonyLocationID: props.colonyLocation.id,
        }, internalOrigin);
    };

    onMount(() => {
        const playerMoveSubId = props.plexer.subscribe(PLAYER_MOVE_EVENT, (event) => {
            if (event.playerID !== props.backend.player.local.id) return;

            if (event.colonyLocationID === props.colonyLocation.id) {
                setUserIsHere(true);
            } else {
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
    });

    const onLocationCardClose = () => {
        setShowLocationCard(false);
        props.actionContext.set(previousActionContext());
    };

    const appendCard = () => {
        if (showLocationCard()) {
            return (
                <LocationCard
                    multiplayer={props.multiplayer}
                    colony={props.colony}
                    events={props.plexer}
                    colonyLocation={props.colonyLocation}
                    location={props.location}
                    buffer={props.buffer}
                    backend={props.backend}
                    text={props.text}
                    register={props.register}
                    onClose={onLocationCardClose}
                />
            );
        }
    };

    const computedContainerStyle = createMemo(
        () => css`
            display: flex;
            ${Styles.POSITION.transformToCSSVariables(props.transform.get())}
            ${Styles.POSITION.TRANSFORM_APPLICATOR}
            ${props.styleOverwrite}
        `,
    );
    return (
        <div class={computedContainerStyle()} id={'location-' + props.location.name + '-level-' + props.colonyLocation.level}>
            <AssetCollection
                id={getCollectionForLevel(0, props.location).assetCollectionID}
                backend={props.backend}
            />
            <BufferBasedButton
                styleOverwrite={namePlateStyle}
                onActivation={onButtonActivation}
                name={currentDisplayText}
                buffer={props.buffer}
                register={props.register}
                charBaseStyleOverwrite={namePlateTextOverwrite}
                enable={props.enable}
                disabledStyleOverwrite={css`color: rgba(255, 255, 255, 0.5);`}
            />
            {appendCard()}
        </div>
    );
};

export default Location;

const namePlateStyle = css`
    border-radius: 1rem;
    padding: .5rem;
    z-index: 100;
    ${Styles.GLASS.FAINT_BACKGROUND}
    transform: translate(-50%, -200%);
`;
const namePlateTextOverwrite = css`
    text-shadow: 5px 5px 10px black;
    font-size: 2.5rem;
    filter: none;
`;
