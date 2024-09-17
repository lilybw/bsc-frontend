import { createSignal, type Component, type JSX } from 'solid-js';

import { SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import { ApplicationContext } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';

injectGlobal`${SHARED_CSS_STR}`

export default function TutorialApp(context: ApplicationContext): JSX.Element {
  const [currentSlide, setCurrentSlide] = createSignal(0);
  return (
    <div>
      <header>
        <SectionTitle>Tutorial</SectionTitle>
      </header>
    </div>
  );
};
