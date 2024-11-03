import { Component, createMemo, For } from 'solid-js';
import { Styles } from '../../sharedCSS';
import { css } from '@emotion/css';
import { ArrayStore } from '../../ts/arrayStore';
import { PlayerParticipation, TrackedClient } from './mini_games/ClientTracker';
import { IBackendBased, IInternationalized } from '@/ts/types';
import { BackendIntegration } from '@/integrations/main_backend/mainBackend';
import { StrictJSX } from '@colony/ColonyApp';
import NTAwait from '../util/NoThrowAwait';
import GraphicalAsset from '../base/GraphicalAsset';

export interface MinigameWaitingScreenProps extends IBackendBased, IInternationalized {
}

const ClientTile: Component<{ client: TrackedClient, backend: BackendIntegration }> = (props) => {

    const getParticipationStatusIconId = createMemo(() => {
        switch (props.client.participation) {
            case PlayerParticipation.OPT_IN:
                return 1029;
            case PlayerParticipation.OPT_OUT:
                return 1028;
            case PlayerParticipation.UNDECIDED:
                return 1027;
            default:
                return 1027;
        }
    })
    
    return (
        <div class={clientTileContainerStyle}>
            <div class={playerIGNStyles}>{props.client.IGN}</div>
            <NTAwait func={() => props.backend.assets.getMetadata(getParticipationStatusIconId())}>{metadata => (
                <GraphicalAsset metadata={metadata} backend={props.backend} styleOverwrite={iconStyle} />
            )}</NTAwait>   
        </div>
    );
}

const MinigameWaitingScreen = (clients: ArrayStore<TrackedClient>, props: MinigameWaitingScreenProps): StrictJSX => {
    return (
        <div class={containerStyle}>
            <div class={titleModStyle}>{props.text.get("MINIGAME.WAITING_FOR_OTHER_PLAYERS").get()}...</div>
            <div class={clientTileListStyle}>
                <For each={clients.get} fallback={<p class={Styles.SUB_TITLE}>No players found</p>}>{client => (
                    <ClientTile client={client} backend={props.backend} />
                )}</For>
            </div>
        </div>
    ) as StrictJSX;
};
export default MinigameWaitingScreen;

const clientTileContainerStyle = css`
    position: relative;
    justify-content: center;
    align-items: center;
    display: flex;
    width: 10vw;
    height: 10vh;
    ${Styles.GLASS.FAINT_BACKGROUND}
    ${Styles.FANCY_BORDER}
    border-radius: 1rem;
    border-top: none;
`
const iconStyle = css`
    width: 80%;
    height: 80%;
    object-fit: contain;
`
const playerIGNStyles = css`
    position: absolute;
    ${Styles.SUB_TITLE}
    border-radius: 1rem;
    ${Styles.GLASS.FAINT_BACKGROUND}
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    bottom: 5%;
    z-index: 1;
`
const titleModStyle = css`
    ${Styles.SUB_TITLE}
    position: absolute;
    bottom: 1vh;
`

const clientTileListStyle = css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    align-content: center;

    gap: 1rem;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
`

const containerStyle = css`
    ${Styles.OVERLAY.CENTERED_QUARTER}
    ${Styles.FANCY_BORDER}
    ${Styles.GLASS.FAINT_BACKGROUND}
    z-index: 100000;
`;
