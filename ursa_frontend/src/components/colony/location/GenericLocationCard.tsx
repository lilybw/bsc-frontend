import { Component, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { css, keyframes } from '@emotion/css';
import { IBackendBased, IBufferBased, IInternationalized, IRegistering, IStyleOverwritable } from '../../../ts/types';
import {
    ColonyLocationInformation,
    LocationInfoResponseDTO,
    MinigameDifficultyResponseDTO,
    MinigameInfoResponseDTO,
    uint32,
} from '../../../integrations/main_backend/mainBackendDTOs';
import NTAwait from '../../util/NoThrowAwait';
import { IEventMultiplexer } from '../../../integrations/multiplayer_backend/eventMultiplexer';
import MinigameDifficultyListEntry from './MinigameDifficultyListEntry';
import {
    DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
    DIFFICULTY_SELECT_FOR_MINIGAME_EVENT,
    DifficultySelectForMinigameMessageDTO,
} from '../../../integrations/multiplayer_backend/EventSpecifications';
import BufferBasedButton from '../../base/BufferBasedButton';
import GraphicalAsset from '../../base/GraphicalAsset';
import UnderConstruction from '../../base/UnderConstruction';
import { Styles } from '../../../sharedCSS';
import {
    STYLE_LOC_CARD_backgroundImageStyle,
    STYLE_LOC_CARD_descriptionStyleOverwrite,
    STYLE_LOC_CARD_lowerThirdWBackgroundStyle,
    STYLE_LOC_CARD_titleStyleOverwrite,
} from './SpacePortLocationCard';
import { IMultiplayerIntegration } from '@/integrations/multiplayer_backend/multiplayerBackend';
import { MultiplayerMode } from '@/meta/types';

export interface GenericLocationCardProps extends IBufferBased, IBackendBased, IInternationalized, IRegistering<string>, IStyleOverwritable {
    colonyLocation: ColonyLocationInformation;
    info: LocationInfoResponseDTO;
    events: IEventMultiplexer;
    multiplayer: IMultiplayerIntegration;
    closeCard: () => void;
}

const getIdOfSplashArt = (
    level: number,
    choices: {
        level: uint32;
        splashArt: uint32;
        assetCollectionID: uint32;
    }[],
) => {
    for (let choice of choices) {
        if (choice.level === level) {
            return choice.splashArt;
        }
    }
    return choices[0].splashArt;
};

const GenericLocationCard: Component<GenericLocationCardProps> = (props) => {
    const [difficultySelected, setDifficultySelected] = createSignal<DifficultySelectForMinigameMessageDTO | null>(null);
    const [minigameInfo, setMinigameInfo] = createSignal<MinigameInfoResponseDTO | null>(null);
    const log = props.backend.logger.copyFor('gen loc card');
    onMount(() => {
        const diffSelectSubID = props.events.subscribe(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, (data) => {
            if (data.minigameID === props.info.minigameID) {
                setDifficultySelected(data);
            }
        });
        onCleanup(() => props.events.unsubscribe(diffSelectSubID));
    });

    const onDifficultyConfirmed = () => {
        const diff = difficultySelected();
        if (diff !== null) {
            props.events.emit(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, diff);
            log.trace('difficulty confirmed for minigame: ' + diff.minigameID + ' difficulty: ' + diff.difficultyID);
        }
    };

    const isDifficultyUnlocked = (diff: MinigameDifficultyResponseDTO) => {
        return props.colonyLocation.level >= diff.requiredLevel;
    };

    const getMinigameList = () => {
        if (!props.info.minigameID || props.info.minigameID === null || props.info.minigameID === 0) {
            return <></>;
        }
        return (
            <NTAwait
                func={() => props.backend.minigame.getInfo(props.info.minigameID)}
                fallback={() => <UnderConstruction specialText={props.text.get('LOCATION.UNDER_CONSTRUCTION').get()} />}
            >
                {(minigame) => {
                    setMinigameInfo(minigame);
                    return (
                        <div class={difficultyListStyle}>
                            <For each={minigame.difficulties}>
                                {(difficulty, index) => (
                                    <MinigameDifficultyListEntry
                                        colonyLocationID={props.colonyLocation.id}
                                        difficulty={difficulty}
                                        minigame={minigame}
                                        buffer={props.buffer}
                                        register={props.register}
                                        backend={props.backend}
                                        emit={props.events.emit}
                                        text={props.text}
                                        enabled={() => isDifficultyUnlocked(difficulty)}
                                        events={props.events}
                                    />
                                )}
                            </For>
                        </div>
                    )}
                }
            </NTAwait>
        );
    };

    const appendMinigameDescriptionForSelectedDifficulty = () => {
        const diff = difficultySelected();
        const minigame = minigameInfo();
        if (diff === null || minigame === null) {
            return <></>;
        }
        const difficultyDescription = minigame.difficulties.find((d) => d.id === diff.difficultyID)?.description;
        return (
            <div class={minigameDisplayContainerStyle} id="minigame-display-container">
                {props.text.SubTitle(minigame.name)({ styleOverwrite: minigameNameStyle })}
                {difficultyDescription ? 
                    props.text.SubTitle(difficultyDescription)({ styleOverwrite: minigameDescriptionStyle })
                    :
                    props.text.SubTitle(minigame.description)({ styleOverwrite: minigameDescriptionStyle })
                }
            </div>
        )
    }

    return (
        <div class={css`${cardContainerStyle} ${props.styleOverwrite}`} id={'location-card-' + props.info.name}>
            <NTAwait func={() => props.backend.assets.getMetadata(getIdOfSplashArt(props.colonyLocation.level, props.info.appearances))}>
                {(asset) => <GraphicalAsset styleOverwrite={STYLE_LOC_CARD_backgroundImageStyle} backend={props.backend} metadata={asset} />}
            </NTAwait>
            {props.text.Title(props.info.name)({ styleOverwrite: STYLE_LOC_CARD_titleStyleOverwrite })}
            
            {getMinigameList()}
            {appendMinigameDescriptionForSelectedDifficulty()}

            <div class={lowerThirdModifiedStyle}>
                {props.text.SubTitle(props.info.description)({ styleOverwrite: STYLE_LOC_CARD_descriptionStyleOverwrite })}
                <div
                    class={css`
                        display: flex;
                        flex-direction: row;
                        width: 100%;
                        justify-content: space-evenly;
                    `}
                >
                    <BufferBasedButton
                        name={props.text.get('LOCATION.USER_ACTION.LEAVE').get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={props.closeCard}
                    />
                    {props.multiplayer.getMode() === MultiplayerMode.AS_OWNER && <BufferBasedButton
                        name={props.text.get('MINIGAME.START').get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={onDifficultyConfirmed}
                        enable={() => difficultySelected() !== null}
                        disabledStyleOverwrite='color: rgba(255, 255, 255, .5)'
                    />}
                </div>
            </div>
        </div>
    );
};

export default GenericLocationCard;

const minigameDescriptionStyle = css`
    font-size: 1.2rem;
    border-radius: 1rem;
    padding: .5rem;
    ${Styles.GLASS.FAINT_BACKGROUND}
`

const minigameNameStyle = css`
    ${Styles.MINIGAME.TITLE}
    font-size: 2rem;
    text-align: center;
    letter-spacing: 0.5rem;
`

const minigameDisplayContainerStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    
    right: 1vw;
    top: 11vh;
    padding: 1vw;
    width: calc(50% - 2vw);
    z-index: 1;
    border-radius: 1rem;
    row-gap: .8vh;

    ${Styles.GLASS.FAINT_BACKGROUND}
`;

const lowerThirdModifiedStyle = css`
    ${STYLE_LOC_CARD_lowerThirdWBackgroundStyle}
    height: 20%;
`;

const cardContainerStyle = css`
    display: flex;
    flex-direction: column;
`;

const difficultyListStyle = css`
    display: flex;
    flex-direction: column;
    position: absolute;

    row-gap: 1rem;
    height: 45%;
    width: 18%;
    left: 1vw;
    top: 40%;
    transform: translateY(-50%);
    border-radius: 1rem;
`;
