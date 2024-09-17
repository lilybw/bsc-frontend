/* @refresh reload */
import { render } from 'solid-js/web';
import 'solid-devtools';
import TutorialApp from './TutorialApp';
import GlobalContainer from '../src/GlobalContainer';

const root = document.getElementById('solidjs-inlay-root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found.',
  );
}
render(() => <GlobalContainer app={TutorialApp} />, root!);
