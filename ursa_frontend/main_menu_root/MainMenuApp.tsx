import type { Component, JSX } from 'solid-js';
import { SHARED_CSS, SHARED_CSS_STR, Styles } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import BigMenuButton from '../src/components/BigMenuButton';
import SectionTitle from '../src/components/SectionTitle';
import StarryBackground from '../src/components/StarryBackground';

export default function MainMenuApp(): JSX.Element {
  console.log("[delete me] MainMenuApp mounted")
  return (
    <div class={Styles.NO_OVERFLOW} id="the-main-menu-app">
      <SectionTitle>U.R.S.A.</SectionTitle>
      <div class={menuOptionsListStyle}>
        <BigMenuButton>New</BigMenuButton>
        <BigMenuButton>Continue</BigMenuButton>
        <BigMenuButton>Join</BigMenuButton>
        <BigMenuButton>Tutorial</BigMenuButton>
      </div>
      <StarryBackground />
    </div>
  );
};


const menuOptionsListStyle = css`
    display: flex;
    flex-direction: column;
    align-items: left;
    position: absolute;
    top: 50%;
    left: 50%;
    width: 33%;
    transform: translate(-50%, -50%);
`
