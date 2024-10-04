import { createSignal, createEffect, onCleanup, Component, createMemo, JSX, Show, For } from 'solid-js';
import { AssetID, AssetResponseDTO, MinimizedAssetDTO, TransformDTO } from '../integrations/main_backend/mainBackendDTOs';
import Spinner from './SimpleLoadingSpinner';
import { css } from '@emotion/css';
import SomethingWentWrongIcon from './SomethingWentWrongIcon';
import { IBackendBased, IParenting, IParentingImages, IStyleOverwritable } from '../ts/types';
import { getRandHash } from '../ts/ursaMath';
import { Styles } from '../sharedCSS';

interface ProgressiveImageProps extends IStyleOverwritable, IParentingImages, IBackendBased {
  metadata: AssetResponseDTO | MinimizedAssetDTO;
  /**
   * Applied first if provided and only to the container of the image
   */
  transform?: TransformDTO;
}

const GraphicalAsset: Component<ProgressiveImageProps> = (props) => {
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

          const lodResponse = await props.backend.getLOD(lod.id);
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
        props.backend.logger.error(`Error loading asset ${props.metadata.alias}: ` + error);
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
    ${baseStyles}
    ${Styles.transformToCSSVariables(props.transform)}
    width: calc(${props.metadata.width}px * var(--transform-xScale));
    height: calc(${props.metadata.height}px * var(--transform-yScale));
    ${props.transform ? Styles.TRANSFORM_APPLICATOR : ""}
    ${props.styleOverwrite}
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
        <>
          <img id={props.metadata.alias + "-" + getRandHash()}
            src={currentSrc()!}
            alt={props.metadata.alias + `-LOD-${currentLODLevel()}`}
            class={computedStyles()}
          />
          {appendChildren()}
        </>
      )}
    </>
  );
};
export default GraphicalAsset;

const baseStyles = css`
  position: relative;
  display: block;
  object-fit: contain;
`