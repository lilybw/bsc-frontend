import { Component } from "solid-js";
import { TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased } from "../../ts/types";

interface AssetCollectionProps extends IBackendBased {
    id: number;
    topLevelTransform?: TransformDTO;
}

const AssetCollection: Component<AssetCollectionProps> = (props) => {
    return (
        <div>
            AssetCollection
        </div>
    )
}
export default AssetCollection;