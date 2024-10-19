import { Component, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { css, keyframes } from "@emotion/css";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "../../../ts/types";
import { ColonyLocationInformation, LocationInfoResponseDTO, MinigameDifficultyResponseDTO, uint32 } from "../../../integrations/main_backend/mainBackendDTOs";
import BufferBasedButton from "../../BufferBasedButton";
import NTAwait from "../../util/NoThrowAwait";
import GraphicalAsset from "../../GraphicalAsset";
import { IEventMultiplexer } from "../../../integrations/multiplayer_backend/eventMultiplexer";
import MinigameDifficultyListEntry from "./MinigameDifficultyListEntry";
import { DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, DifficultySelectForMinigameMessageDTO } from "../../../integrations/multiplayer_backend/EventSpecifications";
import UnderConstruction from "../../UnderConstruction";

export interface GenericLocationCardProps extends IBufferBased, IBackendBased, IInternationalized, IRegistering<string> {
    colonyLocation: ColonyLocationInformation;
    info: LocationInfoResponseDTO;
    events: IEventMultiplexer;
    closeCard: () => void;
}

const getIdOfSplashArt = (level: number, choices: {
    level: uint32;
    splashArt: uint32;
    assetCollectionID: uint32;
}[]) => {
    for (let choice of choices) {
        if (choice.level === level) {
            return choice.splashArt;
        }
    }
    return choices[0].splashArt;
}

const GenericLocationCard: Component<GenericLocationCardProps> = (props) => {
    const [difficultySelected, setDifficultySelected] = createSignal<DifficultySelectForMinigameMessageDTO | null>(null);

    onMount(() => {
        const diffSelectSubID = props.events.subscribe(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, (data) => {
            if (data.minigameID === props.info.minigameID) {
                setDifficultySelected(data);
            }
        });
        onCleanup(() => props.events.unsubscribe(diffSelectSubID));
    })

    const onDifficultyConfirmed = () => {
        const diff = difficultySelected();
        if (diff !== null) {
            props.events.emit(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, diff);
            console.log("[delete me] difficulty confirmed for minigame: " + diff.minigameID + " difficulty: " + diff.difficultyID);
        }
    }

    const isDifficultyUnlocked = (diff: MinigameDifficultyResponseDTO) => {
        return props.colonyLocation.level >= diff.requiredLevel;
    }

    return (
        <div class={cardContainerStyle} id={"location-card-" + props.info.name}>
            <div class={cardContentStyle}>
                <div class={backgroundContainerStyle}>
                    <NTAwait func={() => props.backend.getAssetMetadata(getIdOfSplashArt(props.colonyLocation.level, props.info.appearances))}>
                        {(asset) => (
                            <>
                                <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                                <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                            </>
                        )}
                    </NTAwait>
                </div>
                {props.text.Title(props.info.name)({styleOverwrite: titleStyleOverwrite})}
                <div class={contentGridStyle}>
                    <div class={difficultyListStyle}>
                        <NTAwait 
                            func={() => props.backend.getMinigameInfo(props.info.minigameID)}
                            fallback={() => <UnderConstruction 
                                specialText={props.text.get("LOCATION.UNDER_CONSTRUCTION").get()}
                            />}
                        >
                            {(minigame) => 
                                <Show
                                    when={minigame.difficulties.length > 0}
                                    fallback={<UnderConstruction />}
                                >
                                    <For each={minigame.difficulties}>
                                        {(difficulty, index) =>
                                            <MinigameDifficultyListEntry 
                                                difficulty={difficulty} 
                                                minigameID={minigame.id} 
                                                buffer={props.buffer} 
                                                register={props.register} 
                                                backend={props.backend} 
                                                emit={props.events.emit}
                                                text={props.text}
                                                enabled={() => isDifficultyUnlocked(difficulty)}
                                                index={index()}
                                                maxIndex={minigame.difficulties.length - 1}
                                            />
                                        }
                                    </For>
                                </Show>
                            }
                        </NTAwait>
                    </div>
                    <div class={imageContainerStyle}>
                        <NTAwait func={() => props.backend.getAssetMetadata(getIdOfSplashArt(props.colonyLocation.level, props.info.appearances))}>
                            {(asset) =>
                                <GraphicalAsset styleOverwrite={imageStyle} backend={props.backend} metadata={asset} />
                            }
                        </NTAwait>
                    </div>
                    {props.text.SubTitle(props.info.description)({styleOverwrite: descriptionStyleOverwrite})}
                </div>
                <div class={buttonContainerStyle}>
                    <BufferBasedButton 
                        name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={props.closeCard}
                    />
                    <BufferBasedButton 
                        name={props.text.get("MINIGAME.START").get()}
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

const moveBackground = keyframes`
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
`;

const rotate = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const orbit = keyframes`
    0% { transform: rotate(0deg) translateX(50px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
`;

const cardContainerStyle = css`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
`;

const cardContentStyle = css`
    position: relative;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 20px;
    padding: 1.5rem;
    width: 80vw;
    max-width: 1000px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const backgroundContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 100%;
    display: flex;
    animation: ${moveBackground} 60s linear infinite;
`;

const backgroundImageStyle = css`
    width: 50%;
    height: 100%;
    object-fit: cover;
    opacity: 0.1;
`;

const titleStyleOverwrite = css`
    font-size: 2rem;
    color: #00ffff;
    text-align: center;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    position: relative;
    z-index: 1;
`;

const contentGridStyle = css`
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem;
    height: 100%;
    position: relative;
    z-index: 1;
`;

const difficultyListStyle = css`
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 0.5rem;
    max-height: 40vh;
    overflow-y: auto;
`;

const imageContainerStyle = css`
    grid-column: 2;
    grid-row: 1 / 3;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`;

const imageStyle = css`
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`;

const descriptionStyleOverwrite = css`
    font-size: 0.9rem;
    color: #a0a0a0;
    margin: 0;
    max-height: 15vh;
    overflow-y: auto;
`;

const buttonContainerStyle = css`
    display: flex;
    justify-content: center;
    gap: 1rem;
    position: relative;
    z-index: 1;
`;

const fallbackAnimationStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #00ffff;
    font-size: 1.2rem;
    text-align: center;
`;

const spaceStationStyle = css`
    width: 100px;
    height: 100px;
    background-color: #333;
    border-radius: 50%;
    position: relative;
    margin-bottom: 20px;
    animation: ${rotate} 10s linear infinite;
    &:before, &:after {
        content: '';
        position: absolute;
        background-color: #555;
    }
    &:before {
        width: 120px;
        height: 20px;
        top: 40px;
        left: -10px;
    }
    &:after {
        width: 20px;
        height: 120px;
        top: -10px;
        left: 40px;
    }
`;

const satelliteStyle = css`
    width: 20px;
    height: 20px;
    background-color: #00ffff;
    border-radius: 50%;
    position: absolute;
    animation: ${orbit} 5s linear infinite;
`;