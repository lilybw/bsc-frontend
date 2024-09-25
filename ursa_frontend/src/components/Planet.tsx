import { createSignal, createEffect, onCleanup, Component, createMemo, JSX, Show, For, createResource } from 'solid-js';
import { AssetID, AssetResponseDTO } from '../integrations/main_backend/mainBackendDTOs';
import { BackendIntegration } from '../integrations/main_backend/mainBackend';
import Spinner from './SimpleLoadingSpinner';
import { css } from '@emotion/css';
import SomethingWentWrongIcon from './SomethingWentWrongIcon';
import { IBackendBased, IParenting, IParentingImages, IStyleOverwritable } from '../ts/types';
import { Styles } from '../sharedCSS';
import { ResCodeErr } from '../meta/types';

interface SpinningPlanetProps extends IStyleOverwritable, IParentingImages, IBackendBased {
  metadata: AssetResponseDTO;
  rotationSpeedS?: number;
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

          const lodResponse = await props.backend.getAssetLOD(props.metadata.id, lod.detailLevel);
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

  const computedStyles = createMemo(() => css`
    ${planetCutoutContainer}
    ${props.styleOverwrite}
  `)

  const sharedImageStyles = createMemo(() => css`
  --metadata-width: ${props.metadata.width}px;
  --metadata-height: ${props.metadata.height}px;
  ${imageStyle}
  `)

  const computedContainerStyles = createMemo(() => css`
    --rotation-speed: ${props.rotationSpeedS ?? 10}s;
    ${imageMovementContainer}
  `)

  const appendChildren = () => {
    if (props.children) {
      return (
        <For each={props.children}>
          {(child, index) => 
            {return child({styleOverwrite: computedStyles()})}
          }
        </For>
      )
    }
  }

  return (
    <>
      {loading() && <Spinner styleOverwrite={computedStyles()} />}
      {error() && <SomethingWentWrongIcon styleOverwrite={computedStyles()} message={error()} />}
      {currentSrc() && (
        <div class={computedStyles()}>
            <div class={computedContainerStyles()}>
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
          {appendChildren()}
        </div>
      )}
    </>
  );
};
export default Planet;

const imageMovementContainer =  css`
position: relative;
display: flex;
flex-direction: row;

width: 200%;
height: 100%;
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
`

const planetCutoutContainer = css`
width: 80vh;
height: 80vh;

border-radius: 50%;
background-color: transparent;

${Styles.NO_OVERFLOW}
`