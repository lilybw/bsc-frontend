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

const getSystemContainerStyle = (tiltAngle: number) => css`
  position: relative;
  width: min(66vh, 66vw);
  height: min(66vh, 66vw);
  display: flex;
  justify-content: center;
  align-items: center;
  transform: rotate(${tiltAngle}deg);
`;

type ColorTransform = {
    hue: number;
    name: string;
    filters: string;
};

type PlanetColorScheme = ColorTransform & {
    name: 'red-orange' | 'blue' | 'golden' | 'purple' | 'turquoise';
};

type MoonColorScheme = ColorTransform & {
    name: 'rocky-brown' | 'pale-red' | 'sandy' | 'icy-blue' | 'dusty-purple';
};

const planetColorSchemes: PlanetColorScheme[] = [
    {
        hue: 0,
        name: 'red-orange',
        filters: 'sepia(0.5) hue-rotate(0deg) saturate(1.5) brightness(1.1)'  // Jupiter-like
    },
    {
        hue: 220,
        name: 'blue',
        filters: 'sepia(0.5) hue-rotate(140deg) saturate(1.8) brightness(1)'  // Neptune-like
    },
    {
        hue: 45,
        name: 'golden',
        filters: 'sepia(0.8) hue-rotate(320deg) saturate(1.4) brightness(1.2)'  // Saturn-like
    },
    {
        hue: 280,
        name: 'purple',
        filters: 'sepia(0.4) hue-rotate(230deg) saturate(1.6) brightness(0.9)'  // Purple gas giant
    },
    {
        hue: 160,
        name: 'turquoise',
        filters: 'sepia(0.3) hue-rotate(180deg) saturate(1.7) brightness(1.1)'  // Uranus-like
    }
];

const moonColorSchemes: MoonColorScheme[] = [
    {
        hue: 30,
        name: 'rocky-brown',
        filters: 'sepia(0.6) hue-rotate(350deg) saturate(0.8) brightness(0.9) contrast(1.1)'
    },
    {
        hue: 0,
        name: 'pale-red',
        filters: 'sepia(0.3) hue-rotate(320deg) saturate(0.7) brightness(1) contrast(1)'
    },
    {
        hue: 60,
        name: 'sandy',
        filters: 'sepia(0.8) hue-rotate(330deg) saturate(0.6) brightness(1.1) contrast(1)'
    },
    {
        hue: 200,
        name: 'icy-blue',
        filters: 'sepia(0.2) hue-rotate(160deg) saturate(0.7) brightness(1.2) contrast(0.9)'
    },
    {
        hue: 270,
        name: 'dusty-purple',
        filters: 'sepia(0.4) hue-rotate(220deg) saturate(0.6) brightness(0.9) contrast(1.1)'
    }
];

const getRandomColorScheme = <T extends ColorTransform>(schemes: T[]): T => {
    return schemes[Math.floor(Math.random() * schemes.length)];
};

const getRandomTiltAngle = () => Math.random() * 4 - 2; // generates number between -2 and 2

const getPlanetStyle = (rotationSpeed: number, colorScheme: PlanetColorScheme) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset -2em -2em 2em #000;
  background-size: 200% 100%;
  background-repeat: repeat;
  filter: ${colorScheme.filters};
  animation: rotate ${rotationSpeed}s linear infinite;

  @keyframes rotate {
    to {
      background-position: -200% 0;
    }
  }
`;

const getMoonContainerStyle = (orbitSpeed: number, orbitTilt: number) => css`
  position: absolute;
  width: calc(min(66vh, 66vw) * 0.166);
  height: calc(min(66vh, 66vw) * 0.166);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(${orbitTilt}deg);
  animation: orbit ${orbitSpeed}s infinite ease-in-out;

  @keyframes orbit {
    0% {
      z-index: 1;
      transform: translate(-50%, -50%) rotate(${orbitTilt}deg) translateX(450%);
    }
    49% {
      z-index: 1;
    }
    50% {
      transform: translate(-50%, -50%) rotate(${orbitTilt}deg) translateX(-450%);
      z-index: -1;
    }
    99% {
      z-index: -1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(${orbitTilt}deg) translateX(450%);
      z-index: 1;
    }
  }
`;

const getMoonStyle = (rotationSpeed: number, colorScheme: MoonColorScheme) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset -1.5em -1.5em 1.5em #000;
  background-size: 200% 100%;
  background-repeat: repeat;
  filter: ${colorScheme.filters};
  animation: rotate ${rotationSpeed}s linear infinite;

  @keyframes rotate {
    to {
      background-position: -200% 0;
    }
  }
`;

const getRandomRotationSpeed = () => Math.floor(Math.random() * 120) + 120; // 120-240s
const getRandomOrbitSpeed = () => Math.floor(Math.random() * 80) + 80;    // 80-160s

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
    const moonRotationSpeed = getRandomRotationSpeed() / 2;
    const orbitSpeed = getRandomOrbitSpeed();
    const planetColorScheme = getRandomColorScheme(planetColorSchemes);
    const moonColorScheme = getRandomColorScheme(moonColorSchemes);
    const systemTilt = getRandomTiltAngle();
    const moonOrbitTilt = systemTilt * 2; // Moon orbit tilt is 2x the planet tilt

    console.log('Configuration:', {
        planetRotation: planetRotationSpeed,
        moonRotation: moonRotationSpeed,
        orbit: orbitSpeed,
        planetColor: planetColorScheme.name,
        moonColor: moonColorScheme.name,
        systemTilt: systemTilt,
        moonOrbitTilt: moonOrbitTilt
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
            <div class={getSystemContainerStyle(systemTilt)}>
                <div class={getPlanetStyle(planetRotationSpeed, planetColorScheme)} ref={setPlanetDiv}>
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
                <div class={getMoonContainerStyle(orbitSpeed, moonOrbitTilt)}>
                    <div class={getMoonStyle(moonRotationSpeed, moonColorScheme)} ref={setMoonDiv}>
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