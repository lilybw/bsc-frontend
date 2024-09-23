/** @jsxImportSource solid-js */
import { Component } from "solid-js";
import { css } from "@emotion/css";

// Import the green gas giant image
import greenGasGiantImage from './images/Green Gas Giant.png';
import moon from './images/Moon.png';

const PlanetWithMoon: Component = () => {
  return (
    <div class={containerStyle}>
      <div class={planetStyle}>
        <div class={moonStyle}></div>
      </div>
    </div>
  );
};

export default PlanetWithMoon;  // Changed to default export

const containerStyle = css`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const planetStyle = css`
  width: 80em;
  height: 80em;
  background: url(${greenGasGiantImage});
  box-shadow: inset -8em -8em 4em #000, -1.2em -1.2em 2em #658E66;
  position: relative;
  animation: rotate 10000s linear infinite;
  border-radius: 50%;
  background-repeat: repeat;
  background-size: 1000% 100%;

  @keyframes rotate {
    to {
      background-position: -2000% 0;
    }
  }
`;

const moonStyle = css`
  background: url(${moon});
  width: 6em;
  height: 6em;
  position: absolute;
  left: -15em;
  top: 50%;
  transform: translateY(-50%);
  animation: rotate 2000s linear infinite, orbit 60s infinite ease-in-out;
  border-radius: 50%;
  box-shadow: inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em #AA653C;

  @keyframes orbit {
    49% { 
      z-index: 1; 
    }
    50% { 
      z-index: -1;
      left: 90em;
    }
    99% {
      z-index: -1;
    }
    100% {
      left: -15rem;
      z-index: 1;
    }
  }
`;