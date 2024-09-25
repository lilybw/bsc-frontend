import { Component, createResource, Show } from "solid-js";
import { IBackendBased, IParentingImages, IStyleOverwritable } from "../ts/types";
import { ResCodeErr } from "../meta/types";
import { AssetResponseDTO } from "../integrations/main_backend/mainBackendDTOs";
import Spinner from "./SimpleLoadingSpinner";
import SomethingWentWrongIcon from "./SomethingWentWrongIcon";
import Planet from "./Planet";

export interface ManagedAssetProps extends IStyleOverwritable, IParentingImages, IBackendBased {
    asset: number;
    rotationSpeedS?: number;
}

const ManagedPlanet: Component<ManagedAssetProps> = (props) => {
    const [assetMetadata, setAssetMetadata] = createResource<ResCodeErr<AssetResponseDTO>>(() => props.backend.getAssetMetadata(props.asset));
    return (
        <div>
            <Show when={assetMetadata.loading}>
                <Spinner />
            </Show>
            <Show when={assetMetadata.error}>
                <SomethingWentWrongIcon message={assetMetadata.latest?.err} />
            </Show>
            <Show when={assetMetadata.state === "ready"}>
                <Planet styleOverwrite={props.styleOverwrite} rotationSpeedS={props.rotationSpeedS} metadata={assetMetadata.latest?.res!} backend={props.backend}>
                    {props.children}
                </Planet>
            </Show> 
        </div>
    );

}

export default ManagedPlanet;