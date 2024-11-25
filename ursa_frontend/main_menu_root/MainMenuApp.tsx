import { createSignal, JSX } from 'solid-js';
import { css } from '@emotion/css';
import LandingPage from './pages/LandingPage';
import ColonyListPage from './pages/ColonyListPage';
import NewColonyPage from './pages/NewColonyPage';
import JoinColonyPage from './pages/JoinColony';
import LanguageSelectInlay from '../src/components/base/LanguageSelectInlay';
import { BundleComponent, Bundle } from '@/meta/types';
import { Styles } from '@/styles/sharedCSS';
import { ApplicationProps } from '@/ts/types';

export enum MenuPages {
    LANDING_PAGE = 'landing',
    NEW_COLONY = 'new',
    CONTINUE_COLONY = 'continue',
    JOIN_COLONY = 'join',
}

const MainMenuApp: BundleComponent<ApplicationProps> = Object.assign(
    ({ context }: ApplicationProps) => {

        const goBack = () => {
            setCurrentPage(() => PreviousPage());
        };

        //Pre loading all pages
        let landing: JSX.Element | undefined;
        let newColony: JSX.Element | undefined;
        let colonyList: JSX.Element | undefined;
        let joinColony: JSX.Element | undefined;

        const goToPage = (page: MenuPages) => {
            setPreviousPage(() => CurrentPage());
            switch (page) {
                case MenuPages.LANDING_PAGE:
                    setCurrentPage(landing);
                    break;
                case MenuPages.NEW_COLONY:
                    setCurrentPage(newColony);
                    break;
                case MenuPages.CONTINUE_COLONY:
                    setCurrentPage(colonyList);
                    break;
                case MenuPages.JOIN_COLONY:
                    setCurrentPage(joinColony);
                    break;
                default:
                    context.logger.error('Invalid page requested: ' + page);
            }
        };

        //deferred instantiation
        landing = LandingPage({ context, goToPage, goBack });
        newColony = NewColonyPage({ context, goToPage, goBack })
        colonyList = ColonyListPage({ context, goToPage, goBack });
        joinColony = JoinColonyPage({ context, goToPage, goBack });

        const [CurrentPage, setCurrentPage] = createSignal<JSX.Element>(landing);
        const [PreviousPage, setPreviousPage] = createSignal<JSX.Element>(landing);

        return (
            <div class={mainMenuAppStyle} id="the-main-menu-app">
                <LanguageSelectInlay text={context.text} backend={context.backend} />
                {CurrentPage()}
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
