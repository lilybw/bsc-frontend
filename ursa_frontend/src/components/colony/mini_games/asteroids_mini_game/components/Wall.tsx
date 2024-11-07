import { Accessor, Component, createEffect, onCleanup } from 'solid-js';
import { css } from '@emotion/css';
import NTAwait from '@/components/util/NoThrowAwait';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import { ApplicationContext } from '@/meta/types';

interface WallProps {
    context: ApplicationContext;
    health: Accessor<number>;
    maxHealth?: number;
}

interface Point {
    x: number;
    y: number;
}

interface Fragment {
    element: HTMLCanvasElement;
    points: Point[];
    isActive: boolean;
    hasDropped: boolean;
    dx: number;
    dy: number;
    rotation: number;
    opacity: number;
    timeSinceDrop: number;
    centroid: Point;
}

interface Edge {
    p1: Point;
    p2: Point;
}

const MIN_EDGE_POINTS = 15;
const MAX_EDGE_POINTS = 25;
const MIN_EDGE_SPACING = 20;
const INTERIOR_POINTS = 30;
const FRAME_TIME = 1000 / 60;
const FRAGMENT_LIFETIME = 3000;
const GRAVITY = 0.1;
const MIN_POINT_DISTANCE = 30;
const MAX_CONNECTIONS = 2;

