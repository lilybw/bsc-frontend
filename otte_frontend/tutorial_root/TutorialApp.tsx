import type { Component } from 'solid-js';

import { SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'

injectGlobal`${SHARED_CSS_STR}`

const TutorialApp: Component = () => {
  return (
    <div>
      <header>
        <h1>Tutorial</h1>
      </header>
    </div>
  );
};

export default TutorialApp;
