import type { Component, JSX } from 'solid-js';

import { SHARED_CSS, SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import { ApplicationContext } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';
import { ApplicationProps } from '../src/ts/types';

const testTyles = css`
    background-color: #000000;
`

injectGlobal(SHARED_CSS)


const ColonyApp: Component<ApplicationProps> = (props) => {
  return (
    <div class={testTyles}>
      <header>
        <SectionTitle>Colony</SectionTitle>
      </header>
    </div>
  );
};
export default ColonyApp;
