import { Component, createSignal, For, onMount, onCleanup } from 'solid-js';
import { css } from '@emotion/css';
import GraphicalAsset from './GraphicalAsset';
import NTAwait from '../util/NoThrowAwait';
import { IBackendBased, IStyleOverwritable } from '@/ts/types';
import { ObjectURL } from '@/integrations/main_backend/objectUrlCache';

interface PlanetMoonSystemProps extends IBackendBased, IStyleOverwritable {
    debugMode?: boolean;
    moonCount?: number;
}

const PlanetMoonSystem: Component<PlanetMoonSystemProps> = (props) => {
    const [planetDiv, setPlanetDiv] = createSignal<HTMLDivElement | null>(null);
    const [moonDivs, setMoonDivs] = createSignal<Map<number, HTMLDivElement | null>>(new Map());
    const [planetSize, setPlanetSize] = createSignal<number>(0);
    const planetAssets = [3001];
    const moonAssets = [3005, 3002, 3006, 3007];

    const planetRotationSpeed = getRandomRotationSpeed();
    const planetColorScheme = getRandomColorScheme(planetColorSchemes);
    const planetTilt = getRandomTiltAngle();

    const log = props.backend.logger.copyFor('planet-moon-system');

    const isDebugMode = props.debugMode ?? false;

    const getDebugStyle = () => {
        return isDebugMode ? {
            outline: '2px solid red',
            'background-color': 'rgba(255, 0, 0, 0.1)'
        } : {};
    };

    const getDebugSystemStyle = () => {
        return isDebugMode ? {
            outline: '2px solid blue',
            'background-color': 'rgba(0, 255, 0, 0.1)'
        } : {};
    };

    const getDebugPlanetStyle = () => {
        return isDebugMode ? {
            outline: '2px solid green'
        } : {};
    };

    const getDebugMoonStyle = (moonId: number) => css`
        outline: 2px solid orange;
        &::after {
            content: "Moon ${moonId}";
            position: absolute;
            top: -1.2em;
            left: 50%;
            transform: translateX(-50%);
            color: orange;
            font-size: 0.8em;
            white-space: nowrap;
        }
    `;

    const getDebugOrbitPathStyle = (orbitDistance: number, tiltAngle: number, planetSize: number) => css`
        &::before {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            width: ${planetSize * orbitDistance * 2}px;
            height: 2px;
            background: rgba(255, 255, 0, 0.5);
            transform: translate(-50%, -50%) rotate(${tiltAngle}deg);
            pointer-events: none;
        }
        &::after {
            content: "${tiltAngle.toFixed(1)}°";
            position: absolute;
            left: 100%;
            top: 0;
            color: yellow;
            font-size: 0.8em;
            pointer-events: none;
        }
    `;

    const moons: Moon[] = Array.from(
        { length: props.moonCount ?? getRandomMoonCount() },
        (_, index) => ({
            id: index,
            rotationSpeed: getRandomRotationSpeed() / 2,
            orbitSpeed: getRandomOrbitSpeed(),
            orbitTilt: getRandomTiltAngle(20),
            colorScheme: getRandomColorScheme(moonColorSchemes),
            size: getRandomMoonSize(),
            orbitDistance: getRandomOrbitDistance(),
            orbitOffset: Math.random()
        })
    );

    const handlePlanetLoad = async (url: ObjectURL) => {
        const div = planetDiv();
        if (div) {
            const dominantColor = getDominantColor(url);
            div.style.backgroundImage = `url(${url})`;
            div.style.boxShadow = `inset -2em -2em 2em black, -0.5rem -0.5em 1em ${dominantColor}`;
            const newPlanetSize = div.offsetWidth;
            setPlanetSize(newPlanetSize);
            log.subtrace(`Planet image loaded - size: ${newPlanetSize}, dominantColor: ${dominantColor}`);
        } else {
            log.warn('Planet div not found during image load');
        }
    };

    onMount(async () => {
        const urlAttempt = await props.backend.objectUrlCache.get(getRandomAsset(planetAssets), 0)
        if (urlAttempt.err !== null ) {
            log.error(`Failed to load planet asset: ${urlAttempt.err}`);
            return;
        }
        const url = urlAttempt.res;
        await handlePlanetLoad(url);
        url.release();

        //Also do moon stuff here
    })

    const handleMoonLoad = async (img: HTMLImageElement, moonId: number) => {
        const moonDiv = moonDivs().get(moonId);
        if (moonDiv) {
            const dominantColor = await getDominantColor(img.src as ObjectURL);
            moonDiv.style.backgroundImage = `url(${img.src})`;
            moonDiv.style.boxShadow = `inset -1.5em -1.5em 1.5em #000, -0.2em -0.2em 0.5em ${dominantColor}`;
            log.subtrace(`Moon ${moonId} image loaded - dominantColor: ${dominantColor}`);
        } else {
            log.warn(`Moon ${moonId} div not found during image load`);
        }
    };

    const setMoonDiv = (moonId: number, div: HTMLDivElement | null) => {
        setMoonDivs(prev => {
            const next = new Map(prev);
            next.set(moonId, div);
            log.subtrace(`Moon ${moonId} div ${div ? 'set' : 'unset'}`);
            return next;
        });
    };

    return (
        <div
            class={css([containerStyle, getDebugStyle(), props.styleOverwrite])}
        >
            <div
                class={css([getSystemContainerStyle(planetTilt), getDebugSystemStyle()])}
            >
                <div
                    class={css([getPlanetStyle(planetRotationSpeed, planetColorScheme, 5), getDebugPlanetStyle()])}
                    ref={setPlanetDiv}
                />
                <For each={moons}>
                    {(moon) => (
                        <div
                            class={`${getTiltWrapperStyle(moon.orbitTilt, moon.orbitSpeed, moon.id + 1)} 
                                    ${isDebugMode ? getDebugOrbitPathStyle(moon.orbitDistance, moon.orbitTilt, planetSize()) : ''}`}
                        >
                            <div
                                class={getOrbitContainerStyle(moon.orbitSpeed, moon.size, moon.orbitDistance, planetSize(), moon.orbitOffset)}
                                style={isDebugMode ? { outline: '1px dotted rgba(255, 255, 0, 0.3)' } : {}}
                            >
                                <div
                                    class={`${getMoonStyle(moon.rotationSpeed, moon.colorScheme)} 
                                            ${isDebugMode ? getDebugMoonStyle(moon.id) : ''}`}
                                    ref={(div) => setMoonDiv(moon.id, div)}
                                >
                                    <NTAwait func={() => props.backend.assets.getMetadata(getRandomAsset(moonAssets))}>
                                        {(asset) => (
                                            <GraphicalAsset
                                                metadata={asset}
                                                backend={props.backend}
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

const containerStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const getSystemContainerStyle = (tiltAngle: number) => css`
  position: relative;
  width: 100%;
  height: 100%;
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
    orbitOffset: number;
};

const getRandomColorScheme = <T extends ColorTransform>(schemes: T[]): T => {
    return schemes[Math.floor(Math.random() * schemes.length)];
};

const getRandomTiltAngle = (range: number = 5) => Math.random() * (2 * range) - range;
const getRandomRotationSpeed = () => Math.floor(Math.random() * 120) + 120;
const getRandomOrbitSpeed = () => Math.floor(Math.random() * 80) + 80;
const getRandomMoonCount = () => Math.floor(Math.random() * 5) + 1;
const getRandomMoonSize = () => (1 / 12) + Math.random() * ((1 / 8) - (1 / 12));
const getRandomOrbitDistance = () => 0.6 + (Math.random() * 0.1);

const getTiltWrapperStyle = (tiltAngle: number, orbitSpeed: number, moonId: number) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(${tiltAngle}deg);
  animation: zindex${orbitSpeed}_${moonId} ${orbitSpeed}s infinite ease-in-out;

  @keyframes zindex${orbitSpeed}_${moonId} {
    0% { z-index: ${-((moonId + 1) * 5)}; }
    49.99% { z-index: ${-((moonId + 1) * 5)}; }
    50% { z-index: ${25 - (moonId * 5)}; }
    99.99% { z-index: ${25 - (moonId * 5)}; }
  }
`;

const getPlanetStyle = (rotationSpeed: number, colorScheme: PlanetColorScheme, shadowDepth: number) => css`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset -${shadowDepth}rem -${shadowDepth}rem ${shadowDepth}rem black, 
    -0.5rem -0.5rem 1em rgba(255, 255, 255, 0.5),
    inset 0.2rem 0.2rem 2rem white;
  background-size: 200% 100%;
  background-repeat: repeat;
  filter: ${colorScheme.filters};
  animation: planetRotate${rotationSpeed} ${rotationSpeed}s linear infinite;
  z-index: 0;

  @keyframes planetRotate${rotationSpeed} {
    from { background-position: 0 0; }
    to { background-position: -200% 0; }
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
  animation: moonRotate${rotationSpeed} ${rotationSpeed}s linear infinite;

  @keyframes moonRotate${rotationSpeed} {
    from { background-position: 0 0; }
    to { background-position: -200% 0; }
  }
`;

const getOrbitContainerStyle = (orbitSpeed: number, size: number, orbitDistance: number, planetSize: number, orbitOffset: number) => css`
  position: absolute;
  width: ${planetSize * size}px;
  height: ${planetSize * size}px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: move-${orbitSpeed} ${orbitSpeed}s infinite ease-in-out;

  @keyframes move-${orbitSpeed} {
    0% { transform: translate(-50%, -50%) translateX(${planetSize * orbitDistance}px); }
    50% { transform: translate(-50%, -50%) translateX(${-planetSize * orbitDistance}px); }
    100% { transform: translate(-50%, -50%) translateX(${planetSize * orbitDistance}px); }
  }
`;

const getDominantColor = async (url: ObjectURL): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';
    
    const img = new Image();
    const promise = new Promise<string>((resolve, reject) => {
        img.onload = () => {
            canvas.width = 1;
            canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            resolve(`rgb(${r}, ${g}, ${b})`);
        };
        img.onerror = () => resolve('white');
    });
    img.src = url;
    return await promise;
};

function getRandomAsset<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}