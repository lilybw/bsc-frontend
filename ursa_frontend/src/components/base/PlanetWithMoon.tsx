import { Component, createSignal } from 'solid-js';
import { css } from '@emotion/css';
import GraphicalAsset from './GraphicalAsset';
import NTAwait from '../util/NoThrowAwait';
import { ApplicationContext } from '@/meta/types';

const containerStyle = css`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const systemContainerStyle = css`
  position: relative;
  width: min(66vh, 66vw);
  height: min(66vh, 66vw);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const getPlanetStyle = (rotationSpeed: number) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset -2em -2em 2em #000;
  background-size: 200% 100%;
  background-repeat: repeat;
  animation: rotate ${rotationSpeed}s linear infinite;

  @keyframes rotate {
    to {
      background-position: -200% 0;
    }
  }
`;

const getMoonContainerStyle = (orbitSpeed: number) => css`
  position: absolute;
  width: calc(min(66vh, 66vw) * 0.166);
  height: calc(min(66vh, 66vw) * 0.166);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: orbit ${orbitSpeed}s infinite ease-in-out;

  @keyframes orbit {
    0% {
      z-index: 1;
      transform: translate(-50%, -50%) translateX(450%);
    }
    49% {
      z-index: 1;
    }
    50% {
      transform: translate(-50%, -50%) translateX(-450%);
      z-index: -1;
    }
    99% {
      z-index: -1;
    }
    100% {
      transform: translate(-50%, -50%) translateX(450%);
      z-index: 1;
    }
  }
`;

const getMoonStyle = (rotationSpeed: number) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset -1.5em -1.5em 1.5em #000;
  background-size: 200% 100%;
  background-repeat: repeat;
  animation: rotate ${rotationSpeed}s linear infinite;

  @keyframes rotate {
    to {
      background-position: -200% 0;
    }
  }
`;

const getRandomRotationSpeed = () => Math.floor(Math.random() * 45) + 45; // 45-90s
const getRandomOrbitSpeed = () => Math.floor(Math.random() * 30) + 30;    // 30-60s

const getDominantColor = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';

    canvas.width = 1;
    canvas.height = 1;

    ctx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

    return `rgb(${r}, ${g}, ${b})`;
};

interface PlanetMoonSystemProps {
    context: ApplicationContext
}

const PlanetMoonSystem: Component<PlanetMoonSystemProps> = (props) => {
    const [planetDiv, setPlanetDiv] = createSignal<HTMLDivElement | null>(null);
    const [moonDiv, setMoonDiv] = createSignal<HTMLDivElement | null>(null);

    const planetRotationSpeed = getRandomRotationSpeed();
    const moonRotationSpeed = getRandomRotationSpeed();
    const orbitSpeed = getRandomOrbitSpeed();

    console.log('Speeds:', {
        planetRotation: planetRotationSpeed,
        moonRotation: moonRotationSpeed,
        orbit: orbitSpeed
    });

    const handlePlanetLoad = (img: HTMLImageElement) => {
        if (planetDiv()) {
            const dominantColor = getDominantColor(img);
            planetDiv()!.style.backgroundImage = `url(${img.src})`;
            planetDiv()!.style.boxShadow = `inset -2em -2em 2em #000, -0.5em -0.5em 1em ${dominantColor}`;
        }
    };

    const handleMoonLoad = (img: HTMLImageElement) => {
        if (moonDiv()) {
            const dominantColor = getDominantColor(img);
            moonDiv()!.style.backgroundImage = `url(${img.src})`;
            moonDiv()!.style.boxShadow = `inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em ${dominantColor}`;
        }
    };

    return (
        <div class={containerStyle}>
            <div class={systemContainerStyle}>
                <div class={getPlanetStyle(planetRotationSpeed)} ref={setPlanetDiv}>
                    <NTAwait func={() => props.context.backend.assets.getMetadata(3001)}>
                        {(asset) => (
                            <GraphicalAsset
                                metadata={asset}
                                backend={props.context.backend}
                                onImageLoad={handlePlanetLoad}
                                styleOverwrite={css`
                                    display: none;
                                `}
                            />
                        )}
                    </NTAwait>
                </div>
                <div class={getMoonContainerStyle(orbitSpeed)}>
                    <div class={getMoonStyle(moonRotationSpeed)} ref={setMoonDiv}>
                        <NTAwait func={() => props.context.backend.assets.getMetadata(3005)}>
                            {(asset) => (
                                <GraphicalAsset
                                    metadata={asset}
                                    backend={props.context.backend}
                                    onImageLoad={handleMoonLoad}
                                    styleOverwrite={css`
                                        display: none;
                                    `}
                                />
                            )}
                        </NTAwait>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanetMoonSystem;