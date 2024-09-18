import { createEffect, createSignal, Match, Switch, type Component, type JSX } from 'solid-js';

import { SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import { ApplicationContext } from '../src/meta/types';
import SectionTitle from '../src/components/SectionTitle';
import BigMenuButton from '../src/components/BigMenuButton';
import ProgressTracker from './ProgressTracker';
import LanguagePage from './LanguagePage';
import ErrorPage from '../src/ErrorPage';
import { createStore } from 'solid-js/store';
import SlideIcon, { SlideIconProps } from './SlideIcon';

injectGlobal`${SHARED_CSS_STR}`

export type SlideEntry = {visited: boolean, icon: Component<SlideIconProps>};

export default function TutorialApp(context: ApplicationContext): JSX.Element {
  const [currentSlide, setCurrentSlide] = createSignal(0);
  const [previousSlide, setPreviousSlide] = createSignal(0);
  const [hasCompletedSlide, setHasCompletedSlide] = createSignal(false);
  const [userSelectedLanguage, setUserSelectedLanguage] = createSignal<string | null>(null);
  const [slideStore, setSlides] = createStore<SlideEntry[]>([
    {
      visited: true,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
    {
      visited: false,
      icon: SlideIcon
    },
  ]);

  const onSlideCompleted = (slideNum: number) => {
    setHasCompletedSlide(true);
  }

  const onAdvanceSlide = () => {
    setCurrentSlide(currentSlide() + 1);
    setHasCompletedSlide(false);
  }

  createEffect(() => {
    const current = currentSlide();
    setTimeout(() => setPreviousSlide(current), 50);
  })

  return (
    <div class={containerStyle} id="the-tutorial-app">
        <ProgressTracker currentSlide={currentSlide} slideStore={slideStore} setSlideStore={setSlides} previousSlide={previousSlide}/>
        <Switch fallback= {<ErrorPage content="OOC: Out of Cases" />}>
          <Match when={currentSlide() === 0}>
            <LanguagePage onLanguageSelected={setUserSelectedLanguage} onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 1}>
            <LanguagePage onLanguageSelected={setUserSelectedLanguage} onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 2}>
            <LanguagePage onLanguageSelected={setUserSelectedLanguage} onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 3}>
            <LanguagePage onLanguageSelected={setUserSelectedLanguage} onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
        </Switch>
        <div class={navigationFooterStyle}>
            {currentSlide() < slideStore.length && hasCompletedSlide() ? 
              <BigMenuButton styleOverwrite={rightNavigationButtonStyle} onClick={onAdvanceSlide}>Next</BigMenuButton> : <></>}
            {currentSlide() >= 1 ? 
              <BigMenuButton styleOverwrite={leftNavigationButtonStyle} onClick={() => setCurrentSlide(currentSlide() - 1)}>Back</BigMenuButton> : <></>}
        </div>
    </div>
  );
};

const navigationFooterStyle = css`
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
`

const navigationButtonStyle = css`
  position: absolute;
  bottom: 0;
`

const leftNavigationButtonStyle = css`
  ${navigationButtonStyle}
  left: 0;
`
const rightNavigationButtonStyle = css`
  ${navigationButtonStyle}
  right: 0;
`

const containerStyle = css`
  display: flex;
  flex-direction: column;
`