const Wall: Component<WallProps> = (props) => {
    let containerRef: HTMLDivElement | undefined;
    let lastHealth = props.maxHealth || 100;
    let fragments: Fragment[] = [];
    let animationFrame: number;
    let wallImage: HTMLImageElement | null = null;
    let lastFrameTime = performance.now();

    const distance = (p1: Point, p2: Point): number => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const generatePoints = (width: number, height: number): Point[] => {
        const points: Point[] = [];

        // Add corners with slight inset to avoid tiny corner fragments
        const inset = MIN_POINT_DISTANCE / 2;
        points.push({ x: inset, y: inset });
        points.push({ x: width - inset, y: inset });
        points.push({ x: width - inset, y: height - inset });
        points.push({ x: inset, y: height - inset });

        // Calculate spacing based on wall dimensions and limits
        const horizontalSpacing = Math.max(
            MIN_EDGE_SPACING,
            Math.min(
                width / MIN_EDGE_POINTS,
                width / MAX_EDGE_POINTS
            )
        );

        const verticalSpacing = Math.max(
            MIN_EDGE_SPACING,
            Math.min(
                height / MIN_EDGE_POINTS,
                height / MAX_EDGE_POINTS
            )
        );

        // Add edge points with controlled randomness
        const variance = Math.min(horizontalSpacing, verticalSpacing) * 0.25;

        // Helper function to check if a point is too close to existing points
        const isTooClose = (newPoint: Point): boolean => {
            return points.some(existingPoint =>
                distance(newPoint, existingPoint) < MIN_POINT_DISTANCE
            );
        };

        // Add edge points
        for (let x = horizontalSpacing; x < width - horizontalSpacing; x += horizontalSpacing) {
            const topPoint = {
                x: x + (Math.random() - 0.5) * variance,
                y: inset + (Math.random() - 0.5) * variance
            };
            const bottomPoint = {
                x: x + (Math.random() - 0.5) * variance,
                y: height - inset + (Math.random() - 0.5) * variance
            };

            if (!isTooClose(topPoint)) points.push(topPoint);
            if (!isTooClose(bottomPoint)) points.push(bottomPoint);
        }

        for (let y = verticalSpacing; y < height - verticalSpacing; y += verticalSpacing) {
            const leftPoint = {
                x: inset + (Math.random() - 0.5) * variance,
                y: y + (Math.random() - 0.5) * variance
            };
            const rightPoint = {
                x: width - inset + (Math.random() - 0.5) * variance,
                y: y + (Math.random() - 0.5) * variance
            };

            if (!isTooClose(leftPoint)) points.push(leftPoint);
            if (!isTooClose(rightPoint)) points.push(rightPoint);
        }

        // Add interior points
        const interiorAttempts = INTERIOR_POINTS * 2;

        for (let i = 0; i < interiorAttempts && points.length < INTERIOR_POINTS + points.length; i++) {
            const newPoint = {
                x: Math.random() * (width - horizontalSpacing * 2) + horizontalSpacing,
                y: Math.random() * (height - verticalSpacing * 2) + verticalSpacing
            };

            if (!isTooClose(newPoint)) {
                points.push(newPoint);
            }
        }

        return points;
    };

    const findNearestPoints = (point: Point, allPoints: Point[], maxConnections: number): Point[] => {
        const nearest = allPoints
            .filter(p => p !== point)
            .sort((a, b) => distance(point, a) - distance(point, b))
            .slice(0, maxConnections * 2); // Get more points than needed for better selection

        // Filter points to avoid sharp angles
        const selected: Point[] = [];
        let remainingPoints = [...nearest];

        // Start with the closest point
        if (remainingPoints.length > 0) {
            selected.push(remainingPoints[0]);
            remainingPoints.splice(0, 1);
        }

        // Add additional points while avoiding sharp angles
        while (selected.length < maxConnections && remainingPoints.length > 0) {
            let bestPoint: Point | null = null;
            let bestAngle = 0;

            for (const candidate of remainingPoints) {
                // Calculate angle between existing connections
                const angles = selected.map(p => {
                    const dx = candidate.x - point.x;
                    const dy = candidate.y - point.y;
                    return Math.atan2(dy, dx);
                });

                // Find minimum angle difference with existing connections
                let minAngleDiff = Math.PI * 2;
                for (let i = 0; i < angles.length; i++) {
                    for (let j = i + 1; j < angles.length; j++) {
                        const diff = Math.abs(angles[i] - angles[j]);
                        minAngleDiff = Math.min(minAngleDiff, diff);
                    }
                }

                if (!bestPoint || minAngleDiff > bestAngle) {
                    bestPoint = candidate;
                    bestAngle = minAngleDiff;
                }
            }

            if (bestPoint) {
                selected.push(bestPoint);
                remainingPoints = remainingPoints.filter(p => p !== bestPoint);
            } else {
                break;
            }
        }

        return selected;
    };

    const createFragments = () => {
        if (!containerRef || !wallImage) return;

        const width = containerRef.clientWidth;
        const height = containerRef.clientHeight;

        // Generate more points to ensure full coverage
        const points = generatePoints(width, height);

        // Create edges between points
        const edges: Edge[] = [];
        points.forEach(point => {
            const nearestPoints = findNearestPoints(point, points, 3);
            nearestPoints.forEach(nearPoint => {
                edges.push({ p1: point, p2: nearPoint });
            });
        });

        // Create regions from edges
        const regions: Point[][] = [];
        let usedPoints = new Set<Point>();

        edges.forEach(edge => {
            if (!usedPoints.has(edge.p1)) {
                const region: Point[] = [edge.p1];
                let currentPoint = edge.p2;
                let attempts = 0;

                // Try to create a polygon with 3-5 vertices
                while (attempts < 8 && region.length < 5) {
                    const nearPoints = findNearestPoints(currentPoint, points, 4)
                        .filter(p => !region.includes(p) &&
                            !region.some(existing => distance(p, existing) < MIN_POINT_DISTANCE));

                    if (nearPoints.length > 0) {
                        region.push(currentPoint);
                        // Pick a random point from the nearest points to create more irregular shapes
                        currentPoint = nearPoints[Math.floor(Math.random() * Math.min(nearPoints.length, 2))];
                        attempts = 0;
                    } else {
                        attempts++;
                    }
                }

                // Close the polygon if we have enough points
                if (region.length >= 3) {
                    regions.push(region);
                    region.forEach(p => usedPoints.add(p));
                }
            }
        });

        // Create fragment elements
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;

        // Draw the repeating texture pattern
        const pattern = tempCtx.createPattern(wallImage, 'repeat');
        if (pattern) {
            tempCtx.fillStyle = pattern;
            tempCtx.fillRect(0, 0, width, height);
        }

        regions.forEach(region => {
            if (region.length < 3) return;

            // Calculate bounding box with padding
            const xs = region.map(p => p.x);
            const ys = region.map(p => p.y);
            const minX = Math.min(...xs) - 2;
            const maxX = Math.max(...xs) + 2;
            const minY = Math.min(...ys) - 2;
            const maxY = Math.max(...ys) + 2;

            const canvas = document.createElement('canvas');
            canvas.width = maxX - minX + 4;  // Add padding
            canvas.height = maxY - minY + 4;
            canvas.style.position = 'absolute';
            canvas.style.left = `${minX - 2}px`;
            canvas.style.top = `${minY - 2}px`;
            canvas.style.transformOrigin = 'center center';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '2'

            const ctx = canvas.getContext('2d')!;

            // Draw the fragment shape
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(
                region[0].x - minX + 2,
                region[0].y - minY + 2
            );

            // Use curve interpolation for smoother shapes
            for (let i = 1; i < region.length; i++) {
                const p1 = region[i - 1];
                const p2 = region[i];
                const xc = (p1.x + p2.x) / 2;
                const yc = (p1.y + p2.y) / 2;

                ctx.quadraticCurveTo(
                    p1.x - minX + 2,
                    p1.y - minY + 2,
                    xc - minX + 2,
                    yc - minY + 2
                );
            }

            // Close the path back to the first point
            const last = region[region.length - 1];
            const first = region[0];
            const xc = (last.x + first.x) / 2;
            const yc = (last.y + first.y) / 2;

            ctx.quadraticCurveTo(
                last.x - minX + 2,
                last.y - minY + 2,
                xc - minX + 2,
                yc - minY + 2
            );

            ctx.closePath();
            ctx.clip();

            // Draw the texture
            ctx.drawImage(
                tempCanvas,
                minX - 2,
                minY - 2,
                canvas.width,
                canvas.height,
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.restore();

            // Calculate centroid
            const centroid = {
                x: region.reduce((sum, p) => sum + p.x, 0) / region.length,
                y: region.reduce((sum, p) => sum + p.y, 0) / region.length
            };

            const fragment: Fragment = {
                element: canvas,
                points: region,
                isActive: true,
                hasDropped: false,
                dx: 0,
                dy: 0,
                rotation: 0,
                opacity: 1,
                timeSinceDrop: 0,
                centroid
            };

            fragments.push(fragment);
            containerRef?.appendChild(canvas);
        });
    };

    const dropFragments = (percentToDrop: number) => {
        const availableFragments = fragments.filter(f => f.isActive && !f.hasDropped);
        const numToDrop = Math.ceil(availableFragments.length * (percentToDrop / 100));

        for (let i = 0; i < numToDrop && availableFragments.length > 0; i++) {
            const index = Math.floor(Math.random() * availableFragments.length);
            const fragment = availableFragments[index];

            if (fragment) {
                const sidewaysDirection = fragment.centroid.x > containerRef!.clientWidth / 2 ? 1 : -1;

                fragment.dx = sidewaysDirection * (Math.random() * 0.2);
                fragment.dy = 0;
                fragment.rotation = sidewaysDirection * (Math.random() * 45);
                fragment.timeSinceDrop = 0;
                fragment.hasDropped = true;
            }

            availableFragments.splice(index, 1);
        }

        if (!animationFrame) {
            lastFrameTime = performance.now();
            updateFragments();
        }
    };

    const updateFragments = () => {
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - lastFrameTime, 32);
        lastFrameTime = currentTime;

        let hasActiveFragments = false;

        fragments.forEach(fragment => {
            if (!fragment.hasDropped) return;

            fragment.timeSinceDrop += deltaTime;

            if (fragment.timeSinceDrop >= FRAGMENT_LIFETIME) {
                fragment.isActive = false;
                fragment.element.remove();
                return;
            }

            hasActiveFragments = true;

            const timeScale = deltaTime / FRAME_TIME;

            fragment.dy += GRAVITY * timeScale;
            fragment.dx *= Math.pow(0.99, timeScale);

            fragment.rotation += (fragment.dx * 0.1) * timeScale;

            const fadeStartTime = FRAGMENT_LIFETIME * 0.7;
            const opacity = fragment.timeSinceDrop < fadeStartTime
                ? 1
                : Math.max(0, 1 - ((fragment.timeSinceDrop - fadeStartTime) / (FRAGMENT_LIFETIME - fadeStartTime)));
            fragment.opacity = opacity;

            const currentLeft = parseFloat(fragment.element.style.left) || 0;
            const currentTop = parseFloat(fragment.element.style.top) || 0;

            const newLeft = currentLeft + (fragment.dx * timeScale);
            const newTop = currentTop + (fragment.dy * timeScale);

            fragment.element.style.left = `${newLeft}px`;
            fragment.element.style.top = `${newTop}px`;

            const scale = 1 - (fragment.timeSinceDrop / FRAGMENT_LIFETIME) * 0.1;
            fragment.element.style.transform = `rotate(${fragment.rotation}deg) scale(${scale})`;
            fragment.element.style.opacity = fragment.opacity.toString();
        });

        if (Math.floor(currentTime / 1000) > Math.floor(lastFrameTime / 1000)) {
            fragments = fragments.filter(f => f.isActive);
        }

        if (hasActiveFragments) {
            animationFrame = requestAnimationFrame(updateFragments);
        } else {
            animationFrame = 0;
        }
    };

    createEffect(() => {
        const currentHealth = props.health();
        if (currentHealth < lastHealth) {
            const percentLost = ((lastHealth - currentHealth) / lastHealth) * 100;
            dropFragments(percentLost);
            lastHealth = currentHealth;
        }
    });

    onCleanup(() => {
        fragments.forEach(f => {
            if (f.element) f.element.remove();
        });
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });

    return (
        <div class={wallContainerStyle} id="Outer-Wall" ref={containerRef}>
            {/* Red background - lowest layer */}
            <div class={backgroundStyle}></div>

            {/* Only load the image for creating fragments, but don't display it */}
            <NTAwait func={() => props.context.backend.assets.getMetadata(7003)}>
                {(asset) => (
                    <div style={{ display: 'none' }}>  {/* Hide the original image */}
                        <GraphicalAsset
                            styleOverwrite={wallTextureStyle}
                            backend={props.context.backend}
                            metadata={asset}
                            onImageLoad={(img) => {
                                wallImage = img;
                                createFragments();
                            }}
                        />
                    </div>
                )}
            </NTAwait>
            <div class={gradientOverlayStyle}></div>
        </div>
    );
};

const wallContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 4vw;
    height: 100vh;
    overflow: hidden;
    transform-style: preserve-3d;
    perspective: 1000px;
`;

const textureContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    img {
        width: auto !important;
        height: auto !important;
        object-fit: none !important;
        position: absolute;
        top: 0;
        left: 0;
        image-rendering: pixelated;
        transform: none !important;
    }
`;

const wallTextureStyle = css`
    background-repeat: repeat;
`;

const gradientOverlayStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        to right,
        rgba(30, 30, 30, 0.8) 0%,
        rgba(200, 200, 200, 0.5) 100%
    );
    pointer-events: none;
    z-index: 3;
`;

export default Wall;

const backgroundStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: red;
    z-index: 0;
`;