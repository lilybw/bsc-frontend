import type { Component, JSX } from 'solid-js';
import { SHARED_CSS, SHARED_CSS_STR, Styles } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'
import BigMenuButton from '../src/components/BigMenuButton';
import SectionTitle from '../src/components/SectionTitle';

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
      <div class={menuBackground}></div>
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

const menuBackground = css`
    z-index: -1000;
    position: fixed;
    top: -1px;
    left: -1px;
    width: 101%;
    height: 101%;  
    background-image: url('https://cdn.mos.cms.futurecdn.net/BfemybeKVXCf9pgX9WCxsc-1200-80.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    transition: all 1.5s ease-out; 
    filter: blur(2px);
    overflow: clip;
`