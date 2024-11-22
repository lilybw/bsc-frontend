import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";

export type Vec2 = { x: number; y: number };
export const Vec2_ZERO: Readonly<Vec2> = { x: 0, y: 0 };
export const Vec2_ONE: Readonly<Vec2> = { x: 1, y: 1 };
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

/** Angle returned in radians */
export function angle(vec: Vec2): number {
    return Math.atan2(vec.y, vec.x)
}

/** Angle returned in radians */
export function angleBetween(vec1: Vec2, vec2: Vec2): number {
    return Math.atan2(vec1.y - vec2.y, vec1.x - vec2.x)
}

export type Line = { x1: number; y1: number; x2: number; y2: number };

export type Circle = { x: number; y: number; radius: number };
