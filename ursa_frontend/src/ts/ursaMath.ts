import { TransformDTO } from '../integrations/main_backend/mainBackendDTOs';

export const getRandHash = () => Math.random().toString(36).substring(7);

export const combineTransforms = (a: TransformDTO, b: TransformDTO): TransformDTO => {
    return {
        xOffset: a.xOffset + b.xOffset,
        yOffset: a.yOffset + b.yOffset,
        zIndex: a.zIndex + b.zIndex,
        xScale: a.xScale * b.xScale,
        yScale: a.yScale * b.yScale,
    };
};
