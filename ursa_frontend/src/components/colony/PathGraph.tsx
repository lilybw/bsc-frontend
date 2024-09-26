import { Accessor, Component, For } from "solid-js";
import { ColonyLocationInformation, ColonyPathGraphResponseDTO, LocationInfoResponseDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { IBackendBased } from "../../ts/types";
import NTAwait from "../util/NoThrowAwait";
import AssetCollection from "./AssetCollection";
import { WrappedSignal } from "../../ts/wrappedSignal";

interface PathGraphProps extends IBackendBased {
    camera: WrappedSignal<{ x: number, y: number}>;
    paths: ColonyPathGraphResponseDTO;
    locations: ColonyLocationInformation[];
}

const PathGraph: Component<PathGraphProps> = (props) => {

    const getCollectionId = (info: LocationInfoResponseDTO, level: number): number => {
        for (const appearance of info.appearances) {
            if (appearance.level === level) {
                return appearance.assetCollectionID;
            }
        }
        return 9999999999; // Not found error will make NTAwait show error message
    }

    return (
        <div class={containerStyle}>
            <For each={props.locations}>{(location) => (
                <NTAwait func={() => props.backend.getLocationInfo(location.locationID)}>{(info) => (
                    <AssetCollection backend={props.backend} id={getCollectionId(info, location.level)} topLevelTransform={location.transform} />
                )}</NTAwait>
            )}</For>
        </div>
    )
}
export default PathGraph;

const containerStyle = css`

`