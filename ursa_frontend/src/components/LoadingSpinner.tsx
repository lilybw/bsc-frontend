import { Component, For } from 'solid-js';
import { css, keyframes } from '@emotion/css';
import StarryBackground from './StarryBackground';
import SectionTitle from './SectionTitle';

const orbit = keyframes`
  from { transform: translate(-50%, -50%) rotate(var(--start-position)); }
  to { transform: translate(-50%, -50%) rotate(calc(var(--start-position) + 360deg)); }
`;

const pulse = keyframes`
  0%, 100% { 
    transform: scale(1) translate(-50%, -50%); 
    box-shadow: 0 0 0rem white;
    background: radial-gradient(circle, white 0%, #f7971e 100%);
    filter: brightness(.6);
  }
  50% { 
    transform: scale(1.1) translate(-50%, -50%); 
    box-shadow: 0 0 5rem white;
    background: radial-gradient(circle, white 0%, #f7971e 100%);
    filter: brightness(1);
  }
`;

const spinnerStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
  z-index: 9999;
`;

const solarSystemStyles = css`
  position: relative;
  width: 100%;
  height: 100%;
`;

const sunStyles = css`
  position: fixed;
  --sun-radius: 3rem;
  top: 50%;
  left: 50%;
  width: var(--sun-radius);
  height: var(--sun-radius);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ${pulse} 4s ease-in-out infinite;
`;

const orbitStyles = css`
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border-style: solid;
  filter: drop-shadow(0 0 .5rem white);
`;

const textStyles = css`
  z-index: 0;
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  color: #ffffff;
  font-size: 3rem;
  font-weight: bold;
  text-transform: uppercase;
  text-shadow: 0 0 1rem black;
  letter-spacing: 0.5rem;
`;

const color = '30';
const planets = [
  { name: 'Mercury', color: `hsl(${color}, 50%, 70%)`, size: .333, orbitSize: 16, speed: 6 },
  { name: 'Venus', color: `hsl(${color}, 50%, 60%)`, size: .5, orbitSize: 20, speed: 10 },
  { name: 'Earth', color: `hsl(${color}, 50%, 50%)`, size: .533, orbitSize: 26, speed: 14 },
  { name: 'Mars', color: `hsl(${color}, 50%, 40%)`, size: .466, orbitSize: 32, speed: 22 },
  { name: 'Jupiter', color: `hsl(${color}, 50%, 30%)`, size: 1, orbitSize: 40, speed: 42 },
  { name: 'Saturn', color: `hsl(${color}, 50%, 20%)`, size: 0.933, orbitSize: 48, speed: 62 },
];

interface LoadingSpinnerProps {
    loadingText?: string;
}

const LoadingSpinner: Component<LoadingSpinnerProps> = (props: LoadingSpinnerProps) => {
  const getRandomStartPosition = () => Math.floor(Math.random() * 360);

  return (
    <div class={spinnerStyles}>
      <StarryBackground styleOverwrite={css`filter: brightness(.3);`}/>
      <div class={solarSystemStyles}>
        <div class={sunStyles}></div>
        <SectionTitle styleOverwrite={textStyles}>{props.loadingText ?? "Loading..."}</SectionTitle>
        <For each={planets}>
          {(planet) => {
            const startPosition = getRandomStartPosition();
            return (
              <div
                class={orbitStyles}
                style={{
                  width: `${planet.orbitSize}rem`,
                  height: `${planet.orbitSize}rem`,
                  "border-width": `1px 1px 1px ${planet.size}rem`,
                  "border-color": planet.color,
                  '--start-position': `${startPosition}deg`,
                  "animation": `${orbit} ${planet.speed}s linear infinite`,
                }}
              ></div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default LoadingSpinner;