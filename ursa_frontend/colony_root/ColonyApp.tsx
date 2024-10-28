import { Bundle, BundleComponent, ColonyState, MultiplayerMode, Error } from '../src/meta/types';
import { ApplicationProps } from '../src/ts/types';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';
import { createSignal, onMount, onCleanup, JSX, createMemo } from 'solid-js';
import {
  DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
  DifficultyConfirmedForMinigameMessageDTO,
  LOBBY_CLOSING_EVENT,
  OriginType,
  PLAYER_JOINED_EVENT,
  PLAYER_LEFT_EVENT,
  PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT,
  SERVER_CLOSING_EVENT
} from '../src/integrations/multiplayer_backend/EventSpecifications';
import { css } from '@emotion/css';
import { createArrayStore } from '../src/ts/arrayStore';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../src/ts/actionContext';
import { createWrappedSignal } from '../src/ts/wrappedSignal';
import { ClientDTO } from '../src/integrations/multiplayer_backend/multiplayerDTO';
import MNTAwait from '../src/components/util/MultiNoThrowAwait';
import { MockServer } from '../src/ts/mockServer';
import HandPlacementCheck from '../src/components/colony/HandPlacementCheck';
import Countdown from '../src/components/util/Countdown';
import { ColonyCode, ColonyInfoResponseDTO, ColonyPathGraphResponseDTO, uint32 } from '../src/integrations/main_backend/mainBackendDTOs';
import { KnownLocations } from '../src/integrations/main_backend/constants';
import TimedFullScreenNotification from './TimedFullScreenNotification';
import BufferBasedButton from '../src/components/base/BufferBasedButton';
import EventFeed from '../src/components/base/EventFeed';
import SectionSubTitle from '../src/components/base/SectionSubTitle';
import SectionTitle from '../src/components/base/SectionTitle';
import StarryBackground from '../src/components/base/StarryBackground';
import { Styles } from '../src/sharedCSS';

export type StrictJSX = Node | JSX.ArrayElement | (string & {}) 
  | NonNullable<Exclude<Exclude<Exclude<JSX.Element, string>, number>, boolean>>
  | Element;

/**
 * ColonyApp component responsible for managing the colony view and minigames.
 * It handles both online and offline (mock) server scenarios based on the colony state.
 */
