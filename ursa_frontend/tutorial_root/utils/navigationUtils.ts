// src/utils/navigationUtils.ts
import { Vec2 } from '@/ts/geometry';
import { Accessor } from 'solid-js';

export interface LocationTransform {
    xOffset: number;
    yOffset: number;
    xScale: number;
    yScale: number;
    zIndex: number;
}

export interface Location {
    id: number;
    name: Accessor<string> | string;  // Allow both Accessor and plain string
    transform: LocationTransform;
}

export interface Path {
    from: number;
    to: number;
}

export interface ScaledLocation extends Location {
    scaledPosition: {
        x: number;
        y: number;
    };
}

export type RenderablePath = {
    fromPos: Vec2;
    toPos: Vec2;
    length: number;
    angle: number;
};

export const loadPathMap = (paths: Path[]): Map<number, number[]> => {
    const pathMap = new Map<number, number[]>();
    for (const path of paths) {
        if (!pathMap.has(path.from)) {
            pathMap.set(path.from, []);
        }
        pathMap.get(path.from)!.push(path.to);
        if (!pathMap.has(path.to)) {
            pathMap.set(path.to, []);
        }
        pathMap.get(path.to)!.push(path.from);
    }
    return pathMap;
};

export const getTargetCenterPosition = (
    locationId: string,
    locations: Location[],
    scaledLocations: ScaledLocation[]
): Vec2 | null => {
    const scaledLocation = scaledLocations.find(loc => loc.id.toString() === locationId);
    if (!scaledLocation) return null;

    return {
        x: scaledLocation.scaledPosition.x / window.innerWidth,
        y: scaledLocation.scaledPosition.y / window.innerHeight
    };
};

export const calculateRenderablePaths = (
    paths: Path[],
    getPosition: (id: string) => Vec2 | null
): RenderablePath[] => {
    return paths.map(path => {
        const fromPosition = getPosition(path.from.toString());
        const toPosition = getPosition(path.to.toString());

        if (!fromPosition || !toPosition) return null;

        const dx = (toPosition.x - fromPosition.x) * window.innerWidth;
        const dy = (toPosition.y - fromPosition.y) * window.innerHeight;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        return {
            fromPos: fromPosition,
            toPos: toPosition,
            length,
            angle
        };
    }).filter((path): path is RenderablePath => path !== null);
};