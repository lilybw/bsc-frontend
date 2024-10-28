import { createSignal, createEffect, onCleanup, Component, createMemo, JSX, Show, For, createResource } from 'solid-js';
import { css } from '@emotion/css';
import { AssetResponseDTO } from '../../integrations/main_backend/mainBackendDTOs';
import { Styles } from '../../sharedCSS';
import { IStyleOverwritable, IParenting, IBackendBased } from '../../ts/types';
import Spinner from './SimpleLoadingSpinner';
import SomethingWentWrongIcon from './SomethingWentWrongIcon';

interface SpinningPlanetProps extends IStyleOverwritable, IParenting, IBackendBased {
  metadata: AssetResponseDTO;
  rotationSpeedS?: number;
  imageStyleOverwrite?: string;
  shadowStyleOverwrite?: string;
  useShadow?: boolean;
}

const Planet: Component<SpinningPlanetProps> = (props) => {
  const [currentSrc, setCurrentSrc] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | undefined>(undefined);
  const [currentLODLevel, setCurrentLODLevel] = createSignal(9001);

  createEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(undefined);

    const loadImage = async () => {
      try {
        const sortedLODs = props.metadata.LODs.sort((a, b) => b.detailLevel - a.detailLevel);

        for (const lod of sortedLODs) {
          if (!mounted) break;

          const lodResponse = await props.backend.assets.getAssetLOD(props.metadata.id, lod.detailLevel);
          if (lodResponse.err || lodResponse.res === null) {
            props.backend.logger.warn(`Failed to load LOD ${lod.detailLevel} for asset ${props.metadata}: ${lodResponse.err}`);
            continue; // Try next LOD
          }

          const blob = lodResponse.res;
          const objectUrl = URL.createObjectURL(blob);

          const img = new Image();
          img.src = objectUrl;

          await new Promise<void>((resolve) => {
            img.onload = () => {
              if (mounted) {
                setCurrentSrc((prevSrc) => {
                  if (prevSrc) URL.revokeObjectURL(prevSrc);
                  return objectUrl;
                });
                setCurrentLODLevel(lod.detailLevel);
                setLoading(false);
              }
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve();
            };
          });

          if (lod.detailLevel === 0) break; // Stop if we've loaded the highest detail LOD
        }
      } catch (error) {
        props.backend.logger.error(`Error loading asset ${props.metadata.id}: ` + error);
        setError((error as Error).message);
        setLoading(false);
      }
    };

    loadImage();

    onCleanup(() => {
      mounted = false;
      if (currentSrc()) {
        URL.revokeObjectURL(currentSrc()!);
      }
    });
  });

  const computedAtmosphereStyles = createMemo(() => css`
    ${atmosphereAndPaddingStyles}
    ${props.styleOverwrite}
  `)

  const sharedImageStyles = createMemo(() => css`
  --metadata-width: ${props.metadata.width}px;
  --metadata-height: ${props.metadata.height}px;
  ${imageStyle}
  ${props.imageStyleOverwrite}
  `)

  const computedImageContainerStyles = createMemo(() => css`
    --rotation-speed: ${props.rotationSpeedS ?? 10}s;
    ${imageMovementContainer}
  `)

  const computedShadowStyles = createMemo(() => css`
    ${baseShadowStyles}
    ${props.shadowStyleOverwrite}
  `)

  return (
    <>
      {loading() && <Spinner styleOverwrite={computedAtmosphereStyles()} />}
      {error() && <SomethingWentWrongIcon styleOverwrite={computedAtmosphereStyles()} message={error()} />}
      {currentSrc() && (
        <div class={computedAtmosphereStyles()} id='Atmosphere'>
            <div class={planetCutoutContainer} id='PlanetContainer'>
                <div class={computedImageContainerStyles()}>
                    <img
                        src={currentSrc()!}
                        alt={props.metadata.alias + `-LOD-${currentLODLevel()}`}
                        class={sharedImageStyles()}
                    />
                    <img
                        src={currentSrc()!}
                        alt={props.metadata.alias + `-LOD-${currentLODLevel()}`}
                        class={sharedImageStyles()}
                    />
                </div>
                {props.children}
                {props.useShadow && <div class={computedShadowStyles()} id='Shadow'/>}
            </div>
        </div>
      )}
    </>
  );
};
export default Planet;

const baseShadowStyles = css`
position: relative;
z-index: 100;

width: 100%;
height: 100%;
top: -100%;

background-image: radial-gradient(circle at 100% 100%, black 50%, transparent)
`

const imageMovementContainer =  css`
position: relative;
z-index: -1;
display: flex;
flex-direction: row;

width: 200%;
height: 100%;
top: 50%;
transform: translateY(-50%);
left: 0;

animation: moveImages var(--rotation-speed) linear infinite;

@keyframes moveImages {
  from {
    left: 0;
  }
  to {
    left: -200%;
  }
}
`

const imageStyle = css`

  z-index: -1;
  width: 100%;
  object-fit: fill;
`

const planetCutoutContainer = css`
position: relative;
z-index: -1;
width: 100%;
height: 100%;
border-radius: 50%;
background-color: transparent;

${Styles.NO_OVERFLOW}
`

const atmosphereAndPaddingStyles = css`
z-index: 100;

width: 40vh;
height: 40vh;

padding: 2%;
background-image: radial-gradient(circle, transparent 20%, hsla(0,0%,100%,1) 63%, transparent 67%);
`