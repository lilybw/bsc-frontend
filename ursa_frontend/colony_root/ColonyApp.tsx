import { createSignal, onMount, onCleanup, JSX, createMemo, createEffect } from 'solid-js';
import { css } from '@emotion/css';
import MinigameSequenceOverlay from './MinigameSequenceOverlay';
import { DifficultyConfirmedForMinigameMessageDTO, LOBBY_CLOSING_EVENT, SERVER_CLOSING_EVENT } from '@/integrations/multiplayer_backend/EventSpecifications';
import { Bundle, BundleComponent, ColonyState, Error, MultiplayerMode } from '@/meta/types';
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
import { Styles } from '@/sharedCSS';
import { createArrayStore } from '@/ts/arrayStore';
import { MockServer } from '@/ts/mockServer';
import TimedFullScreenNotification from './TimedFullScreenNotification';

export type StrictJSX =
    | Node
    | JSX.ArrayElement
    | (string & {})
    | NonNullable<Exclude<Exclude<Exclude<JSX.Element, string>, number>, boolean>>
    | Element;

interface DiffConfWExtraInfo extends DifficultyConfirmedForMinigameMessageDTO {
    minigameName: string;
}

enum LocalSequencePhase {
    ROAMING_COLONY = 0,
    HAND_PLACEMENT_CHECK = 1,
    WAITING_SCREEN = 2,
    LOADING_MINIGAME = 3,
    IN_MINIGAME = 4,
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
        const [shuntNotaficationReason, setShuntNotificationReason] = createSignal<string>('Unknown');
        const [showNotification, setShowShuntNotification] = createSignal<boolean>(false);
        const log = props.context.logger.copyFor('colony');
        const bundleSwapColonyInfo = props.context.nav.getRetainedColonyInfo();
        const bundeSwapPlayerInfo = props.context.nav.getRetainedUserInfo();

        /**
         * Handles colony info load error by logging and redirecting to the menu.
         * @param error - The error message(s) to display.
         * @returns An ErrorPage component with the error content.
         */
        const onColonyInfoLoadError = (error: string[]) => {
            log.error('Failed to load colony: ' + error);
            return (
                <ErrorPage content={error}>
                    {props.context.text.SubTitle("NOTIFICATION.RETURNING_TO_MENU_IN")({})}
                    <Countdown styleOverwrite={Styles.TITLE} duration={5} onComplete={() => props.context.nav.goToMenu()} />
                </ErrorPage>
            );
        };

        /**
         * Renders the main colony layout.
         * @returns The colony layout as a StrictJSX element.
         */
        const colonyLayout = 
            (
                <Unwrap data={[bundleSwapColonyInfo, bundeSwapPlayerInfo]} fallback={onColonyInfoLoadError}>
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

        const [pageContent, setPageContent] = createSignal<StrictJSX>(colonyLayout);

        const clientTracker = new ClientTracker(props.context.events, props.context.logger);
        const mockServer = new MockServer(props.context, props.context.logger);

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
            clientTracker.addClients(...lobbyState.clients.filter((c) => c.id !== props.context.backend.player.local.id));
        };

        createEffect(() => {
            const colonyState = props.context.multiplayer.getState();
            if (colonyState === ColonyState.CLOSED) {
                mockServer.start();
            }else{
                mockServer.shutdown();
            }
        })

        onMount(async () => {
            // If there is a colonyCode present, that means that we're currently trying to go and join someone else's colony
            if (bundleSwapColonyInfo.res?.colonyCode) {
                const err = await initializeMultiplayerSession(bundleSwapColonyInfo.res.colonyCode);
                if (err) {
                    setPageContent(onColonyInfoLoadError([JSON.stringify(err)]) as StrictJSX);
                }
            }

            clientTracker.mount();
            const subscribe = props.context.events.subscribe;
            const serverClosingSubId = subscribe(SERVER_CLOSING_EVENT, (ev) => {
                if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;

                setShuntNotificationReason('NOTIFICATION.MULTIPLAYER.SERVER_CLOSING');
            });
            const lobbyClosingSubId = subscribe(LOBBY_CLOSING_EVENT, (ev) => {
                if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;

                setShuntNotificationReason('NOTIFICATION.MULTIPLAYER.LOBBY_CLOSING');
            });
            
            onCleanup(() => {
                clientTracker.unmount();
                props.context.events.unsubscribe(
                    serverClosingSubId,
                    lobbyClosingSubId,
                );
            });
        });

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
                <MinigameSequenceOverlay
                    clientTracker={clientTracker}
                    context={props.context}
                    setPageContent={setPageContent}
                    goBackToColony={() => setPageContent(colonyLayout)}
                    bundleSwapData={bundleSwapColonyInfo.res!}
                    register={bufferSubscribers.add}
                    buffer={inputBuffer.get}
                />
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
