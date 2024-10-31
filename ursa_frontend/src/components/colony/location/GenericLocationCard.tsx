import { Component, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { css, keyframes } from '@emotion/css';
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from '../../../ts/types';
import {
    ColonyLocationInformation,
    LocationInfoResponseDTO,
    MinigameDifficultyResponseDTO,
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

export interface GenericLocationCardProps extends IBufferBased, IBackendBased, IInternationalized, IRegistering<string> {
    colonyLocation: ColonyLocationInformation;
    info: LocationInfoResponseDTO;
    events: IEventMultiplexer;
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
            log.info('difficulty confirmed for minigame: ' + diff.minigameID + ' difficulty: ' + diff.difficultyID);
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
                {(minigame) => (
                    <div class={difficultyListStyle}>
                        <For each={minigame.difficulties}>
                            {(difficulty, index) => (
                                <MinigameDifficultyListEntry
                                    difficulty={difficulty}
                                    minigameID={minigame.id}
                                    buffer={props.buffer}
                                    register={props.register}
                                    backend={props.backend}
                                    emit={props.events.emit}
                                    text={props.text}
                                    enabled={() => isDifficultyUnlocked(difficulty)}
                                />
                            )}
                        </For>
                    </div>
                )}
            </NTAwait>
        );
    };

    return (
        <div class={cardContainerStyle} id={'location-card-' + props.info.name}>
            <NTAwait func={() => props.backend.assets.getMetadata(getIdOfSplashArt(props.colonyLocation.level, props.info.appearances))}>
                {(asset) => <GraphicalAsset styleOverwrite={STYLE_LOC_CARD_backgroundImageStyle} backend={props.backend} metadata={asset} />}
            </NTAwait>
            {props.text.Title(props.info.name)({ styleOverwrite: STYLE_LOC_CARD_titleStyleOverwrite })}
            {getMinigameList()}

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
                    <BufferBasedButton
                        name={props.text.get('MINIGAME.START').get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={onDifficultyConfirmed}
                        enable={() => difficultySelected() !== null}
                    />
                </div>
            </div>
        </div>
    );
};

export default GenericLocationCard;

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
    width: 16%;
    left: 1rem;
    top: 40%;
    padding: 1rem;
    transform: translateY(-50%);
    border-radius: 1rem;

    ${Styles.GLASS.FAINT_BACKGROUND}
`;
