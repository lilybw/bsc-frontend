import { Component, createSignal, createMemo } from 'solid-js';
import { GenericLocationCardProps } from './GenericLocationCard';
import { css } from '@emotion/css';
import NTAwait from '../../util/NoThrowAwait';
import { ColonyCode, ColonyInfoResponseDTO, OpenColonyRequestDTO } from '../../../integrations/main_backend/mainBackendDTOs';
import { PLAYER_MOVE_EVENT } from '../../../integrations/multiplayer_backend/EventSpecifications';
import { IMultiplayerIntegration } from '../../../integrations/multiplayer_backend/multiplayerBackend';
import { Error, MultiplayerMode } from '../../../meta/types';
import { Styles } from '../../../sharedCSS';
import BufferBasedButton from '../../base/BufferBasedButton';
import GraphicalAsset from '../../base/GraphicalAsset';
import Spinner from '@/components/base/SimpleLoadingSpinner';

interface SpacePortCardProps extends GenericLocationCardProps {
    colony: ColonyInfoResponseDTO;
}

const SpacePortLocationCard: Component<SpacePortCardProps> = (props) => {
    const [connectErr, setConnectErr] = createSignal<string | undefined>();
    const [isConnecting, setIsConnecting] = createSignal(false);
    const log = props.backend.logger.copyFor('space port');

    const openColony = async () => {
        setIsConnecting(true);
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
                hour12: false,
            });
        };

        const request: OpenColonyRequestDTO = {
            validDurationMS: 3600000 * 12,
            playerID: props.backend.player.local.id,
            latestVisit: getCurrentDateTimeLocaleString(),
        };

        const openResponse = await props.backend.colony.open(props.colony.id, request);

        if (openResponse.err !== null) {
            log.error('Failed to open colony: ' + openResponse.err);
            setIsConnecting(false);
            return openResponse.err;
        }
        const err = await props.multiplayer.connect(openResponse.res.code, () => {});

        if (err) {
            log.error('Failed to connect to multiplayer: ' + err);
            setIsConnecting(false);
            setConnectErr(err);
            return;
        }
        setIsConnecting(false);
        props.events.emit(PLAYER_MOVE_EVENT, {
            playerID: props.backend.player.local.id,
            colonyLocationID: props.colonyLocation.id,
        });
    };

    const closeColony = async () => {
        await props.multiplayer.disconnect();
    };

    const formatCodeForDisplay = (code: number): string => {
        const str = code.toString();
        let formatted = '';
        //space after each 2 digits, but the last
        for (let i = 0; i < str.length; i++) {
            if (i % 2 === 0 && i !== str.length - 1) {
                formatted += ' ' + str[i];
            } else {
                formatted += str[i];
            }
        }
        return formatted;
    };

    const getOpenLayout = (code: ColonyCode) => (
        <>
            <div
                class={css`${Styles.MENU_INPUT} ${codeDisplayStyle}`}
            >
                {formatCodeForDisplay(code)}
            </div>
            <div class={STYLE_LOC_CARD_lowerThirdWBackgroundStyle}>
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
                        onActivation={() => {
                            props.closeCard();
                        }}
                    />
                    {props.multiplayer.getMode() === MultiplayerMode.AS_OWNER && (
                        <BufferBasedButton
                            name={props.text.get('LOCATION.SPACE_PORT.CLOSE_COLONY').get()}
                            buffer={props.buffer}
                            register={props.register}
                            onActivation={() => closeColony()}
                        />
                    )}
                </div>
            </div>
        </>
    );

    const getClosedLayout = () => (
        <div class={STYLE_LOC_CARD_lowerThirdWBackgroundStyle}>
            <div class={STYLE_LOC_CARD_descriptionContainerStyle}>
                {props.text.SubTitle(props.info.description)({ styleOverwrite: STYLE_LOC_CARD_descriptionStyleOverwrite })}
            </div>
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
                {props.multiplayer.getMode() === MultiplayerMode.AS_OWNER && (
                    <BufferBasedButton
                        name={props.text.get('LOCATION.SPACE_PORT.OPEN_COLONY').get()}
                        buffer={props.buffer}
                        register={props.register}
                        onActivation={openColony}
                        enable={createMemo(() => !isConnecting())}
                    />
                )}
            </div>
        </div>
    );

    const getBody = createMemo(() => {
        const code = props.multiplayer.getCode();
        if (code !== null) {
            return getOpenLayout(code);
        } else {
            return getClosedLayout();
        }
    });

    return (
        <div class={cardContainerStyle} id={'location-card-space-port'}>
            <NTAwait func={() => props.backend.assets.getMetadata(props.info.appearances[0].splashArt)}>
                {(asset) => (
                    <>
                        <GraphicalAsset styleOverwrite={STYLE_LOC_CARD_backgroundImageStyle} backend={props.backend} metadata={asset} />
                    </>
                )}
            </NTAwait>

            {props.text.Title(props.info.name)({ styleOverwrite: STYLE_LOC_CARD_titleStyleOverwrite })}

            {getBody()}
            {connectErr() && 
                <div class={errorMessageStyle}>connectErr()</div>}
            {isConnecting() && 
                <Spinner styleOverwrite={spinnerStyle}/>}
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
`;
const spinnerStyle = css`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10vw;
    height: 10vw;
    transform: translate(-50%, -50%);
    ${Styles.GLASS.BACKGROUND}
`

const errorMessageStyle = css`
    ${codeDisplayStyle}; 
    font-size: 1.5rem; 
    border-color: red; 
    background-image: linear-gradient(rgba(255, 0, 0, 0.5), rgba(0, 0, 0, 0.5)); 
`

export const STYLE_LOC_CARD_lowerThirdWBackgroundStyle = css`
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    position: absolute;

    z-index: 1;
    width: 100%;
    height: 15%;
    bottom: 0;
    border-radius: 10px;

    ${Styles.GLASS.BACKGROUND}
`;

const cardContainerStyle = css`
    display: flex;
    flex-direction: column;
`;

export const STYLE_LOC_CARD_backgroundImageStyle = css`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 1rem;
    box-shadow: 0 0 1rem 0.5rem inset rgba(255, 255, 255, 1);
`;

export const STYLE_LOC_CARD_titleStyleOverwrite = css`
    position: absolute;
    top: 2rem;
    width: 100%;
    font-size: 2rem;
    text-align: center;
    z-index: 1;
    margin: 0;
    ${Styles.GLASS.FAINT_BACKGROUND}
`;

export const STYLE_LOC_CARD_descriptionContainerStyle = css`
    margin: 0;
    padding: 0;
`;

export const STYLE_LOC_CARD_descriptionStyleOverwrite = css`
    font-size: 1.2rem;
    text-shadow: none;
    text-align: center;
    filter: none;
    margin: 0;
    padding: 0;
`;
