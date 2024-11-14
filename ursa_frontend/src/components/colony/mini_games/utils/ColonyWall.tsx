import GraphicalAsset from "@/components/base/GraphicalAsset";
import NTAwait from "@/components/util/NoThrowAwait";
import { ArrayStore } from "@/ts/arrayStore";
import { Vec2 } from "@/ts/geometry";
import { IBackendBased } from "@/ts/types";
import { css } from "@emotion/css";
import { Accessor, For } from "solid-js";

interface ColonyWallProps extends IBackendBased {
    health: Accessor<number>;
    impactPositions: ArrayStore<Vec2>;
}

export default function ColonyWall({ 
    health, impactPositions, backend
}: ColonyWallProps) {
    const log = backend.logger.copyFor("col wall");

    const wallHeight = "60vh";
    const wallWidth = "10vw";
    return (
        <div id="colony-wall" 
            class={css({ position: "absolute", bottom: 0, height: wallHeight, width: wallWidth, backgroundColor: "LightSteelBlue" })}
        >
            <NTAwait func={() => backend.assets.getMetadata(7003)}>{ metadata => 
                <GraphicalAsset backend={backend} metadata={metadata}
                    styleOverwrite={css({ objectFit: "cover", height: "100%", width: "100%" })} 
                />
            }</NTAwait>
            <For each={impactPositions.get}>{ (pos, index) => 
               <div id="crack-decal-wrapper" class={css({ position: "absolute", top: `calc(${pos.y}px - 40vh)`, left: wallWidth })}>
                <NTAwait func={() => backend.assets.getMetadata(9001)}>{metadata =>
                    <GraphicalAsset backend={backend} metadata={metadata} 
                        styleOverwrite={css({
                            width: "20vw", height: "20vh",
                            transform: "translateX(-100%)" + (index() % 2 === 0 ? " rotateY(180deg)" : ""), 
                            filter: "contrast(0.8) brightness(0.6) saturate(0.8)",
                            objectFit: "cover",
                        })} 
                    />
                }</NTAwait>
               </div>  
            }</For>
        </div>
    );
}
