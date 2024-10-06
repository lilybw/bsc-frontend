import { Bundle, BundleComponent, LogLevel } from '../src/meta/types';
import { ApplicationProps } from '../src/ts/types';
import SectionTitle from '../src/components/SectionTitle';
import SectionSubTitle from '../src/components/SectionSubTitle';
import StarryBackground from '../src/components/StarryBackground';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';
import { createSignal, Accessor } from 'solid-js';

const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  // Create a buffer state
  const [buffer, setBuffer] = createSignal('test');

  const onColonyInfoLoadError = (error: string) => {
    props.context.logger.error('Failed to load colony info: ' + error);
    setTimeout(() => props.context.nav.goToMenu(), 5000);
    return (
      <ErrorPage content={error} />
    )
  }

  // Function to update buffer
  const updateBuffer = (value: string) => {
    setBuffer(value);
    // You might want to perform additional actions here when the buffer changes
  }

  return (
    <div>
      <StarryBackground />
      <header>
        <SectionTitle>Colony</SectionTitle>
      </header>
      <Unwrap func={props.context.nav.getRetainedColonyInfo} fallback={onColonyInfoLoadError}>
        {(colonyInfo) => (
          <PathGraph 
            colony={colonyInfo}
            plexer={props.context.events}
            text={props.context.text}
            backend={props.context.backend}
            buffer={buffer}
            localPlayerId={Number(props.context.nav.getRetainedUserInfo().res?.id)}
          />
        )}
      </Unwrap>
    </div>
  );
}, {bundle: Bundle.COLONY});

export default ColonyApp;