const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  const inputBuffer = createWrappedSignal<string>('');
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.NAVIGATION);
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const clients = createArrayStore<ClientDTO>();
  const [confirmedDifficulty, setConfirmedDifficulty] = createSignal<DifficultyConfirmedForMinigameMessageDTO | null>(null);
  const bundleSwapColonyInfo = props.context.nav.getRetainedColonyInfo();
  const [notaficationReason, setNotificationReason] = createSignal<string>("Unknown");
  const [showNotification, setShowShuntNotification] = createSignal<boolean>(false);
  const log = props.context.logger.copyFor('colony');

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
        <Countdown styleOverwrite={Styles.TITLE} duration={5} onComplete={() => props.context.nav.goToMenu()}/>
      </ErrorPage>
    )
  }

  const setUnassignedClientPositions = (ownerID: uint32, colony: ColonyInfoResponseDTO, graph: ColonyPathGraphResponseDTO) => {
    const colLocIdOfSpacePort = colony.locations.filter(l => l.locationID === KnownLocations.SpacePort)[0].id;
    const colLocIdOfHome = colony.locations.filter(l => l.locationID === KnownLocations.Home)[0].id;
    
    clients.mutateByPredicate(
      c => c.state.lastKnownPosition <= 0, 
      c => (
        { ...c, 
          state: {...c.state, lastKnownPosition: 
            c.id === ownerID ? colLocIdOfHome : colLocIdOfSpacePort}
        }
    ));
  }

  /**
   * Renders the main colony layout.
   * @returns The colony layout as a StrictJSX element.
   */
  const colonyLayout = () => {
    return (
      <Unwrap data={[bundleSwapColonyInfo, props.context.nav.getRetainedUserInfo()]} fallback={onColonyInfoLoadError}>
        {(colonyInfo, playerInfo) =>
          <>
          <SectionTitle styleOverwrite={colonyTitleStyle}>{colonyInfo.name}</SectionTitle>
          <BufferBasedButton 
            name={props.context.text.get('COLONY.UI.LEAVE').get}
            buffer={inputBuffer.get}
            onActivation={() => props.context.nav.goToMenu()}
            register={bufferSubscribers.add}
            styleOverwrite='position: absolute; top: 13vh; left: 2vw;'
            charBaseStyleOverwrite='font-size: 1.5rem;'
          />
          <MNTAwait funcs={[
              () => props.context.backend.colony.get(colonyInfo.owner, colonyInfo.id),
              () => props.context.backend.colony.getPathGraph(colonyInfo.id)
          ]}>
            {(colony, graph) =>
              {
                setUnassignedClientPositions(colonyInfo.owner, colony, graph);
                return (
                  <PathGraph 
                    ownerID={colonyInfo.owner}
                    graph={graph}
                    bufferSubscribers={bufferSubscribers}
                    actionContext={actionContext}
                    clients={clients}
                    colony={colony}
                    plexer={props.context.events}
                    text={props.context.text}
                    backend={props.context.backend}
                    buffer={inputBuffer}
                    localPlayerId={playerInfo.id}
                    multiplayer={props.context.multiplayer}
                  />
              )}
            }
          </MNTAwait>
          </>
        }
      </Unwrap>
    ) as StrictJSX;
  }

  const [pageContent, setPageContent] = createSignal<StrictJSX>(colonyLayout());

  const mockServer = new MockServer(props.context, setPageContent, () => setPageContent(colonyLayout()), props.context.logger);

  const initializeMultiplayerSession = async (code: ColonyCode): Promise<Error | undefined> => {
    log.trace('Connecting to multiplayer, code: ' + code);
    const onConnClose = () => {
      if (props.context.multiplayer.getMode() !== MultiplayerMode.AS_OWNER) {
        log.info('connection closed, redirecting to menu');
        setShowShuntNotification(true);
      }
    }
    const err = await props.context.multiplayer.connect(code, onConnClose); if (err) {
      return err;
    } 
    const lobbyStateReq = await props.context.multiplayer.getLobbyState(); if (lobbyStateReq.err !== null) {
      return lobbyStateReq.err;
    }
    const lobbyState = lobbyStateReq.res;
    clients.addAll(lobbyState.clients);
  }

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

    if (state === ColonyState.CLOSED) {
      mockServer.start();
    }

    // Set up event subscriptions
    const playerLeaveSubId = props.context.events.subscribe(PLAYER_LEFT_EVENT, (data) => {
      log.info('Player left: ' + data.id);
      clients.removeFirst((c) => c.id === data.id);
    });

    const playerJoinSubId = props.context.events.subscribe(PLAYER_JOINED_EVENT, (data) => {
      log.info('Player joined: ' + data.id);
      clients.add({
        id: data.id,
        IGN: data.ign,
        type: OriginType.Guest,
        state: {
          lastKnownPosition: -1,
          msOfLastMessage: 0
        }
      });
    });

    const serverClosingSubId = props.context.events.subscribe(SERVER_CLOSING_EVENT, (ev) => {
      if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;

      setNotificationReason("NOTIFICATION.MULTIPLAYER.SERVER_CLOSING");
    });

    const lobbyClosingSubId = props.context.events.subscribe(LOBBY_CLOSING_EVENT, (ev) => {
      if (props.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) return;
      
      setNotificationReason("NOTIFICATION.MULTIPLAYER.LOBBY_CLOSING");
    });

    const diffConfirmedSubId = props.context.events.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, data => {
      setConfirmedDifficulty(data);
    });

    const declareIntentSubId = props.context.events.subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, data => {
      const diff = confirmedDifficulty();
      if (diff === null) {
        console.error('Received intent declaration before difficulty was confirmed');
        return;
      }
    })

    onCleanup(() => {
      props.context.events.unsubscribe(
        playerLeaveSubId, playerJoinSubId, serverClosingSubId, 
        lobbyClosingSubId, diffConfirmedSubId, declareIntentSubId
      );
    });
  });

  const appendOverlay = () => {
    const confDiff = confirmedDifficulty();
    if (confDiff === null) return null;

    return (
      <HandPlacementCheck 
        gameToBeMounted={confDiff}
        events={props.context.events}
        backend={props.context.backend}
        text={props.context.text}
        setActionContext={actionContext.set}
        buffer={inputBuffer.get}
        register={bufferSubscribers.add}
        clearSelf={() => setConfirmedDifficulty(null)}
        goToWaitingScreen={() => console.log("on waiting screen")}
      />
    )
  }

  const shuntNotaMemo = createMemo(() => showNotification() && (
    <TimedFullScreenNotification
      text={props.context.text}
      reason={notaficationReason()}
      durationMS={5000}
      onClose={() => setShowShuntNotification(false)}
      onCompletion={() => props.context.nav.goToMenu()}
    />
  ));

  return (
    <div id="colony-app">
      <StarryBackground />
      {pageContent()}
      {appendOverlay()}
      {shuntNotaMemo()}
      <EventFeed
        events={props.context.events}
        backend={props.context.backend}
        text={props.context.text}
      />
    </div>
  );
}, {bundle: Bundle.COLONY});

export default ColonyApp;

const colonyTitleStyle = css`
  position: absolute;
  z-index: 100000;
  font-size: 3.5rem;
  top: 0;
  left: 0;
`;