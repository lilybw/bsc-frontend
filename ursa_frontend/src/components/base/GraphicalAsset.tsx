import { css } from '@emotion/css';
import { createSignal, createEffect, onCleanup, Component, createMemo, For } from 'solid-js';
import { AssetResponseDTO, MinimizedAssetDTO, TransformDTO } from '../../integrations/main_backend/mainBackendDTOs';
import { ObjectURL } from '../../integrations/main_backend/objectUrlCache';
import { Styles } from '../../styles/sharedCSS';
import { IStyleOverwritable, IParentingImages, IBackendBased } from '../../ts/types';
import { GlobalHashPool } from '../../ts/ursaMath';
import Spinner from './SimpleLoadingSpinner';
import SomethingWentWrongIcon from './SomethingWentWrongIcon';

interface ProgressiveImageProps extends IStyleOverwritable, IParentingImages, IBackendBased {
    metadata: AssetResponseDTO | MinimizedAssetDTO;
    transform?: TransformDTO;
    onImageLoad?: (img: HTMLImageElement) => void;
}

const GraphicalAsset: Component<ProgressiveImageProps> = (props) => {
    const log = props.backend.logger.copyFor('asset');
    const [currentSrc, setCurrentSrc] = createSignal<ObjectURL | null>(null);
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

                    const urlAttempt = await props.backend.objectUrlCache.getByLODID(lod.id);
                    if (urlAttempt.err || urlAttempt.res === null) {
                        log.warn(`Failed to load LOD ${lod.detailLevel} for asset ${props.metadata}: ${urlAttempt.err}`);
                        continue; // Try next LOD
                    }

                    const img = new Image();
                    img.src = urlAttempt.res;

                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            if (mounted) {
                                setCurrentSrc((prevSrc) => {
                                    if (prevSrc) prevSrc.release();
                                    return urlAttempt.res;
                                });
                                setCurrentLODLevel(lod.detailLevel);
                                setLoading(false);
                                if (props.onImageLoad) {
                                    props.onImageLoad(img);
                                }
                            }
                            resolve();
                        };
                        img.onerror = () => {
                            urlAttempt.res.release();
                            resolve();
                        };
                    });

                    if (lod.detailLevel === 0) break; // Stop if we've loaded the highest detail LOD
                }
            } catch (error) {
                log.error(`Error loading asset ${props.metadata.alias}: ` + error);
                setError((error as Error).message);
                setLoading(false);
            }
        };

        loadImage();

        onCleanup(() => {
            mounted = false;
            const src = currentSrc();
            if (src) {
                src.release();
            }
        });
    });

    const computedStyles = createMemo(
        () => css`
            ${baseStyles}
            ${Styles.POSITION.transformToCSSVariables(props.transform)}
            width: calc(${props.metadata.width}px * var(--transform-xScale));
            height: calc(${props.metadata.height}px * var(--transform-yScale));
            ${props.transform ? Styles.POSITION.TRANSFORM_APPLICATOR : ''}
            ${props.styleOverwrite}
        `,
    );

    const appendChildren = () => {
        if (!props.children) return;
        if (Array.isArray(props.children)) {
            return (
                <For each={props.children}>
                    {(child, index) => {
                        return child({ styleOverwrite: computedStyles() });
                    }}
                </For>
            );
        } else {
            return props.children({ styleOverwrite: computedStyles() });
        }
    };

    return (
        <>
            {loading() && <Spinner styleOverwrite={computedStyles()} />}
            {error() && <SomethingWentWrongIcon styleOverwrite={computedStyles()} message={error()} />}
            {currentSrc() && (
                <>
                    <img
                        id={props.metadata.alias + '-' + GlobalHashPool.next()}
                        src={currentSrc()!}
                        alt={props.metadata.alias + `-LOD-${currentLODLevel()}`}
                        class={computedStyles()}
                        ref={props.onImageLoad ?? (() => { })}
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
`;