import { Component, createSignal } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css, keyframes } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";
import NTAwait from "../../util/NoThrowAwait";
import GraphicalAsset from "../../GraphicalAsset";
import { ColonyInfoResponseDTO, OpenColonyRequestDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { error } from "console";
import { LOBBY_CLOSING_EVENT, LobbyClosingMessageDTO } from "../../../integrations/multiplayer_backend/EventSpecifications";

interface SpacePortCardProps extends GenericLocationCardProps {
    colony: ColonyInfoResponseDTO;
}

const SpacePortLocationCard: Component<SpacePortCardProps> = (props) => {
    const [state, setState] = createSignal<'initial' | 'open' | 'join'>('initial');
    const [colonyCode, setColonyCode] = createSignal<number | null>(null);

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
            validDurationMS: 3600000 * 12, // 12 hours
            playerID: props.backend.localPlayer.id,
            latestVisit: getCurrentDateTimeLocaleString(),
        };

        const openResponse = await props.backend.openColony(props.colony.id, request);

        if (openResponse.err !== null) {
            return openResponse.err
        }

        setColonyCode(openResponse.res.code)

        // TODO: open colony in multiplexer?
    };

    const closeColony = async () => {
        const result = await props.backend.closeColony(props.colony.id, {
            playerId: props.backend.localPlayer.id
        })
        props.events.emit(LOBBY_CLOSING_EVENT, {});
        setState('initial');
    }

    const renderInitialState = () => (
        <>
            <div class={imageContainerStyle}>
                <NTAwait func={() => props.backend.getAssetMetadata(props.info.appearances[0].splashArt)}>
                    {(asset) =>
                        <GraphicalAsset styleOverwrite={imageStyle} backend={props.backend} metadata={asset} />
                    }
                </NTAwait>
            </div>
            <div class={contentGridStyle}>
                <BufferBasedButton
                    name={props.text.get("LOCATION.SPACE_PORT.OPEN_COLONY").get()}
                    buffer={props.buffer}
                    register={props.register}
                    onActivation={() => {
                        setState('open');
                        openColony();
                    }}
                >
                    {props.text.get("COLONY.UI_BUTTON.OPEN").get()}
                </BufferBasedButton>
                <div class={descriptionStyle}>
                    {props.text.SubTitle(props.info.description)({styleOverwrite: descriptionStyleOverwrite})}
                </div>
                <BufferBasedButton
                    name={props.text.get("LOCATION.SPACE_PORT.JOIN_COLONY").get()}
                    buffer={props.buffer}
                    register={props.register}
                    onActivation={() => setState('join')}
                >
                    {props.text.get("SPACEPORT.JOIN").get()}
                </BufferBasedButton>
            </div>
        </>
    );

    const renderOpenState = () => (
        <div class={openStateContentStyle}>
            <div class={openStateLeftColumnStyle}>
                <BufferBasedButton
                    name={props.text.get("COLONY.UI_BUTTON.CLOSE").get()}
                    buffer={props.buffer}
                    register={props.register}
                    onActivation={() => closeColony()}
                >
                    {props.text.get("COLONY.UI_BUTTON.CLOSE").get()}
                </BufferBasedButton>
                <div class={colonyCodeContainerStyle}>
                    <div class={colonyCodeLabelStyle}>
                        {props.text.get("SPACEPORT.COLONY_CODE_LABEL").get()}
                    </div>
                    <div class={colonyCodeStyle}>
                        {colonyCode() || props.text.get("SPACEPORT.LOADING_CODE").get()}
                    </div>
                </div>
            </div>
            <div class={openStateRightColumnStyle}>
                <NTAwait func={() => props.backend.getAssetMetadata(props.info.appearances[0].splashArt)}>
                    {(asset) =>
                        <GraphicalAsset styleOverwrite={openStateImageStyle} backend={props.backend} metadata={asset} />
                    }
                </NTAwait>
            </div>
        </div>
    );

    const renderJoinState = () => (
        <div class={stateContentStyle}>
            {props.text.SubTitle(props.text.get("SPACEPORT.JOIN_COLONY_DESCRIPTION").get())({styleOverwrite: descriptionStyleOverwrite})}
            {/* Add your join colony logic here */}
        </div>
    );

    return (
        <div class={cardContainerStyle} id={"location-card-space-port"}>
            <div class={cardContentStyle}>
                <div class={backgroundContainerStyle}>
                    <NTAwait func={() => props.backend.getAssetMetadata(props.info.appearances[0].splashArt)}>
                        {(asset) => (
                            <>
                                <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                                <GraphicalAsset styleOverwrite={backgroundImageStyle} backend={props.backend} metadata={asset} />
                            </>
                        )}
                    </NTAwait>
                </div>
                {props.text.Title(props.info.name)({styleOverwrite: titleStyleOverwrite})}
                {state() === 'initial' && renderInitialState()}
                {state() === 'open' && renderOpenState()}
                {state() === 'join' && renderJoinState()}
                <div class={buttonContainerStyle}>
                    <BufferBasedButton 
                        name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={props.closeCard}
                    />
                    {state() !== 'initial' && (
                        <BufferBasedButton 
                            name={props.text.get("SPACEPORT.BACK").get()}
                            buffer={props.buffer}
                            register={props.register}
                            onActivation={() => setState('initial')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpacePortLocationCard;

const moveBackground = keyframes`
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
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
    grid-template-columns: 1fr 2fr 1fr;
    gap: 1rem;
    align-items: center;
    position: relative;
    z-index: 1;
`;

const imageContainerStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    margin-bottom: 1rem;
`;

const imageStyle = css`
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`;

const descriptionStyle = css`
    text-align: center;
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

const stateContentStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
`;

const openStateContentStyle = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
    position: relative;
    z-index: 1;
`;

const openStateLeftColumnStyle = css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const openStateRightColumnStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const openStateImageStyle = css`
    width: 100%;
    height: auto;
    max-height: 300px;
    object-fit: contain;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`;

const colonyCodeContainerStyle = css`
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 1rem;
`;

const colonyCodeLabelStyle = css`
    font-size: 1rem;
    color: #00ffff;
    margin-bottom: 0.5rem;
`;

const colonyCodeStyle = css`
    font-size: 1.2rem;
    color: #ffffff;
    font-weight: bold;
    word-break: break-all;
`;