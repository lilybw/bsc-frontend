/**
 * ColonyApp.tsx
 * 
 * Main component for the colony view of the game. Responsible for:
 * - Managing colony and minigame view states
 * - Coordinating multiplayer sessions
 * - Handling focus control for input interactions
 * - Managing client tracking and event subscriptions
 */

import { createSignal, onMount, onCleanup, JSX, createMemo, createEffect } from 'solid-js';
import { css } from '@emotion/css';
import MinigameSequenceOverlay, { LocalSequencePhase } from './MinigameSequenceOverlay';
import {
    DifficultyConfirmedForMinigameMessageDTO,
    LOBBY_CLOSING_EVENT,
    SERVER_CLOSING_EVENT
} from '@/integrations/multiplayer_backend/EventSpecifications';
import {
    Bundle,
    BundleComponent,
    ColonyState,
    Error,
    MultiplayerMode
} from '@/meta/types';
import { ApplicationProps } from '@/ts/types';
import { createWrappedSignal } from '@/ts/wrappedSignal';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '@/ts/actionContext';
import BufferBasedButton from '@/components/base/BufferBasedButton';
import EventFeed from '@/components/base/EventFeed';
import SectionTitle from '@/components/base/SectionTitle';
import StarryBackground from '@/components/base/StarryBackground';
import ClientTracker from '@/components/colony/mini_games/ClientTracker';
import PathGraph from '@/components/colony/PathGraph';
import Countdown from '@/components/util/Countdown';
import MNTAwait from '@/components/util/MultiNoThrowAwait';
import Unwrap from '@/components/util/Unwrap';
import ErrorPage from '@/ErrorPage';
import { ColonyCode } from '@/integrations/main_backend/mainBackendDTOs';
import { Styles } from '@/styles/sharedCSS';
import { createArrayStore } from '@/ts/arrayStore';
import TimedFullScreenNotification from './TimedFullScreenNotification';
import { MockServer } from '@/integrations/multiplayer_backend/mockServer';

export type StrictJSX =
    | Node
    | JSX.ArrayElement
    | (string & {})
    | NonNullable<Exclude<Exclude<Exclude<JSX.Element, string>, number>, boolean>>
    | Element;

interface DiffConfWExtraInfo extends DifficultyConfirmedForMinigameMessageDTO {
    minigameName: string;
}

