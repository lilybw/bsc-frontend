import { createSignal, createEffect, onCleanup, Component } from 'solid-js';
import { AssetID, AssetResponseDTO } from '../integrations/main_backend/mainBackendDTOs';
import { BackendIntegration } from '../integrations/main_backend/mainBackend';
import Spinner from './SimpleLoadingSpinner';
import { css } from '@emotion/css';
import SomethingWentWrongIcon from './SomethingWentWrongIcon';
import { IStyleOverwritable } from '../ts/types';

interface ProgressiveImageProps extends IStyleOverwritable {
  metadata: AssetResponseDTO;
  backend: BackendIntegration;
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

          const lodResponse = await props.backend.getAssetLOD(props.metadata.id, lod.id);
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

  const computedStyles = css`
    ${baseStyles}
    width: ${props.metadata.width}px;
    height: ${props.metadata.height}px;
    ${props.styleOverwrite}
  `

  return (
    <>
      {loading() && <Spinner styleOverwrite={computedStyles} />}
      {error() && <SomethingWentWrongIcon styleOverwrite={computedStyles} message={error()} />}
      {currentSrc() && (
        <img
          src={currentSrc()!}
          alt={props.metadata.alias + `-LOD-${currentLODLevel()}`}
          class={computedStyles}
        />
      )}
    </>
  );
};
export default GraphicalAsset;

const baseStyles = css`
  display: block;
  object-fit: contain;
`