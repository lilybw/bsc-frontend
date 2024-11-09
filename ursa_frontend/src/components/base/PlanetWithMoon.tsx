import { Component } from 'solid-js';
import { css } from '@emotion/css';

const bodyStyle = css`
  height: 100vh;
  background: url('./images/space.jpg') center no-repeat;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

const planetStyle = css`
  width: 20em;
  height: 20em;
  background: url('./images/venus.jpg');
  border-radius: 50%;
  background-size: 200% 100%;
  background-repeat: repeat;
  position: relative;
  box-shadow: inset -2em -2em 2em #000,
              -0.5em -0.5em 1em #f0d08b;
  animation: rotate 10s linear infinite;

  @keyframes rotate {
    to {
      background-position: -200% 0;
    }
  }
`;

const moonStyle = css`
  width: 6em;
  height: 6em;
  background: url('./images/mercury.jpg');
  border-radius: 50%;
  background-size: 200% 100%;
  position: absolute;
  left: -11em;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: inset -1.5em -1.5em 1.5em #000,
              -0.2em -0.2em 0.5em #ccc;
  z-index: 1;
  animation: rotate 5s linear infinite,
             orbit 20s infinite ease-in-out;

  @keyframes orbit {
    0% {
      z-index: 1;
      left: 25em;
    }
    49% {
      z-index: 1;
    }
    50% {
      left: -11em;
      z-index: -1;
    }
    99% {
      z-index: -1;
    }
    100% {
      left: 25em;
      z-index: 1;
    }
  }
`;

const PlanetMoonSystem: Component = () => {
    return (
        <div class={bodyStyle}>
            <div class={planetStyle}>
                <div class={moonStyle} />
            </div>
        </div>
    );
};

export default PlanetMoonSystem;