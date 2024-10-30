import { createSignal, type Component } from 'solid-js';
import { Styles } from '../src/sharedCSS';
import { css } from '@emotion/css';
import { ApplicationContext, Bundle, BundleComponent } from '../src/meta/types';
import LandingPage from './pages/LandingPage';
import { ApplicationProps } from '../src/ts/types';
import ColonyListPage from './pages/ColonyListPage';
import NewColonyPage from './pages/NewColonyPage';
import JoinColonyPage from './pages/JoinColony';
import LanguageSelectInlay from './pages/LanguageSelectInlay';
import HandPlacementCheck from '../src/components/colony/HandPlacementCheck';

export enum MenuPages {
    LANDING_PAGE = 'landing',
    NEW_COLONY = 'new',
    CONTINUE_COLONY = 'continue',
    JOIN_COLONY = 'join',
}
export type MenuPageProps = {
    context: ApplicationContext;
    goToPage: (page: MenuPages) => void;
    goBack: () => void;
};
type MenuPageComponent = Component<MenuPageProps>;

const MainMenuApp: BundleComponent<ApplicationProps> = Object.assign(
    (props: ApplicationProps) => {
        const [CurrentPage, setCurrentPage] = createSignal<MenuPageComponent>(LandingPage);
        const [PreviousPage, setPreviousPage] = createSignal<MenuPageComponent>(LandingPage);

        const goToPage = (page: MenuPages) => {
            setPreviousPage(() => CurrentPage());
            switch (page) {
                case MenuPages.LANDING_PAGE:
                    setCurrentPage(() => LandingPage);
                    break;
                case MenuPages.NEW_COLONY:
                    setCurrentPage(() => NewColonyPage);
                    break;
                case MenuPages.CONTINUE_COLONY:
                    setCurrentPage(() => ColonyListPage);
                    break;
                case MenuPages.JOIN_COLONY:
                    setCurrentPage(() => JoinColonyPage);
                    break;
                default:
                    props.context.logger.info('Invalid page requested: ' + page);
            }
        };

        const goBack = () => {
            setCurrentPage(() => PreviousPage());
        };

        const [a, setA] = createSignal(true);
        return (
            <div class={mainMenuAppStyle} id="the-main-menu-app">
                <LanguageSelectInlay text={props.context.text} backend={props.context.backend} />
                {CurrentPage()({ context: props.context, goToPage: goToPage, goBack: goBack })}
                {a() && <HandPlacementCheck
                    nameOfMinigame='GameHere'
                    nameOfOwner='User1'
                    gameToBeMounted={{ senderID: 1, eventID: 489, minigameID: 1,
                        difficultyID: 1,
                        difficultyName: "Let"}}
                    backend={props.context.backend}
                    events={props.context.events}
                    text={props.context.text}
                    clearSelf={() => setA(false)}
                    goToWaitingScreen={() => {}}

                />}
            </div>
        );
    },
    { bundle: Bundle.MENU },
);
export default MainMenuApp;

const mainMenuAppStyle = css`
    width: 100vw;
    height: 100vh;
    ${Styles.NO_OVERFLOW}
`;
