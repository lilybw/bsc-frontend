import { createEffect, createSignal, Match, Switch, type Component } from 'solid-js';
import { css } from '@emotion/css';
import ProgressTracker from './ProgressTracker';
import LanguagePage from './slides/LanguagePage';
import { createStore } from 'solid-js/store';
import SlideIcon, { SlideIconProps } from './SlideIcon';
import WelcomePage from './slides/WelcomePage';
import LocationTrial from './slides/LocationTrial';
import NavigationDemo from './slides/NavigationDemo';
import NavigationTrial from './slides/NavigationTrial';
import LocationDemo from './slides/LocationDemo';
import TutorialCompletePage from './slides/TutorialCompletePage';
import BigMenuButton from '@/components/base/BigMenuButton';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import StarryBackground from '@/components/base/StarryBackground';
import NTAwait from '@/components/util/NoThrowAwait';
import ErrorPage from '@/ErrorPage';
import { LanguagePreference } from '@/integrations/vitec/vitecDTOs';
import { BundleComponent, Bundle } from '@/meta/types';
import { ApplicationProps } from '@/ts/types';
import MultiplayerDemo from './slides/MultiplayerDemo';

export type SlideEntry = { hasCompleted: boolean; icon: Component<SlideIconProps>; iconId: number };
const slides: SlideEntry[] = [
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1003,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1006,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1005,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1005,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1002,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1002,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1004,
    },
    {
        hasCompleted: false,
        icon: SlideIcon,
        iconId: 1018,
    },
];

const TutorialApp: BundleComponent<ApplicationProps> = Object.assign(
    function (props: ApplicationProps) {
        const [currentSlide, setCurrentSlide] = createSignal(5);
        const [previousSlide, setPreviousSlide] = createSignal(0);
        const [userSelectedLanguage, setUserSelectedLanguage] = createSignal<LanguagePreference | undefined>(props.context.text.language());
        const [slideStore, setSlides] = createStore<SlideEntry[]>(slides);
        const [currentSlideCompleted, setSlideCompleted] = createSignal(false);

        const onSlideCompleted = () => {
            setSlideCompleted(true);
            setSlides(currentSlide(), 'hasCompleted', true);
        };

        const onAdvanceSlide = () => {
            setCurrentSlide(currentSlide() + 1);
            setSlideCompleted(false);
        };

        const onBackSlide = () => {
            setCurrentSlide(currentSlide() - 1);
            setSlideCompleted(true);
        };

        const onLanguageChange = (language: LanguagePreference) => {
            setUserSelectedLanguage(language);
            props.context.text.setLanguage(language);
        };

        createEffect(() => {
            const current = currentSlide();
            setTimeout(() => setPreviousSlide(current), 50);
        });

        return (
            <div class={containerStyle} id="the-tutorial-app">
                <StarryBackground />
                <ProgressTracker
                    currentSlide={currentSlide}
                    slideStore={slideStore}
                    setSlideStore={setSlides}
                    previousSlide={previousSlide}
                    backend={props.context.backend}
                />
                <Switch fallback={<ErrorPage content="OOC: Out of Cases" />}>
                    <Match when={currentSlide() === 0}>
                        <LanguagePage onLanguageSelected={onLanguageChange} onSlideCompleted={onSlideCompleted} backend={props.context.backend} />
                    </Match>
                    <Match when={currentSlide() === 1}>
                        <WelcomePage onSlideCompleted={onSlideCompleted} backend={props.context.backend} text={props.context.text} />
                    </Match>
                    <Match when={currentSlide() === 2}>
                        <NavigationDemo backend={props.context.backend} onSlideCompleted={onSlideCompleted} text={props.context.text} />
                    </Match>
                    <Match when={currentSlide() === 3}>
                        <NavigationTrial
                            onSlideCompleted={onSlideCompleted}
                            context={props.context}
                            backend={props.context.backend}
                            text={props.context.text}
                        />
                    </Match>
                    <Match when={currentSlide() === 4}>
                        <LocationDemo onSlideCompleted={onSlideCompleted} text={props.context.text} backend={props.context.backend} />
                    </Match>
                    <Match when={currentSlide() === 5}>
                        <LocationTrial onSlideCompleted={onSlideCompleted} text={props.context.text} backend={props.context.backend} />
                    </Match>
                    <Match when={currentSlide() === 6}>
                        <MultiplayerDemo onSlideCompleted={onSlideCompleted} text={props.context.text} backend={props.context.backend} />
                    </Match>
                    <Match when={currentSlide() === 7}>
                        <TutorialCompletePage
                            nav={props.context.nav}
                            onSlideCompleted={onSlideCompleted}
                            text={props.context.text}
                            backend={props.context.backend}
                        />
                    </Match>
                </Switch>
                <div class={navigationFooterStyle} id="tutorial-slide-navigation">
                    {currentSlide() < slideStore.length - 1 && (
                        <BigMenuButton onClick={onAdvanceSlide} styleOverwrite={rightNavigationButtonStyle} enable={currentSlideCompleted}>
                            <NTAwait func={() => props.context.backend.assets.getMetadata(1019)}>
                                {(asset) => (
                                    <GraphicalAsset styleOverwrite={footerImageStyleOverwrite} metadata={asset} backend={props.context.backend} />
                                )}
                            </NTAwait>
                        </BigMenuButton>
                    )}
                    {currentSlide() >= 1 && (
                        <BigMenuButton styleOverwrite={leftNavigationButtonStyle} onClick={onBackSlide}>
                            <NTAwait func={() => props.context.backend.assets.getMetadata(1020)}>
                                {(asset) => (
                                    <GraphicalAsset styleOverwrite={footerImageStyleOverwrite} metadata={asset} backend={props.context.backend} />
                                )}
                            </NTAwait>
                        </BigMenuButton>
                    )}
                </div>
            </div>
        );
    },
    { bundle: Bundle.TUTORIAL },
);
export default TutorialApp;

const footerImageStyleOverwrite = css`
    height: 10vh;
    width: 5vw;
`;

const navigationFooterStyle = css`
    position: absolute;
    display: flex;
    flex-direction: row;
    z-index: 100;

    bottom: 0;
    width: 100%;
    height: 20vh;
`;

const navigationButtonStyle = css`
    position: absolute;
    bottom: 0;
`;
const rightNavigationButtonStyle = css`
    ${navigationButtonStyle}
    right: 0;
`;

const leftNavigationButtonStyle = css`
    ${navigationButtonStyle}
    left: 0;
`;
const containerStyle = css`
    display: flex;
    flex-direction: column;
`;
