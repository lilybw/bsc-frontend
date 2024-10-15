import { Bundle, BundleComponent, LogLevel, ResErr } from '../src/meta/types';
import { ApplicationProps } from '../src/ts/types';
import SectionTitle from '../src/components/SectionTitle';
import StarryBackground from '../src/components/StarryBackground';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';
import { createSignal, Accessor, onMount, onCleanup, JSX, For } from 'solid-js';
import { DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, DifficultyConfirmedForMinigameMessageDTO, LOBBY_CLOSING_EVENT, PLAYER_JOINED_EVENT, PLAYER_LEFT_EVENT, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, SERVER_CLOSING_EVENT } from '../src/integrations/multiplayer_backend/EventSpecifications';
import { css } from '@emotion/css';
import { createArrayStore } from '../src/ts/arrayStore';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../src/ts/actionContext';
import { createWrappedSignal } from '../src/ts/wrappedSignal';
import { IExpandedAccessMultiplexer } from '../src/integrations/multiplayer_backend/eventMultiplexer';
import { Styles } from '../src/sharedCSS';
import { ColonyInfoResponseDTO, PlayerInfoResponseDTO } from '../src/integrations/main_backend/mainBackendDTOs';
import { ClientDTO } from '../src/integrations/multiplayer_backend/multiplayerDTO';
import { RetainedColonyInfoForPageSwap } from '../src/integrations/vitec/navigator';
import NTAwait from '../src/components/util/NoThrowAwait';
import MNTAwait from '../src/components/util/MultiNoThrowAwait';
import BufferBasedButton from '../src/components/BufferBasedButton';
import AsteroidsMiniGame from '../src/components/colony/mini_games/asteroids_mini_game/AsteroidsMiniGame';

const eventFeedMessageDurationMS = 10_000;
type StrictJSX = Node | JSX.ArrayElement | (string & {}) 
  | NonNullable<Exclude<Exclude<Exclude<JSX.Element, string>, number>, boolean>>
  | Element;

