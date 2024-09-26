import { Component } from "solid-js";
import { TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased } from "../../ts/types";
import { css } from "@emotion/css";

interface AssetCollectionProps extends IBackendBased {
    id: number;
    topLevelTransform?: TransformDTO;
}

const AssetCollection: Component<AssetCollectionProps> = (props) => {
    return (
        <div class={containerStyle}>
            AssetCollection
        </div>
    )
}
export default AssetCollection;

const containerStyle = css`

`