import type { Component, JSX } from 'solid-js';
import { SHARED_CSS, SHARED_CSS_STR } from '../src/sharedCSS';

import {injectGlobal, css} from '@emotion/css'

export default function MainMenuApp(): JSX.Element {
  console.log("[delete me] MainMenuApp mounted")
  return (
    <>
      <div class={gameTitleStyle}>U.R.S.A.</div>
      <div class={menuOptionsListStyle}>
        <button class={menuOptionStyle}>New</button>
        <button class={menuOptionStyle}>Continue</button>
        <button class={menuOptionStyle}>Join</button>
        <button class={menuOptionStyle}>Tutorial</button>
      </div>
      <div class={menuBackground}></div>
    </>
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

const menuOptionStyle = css`
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 2rem;
    padding: 1rem;
    margin: 1rem;
    border-radius: 1rem;
    border: 1px solid black;
    box-shadow: inset 0 0 4px white;  
    cursor: pointer;
    text-shadow: none;
    scale: 1;
    transition: all 0.3s ease-out;
    &:hover {
        scale: 1.1;
        border: 1px solid white;
        box-shadow: inset 0 0 10px white;
        background-color: rgba(0, 0, 0, 0.7);
        text-shadow: 2px 2px 4px white;
    }
`

const gameTitleStyle = css`
    color: white;
    margin: 2rem;
    font-size: 5rem;
    letter-spacing: 1rem;
    font-family: system-ui;
    text-shadow: .75rem .3rem .3rem rgba(255, 255, 255, .3);
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