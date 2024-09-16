/* @refresh reload */
import { render } from 'solid-js/web';
import 'solid-devtools';
import MainMenuApp from './MainMenuApp';
import GlobalContainer from '../src/GlobalContainer';
import { init } from '../src/setup';
import ErrorPage from '../src/ErrorPage';

const root = document.getElementById('solidjs-inlay-root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found.',
  );
}

render(() => <GlobalContainer app={MainMenuApp} />, root!);