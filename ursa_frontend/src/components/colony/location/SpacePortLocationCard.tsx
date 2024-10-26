import { Component, createSignal, createEffect, createMemo } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css, keyframes } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";
import NTAwait from "../../util/NoThrowAwait";
import GraphicalAsset from "../../GraphicalAsset";
import { ColonyCode, ColonyInfoResponseDTO, OpenColonyRequestDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { LOBBY_CLOSING_EVENT, PLAYER_MOVE_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications";
import { IMultiplayerIntegration } from "../../../integrations/multiplayer_backend/multiplayerBackend";
import { ColonyState, MultiplayerMode } from "../../../meta/types";
import { Styles } from "../../../sharedCSS";

interface SpacePortCardProps extends GenericLocationCardProps {
    colony: ColonyInfoResponseDTO;
    multiplayer: IMultiplayerIntegration;
}

const SpacePortLocationCard: Component<SpacePortCardProps> = (props) => {
    const [connectErr, setConnectErr] = createSignal<string | undefined>();
    const log = props.backend.logger.copyFor("space port");

    const openColony = async () => {
        const getCurrentDateTimeLocaleString = () => {
            const now = new Date();
            return now.toLocaleString('en-US', { 
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        };

        const request: OpenColonyRequestDTO = {
            validDurationMS: 3600000 * 12,
            playerID: props.backend.player.local.id,
            latestVisit: getCurrentDateTimeLocaleString(),
        };

        const openResponse = await props.backend.colony.open(props.colony.id, request);

        if (openResponse.err !== null) {
            return openResponse.err;
        }

        const err = await props.multiplayer.connect(openResponse.res.code, () => {});
        if (err !== null) {
            setConnectErr(err);
            return;
        }
        props.events.emit(PLAYER_MOVE_EVENT, {
            playerID: props.backend.player.local.id,
            colonyLocationID: props.colonyLocation.id
        })
    };

    const closeColony = async () => {
        await props.multiplayer.disconnect();
    };

    const formatCodeForDisplay = (code: number): string => {
        const str = code.toString();
        let formatted = "";
        //space after each 2 digits, but the last
        for (let i = 0; i < str.length; i++) {
            if (i % 2 === 0 && i !== str.length -1) {
                formatted += " " + str[i];
            } else {
                formatted += str[i];
            }
        }
        return formatted;
    }

    const getOpenLayout = (code: ColonyCode) => (
        <>
            <div class={css`${Styles.MENU_INPUT} ${codeDisplayStyle}`}>
                {formatCodeForDisplay(code)}
            </div>
            <div class={lowerThirdWBackgroundStyle}>
                <div class={css`display: flex; flex-direction: row; width: 100%; justify-content: space-evenly;`}>
                    <BufferBasedButton 
                        name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={() => {
                            props.closeCard();
                        }}
                    />
                    {props.multiplayer.getMode() === MultiplayerMode.AS_OWNER && 
                    <BufferBasedButton
                        name={props.text.get("LOCATION.SPACE_PORT.CLOSE_COLONY").get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={() => closeColony()}
                    />}
                </div>
            </div>
        </>
    );
    

    const getClosedLayout = () => (        
        <div class={lowerThirdWBackgroundStyle}>
            <div class={descriptionStyle}>
                {props.text.SubTitle(props.info.description)({styleOverwrite: descriptionStyleOverwrite})}
            </div>
            <div class={css`display: flex; flex-direction: row; width: 100%; justify-content: space-evenly;`}>
                <BufferBasedButton 
                    name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                    buffer={props.buffer}
                    register={props.register}
                    onActivation={props.closeCard}
                />
                {props.multiplayer.getMode() === MultiplayerMode.AS_OWNER && 
                <BufferBasedButton
                    name={props.text.get("LOCATION.SPACE_PORT.OPEN_COLONY").get()}
                    buffer={props.buffer}
                    register={props.register}
                    onActivation={openColony}
                />}
            </div>
        </div>
    )
    

    const getBody = createMemo(() => {
        const code = props.multiplayer.getCode();
        if (code !== null) {
            return getOpenLayout(code);
        } else {
            return getClosedLayout();
        }
    })

    return (
        <div class={cardContainerStyle} id={"location-card-space-port"}>
            {props.text.Title(props.info.name)({styleOverwrite: titleStyleOverwrite})}

            {getBody()}

            <NTAwait func={() => props.backend.assets.getMetadata(props.info.appearances[0].splashArt)}>
                {(asset) => (
                    <>
                        <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                    </>
                )}
            </NTAwait>
        </div>
    );
};

export default SpacePortLocationCard;

const codeDisplayStyle = css`
    position: absolute; 
    top: 50%;
    left: 50%;
    height: fit-content;
    width: 80%;
    transform: translate(-50%, -50%);

    z-index: 1;
    font-size: 8rem;
    text-align: center;
    ${Styles.GLASS.BACKGROUND}
`

const lowerThirdWBackgroundStyle = css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;

    z-index: 1;
    width: 100%;
    height: fit-content;
    padding-bottom: 1rem;   
    padding-top: 1rem;    
    row-gap: .5rem;
    bottom: 0;
    border-radius: 10px;

    ${Styles.GLASS.BACKGROUND}
`

const cardContainerStyle = css`
    display: flex;
    flex-direction: column;
`;

const backgroundImageStyle = css`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1rem;
`;

const titleStyleOverwrite = css`
    position: absolute;
    top: 2rem;
    width: 100%;
    font-size: 2rem;
    text-align: center;
    z-index: 1;
    margin: 0;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;

const descriptionStyle = css`
    text-align: center;
    filter: none;
    font-size: 3rem;
    margin: 0;
    adding: 0;
`;

const descriptionStyleOverwrite = css`
    font-size: 1.1rem;
    text-shadow: none;
`;