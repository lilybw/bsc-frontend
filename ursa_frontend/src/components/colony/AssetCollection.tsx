import { Component, createMemo } from "solid-js";
import { TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IStyleOverwritable } from "../../ts/types";
import { css } from "@emotion/css";
import NTAwait from "../util/NoThrowAwait";

interface AssetCollectionProps extends IBackendBased, IStyleOverwritable {
    id: number;
    topLevelTransform?: TransformDTO;
}

const getRandHash = () => Math.random().toString(36).substring(7);

const AssetCollection: Component<AssetCollectionProps> = (props) => {
    const computedContainerStyle = (transform?: TransformDTO) => css`
        --transform-x: ${transform ? transform.xOffset : 0}px;
        --transform-y: ${transform ? transform.yOffset : 0}px;
        --transform-index: ${transform ? transform.zIndex : 1};
        --transform-xScale: ${transform ? transform.xScale : 1};
        --transform-yScale: ${transform ? transform.yScale : 1};
        ${containerStyle}
        ${props.styleOverwrite}
    `;
    return (
        <div class={computedContainerStyle(props.topLevelTransform)}>
            <NTAwait func={() => props.backend.getAssetCollection(props.id)} > 
                {assetCollection => {
                    return (
                        <div id={assetCollection.name +"-"+getRandHash()}>
                            {assetCollection.name}
                        </div>
                    )
                }}
            </NTAwait>
            AssetCollection
        </div>
    )
}
export default AssetCollection;

const containerStyle = css`
    position: absolute;
    left: var(--transform-x);
    top: var(--transform-y);
    z-index: var(--transform-index);
    transform: scale(var(--transform-xScale), var(--transform-yScale));
`