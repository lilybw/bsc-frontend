import { createEffect, createMemo, createSignal, Match, Switch, type Component, type JSX } from 'solid-js';

import { SHARED_CSS_STR, Styles } from '../src/sharedCSS';

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
import { Bundle, BundleComponent } from '../src/meta/types';
import { LanguagePreference } from '../src/integrations/vitec/vitecDTOs';

injectGlobal`${SHARED_CSS_STR}`

export type SlideEntry = {hasCompleted: boolean, icon: Component<SlideIconProps>};
const slides: SlideEntry[] = [
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
  {
    hasCompleted: false,
    icon: SlideIcon
  },
]

const TutorialApp: BundleComponent<ApplicationProps> = Object.assign(function (props: ApplicationProps) {
  const [currentSlide, setCurrentSlide] = createSignal(0);
  const [previousSlide, setPreviousSlide] = createSignal(0);
  const [userSelectedLanguage, setUserSelectedLanguage] = createSignal<LanguagePreference | undefined>(props.context.text.language());
  const [slideStore, setSlides] = createStore<SlideEntry[]>(slides);
  const [currentSlideCompleted, setSlideCompleted] = createSignal(false);

  const onSlideCompleted = () => {
    setSlideCompleted(true);
    setSlides(currentSlide(), 'hasCompleted', true);
  }

  const onAdvanceSlide = () => {
    setCurrentSlide(currentSlide() + 1);
    setSlideCompleted(false);
  }

  const onBackSlide = () => {
    setCurrentSlide(currentSlide() - 1);
    setSlideCompleted(true);
  }

  const onLanguageChange = (language: LanguagePreference) => {
    setUserSelectedLanguage(language);
    props.context.text.setLanguage(language);
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
            <LanguagePage onLanguageSelected={onLanguageChange} onSlideCompleted={onSlideCompleted} backend={props.context.backend}/>
          </Match>
          <Match when={currentSlide() === 1}>
            <WelcomePage onSlideCompleted={onSlideCompleted} backend={props.context.backend} text={props.context.text}/>
          </Match>
          <Match when={currentSlide() === 2}>
            <NavigationDemo backend={props.context.backend} onSlideCompleted={onSlideCompleted} text={props.context.text}/>
          </Match>
          <Match when={currentSlide() === 3}>
            <NavigationTrial onSlideCompleted={onSlideCompleted} text={props.context.text}/>
          </Match>
          <Match when={currentSlide() === 4}>
            <LocationDemo onSlideCompleted={onSlideCompleted} text={props.context.text}/>
          </Match>
          <Match when={currentSlide() === 5}>
            <LocationTrial onSlideCompleted={onSlideCompleted} text={props.context.text}/>
          </Match>
          <Match when={currentSlide() === 6}>
            <MultiplayerTrial onSlideCompleted={onSlideCompleted} text={props.context.text}/>
          </Match>
          <Match when={currentSlide() === 7}>
            <TutorialCompletePage onSlideCompleted={onSlideCompleted} text={props.context.text}/>
          </Match>
        </Switch>
        <div class={navigationFooterStyle} id="tutorial-slide-navigation">
            {currentSlide() < slideStore.length &&  
              <BigMenuButton onClick={onAdvanceSlide} styleOverwrite={rightNavigationButtonStyle}
                enable={currentSlideCompleted}>
                Next
              </BigMenuButton>
            }
            {currentSlide() >= 1 &&
              <BigMenuButton styleOverwrite={leftNavigationButtonStyle} onClick={onBackSlide}>
                Back
              </BigMenuButton>
            }
        </div>
    </div>
  );
}, { bundle: Bundle.TUTORIAL });
export default TutorialApp;
const navigationFooterStyle = css`
  position: absolute;
  bottom: 0;
  z-index: 100;
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

const rightNavigationDistabledStyle = css`
  ${rightNavigationButtonStyle}
  pointer-events: none;
  color: grey;
  ${Styles.CROSS_HATCH_GRADIENT}
`

const containerStyle = css`
  display: flex;
  flex-direction: column;
`
