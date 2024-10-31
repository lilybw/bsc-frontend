import { Bundle, BundleComponent, ColonyState, MultiplayerMode, Error } from '../src/meta/types';
import { ApplicationProps } from '../src/ts/types';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';
import { createSignal, onMount, onCleanup, JSX, createMemo } from 'solid-js';
import {
    DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
    DifficultyConfirmedForMinigameMessageDTO,
    GENERIC_MINIGAME_SEQUENCE_RESET_EVENT,
    GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT,
    LOAD_MINIGAME_EVENT,
    LOBBY_CLOSING_EVENT,
    MINIGAME_BEGINS_EVENT,
    PLAYER_LOAD_COMPLETE_EVENT,
    PLAYER_LOAD_FAILURE_EVENT,
    PLAYER_READY_FOR_MINIGAME_EVENT,
    PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT,
    SERVER_CLOSING_EVENT,
} from '../src/integrations/multiplayer_backend/EventSpecifications';
import { css } from '@emotion/css';
import { createArrayStore } from '../src/ts/arrayStore';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../src/ts/actionContext';
import { createWrappedSignal } from '../src/ts/wrappedSignal';
import MNTAwait from '../src/components/util/MultiNoThrowAwait';
import { MockServer } from '../src/ts/mockServer';
import HandPlacementCheck from '../src/components/colony/HandPlacementCheck';
import Countdown from '../src/components/util/Countdown';
import { ColonyCode } from '../src/integrations/main_backend/mainBackendDTOs';
import TimedFullScreenNotification from './TimedFullScreenNotification';
import BufferBasedButton from '../src/components/base/BufferBasedButton';
import EventFeed from '../src/components/base/EventFeed';
import SectionSubTitle from '../src/components/base/SectionSubTitle';
import SectionTitle from '../src/components/base/SectionTitle';
import StarryBackground from '../src/components/base/StarryBackground';
import { Styles } from '../src/sharedCSS';
import ClientTracker from '../src/components/colony/mini_games/ClientTracker';
import { getMinigameComponentInitFunction, getMinigameName } from '../src/components/colony/mini_games/miniGame';
import SolarLoadingSpinner from '../src/components/base/SolarLoadingSpinner';

export type StrictJSX =
    | Node
    | JSX.ArrayElement
    | (string & {})
    | NonNullable<Exclude<Exclude<Exclude<JSX.Element, string>, number>, boolean>>
    | Element;

interface DiffConfWExtraInfo extends DifficultyConfirmedForMinigameMessageDTO {
    minigameName: string;
}

/**
 * ColonyApp component responsible for managing the colony view and minigames.
 * It handles both online and offline (mock) server scenarios based on the colony state.
 */
