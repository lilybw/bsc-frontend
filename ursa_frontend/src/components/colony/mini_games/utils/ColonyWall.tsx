import GraphicalAsset from "@/components/base/GraphicalAsset";
import NTAwait from "@/components/util/NoThrowAwait";
import { ArrayStore } from "@/ts/arrayStore";
import { Vec2 } from "@/ts/geometry";
import { IBackendBased } from "@/ts/types";
import { css } from "@emotion/css";
import { Accessor, For, createSignal } from "solid-js";

interface ColonyWallProps extends IBackendBased {
    health: Accessor<number>;
    impactPositions: ArrayStore<Vec2>;
}

export default function ColonyWall({
    health, impactPositions, backend
}: ColonyWallProps) {
    const [wallRef, setWallRef] = createSignal<HTMLImageElement | null>(null);
    const wallWidth = "10vw";
    const tileSize = "5vw";
    const glassCount = 30;

    return (
        <>
            {/* Glass tiles */}
            <div class={css({
                position: "absolute",
                bottom: 0,
                width: tileSize,
                zIndex: -1
            })}>
                <For each={Array(glassCount).fill(0)}>{(_, index) =>
                    <NTAwait func={() => backend.assets.getMetadata(8035)}>{metadata =>
                        <GraphicalAsset
                            backend={backend}
                            metadata={metadata}
                            styleOverwrite={css({
                                position: "absolute",
                                objectFit: "fill",
                                width: tileSize,
                                height: tileSize,
                                bottom: `calc(60vh + ${tileSize} * ${index()} - ${tileSize} * 0.4)`,
                                right: "-4.5vw",
                                transform: "translateX(-2vw)",
                                opacity: 0.8
                            })}
                        />
                    }</NTAwait>
                }</For>
            </div>

            <div id="colony-wall"
                class={css({
                    position: "absolute",
                    bottom: 0,
                    height: "60vh",
                    width: wallWidth,
                    overflow: "hidden"
                })}
            >
                <NTAwait func={() => backend.assets.getMetadata(7003)}>{metadata =>
                    <>
                        <GraphicalAsset
                            backend={backend}
                            metadata={metadata}
                            onImageLoad={setWallRef}
                            styleOverwrite={css({
                                objectFit: "fill",
                                height: "100%",
                                width: "100%"
                            })}
                        />
                        <div class={css({
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            maskImage: wallRef() ? `url(${wallRef()?.src})` : "none",
                            maskSize: "100% 100%",
                            WebkitMaskImage: wallRef() ? `url(${wallRef()?.src})` : "none",
                            WebkitMaskSize: "100% 100%"
                        })}>
                            <For each={impactPositions.get}>{(pos, index) =>
                                <div class={css({
                                    position: "absolute",
                                    top: `calc(${pos.y}px - 40vh)`,
                                    width: "20vw",
                                    height: "20vh",
                                    transform: `translateX(calc(-1*${wallWidth}))`
                                })}>
                                    <NTAwait func={() => backend.assets.getMetadata(9001)}>{metadata =>
                                        <GraphicalAsset
                                            backend={backend}
                                            metadata={metadata}
                                            styleOverwrite={css({
                                                objectFit: "fill",
                                                height: "100%",
                                                width: "100%",
                                                transform: index() % 2 === 0 ? "rotateY(180deg)" : "none",
                                                filter: "contrast(0.8) brightness(0.6) saturate(0.8)",
                                                pointerEvents: "none"
                                            })}
                                        />
                                    }</NTAwait>
                                </div>
                            }</For>
                        </div>
                    </>
                }</NTAwait>
            </div>
        </>
    );
}