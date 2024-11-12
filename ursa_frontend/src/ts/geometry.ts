
export type Vec2 = { x: number; y: number };
export function normalizeVec2(vec: Vec2): Vec2 {
    const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    return { x: vec.x / mag, y: vec.y / mag };
}
export type Line = { x1: number; y1: number; x2: number; y2: number };