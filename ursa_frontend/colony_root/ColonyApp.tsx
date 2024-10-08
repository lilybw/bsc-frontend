import { Bundle, BundleComponent, LogLevel } from '../src/meta/types';
import { ApplicationProps } from '../src/ts/types';
import SectionTitle from '../src/components/SectionTitle';
import StarryBackground from '../src/components/StarryBackground';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';
import { createSignal, Accessor, onMount, onCleanup } from 'solid-js';
import { LOBBY_CLOSING_EVENT, PLAYER_JOINED_EVENT, PLAYER_LEFT_EVENT, SERVER_CLOSING_EVENT } from '../src/integrations/multiplayer_backend/EventSpecifications';
import { css } from '@emotion/css';
import { createArrayStore } from '../src/ts/wrappedStore';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../src/ts/actionContext';
import { createWrappedSignal } from '../src/ts/wrappedSignal';

const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  const inputBuffer = createWrappedSignal<string>('');
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.NAVIGATION);
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

  const onColonyInfoLoadError = (error: string) => {
    props.context.logger.error('Failed to load colony info: ' + error);
    setTimeout(() => props.context.nav.goToMenu(), 5000);
    return (
      <ErrorPage content={error} />
    )
  }

  onMount(() => {
    props.context.logger.log('Colony app mounted');
    const playerLeaveSubId = props.context.events.subscribe(PLAYER_LEFT_EVENT, (data) => {
      props.context.logger.log('Player left: ' + data.id);
    })
    const playerJoinSubId = props.context.events.subscribe(PLAYER_JOINED_EVENT, (data) => {
      props.context.logger.log('Player joined: ' + data.id);
    })
    const serverClosingSubId = props.context.events.subscribe(SERVER_CLOSING_EVENT, (ev) => {
      props.context.logger.log('server closing');

    })
    const lobbyClosingSubId = props.context.events.subscribe(LOBBY_CLOSING_EVENT, (ev) => {
      props.context.logger.log('lobby closing');
    })

    onCleanup(() => { props.context.events.unsubscribe(playerLeaveSubId, playerJoinSubId, serverClosingSubId, lobbyClosingSubId) })
  })

  return (
    <div>
      <StarryBackground />
      <Unwrap func={props.context.nav.getRetainedColonyInfo} fallback={onColonyInfoLoadError}>
        {(colonyInfo) => (
          <>
          <SectionTitle styleOverwrite={colonyTitleStyle}>{colonyInfo.name}</SectionTitle>
          <PathGraph 
            bufferSubscribers={bufferSubscribers}
            actionContext={actionContext}
            existingClients={[]}
            colony={colonyInfo}
            plexer={props.context.events}
            text={props.context.text}
            backend={props.context.backend}
            buffer={inputBuffer}
            localPlayerId={Number(props.context.nav.getRetainedUserInfo().res?.id)}
            multiplayerIntegration={props.context.multiplayer}
          />
          </>
        )}
      </Unwrap>
    </div>
  );
}, {bundle: Bundle.COLONY});

export default ColonyApp;

const colonyTitleStyle = css`
position: absolute;
z-index: 100000;
font-size: 5rem;
top: 0;
left: 0;
`