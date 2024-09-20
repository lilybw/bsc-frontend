/* @refresh reload */
import { render } from 'solid-js/web';
import 'solid-devtools';
import MainMenuApp from './MainMenuApp';
import GlobalContainer from '../src/GlobalContainer';
import { SOLIDJS_MOUNT_ELEMENT_ID } from '../src/setup';

const root = document.getElementById(SOLIDJS_MOUNT_ELEMENT_ID);

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found.',
  );
}

render(() => <GlobalContainer app={MainMenuApp} />, root!);