import { createEffect, createSignal, Match, Switch, type Component, type JSX } from 'solid-js';

import { SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import BigMenuButton from '../src/components/BigMenuButton';
import ProgressTracker from './ProgressTracker';
import LanguagePage from './slides/LanguagePage';
import ErrorPage from '../src/ErrorPage';
import { createStore } from 'solid-js/store';
import SlideIcon, { SlideIconProps } from './SlideIcon';
import WelcomePage from './slides/WelcomePage';
import LocationTrial from './slides/LocationTrial';
import NavigationDemo from './slides/NavigationDemo';
import NavigationTrial from './slides/NavigationTrial';
import LocationDemo from './slides/LocationDemo';
import MultiplayerTrial from './slides/MultiplayerTrial';
import TutorialCompletePage from './slides/TutorialCompletePage';
import { ApplicationProps } from '../src/ts/types';
import StarryBackground from '../src/components/StarryBackground';

injectGlobal`${SHARED_CSS_STR}`

export type SlideEntry = {visited: boolean, icon: Component<SlideIconProps>};

const TutorialApp: Component<ApplicationProps> = (props) => {
  const [currentSlide, setCurrentSlide] = createSignal(2);
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
        <StarryBackground />
        <ProgressTracker currentSlide={currentSlide} slideStore={slideStore} setSlideStore={setSlides} previousSlide={previousSlide}/>
        <Switch fallback= {<ErrorPage content="OOC: Out of Cases" />}>
          <Match when={currentSlide() === 0}>
            <LanguagePage onLanguageSelected={setUserSelectedLanguage} onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 1}>
            <WelcomePage onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 2}>
            <NavigationDemo backend={props.context.backend} onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 3}>
            <NavigationTrial onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 4}>
            <LocationDemo onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 5}>
            <LocationTrial onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 6}>
            <MultiplayerTrial onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
          <Match when={currentSlide() === 7}>
            <TutorialCompletePage onSlideCompleted={() => onSlideCompleted(currentSlide())} />
          </Match>
        </Switch>
        <div class={navigationFooterStyle} id="tutorial-slide-navigation">
            {currentSlide() < slideStore.length && hasCompletedSlide() ? 
              <BigMenuButton styleOverwrite={rightNavigationButtonStyle} onClick={onAdvanceSlide}>Next</BigMenuButton> : <></>}
            {currentSlide() >= 1 ? 
              <BigMenuButton styleOverwrite={leftNavigationButtonStyle} onClick={() => setCurrentSlide(currentSlide() - 1)}>Back</BigMenuButton> : <></>}
        </div>
    </div>
  );
};
export default TutorialApp;
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