const ColonyApp: BundleComponent<ApplicationProps> = Object.assign(
    (props: ApplicationProps) => {
        // Core state management
        const inputBuffer = createWrappedSignal<string>('');
        const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.NAVIGATION);
        const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

        // Notification state
        const [shuntNotaficationReason, setShuntNotificationReason] = createSignal<string>('Unknown');
        const [showNotification, setShowShuntNotification] = createSignal<boolean>(false);

        // Utility and context
        const log = props.context.logger.copyFor('colony');
        const bundleSwapColonyInfo = props.context.nav.getRetainedColonyInfo();
        const bundeSwapPlayerInfo = props.context.nav.getRetainedUserInfo();

        // Actioninput autofocus management
        const [minigameSequencePhase, setMinigameSequencePhase] = createSignal<LocalSequencePhase>(
            LocalSequencePhase.ROAMING_COLONY
        );


        const onColonyInfoLoadError = (error: string[]) => {
            log.error('Failed to load colony: ' + error);
            return (
                <ErrorPage content={error}>
                    {props.context.text.SubTitle("NOTIFICATION.RETURNING_TO_MENU_IN")({})}
                    <Countdown
                        styleOverwrite={Styles.TITLE}
                        duration={5}
                        onComplete={() => props.context.nav.goToMenu()}
                    />
                </ErrorPage>
            );
        };

        const colonyLayout = (
            <Unwrap
                data={[bundleSwapColonyInfo, bundeSwapPlayerInfo]}
                fallback={onColonyInfoLoadError}
            >
                {(colonyInfo, playerInfo) => (
                    <>
                        <SectionTitle styleOverwrite={colonyTitleStyle}>
                            {colonyInfo.name}
                        </SectionTitle>

                        <BufferBasedButton
                            name={props.context.text.get('COLONY.UI.LEAVE').get}
                            buffer={inputBuffer.get}
                            onActivation={() => props.context.nav.goToMenu()}
                            register={bufferSubscribers.add}
                            styleOverwrite="position: absolute; top: 8vh; left: 1vh; z-index: 100000;"
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
                                    focusEnabled={isShowingColonyLayout()}
                                />
                            )}
                        </MNTAwait>
                    </>
                )}
            </Unwrap>
        ) as StrictJSX;

        // Page content management
        const [pageContent, setPageContent] = createSignal<StrictJSX>(colonyLayout);

        const isShowingColonyLayout = createMemo(() =>
            pageContent() === colonyLayout &&
            minigameSequencePhase() !== LocalSequencePhase.HAND_PLACEMENT_CHECK
        );

        // Client and server management
        const clientTracker = new ClientTracker(props.context.events, props.context.logger);
        const mockServer = new MockServer(props.context, bundleSwapColonyInfo.res!.id, props.context.logger);

        const initializeMultiplayerSession = async (code: ColonyCode): Promise<Error | undefined> => {
            log.trace('Connecting to multiplayer, code: ' + code);
            const onConnClose = () => {
                if (props.context.multiplayer.getMode() !== MultiplayerMode.AS_OWNER) {
                    log.info('connection closed, redirecting to menu');
                    setShowShuntNotification(true);
                }
            };

            // Establish connection
            const err = await props.context.multiplayer.connect(code, onConnClose);
            if (err) {
                return err;
            }

            // Get and process lobby state
            const lobbyStateReq = await props.context.multiplayer.getLobbyState();
            if (lobbyStateReq.err !== null) {
                return lobbyStateReq.err;
            }

            // Initialize clients
            const lobbyState = lobbyStateReq.res;
            clientTracker.addClients(
                ...lobbyState.clients.filter((c) => c.id !== props.context.backend.player.local.id)
            );
        };

        createEffect(() => {
            const colonyState = props.context.multiplayer.getState();
            if (colonyState === ColonyState.CLOSED) {
                mockServer.start();
            } else {
                mockServer.shutdown();
            }
        });

        onMount(async () => {
            // Initialize multiplayer if needed
            if (bundleSwapColonyInfo.res?.colonyCode) {
                const err = await initializeMultiplayerSession(bundleSwapColonyInfo.res.colonyCode);
                if (err) {
                    setPageContent(onColonyInfoLoadError([JSON.stringify(err)]) as StrictJSX);
                }
            }

            // Set up client tracking
            clientTracker.mount();
            const subscribe = props.context.events.subscribe;

            // Subscribe to server events
            const serverClosingSubId = subscribe(SERVER_CLOSING_EVENT, (ev) => {
                if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;
                setShuntNotificationReason('NOTIFICATION.MULTIPLAYER.SERVER_CLOSING');
            });

            const lobbyClosingSubId = subscribe(LOBBY_CLOSING_EVENT, (ev) => {
                if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;
                setShuntNotificationReason('NOTIFICATION.MULTIPLAYER.LOBBY_CLOSING');
            });

            // Cleanup subscriptions and tracking
            onCleanup(() => {
                clientTracker.unmount();
                props.context.events.unsubscribe(
                    serverClosingSubId,
                    lobbyClosingSubId
                );
            });
        });

        const shuntNotaMemo = createMemo(
            () =>
                showNotification() && (
                    <TimedFullScreenNotification
                        text={props.context.text}
                        title={shuntNotaficationReason()}
                        durationMS={5000}
                        subTitle={"NOTIFICATION.RETURNING_TO_MENU_IN"}
                        onClose={() => setShowShuntNotification(false)}
                        onCompletion={() => props.context.nav.goToMenu()}
                    />
                ),
        );

        return (
            <div id="colony-app">
                <StarryBackground backend={props.context.backend} />
                {pageContent()}
                <MinigameSequenceOverlay
                    clientTracker={clientTracker}
                    context={props.context}
                    setPageContent={setPageContent}
                    goBackToColony={() => setPageContent(colonyLayout)}
                    bundleSwapData={bundleSwapColonyInfo.res!}
                    register={bufferSubscribers.add}
                    buffer={inputBuffer.get}
                    setSequencePhase={setMinigameSequencePhase}
                />
                {shuntNotaMemo()}
                <EventFeed
                    events={props.context.events}
                    backend={props.context.backend}
                    text={props.context.text}
                />
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