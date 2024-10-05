import { Bundle, BundleComponent, LogLevel } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';
import { ApplicationProps } from '../src/ts/types';
import SectionSubTitle from '../src/components/SectionSubTitle';
import StarryBackground from '../src/components/StarryBackground';
import PathGraph from '../src/components/colony/PathGraph';
import Unwrap from '../src/components/util/Unwrap';
import ErrorPage from '../src/ErrorPage';

const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {

  const onColonyInfoLoadError = (error: string) => {
    props.context.logger.error('Failed to load colony info: ' + error);
    setTimeout(() => props.context.nav.goToMenu(), 5000);
    return (
      <ErrorPage content={error} />
    )
  }

  return (
    <div>
      <StarryBackground />
      <header>
        <SectionTitle>Colony</SectionTitle>
      </header>
      <Unwrap func={props.context.nav.getRetainedColonyInfo} fallback={onColonyInfoLoadError}>{(colonyInfo) => 
          {return (<PathGraph colony={colonyInfo} backend={props.context.backend} text={props.context.text} />)}
      }</Unwrap>
    </div>
  );
}, {bundle: Bundle.COLONY});
export default ColonyApp;
