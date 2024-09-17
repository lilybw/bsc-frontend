import type { Component, JSX } from 'solid-js';

import { SHARED_CSS, SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import { ApplicationContext } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';

const testTyles = css`
    background-color: #000000;
`

injectGlobal(SHARED_CSS)


export default function ColonyApp(context: ApplicationContext): JSX.Element {
  return (
    <div class={testTyles}>
      <header>
        <SectionTitle>Colony</SectionTitle>
      </header>
    </div>
  );
};
