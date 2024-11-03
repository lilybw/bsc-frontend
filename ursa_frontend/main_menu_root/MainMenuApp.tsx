import { createSignal, type Component } from 'solid-js';
import { css } from '@emotion/css';
import LandingPage from './pages/LandingPage';
import ColonyListPage from './pages/ColonyListPage';
import NewColonyPage from './pages/NewColonyPage';
import JoinColonyPage from './pages/JoinColony';
import LanguageSelectInlay from '../src/components/base/LanguageSelectInlay';
import { ApplicationContext, BundleComponent, Bundle } from '@/meta/types';
import { Styles } from '@/sharedCSS';
import { ApplicationProps } from '@/ts/types';
import VictoryScreen from '@colony/VictoryScreen';
import DefeatScreen from '@colony/DefeatScreen';

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

        return (
            <div class={mainMenuAppStyle} id="the-main-menu-app">
                <LanguageSelectInlay text={props.context.text} backend={props.context.backend} />
                {CurrentPage()({ context: props.context, goToPage: goToPage, goBack: goBack })}
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
