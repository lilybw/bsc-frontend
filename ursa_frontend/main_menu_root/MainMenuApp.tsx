import { createSignal, type Component, type JSX } from 'solid-js';
import { SHARED_CSS, SHARED_CSS_STR, Styles } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import BigMenuButton from '../src/components/BigMenuButton';
import SectionTitle from '../src/components/SectionTitle';
import StarryBackground from '../src/components/StarryBackground';
import { ApplicationContext, Bundle, BundleComponent } from '../src/meta/types';
import LandingPage from './pages/LandingPage';
import { ApplicationProps } from '../src/ts/types';
import Spinner from '../src/components/SimpleLoadingSpinner';
import SomethingWentWrongIcon from '../src/components/SomethingWentWrongIcon';
import ColonyListPage from './pages/ColonyListPage';
import NewColonyPage from './pages/NewColonyPage';
import ManagedPlanet from '../src/components/ManagedPlanet';

export enum MenuPages {
  LANDING_PAGE = "landing",
  NEW_COLONY = "new",
  CONTINUE_COLONY = "continue",
  JOIN_COLONY = "join",
}
export type MenuPageProps = {
  context: ApplicationContext;
  goToPage: (page: MenuPages) => void;
  goBack: () => void;
}
type MenuPageComponent = Component<MenuPageProps>;

const MainMenuApp: BundleComponent<ApplicationProps> = Object.assign((props: ApplicationProps) => {
  const [CurrentPage, setCurrentPage] = createSignal<MenuPageComponent>(LandingPage);
  const [PreviousPage, setPreviousPage] = createSignal<MenuPageComponent>(LandingPage);

  const goToPage = (page: MenuPages) => {
    setPreviousPage(() => CurrentPage());
    switch (page) {
      case MenuPages.LANDING_PAGE:
        setCurrentPage(() => LandingPage);
        break;
      case MenuPages.NEW_COLONY:
        setCurrentPage(() => NewColonyPage)
        break;
      case MenuPages.CONTINUE_COLONY:
        setCurrentPage(() => ColonyListPage);
        break;
      case MenuPages.JOIN_COLONY:
        break;
      default:
        props.context.logger.log("Invalid page requested: " + page);
    }
  }

  const goBack = () => {
    setCurrentPage(() => PreviousPage());
  }

  return (
    <div class={mainMenuAppStyle} id="the-main-menu-app">
      <ManagedPlanet asset={5} backend={props.context.backend} />
      {CurrentPage()({context: props.context, goToPage: goToPage, goBack: goBack})}
    </div>
  );
}, {bundle: Bundle.MENU});
export default MainMenuApp;

const mainMenuAppStyle = css`
  width: 100vw;
  height: 100vh;
  ${Styles.NO_OVERFLOW}
`