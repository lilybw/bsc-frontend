import { Component, createMemo, createSignal, For } from "solid-js";
import { AssetCollectionID, TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IStyleOverwritable } from "../../ts/types";
import { css } from "@emotion/css";
import NTAwait from "../util/NoThrowAwait";
import GraphicalAsset from "../GraphicalAsset";
import { combineTransforms, getRandHash } from "../../ts/ursaMath";
import { Styles } from "../../sharedCSS";
import { WrappedSignal } from "../../ts/wrappedSignal";

interface AssetCollectionProps extends IBackendBased, IStyleOverwritable {
    id: AssetCollectionID;
    topLevelTransform?: WrappedSignal<TransformDTO>;
}

const AssetCollection: Component<AssetCollectionProps> = (props) => {
    const [collectionName, setCollectionName] = createSignal<string>("unknown-collection...");
    
    const computedContainerStyle = (transform?: TransformDTO) => css`
        ${Styles.transformToCSSVariables(transform)}
        ${props.topLevelTransform ? Styles.TRANSFORM_APPLICATOR : ""}
        ${props.styleOverwrite}
        width: fit-content;
        height: fit-content;
    `;
    return (
        <div class={computedContainerStyle(props.topLevelTransform?.get())} id={collectionName()}>
            <NTAwait func={() => props.backend.getAssetCollection(props.id)}>{collection => {
                setCollectionName(collection.name + " - " + getRandHash());
                return (
                    <For each={collection.entries}>{(entry) =>
                        <GraphicalAsset 
                            backend={props.backend} 
                            metadata={entry.asset}
                            transform={
                                props.topLevelTransform ? 
                                    combineTransforms(props.topLevelTransform.get(), entry.transform) 
                                    : entry.transform
                            }
                        />
                    }</For>
                )}}
            </NTAwait>
        </div>
    )
}
export default AssetCollection;