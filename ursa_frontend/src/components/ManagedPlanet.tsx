import { Component, createResource, Show } from "solid-js";
import { IBackendBased, IParenting, IParentingImages, IStyleOverwritable } from "../ts/types";
import { ResCodeErr } from "../meta/types";
import { AssetResponseDTO } from "../integrations/main_backend/mainBackendDTOs";
import Spinner from "./SimpleLoadingSpinner";
import SomethingWentWrongIcon from "./SomethingWentWrongIcon";
import Planet from "./Planet";

export interface ManagedAssetProps extends IStyleOverwritable, IParenting, IBackendBased {
    asset: number;
    rotationSpeedS?: number;
    imageStyleOverwrite?: string;
    shadowStyleOverwrite?: string;
    useShadow?: boolean;
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
                <Planet  {...props} metadata={assetMetadata.latest?.res!}
                >
                    {props.children}
                </Planet>
            </Show> 
        </div>
    );

}

export default ManagedPlanet;