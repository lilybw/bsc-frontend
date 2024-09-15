import type { Component } from 'solid-js';

import { SHARED_CSS, SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'

const testTyles = css`
    background-color: #000000;
`

injectGlobal(SHARED_CSS)


const ColonyApp: Component = () => {
  return (
    <div class={testTyles}>
      <header>
        <h1>Colony</h1>
      </header>
    </div>
  );
};

export default ColonyApp;