const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  const inputBuffer = createWrappedSignal<string>('');
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.NAVIGATION);
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const eventFeed = createArrayStore<StrictJSX>();
  const clients = createArrayStore<ClientDTO>();
  const [confirmedDifficulty, setConfirmedDifficulty] = createSignal<DifficultyConfirmedForMinigameMessageDTO | null>(null);
  const colonyInfo = props.context.nav.getRetainedColonyInfo();
  const onColonyInfoLoadError = (error: string[]) => {
    props.context.logger.error('Failed to load colony info: ' + error);
    setTimeout(() => props.context.nav.goToMenu(), 0);
    return (
      <ErrorPage content={error} />
    )
  }
  const colonyLayout = () => {
    return (
      <Unwrap data={[colonyInfo, props.context.nav.getRetainedUserInfo()]} fallback={onColonyInfoLoadError}>
        {(colonyInfo, playerInfo) =>
          <>
          <SectionTitle styleOverwrite={colonyTitleStyle}>{colonyInfo.name}</SectionTitle>
          <BufferBasedButton 
            name={props.context.text.get('COLONY.UI.LEAVE').get}
            buffer={inputBuffer.get}
            onActivation={() => props.context.nav.goToMenu()}
            register={bufferSubscribers.add}
            styleOverwrite='position: absolute; top: 13vh; left: 2vw;'
          />
          <MNTAwait funcs={
              [() => props.context.backend.getColony(colonyInfo.owner, colonyInfo.id),
              () => props.context.backend.getColonyPathGraph(colonyInfo.id)]
          }>{ (colony, graph) =>
            <PathGraph 
              ownerID={colonyInfo.owner}
              graph={graph}
              bufferSubscribers={bufferSubscribers}
              actionContext={actionContext}
              existingClients={clients}
              colony={colony}
              plexer={props.context.events}
              text={props.context.text}
              backend={props.context.backend}
              buffer={inputBuffer}
              localPlayerId={playerInfo.id}
              multiplayerIntegration={props.context.multiplayer}
            />
          }</MNTAwait>
          </>
        }
      </Unwrap>
    ) as StrictJSX;
  }
  const [pageContet, setPageContent] = createSignal<StrictJSX>(colonyLayout());

  onMount(async () => {

    const playerLeaveSubId = props.context.events.subscribe(PLAYER_LEFT_EVENT, (data) => {
      const removeFunc = eventFeed.add((
        <div class={eventFeedMessageStyle}>
          <div class={css`color: hsla(32, 100%, 36%, 1)`}>{data.ign}</div>
          <div class={css`color: hsla(32, 100%, 36%, 1)`}>Left</div>
        </div>
      ) as StrictJSX);
      setTimeout(removeFunc, eventFeedMessageDurationMS);
      props.context.logger.log('Player left: ' + data.id);
    })
    const playerJoinSubId = props.context.events.subscribe(PLAYER_JOINED_EVENT, (data) => {
      const removeFunc = eventFeed.add((
        <div class={eventFeedMessageStyle}>
          <div class={css`color: hsla(131, 100%, 27%, 1)`}>{data.ign}</div>
          <div class={css`color: hsla(131, 100%, 27%, 1)`}>Joined</div>
        </div>
      ) as StrictJSX);
      setTimeout(removeFunc, eventFeedMessageDurationMS);
    })
    const serverClosingSubId = props.context.events.subscribe(SERVER_CLOSING_EVENT, (ev) => {
      const removeFunc = eventFeed.add((
        <div class={eventFeedMessageStyle}>
          <div class={css`color: hsla(352, 100%, 29%, 1)`}>Server Closing</div>
        </div>
      ) as StrictJSX);
      setTimeout(removeFunc, eventFeedMessageDurationMS);
    })
    const lobbyClosingSubId = props.context.events.subscribe(LOBBY_CLOSING_EVENT, (ev) => {
      props.context.logger.log('lobby closing');
      const removeFunc = eventFeed.add((
        <div class={eventFeedMessageStyle}>
          <div>Lobby Closing</div>
        </div>
      ) as StrictJSX);
      setTimeout(removeFunc, eventFeedMessageDurationMS);
    })
    const diffConfirmedSubId = props.context.events.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, data => {
      setConfirmedDifficulty(data);
    })
    const declareIntentSubId = props.context.events.subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, data => {
      const diff = confirmedDifficulty();
      if (diff === null) {
        console.error('Received intent declaration before difficulty was confirmed');
        return;
      }
      setPageContent((
        <AsteroidsMiniGame 
          context={props.context}
          difficulty={diff}
          returnToColony={() => setPageContent(colonyLayout())}
        />
      ) as StrictJSX);
    })
    
    // Check open/closed state
    if (colonyInfo.res?.colonyCode) {
      const err = await props.context.multiplayer.connect(colonyInfo.res?.colonyCode, (ev) => console.log('connection closed'));
      console.error(err);
    } else {

    }

    onCleanup(() => { props.context.events.unsubscribe(
      playerLeaveSubId, playerJoinSubId, serverClosingSubId, 
      lobbyClosingSubId, diffConfirmedSubId, declareIntentSubId
    ) })
  })

  return (
    <div id="colony-app">
      <StarryBackground />
      {pageContet()}
      <div class={eventFeedContainerStyle} id="event-feed">
        <For each={eventFeed.get}>{event => event}</For>
      </div>
    </div>
  );
}, {bundle: Bundle.COLONY});

export default ColonyApp;

const eventFeedMessageStyle = css`
display: flex;
flex-direction: column;
justify-content: left;
align-items: center;

width: 90%;
height: 5vh;
font-size: 1.5rem;
padding: 0.5rem;

color: white;
${Styles.FANCY_BORDER}
background-color: rgba(0, 0, 0, 0.7);
border-color: rgba(255, 255, 255, 0.5);
${Styles.ANIM_FADE_OUT(eventFeedMessageDurationMS / 1000)}
`

const eventFeedContainerStyle = css`
position: fixed;
display: flex;
flex-direction: column;
justify-content: flex-end;
align-items: center;

right: 0;
bottom: 0;
height: 50vh;
width: 15vw;
row-gap: 1vh;
z-index: 1000;

overflow: hidden;
`	

const colonyTitleStyle = css`
position: absolute;
z-index: 100000;
font-size: 5rem;
top: 0;
left: 0;
`