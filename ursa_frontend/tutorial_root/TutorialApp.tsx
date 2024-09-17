import type { Component, JSX } from 'solid-js';

import { SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import { ApplicationContext } from '../src/meta/types';

injectGlobal`${SHARED_CSS_STR}`

export default function TutorialApp(context: ApplicationContext): JSX.Element {
  return (
    <div>
      <header>
        <h1>Tutorial</h1>
      </header>
    </div>
  );
};
