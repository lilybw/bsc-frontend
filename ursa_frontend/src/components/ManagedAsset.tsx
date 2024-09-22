import { Component, createResource, Show } from "solid-js";
import { BackendIntegration } from "../integrations/main_backend/mainBackend";
import { IStyleOverwritable } from "../ts/types";
import { AssetResponseDTO } from "../integrations/main_backend/mainBackendDTOs";
import { ResCodeErr } from "../meta/types";
import Spinner from "./SimpleLoadingSpinner";
import SomethingWentWrongIcon from "./SomethingWentWrongIcon";
import GraphicalAsset from "./GraphicalAsset";

interface ManagedAssetProps extends IStyleOverwritable {
    asset: number;
    backend: BackendIntegration;
}

const ManagedAsset: Component<ManagedAssetProps> = (props) => {
    const [assetMetadata, setAssetMetadata] = createResource<ResCodeErr<AssetResponseDTO>>(() => props.backend.getAssetMetadata(props.asset));
    return (
        <div class={props.styleOverwrite}>
               <Show when={assetMetadata.loading}>
                    <Spinner />
                </Show>
                <Show when={assetMetadata.error}>
                    <SomethingWentWrongIcon message={assetMetadata.latest?.err} />
                </Show>
                <Show when={assetMetadata.state === "ready"}>
                    <GraphicalAsset metadata={assetMetadata.latest?.res!} backend={props.backend} />
                </Show> 
        </div>
    );
}
export default ManagedAsset;