const ColonyApp: BundleComponent<ApplicationProps> = Object.assign(
    (props: ApplicationProps) => {
        const inputBuffer = createWrappedSignal<string>('');
        const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.NAVIGATION);
        const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
        const [confirmedDifficulty, setConfirmedDifficulty] = createSignal<DiffConfWExtraInfo | null>(null);
        const [shuntNotaficationReason, setShuntNotificationReason] = createSignal<string>('Unknown');
        const [showNotification, setShowShuntNotification] = createSignal<boolean>(false);
        const log = props.context.logger.copyFor('colony');
        const bundleSwapColonyInfo = props.context.nav.getRetainedColonyInfo();

        /**
         * Handles colony info load error by logging and redirecting to the menu.
         * @param error - The error message(s) to display.
         * @returns An ErrorPage component with the error content.
         */
        const onColonyInfoLoadError = (error: string[]) => {
            log.error('Failed to load colony: ' + error);
            return (
                <ErrorPage content={error}>
                    <SectionSubTitle>Redirecting to menu in:</SectionSubTitle>
                    <Countdown styleOverwrite={Styles.TITLE} duration={5} onComplete={() => props.context.nav.goToMenu()} />
                </ErrorPage>
            );
        };

        /**
         * Renders the main colony layout.
         * @returns The colony layout as a StrictJSX element.
         */
        const colonyLayout = () =>
            (
                <Unwrap data={[bundleSwapColonyInfo, props.context.nav.getRetainedUserInfo()]} fallback={onColonyInfoLoadError}>
                    {(colonyInfo, playerInfo) => (
                        <>
                            <SectionTitle styleOverwrite={colonyTitleStyle}>{colonyInfo.name}</SectionTitle>
                            <BufferBasedButton
                                name={props.context.text.get('COLONY.UI.LEAVE').get}
                                buffer={inputBuffer.get}
                                onActivation={() => props.context.nav.goToMenu()}
                                register={bufferSubscribers.add}
                                styleOverwrite="position: absolute; top: 8vh; left: 1vh;"
                                charBaseStyleOverwrite="font-size: 1.5rem;"
                            />
                            <MNTAwait
                                funcs={[
                                    () => props.context.backend.colony.get(colonyInfo.owner, colonyInfo.id),
                                    () => props.context.backend.colony.getPathGraph(colonyInfo.id),
                                ]}
                            >
                                {(colony, graph) => (
                                    <PathGraph
                                        ownerID={colonyInfo.owner}
                                        graph={graph}
                                        colony={colony}
                                        bufferSubscribers={bufferSubscribers}
                                        actionContext={actionContext}
                                        clients={clientTracker.getAsClients()}
                                        context={props.context}
                                        buffer={inputBuffer}
                                    />
                                )}
                            </MNTAwait>
                        </>
                    )}
                </Unwrap>
            ) as StrictJSX;

        const [pageContent, setPageContent] = createSignal<StrictJSX>(colonyLayout());

        const clientTracker = new ClientTracker(props.context.events, props.context.logger);
        const mockServer = new MockServer(props.context, setPageContent, () => setPageContent(colonyLayout()), props.context.logger);

        const initializeMultiplayerSession = async (code: ColonyCode): Promise<Error | undefined> => {
            log.trace('Connecting to multiplayer, code: ' + code);
            const onConnClose = () => {
                if (props.context.multiplayer.getMode() !== MultiplayerMode.AS_OWNER) {
                    log.info('connection closed, redirecting to menu');
                    setShowShuntNotification(true);
                }
            };
            const err = await props.context.multiplayer.connect(code, onConnClose);
            if (err) {
                return err;
            }
            const lobbyStateReq = await props.context.multiplayer.getLobbyState();
            if (lobbyStateReq.err !== null) {
                return lobbyStateReq.err;
            }
            const lobbyState = lobbyStateReq.res;
            clientTracker.addClients(...lobbyState.clients);
        };

        onMount(async () => {
            // If there is a colonyCode present, that means that we're currently trying to go and join someone else's colony
            if (bundleSwapColonyInfo.res?.colonyCode) {
                const err = await initializeMultiplayerSession(bundleSwapColonyInfo.res.colonyCode);
                if (err) {
                    setPageContent(onColonyInfoLoadError([JSON.stringify(err)]) as StrictJSX);
                }
            }

            // Determine colony state
            const state = props.context.multiplayer.getState();

            clientTracker.mount();
            if (state === ColonyState.CLOSED) {
                mockServer.start();
            }
            const subscribe = props.context.events.subscribe;

            const serverClosingSubId = subscribe(SERVER_CLOSING_EVENT, (ev) => {
                if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;

                setShuntNotificationReason('NOTIFICATION.MULTIPLAYER.SERVER_CLOSING');
            });
            const lobbyClosingSubId = subscribe(LOBBY_CLOSING_EVENT, (ev) => {
                if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;

                setShuntNotificationReason('NOTIFICATION.MULTIPLAYER.LOBBY_CLOSING');
            });
            const diffConfirmedSubId = subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, (data) => {
                setConfirmedDifficulty({ ...data, minigameName: getMinigameName(data.minigameID) });
                //When confirmedDifficulty != null, the HandPlacementCheck is shown
                //The HandPlacementCheck emits the required Player Join Activity or Player Aborting Activity
                //And then forwards to the waiting screen
            });

            const declareIntentSubId = subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, (data) => {
                const diff = confirmedDifficulty();
                if (diff === null) {
                    log.error('Received intent declaration before difficulty was confirmed');
                    return;
                }
                //Needs to be handled.
                //Here is to be emitted Player Ready Event
                props.context.events.emit(PLAYER_READY_FOR_MINIGAME_EVENT, {
                    id: props.context.backend.player.local.id,
                    ign: props.context.backend.player.local.firstName,
                });
            });

            let minigameComponent: JSX.Element | null = null;
            const loadMinigameSubId = subscribe(LOAD_MINIGAME_EVENT, async (data) => {
                //Load the minigame
                const diff = confirmedDifficulty();
                if (diff === null) {
                    log.error('Received load minigame while confirmed difficulty was null');
                    return;
                }
                setPageContent((<SolarLoadingSpinner text={'Loading ' + diff.minigameName} />) as StrictJSX);
                const initFunc = getMinigameComponentInitFunction(diff.minigameID);
                if (initFunc.err !== null) {
                    log.error('Could not load minigame component init function: ' + initFunc.err);
                    props.context.events.emit(PLAYER_LOAD_FAILURE_EVENT, { reason: initFunc.err });
                    return;
                }
                const res = await initFunc.res(props.context, diff.difficultyID);
                if (res.err !== null) {
                    log.error('Could not load minigame component: ' + res.err);
                    props.context.events.emit(PLAYER_LOAD_FAILURE_EVENT, { reason: res.err });
                    return;
                }
                setPageContent(res.res as StrictJSX);
                props.context.events.emit(PLAYER_LOAD_COMPLETE_EVENT, {});
            });

            const minigameBeginsSubId = subscribe(MINIGAME_BEGINS_EVENT, (data) => {
                //Start the minigame
                //nothing to do here right now
            });

            const resetSequenceSubID = subscribe(GENERIC_MINIGAME_SEQUENCE_RESET_EVENT, (data) => {
                setConfirmedDifficulty(null);
            });
            const genericAbortSubId = subscribe(GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT, (data) => {
                //TODO: Show some notification
                log.error('Received generic abort event concerning: ' + data.id + ' with reason: ' + data.reason);
                setConfirmedDifficulty(null);
                setPageContent(colonyLayout());
            });

            onCleanup(() => {
                clientTracker.unmount();
                props.context.events.unsubscribe(
                    serverClosingSubId,
                    lobbyClosingSubId,
                    diffConfirmedSubId,
                    declareIntentSubId,
                    loadMinigameSubId,
                    minigameBeginsSubId,
                    resetSequenceSubID,
                    genericAbortSubId,
                );
            });
        });

        const [currentSequenceOverlay, setCurrentSequenceOverlay] = createSignal<StrictJSX | null>(null);
        const appendSequenceOverlay = () => {
            const confDiff = confirmedDifficulty();
            if (confDiff === null) return null;

            return (
                <HandPlacementCheck
                    nameOfOwner={clientTracker.getByID(bundleSwapColonyInfo.res?.owner!)?.IGN || props.context.backend.player.local.firstName}
                    nameOfMinigame={confDiff.minigameName}
                    gameToBeMounted={confDiff}
                    events={props.context.events}
                    backend={props.context.backend}
                    text={props.context.text}
                    clearSelf={() => setConfirmedDifficulty(null)}
                    goToWaitingScreen={() => console.log('on waiting screen')}
                />
            );
        };

        const shuntNotaMemo = createMemo(
            () =>
                showNotification() && (
                    <TimedFullScreenNotification
                        text={props.context.text}
                        reason={shuntNotaficationReason()}
                        durationMS={5000}
                        onClose={() => setShowShuntNotification(false)}
                        onCompletion={() => props.context.nav.goToMenu()}
                    />
                ),
        );

        return (
            <div id="colony-app">
                <StarryBackground />
                {pageContent()}
                {appendSequenceOverlay()}
                {shuntNotaMemo()}
                <EventFeed events={props.context.events} backend={props.context.backend} text={props.context.text} />
            </div>
        );
    },
    { bundle: Bundle.COLONY },
);

export default ColonyApp;

const colonyTitleStyle = css`
    position: absolute;
    z-index: 100000;
    font-size: 3.5rem;
    top: 0;
    left: 1vh;
`;
