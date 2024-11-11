import { Line } from "@/ts/geometry";
import { ColonyAssetResponseDTO, ColonyLocationInformation, ColonyPathGraphResponseDTO, TransformDTO, uint32 } from "../../integrations/main_backend/mainBackendDTOs";
import { BufferSubscriber } from "../../ts/actionContext";
import { createWrappedSignal, WrappedSignal } from "../../ts/wrappedSignal";


export function arrayToMap(array: ColonyLocationInformation[]): Map<ColonyLocationID, WrappedSignal<TransformDTO>> {
    const map = new Map();

    for (const element of array) {
        map.set(element.id, createWrappedSignal(element.transform));
    }

    return map;
}
export type ColonyLocationID = uint32;
export const loadPathMap = (paths: ColonyPathGraphResponseDTO['paths']): Map<ColonyLocationID, ColonyLocationID[]> => {
    const pathMap = new Map<ColonyLocationID, ColonyLocationID[]>();
    for (const path of paths) {
        if (!pathMap.has(path.from)) {
            pathMap.set(path.from, []);
        }
        pathMap.get(path.from)!.push(path.to);
    }
    return pathMap;
};

export interface LocLine extends Line { from: ColonyLocationID; to: ColonyLocationID; };
export interface ColonyLocationInfoWOriginalTransform extends ColonyLocationInformation {
    originalTransform: TransformDTO;
}
export interface ColonyAssetWOriginalTransform extends ColonyAssetResponseDTO {
    originalTransform: TransformDTO;
    wrappedTransform: WrappedSignal<TransformDTO>;
}
export const loadPathsFromInitial = (paths: ColonyPathGraphResponseDTO['paths']): LocLine[] => {
    return paths.map((path) => ({
        from: path.from,
        to: path.to,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    }));
};
