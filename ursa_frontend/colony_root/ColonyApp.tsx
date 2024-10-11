import { Bundle, BundleComponent, LogLevel, ResErr } from '../src/meta/types';
import { ApplicationProps } from '../src/ts/types';
import SectionTitle from '../src/components/SectionTitle';
import StarryBackground from '../src/components/StarryBackground';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';
import { createSignal, Accessor, onMount, onCleanup, JSX, For } from 'solid-js';
import { LOBBY_CLOSING_EVENT, PLAYER_JOINED_EVENT, PLAYER_LEFT_EVENT, SERVER_CLOSING_EVENT } from '../src/integrations/multiplayer_backend/EventSpecifications';
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

type StrictJSX = Node | JSX.ArrayElement | (string & {});
const eventFeedMessageDurationMS = 10_000;

const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  const inputBuffer = createWrappedSignal<string>('');
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.NAVIGATION);
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const eventFeed = createArrayStore<StrictJSX>();
  const clients = createArrayStore<ClientDTO>();

  const onColonyInfoLoadError = (error: string) => {
    props.context.logger.error('Failed to load colony info: ' + error);
    setTimeout(() => props.context.nav.goToMenu(), 0);
    return (
      <ErrorPage content={error} />
    )
  }

  onMount(() => {
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

    onCleanup(() => { props.context.events.unsubscribe(playerLeaveSubId, playerJoinSubId, serverClosingSubId, lobbyClosingSubId) })
  })

  const handleInfoRetrieval = (): ResErr<{colonyInfo: RetainedColonyInfoForPageSwap, playerInfo: PlayerInfoResponseDTO}> => {
    const colonyInfoRes = props.context.nav.getRetainedColonyInfo();
    const playerInfoRes = props.context.nav.getRetainedUserInfo();
    if (colonyInfoRes.err !== null || playerInfoRes.err !== null) {
      return {
        res: null,
        err: 'Failed to get colony or player info: ' + colonyInfoRes.err + ' ' + playerInfoRes.err
      }
    }
    return {
      res: {colonyInfo: colonyInfoRes.res, playerInfo: playerInfoRes.res},
      err: null
    }
  }

  return (
    <div>
      <StarryBackground />
      <Unwrap func={handleInfoRetrieval} fallback={onColonyInfoLoadError}>
        {({colonyInfo, playerInfo}) =>
          <>
          <SectionTitle styleOverwrite={colonyTitleStyle}>{colonyInfo.name}</SectionTitle>
          <NTAwait func={() => props.context.backend.getColony(colonyInfo.owner, colonyInfo.id)}>{ (colony) =>
            <PathGraph 
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
          }</NTAwait>
          </>
        }
      </Unwrap>
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