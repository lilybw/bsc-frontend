import {css} from '@emotion/css'
import { Bundle, BundleComponent } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';
import { ApplicationProps } from '../src/ts/types';

const testTyles = css`
    background-color: #000000;
`


const ColonyApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  return (
    <div class={testTyles}>
      <header>
        <SectionTitle>Colony</SectionTitle>
      </header>
    </div>
  );
}, {bundle: Bundle.COLONY});
export default ColonyApp;
