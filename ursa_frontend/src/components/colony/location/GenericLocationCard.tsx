import { Component, For } from "solid-js";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "../../../ts/types";
import { ColonyLocationInformation, LocationInfoResponseDTO, uint32 } from "../../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";
import NTAwait from "../../util/NoThrowAwait";
import GraphicalAsset from "../../GraphicalAsset";

export interface GenericLocationCardProps extends IBufferBased, IBackendBased, IInternationalized, IRegistering<string>{
    colonyLocation: ColonyLocationInformation;
    info: LocationInfoResponseDTO;
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
    return (
        <div class={cardContainerStyle} id={"location-card-" + props.info.name}>
            {props.text.Title(props.info.name)({styleOverwrite: titleStyleOverwrite})}
            <div class={sideBySideStyle}>
                <div class={difficultyListStyle}>
                    <NTAwait func={() => props.backend.getMinigameInfo(props.info.minigameID)}>{(minigame) => 
                            <For each={minigame.difficulties}>{(difficulty) =>
                                <div>{difficulty.name}</div>
                            }</For>
                    }</NTAwait>
                </div>
                <div class={rightSideContentStyle}>
                    <NTAwait func={() => props.backend.getAssetMetadata(getIdOfSplashArt(props.colonyLocation.level, props.info.appearances))}>{(asset) =>
                        <GraphicalAsset styleOverwrite={imageStyleOverride} backend={props.backend} metadata={asset} />
                    }</NTAwait>
                    {props.text.SubTitle(props.info.description)({styleOverwrite: descriptionStyleOverwrite})}
                </div>
            </div>
            <BufferBasedButton 
                name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                buffer={props.buffer}
                register={props.register}
                onActivation={props.closeCard}
                styleOverwrite={leaveButtonOverrideStyle}
            />
        </div>
    )
}
export default GenericLocationCard;

const imageStyleOverride = css`
--size: 20vw;
width: var(--size);
height: var(--size);
`

const titleStyleOverwrite = css`
font-size: 3.5rem;
width: 100%;
text-align: center;
top: 0;
margin-top: -10vh;
`
const descriptionStyleOverwrite = css`
font-size: 1.5rem;
`

const sideBySideStyle = css`
display: flex;
flex-direction: row;
height: 100%;
width: 100%;
`

const difficultyListStyle = css`
display: flex;
flex-direction: column;
height: 100%;
width: 30%;
justify-content: flex-start;
align-items: center;
column-gap: 1rem;
`

const rightSideContentStyle = css`
display: flex;
flex-direction: column;
height: 100%;
width: 70%;
column-gap: 1rem;
`

const leaveButtonOverrideStyle = css`
width: 100%;
align-self: center;

`

const cardContainerStyle = css`

`