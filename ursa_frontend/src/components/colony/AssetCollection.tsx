import { Component, createMemo, createSignal, For } from "solid-js";
import { AssetCollectionID, TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IStyleOverwritable } from "../../ts/types";
import { css } from "@emotion/css";
import NTAwait from "../util/NoThrowAwait";
import GraphicalAsset from "../GraphicalAsset";
import { getRandHash } from "../../ts/randHash";

interface AssetCollectionProps extends IBackendBased, IStyleOverwritable {
    id: AssetCollectionID;
    topLevelTransform?: TransformDTO;
}

const AssetCollection: Component<AssetCollectionProps> = (props) => {
    const [collectionName, setCollectionName] = createSignal<string>("unknown-collection...");
    const computedContainerStyle = (transform?: TransformDTO) => css`
        --transform-x: ${transform ? transform.xOffset : 0}px;
        --transform-y: ${transform ? transform.yOffset : 0}px;
        --transform-index: ${transform ? transform.zIndex : 1};
        --transform-xScale: ${transform ? transform.xScale : 1};
        --transform-yScale: ${transform ? transform.yScale : 1};
        ${transformDependentStyle}
        ${props.styleOverwrite}
    `;
    return (
        <div class={computedContainerStyle(props.topLevelTransform)} id={collectionName()}>
            <NTAwait func={() => props.backend.getAssetCollection(props.id)}> 
                {collection => {
                    setCollectionName(collection.name + " - " + getRandHash());
                    return (
                        <For each={collection.entries}>{(entry) =>
                            <GraphicalAsset 
                                backend={props.backend} 
                                metadata={entry.asset} 
                                transform={entry.transform}
                            />
                        }</For>
                    )
                }}
            </NTAwait>
        </div>
    )
}
export default AssetCollection;

const transformDependentStyle = css`
    position: absolute;
    left: var(--transform-x);
    top: var(--transform-y);
    z-index: var(--transform-index);
    transform: scale(var(--transform-xScale), var(--transform-yScale));
`