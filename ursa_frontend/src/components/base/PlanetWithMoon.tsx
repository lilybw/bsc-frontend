import { Component, createSignal, For } from 'solid-js';
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
        filters: 'sepia(0.5) hue-rotate(0deg) saturate(1.5) brightness(1.1)'
    },
    {
        hue: 220,
        name: 'blue',
        filters: 'sepia(0.5) hue-rotate(140deg) saturate(1.8) brightness(1)'
    },
    {
        hue: 45,
        name: 'golden',
        filters: 'sepia(0.8) hue-rotate(320deg) saturate(1.4) brightness(1.2)'
    },
    {
        hue: 280,
        name: 'purple',
        filters: 'sepia(0.4) hue-rotate(230deg) saturate(1.6) brightness(0.9)'
    },
    {
        hue: 160,
        name: 'turquoise',
        filters: 'sepia(0.3) hue-rotate(180deg) saturate(1.7) brightness(1.1)'
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

type Moon = {
    id: number;
    rotationSpeed: number;
    orbitSpeed: number;
    orbitTilt: number;
    colorScheme: MoonColorScheme;
    size: number;
    orbitDistance: number;
};

const getRandomColorScheme = <T extends ColorTransform>(schemes: T[]): T => {
    return schemes[Math.floor(Math.random() * schemes.length)];
};

const getRandomTiltAngle = (range: number = 5) => Math.random() * (2 * range) - range;
const getRandomRotationSpeed = () => Math.floor(Math.random() * 120) + 120;
const getRandomOrbitSpeed = () => Math.floor(Math.random() * 80) + 80;
const getRandomMoonCount = () => Math.floor(Math.random() * 5) + 1;
const getRandomMoonSize = () => (1 / 12) + Math.random() * ((1 / 8) - (1 / 12));; // Between 1/12 and 1/8 of planet
const getRandomOrbitDistance = () => 0.6 + (Math.random() * 0.1); // Between 60% and 70% of planet size

const getTiltWrapperStyle = (tiltAngle: number, orbitSpeed: number, moonId: number) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(${tiltAngle}deg);
  animation: zindex${orbitSpeed}_${moonId} ${orbitSpeed}s infinite ease-in-out;

  @keyframes zindex${orbitSpeed}_${moonId} {
    0% {
      z-index: ${-((moonId + 1) * 5)};
    }
    49.99% {
      z-index: ${-((moonId + 1) * 5)};
    }
    50% {
      z-index: ${25 - (moonId * 5)};
    }
    99.99% {
      z-index: ${25 - (moonId * 5)};
    }
  }
`;
const getPlanetStyle = (rotationSpeed: number, colorScheme: PlanetColorScheme) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-shadow: inset -2em -2em 2em #000;
  background-size: 200% 100%;
  background-repeat: repeat;
  filter: ${colorScheme.filters};
  animation: rotate ${rotationSpeed}s linear infinite;
  z-index: 0;

  @keyframes rotate {
    to {
      background-position: -200% 0;
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
    context: ApplicationContext;
}

const PlanetMoonSystem: Component<PlanetMoonSystemProps> = (props) => {
    const [planetDiv, setPlanetDiv] = createSignal<HTMLDivElement | null>(null);
    const [moonDivs, setMoonDivs] = createSignal<Map<number, HTMLDivElement | null>>(new Map());
    const [planetSize, setPlanetSize] = createSignal<number>(0);
    const planetAssets = [3001]
    const moonAssets = [3005, 3002, 3006, 3007]

    const getOrbitContainerStyle = (orbitSpeed: number, size: number, orbitDistance: number) => css`
        position: absolute;
        width: ${planetSize() * size}px;
        height: ${planetSize() * size}px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        animation: move${orbitSpeed} ${orbitSpeed}s infinite ease-in-out;

        @keyframes move${orbitSpeed} {
            0% {
                transform: translate(-50%, -50%) translateX(${planetSize() * orbitDistance}px);
            }
            50% {
                transform: translate(-50%, -50%) translateX(${-planetSize() * orbitDistance}px);
            }
            100% {
                transform: translate(-50%, -50%) translateX(${planetSize() * orbitDistance}px);
            }
        }
    `;

    const planetRotationSpeed = getRandomRotationSpeed();
    const planetColorScheme = getRandomColorScheme(planetColorSchemes);
    const planetTilt = getRandomTiltAngle();

    const moons: Moon[] = Array.from(
        { length: getRandomMoonCount() },
        (_, index) => ({
            id: index,
            rotationSpeed: getRandomRotationSpeed() / 2,
            orbitSpeed: getRandomOrbitSpeed(),
            orbitTilt: getRandomTiltAngle(20),
            colorScheme: getRandomColorScheme(moonColorSchemes),
            size: getRandomMoonSize(),
            orbitDistance: getRandomOrbitDistance()
        })
    );

    console.log('Configuration:', {
        planetRotation: planetRotationSpeed,
        planetColor: planetColorScheme.name,
        planetTilt,
        moons: moons.map(moon => ({
            id: moon.id,
            rotation: moon.rotationSpeed,
            orbit: moon.orbitSpeed,
            color: moon.colorScheme.name,
            tilt: moon.orbitTilt,
            size: moon.size,
            orbitDistance: moon.orbitDistance
        }))
    });

    function getRandomAsset<T>(array: T[]): T {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    const handlePlanetLoad = (img: HTMLImageElement) => {
        if (planetDiv()) {
            const dominantColor = getDominantColor(img);
            planetDiv()!.style.backgroundImage = `url(${img.src})`;
            planetDiv()!.style.boxShadow = `inset -2em -2em 2em #000, -0.5em -0.5em 1em ${dominantColor}`;
            // Store actual planet width
            setPlanetSize(planetDiv()!.offsetWidth);
        }
    };

    const handleMoonLoad = (img: HTMLImageElement, moonId: number) => {
        const moonDiv = moonDivs().get(moonId);
        if (moonDiv) {
            const dominantColor = getDominantColor(img);
            moonDiv.style.backgroundImage = `url(${img.src})`;
            moonDiv.style.boxShadow = `inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em ${dominantColor}`;
        }
    };

    const setMoonDiv = (moonId: number, div: HTMLDivElement | null) => {
        setMoonDivs(prev => {
            const next = new Map(prev);
            next.set(moonId, div);
            return next;
        });
    };

    return (
        <div class={containerStyle}>
            <div class={getSystemContainerStyle(planetTilt)}>
                <div class={getPlanetStyle(planetRotationSpeed, planetColorScheme)} ref={setPlanetDiv}>
                    <NTAwait func={() => props.context.backend.assets.getMetadata(getRandomAsset(planetAssets))}>
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

                <For each={moons}>
                    {(moon) => (
                        <div class={getTiltWrapperStyle(moon.orbitTilt, moon.orbitSpeed, moon.id + 1)}>
                            <div class={getOrbitContainerStyle(moon.orbitSpeed, moon.size, moon.orbitDistance * (1 + Math.random() * 0.5))}>
                                <div
                                    class={getMoonStyle(moon.rotationSpeed, moon.colorScheme)}
                                    ref={(div) => setMoonDiv(moon.id, div)}
                                >
                                    <NTAwait func={() => props.context.backend.assets.getMetadata(getRandomAsset(moonAssets))}>
                                        {(asset) => (
                                            <GraphicalAsset
                                                metadata={asset}
                                                backend={props.context.backend}
                                                onImageLoad={(img) => handleMoonLoad(img, moon.id)}
                                                styleOverwrite={css`
                                                    display: none;
                                                `}
                                            />
                                        )}
                                    </NTAwait>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
};

export default PlanetMoonSystem;