import {css} from '@emotion/css'
import { Bundle, BundleComponent } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';
import { ApplicationProps } from '../src/ts/types';
import SectionSubTitle from '../src/components/SectionSubTitle';
import StarryBackground from '../src/components/StarryBackground';
import PathGraph from '../src/components/colony/PathGraph';
import NTAwait from '../src/components/util/NoThrowAwait';
import Unwrap from '../src/components/util/Unwrap';



const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {

  return (
    <div>
      <StarryBackground />
      <header>
        <SectionTitle>Colony</SectionTitle>
        <SectionSubTitle>{JSON.stringify(props.context.nav.getRetainedColonyInfo())}</SectionSubTitle>
      </header>
      <Unwrap func={props.context.nav.getRetainedColonyInfo}>{(colonyInfo) => 
          <PathGraph colonyInfo={colonyInfo} />
      }</Unwrap>
    </div>
  );
}, {bundle: Bundle.COLONY});
export default ColonyApp;
