import { Component, createSignal, createEffect } from "solid-js";
import { GenericLocationCardProps } from "./GenericLocationCard";
import { css, keyframes } from "@emotion/css";
import BufferBasedButton from "../../BufferBasedButton";
import NTAwait from "../../util/NoThrowAwait";
import GraphicalAsset from "../../GraphicalAsset";
import { ColonyInfoResponseDTO, OpenColonyRequestDTO } from "../../../integrations/main_backend/mainBackendDTOs";
import { LOBBY_CLOSING_EVENT } from "../../../integrations/multiplayer_backend/EventSpecifications";
import { IMultiplayerIntegration } from "../../../integrations/multiplayer_backend/multiplayerBackend";
import { ColonyState } from "../../../meta/types";

interface SpacePortCardProps extends GenericLocationCardProps {
    colony: ColonyInfoResponseDTO;
    multiplayer: IMultiplayerIntegration;
}

const CODE_LENGTH = 6;

const SpacePortLocationCard: Component<SpacePortCardProps> = (props) => {
    const [state, setState] = createSignal<'initial' | 'open' | 'join'>(
        props.multiplayer.getState() === ColonyState.OPEN ? 'open' : 'initial'
    );
    const [colonyCode, setColonyCode] = createSignal<number | null>(null);
    const [codeStatus, setCodeStatus] = createSignal<'idle' | 'valid' | 'invalid'>('idle');
    const [joinCode, setJoinCode] = createSignal(
        Array(CODE_LENGTH).fill('').map(() => createSignal(''))
    );
    let validationTimeout: NodeJS.Timeout;
    let statusTimeout: NodeJS.Timeout;
    const log = props.backend.logger.copyFor("space port");

    createEffect(() => {
        log.subtrace("Buffer value:" + props.buffer());
        if (state() === 'join') {
            const value = props.buffer();
            console.log("Processing buffer in join state:", value);
    
            if (!/^\d*$/.test(value)) {
                joinCode().forEach(([_, setValue]) => setValue(''));
                return;
            }
    
            const numbers = value.split('');
            joinCode().forEach(([_, setValue], index) => {
                setValue(numbers[index] || '');
            });
    
            if (value.length === CODE_LENGTH) {
                validateCode(numbers);
            }
        }
    });

    const validateCode = async (code: string[]) => {
        clearTimeout(validationTimeout);
        clearTimeout(statusTimeout);

        try {
            const result = await props.backend.joinColony(parseInt(code.join('')));
            if (result.err === null) {
                setCodeStatus('valid');
                statusTimeout = setTimeout(() => {
                    setState('initial');
                    joinCode().forEach(([_, setValue]) => setValue(''));
                    setCodeStatus('idle');
                }, 1000);
            } else {
                setCodeStatus('invalid');
                statusTimeout = setTimeout(() => {
                    setCodeStatus('idle');
                    joinCode().forEach(([_, setValue]) => setValue(''));
                }, 1500);
            }
        } catch (error) {
            setCodeStatus('invalid');
            statusTimeout = setTimeout(() => {
                setCodeStatus('idle');
                joinCode().forEach(([_, setValue]) => setValue(''));
            }, 1500);
        }
    };

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
            playerID: props.backend.localPlayer.id,
            latestVisit: getCurrentDateTimeLocaleString(),
        };

        const openResponse = await props.backend.openColony(props.colony.id, request);

        if (openResponse.err !== null) {
            return openResponse.err;
        }

        setColonyCode(openResponse.res.code);
        setState('open');
        props.multiplayer.connect(openResponse.res.code, () => {});
    };

    const closeColony = async () => {
        props.backend.closeColony(props.colony.id, {
            playerId: props.backend.localPlayer.id
        });
        setColonyCode(null);
        setState('initial');
        props.multiplayer.disconnect();
    };

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
                    onActivation={() => openColony()}
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

    const renderOpenState = () => {
        // If we're open but don't have the code, get it
        if (props.multiplayer.getState() === ColonyState.OPEN && !colonyCode()) {
            props.backend.getColonyCode(props.colony.id).then(result => {
                if (result.err === null && result.res) {
                    setColonyCode(result.res.code);
                }
            });
        }

        return (
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
    };

    const renderJoinState = () => (
        <div class={joinStateContentStyle}>
            <div class={imageContainerStyle}>
                <NTAwait func={() => props.backend.getAssetMetadata(props.info.appearances[0].splashArt)}>
                    {(asset) =>
                        <GraphicalAsset styleOverwrite={joinStateImageStyle} backend={props.backend} metadata={asset} />
                    }
                </NTAwait>
            </div>
            <div class={joinInputContainerStyle}>
                <div class={joinInputLabelStyle}>
                    {props.text.get("SPACEPORT.INSERT_CODE").get()}
                </div>
                <div class={codeDisplayStyle}>
                    {joinCode().map(([get]) => (
                        <div
                            class={`${codeBoxStyle} 
                                   ${get() ? filledCodeBoxStyle : ''} 
                                   ${codeStatus() === 'valid' ? validInputStyle : ''} 
                                   ${codeStatus() === 'invalid' ? invalidInputStyle : ''}`}
                        >
                            {get() || ' '}
                        </div>
                    ))}
                </div>
            </div>
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
                {props.multiplayer.getState() === ColonyState.OPEN 
                    ? renderOpenState()
                    : <>
                        {state() === 'initial' && renderInitialState()}
                        {state() === 'open' && renderOpenState()}
                        {state() === 'join' && renderJoinState()}
                      </>
                }
                <div class={buttonContainerStyle}>
                    <BufferBasedButton 
                        name={props.text.get("LOCATION.USER_ACTION.LEAVE").get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={() => {
                            clearTimeout(validationTimeout);
                            clearTimeout(statusTimeout);
                            props.closeCard();
                        }}
                    />
                    {state() !== 'initial' && props.multiplayer.getState() !== ColonyState.OPEN && (
                        <BufferBasedButton 
                            name={props.text.get("SPACEPORT.BACK").get()}
                            buffer={props.buffer}
                            register={props.register}
                            onActivation={() => {
                                clearTimeout(validationTimeout);
                                clearTimeout(statusTimeout);
                                setState('initial');
                                joinCode().forEach(([_, setValue]) => setValue(''));
                                setCodeStatus('idle');
                            }}
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

const glowPulse = keyframes`
    0% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.5); }
    50% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.8); }
    100% { box-shadow: 0 0 5px rgba(0, 255, 255, 0.5); }
`;

const invalidShake = keyframes`
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-10px); }
    80% { transform: translateX(10px); }
`;

const validPulse = keyframes`
    0% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
    50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.8); }
    100% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
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

const joinStateContentStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    position: relative;
    z-index: 1;
`;

const joinStateImageStyle = css`
    width: 100%;
    max-width: 400px;
    height: auto;
    object-fit: contain;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
`;

const joinInputContainerStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
`;

const joinInputLabelStyle = css`
    font-size: 1.2rem;
    color: #00ffff;
    text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
`;

const validInputStyle = css`
    animation: ${validPulse} 1s infinite !important;
    border-color: #00ff00 !important;
    color: #00ff00;
`;

const invalidInputStyle = css`
    animation: ${invalidShake} 0.5s, ${glowPulse} 1s infinite !important;
    border-color: #ff0000 !important;
    color: #ff0000;
`;

const filledCodeBoxStyle = css`
    border-color: #00ffff;
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    animation: ${glowPulse} 1.5s infinite;
`;

const codeDisplayStyle = css`
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin: 1rem 0;
    `;

const codeBoxStyle = css`
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
    border: 2px solid rgba(0, 255, 255, 0.3);
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
`;

const hiddenButtonStyle = css`
    pointer-events: all !important;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    width: auto;
    display: flex;
    justify-content: center;
`;