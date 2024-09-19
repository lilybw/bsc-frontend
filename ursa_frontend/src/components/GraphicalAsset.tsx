import { createSignal, createEffect, onCleanup, Component } from 'solid-js';
import { AssetID, AssetResponseDTO } from '../integrations/main_backend/mainBackendDTOs';
import { BackendIntegration } from '../integrations/main_backend/mainBackend';

interface ProgressiveImageProps {
  assetId: AssetID;
  backend: BackendIntegration;
}

const GraphicalAsset: Component<ProgressiveImageProps> = (props) => {
  const [currentSrc, setCurrentSrc] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [metadata, setMetadata] = createSignal<AssetResponseDTO | null>(null);

  createEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        const metadataResponse = await props.backend.getAssetMetadata(props.assetId);
        if (metadataResponse.err || metadataResponse.res === null) {
          throw new Error(metadataResponse.err);
        }

        const assetMetadata = metadataResponse.res;
        setMetadata(assetMetadata);

        const sortedLODs = assetMetadata.LODs.sort((a, b) => b.detailLevel - a.detailLevel);

        for (const lod of sortedLODs) {
          if (!mounted) break;

          const lodResponse = await props.backend.getAssetLOD(props.assetId, lod.id);
          if (lodResponse.err || lodResponse.res === null) {
            props.backend.logger.warn(`Failed to load LOD ${lod.detailLevel} for asset ${props.assetId}: ${lodResponse.err}`);
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
        props.backend.logger.error(`Error loading asset ${props.assetId}: ` + error);
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

  return (
    <>
      {loading() && <div class="loading-placeholder">Loading...</div>}
      {error() && <div class="error-message">{error()}</div>}
      {currentSrc() && metadata() && (
        <img
          src={currentSrc()!}
          alt={metadata()!.alias}
          style={{
            display: loading() ? 'none' : 'block',
            width: `${metadata()!.width}px`,
            height: `${metadata()!.height}px`,
          }}
        />
      )}
    </>
  );
};

export default GraphicalAsset;