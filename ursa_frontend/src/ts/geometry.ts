import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";

export type Vec2 = { x: number; y: number };
export const Vec2_ZERO: Readonly<Vec2> = { x: 0, y: 0 };
export const Vec2_ONE:  Readonly<Vec2> = { x: 1, y: 1 };
export const Vec2_TWENTY: Readonly<Vec2> = { x: 20, y: 20 };
export const UNIT_TRANSFORM: Readonly<TransformDTO> = { 
    xOffset: 0,
    yOffset: 0,
    zIndex: 0,
    xScale: 1,
    yScale: 1,
};
/** Caution: May contain traces of sqrt (expensive) */
export function normalizeVec2(vec: Vec2): Vec2 {
    const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    return { x: vec.x / mag, y: vec.y / mag };
}

export type Line = { x1: number; y1: number; x2: number; y2: number };
