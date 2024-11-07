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
    let backgroundCanvas: HTMLCanvasElement | null = null;

    const distance = (p1: Point, p2: Point): number => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const generateGridPoints = (width: number, height: number): Point[] => {
        const points: Point[] = [];
        // Create larger cells - maybe 3-4 cells across the width
        const cellWidth = width / 3;
        const cellHeight = height / 6;  // More cells vertically since wall is tall

        // Create grid points
        for (let y = 0; y <= height; y += cellHeight) {
            for (let x = 0; x <= width; x += cellWidth) {
                // Add some randomness to non-edge points to make it less regular
                if (x > 0 && x < width && y > 0 && y < height) {
                    points.push({
                        x: x + (Math.random() - 0.5) * cellWidth * 0.3,
                        y: y + (Math.random() - 0.5) * cellHeight * 0.3
                    });
                } else {
                    // Keep edge points aligned
                    points.push({ x, y });
                }
            }
        }
        return points;
    };

    const generateGridFragments = (width: number, height: number): Point[][] => {
        const regions: Point[][] = [];
        const numColumns = 4;
        const cellWidth = width / numColumns;
        const cellHeight = cellWidth; // Make cells square
        const numRows = Math.ceil(height / cellHeight); // Removed the +1

        console.log(`Creating grid: ${numColumns} columns x ${numRows} rows`); // Debug info

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numColumns; col++) {
                const x1 = col * cellWidth;
                const y1 = row * cellHeight;
                const x2 = x1 + cellWidth;
                const y2 = y1 + cellHeight;

                const region = [
                    { x: x1, y: y1 },
                    { x: x2, y: y1 },
                    { x: x2, y: y2 },
                    { x: x1, y: y2 },
                    { x: x1, y: y1 }
                ];
                regions.push(region);
            }
        }

        return regions;
    };

    const findFragmentsFromGrid = (points: Point[], width: number, height: number): Point[][] => {
        const regions: Point[][] = [];
        const gridSize = Math.sqrt(points.length);
        const rowSize = Math.ceil(width / (width / 3)) + 1;  // Number of points per row

        // Helper to get point at grid position
        const getPoint = (x: number, y: number): Point | undefined => {
            const index = y * rowSize + x;
            return points[index];
        };

        // Helper to create a random region from grid cells
        const createRegion = (startX: number, startY: number, width: number, height: number): Point[] => {
            const region: Point[] = [];
            const topLeft = getPoint(startX, startY);
            const topRight = getPoint(startX + width, startY);
            const bottomRight = getPoint(startX + width, startY + height);
            const bottomLeft = getPoint(startX, startY + height);

            if (topLeft && topRight && bottomRight && bottomLeft) {
                // Add points in clockwise order
                region.push(topLeft);
                region.push(topRight);
                region.push(bottomRight);
                region.push(bottomLeft);
                region.push(topLeft); // Close the loop
            }

            return region;
        };

        // Create larger fragments by combining grid cells
        for (let y = 0; y < rowSize - 1; y += 2) {
            for (let x = 0; x < rowSize - 1; x += 1) {
                const region = createRegion(x, y, 1, 2);
                if (region.length > 0) {
                    regions.push(region);
                }
            }
        }

        return regions;
    };

    const findTriangulation = (points: Point[]): Point[][] => {
        const regions: Point[][] = [];
        const usedEdges = new Set<string>();

        const edgeKey = (p1: Point, p2: Point) => {
            return `${Math.min(p1.x, p2.x)},${Math.min(p1.y, p2.y)}-${Math.max(p1.x, p2.x)},${Math.max(p1.y, p2.y)}`;
        };

        // For each point, find its 3 closest neighbors
        points.forEach(point => {
            const neighbors = findNearestPoints(point, points, 3);
            neighbors.forEach(neighbor => {
                const key = edgeKey(point, neighbor);
                if (!usedEdges.has(key)) {
                    usedEdges.add(key);
                }
            });
        });

        // Find triangles from the edges
        points.forEach(p1 => {
            const neighbors = findNearestPoints(p1, points, 6);
            for (let i = 0; i < neighbors.length - 1; i++) {
                const p2 = neighbors[i];
                for (let j = i + 1; j < neighbors.length; j++) {
                    const p3 = neighbors[j];

                    const edge1 = edgeKey(p1, p2);
                    const edge2 = edgeKey(p2, p3);
                    const edge3 = edgeKey(p3, p1);

                    if (usedEdges.has(edge1) && usedEdges.has(edge2) && usedEdges.has(edge3)) {
                        const region = [p1, p2, p3, p1];
                        regions.push(region);
                    }
                }
            }
        });

        // Merge triangles into larger regions
        const mergedRegions: Point[][] = [];
        let usedTriangles = new Set<number>();

        regions.forEach((region1, i) => {
            if (usedTriangles.has(i)) return;

            let currentRegion = [...region1];
            usedTriangles.add(i);

            let merged;
            do {
                merged = false;
                regions.forEach((region2, j) => {
                    if (usedTriangles.has(j)) return;

                    // Check if regions share two points
                    const sharedPoints = currentRegion.filter(p1 =>
                        region2.some(p2 => p2.x === p1.x && p2.y === p1.y)
                    );

                    if (sharedPoints.length >= 2 && currentRegion.length < 10) {  // Limited size for more uniform fragments
                        // Merge regions
                        const uniquePoints = region2.filter(p1 =>
                            !currentRegion.some(p2 => p2.x === p1.x && p2.y === p1.y)
                        );

                        // Find best insertion point for natural shape
                        const insertIndex = currentRegion.findIndex(p =>
                            p.x === sharedPoints[0].x && p.y === sharedPoints[0].y
                        );

                        currentRegion.splice(insertIndex, 0, ...uniquePoints);
                        usedTriangles.add(j);
                        merged = true;
                    }
                });
            } while (merged);

            mergedRegions.push(currentRegion);
        });

        return mergedRegions;
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

        // Clear any existing fragments
        fragments.forEach(f => {
            if (f.element) f.element.remove();
        });
        fragments = [];

        // Don't create background canvas at all since we want to see the red background
        // when fragments fall

        // Generate rectangular grid fragments
        const regions = generateGridFragments(width, height);

        // Create temporary canvas for the wall texture
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;

        // Fill the temporary canvas with the repeated wall texture
        const wallPattern = tempCtx.createPattern(wallImage, 'repeat');
        if (wallPattern) {
            tempCtx.fillStyle = wallPattern;
            tempCtx.fillRect(0, 0, width, height);
        }

        // Create fragments
        regions.forEach(region => {
            const xs = region.map(p => p.x);
            const ys = region.map(p => p.y);

            // Minimal padding
            const padding = 0.5;
            const minX = Math.max(0, Math.min(...xs) - padding);
            const maxX = Math.min(width, Math.max(...xs) + padding);
            const minY = Math.max(0, Math.min(...ys) - padding);
            const maxY = Math.min(height, Math.max(...ys) + padding);

            const canvas = document.createElement('canvas');
            canvas.width = maxX - minX;
            canvas.height = maxY - minY;

            canvas.style.position = 'absolute';
            canvas.style.left = `${minX}px`;
            canvas.style.top = `${minY}px`;
            canvas.style.transformOrigin = 'center center';
            canvas.style.zIndex = '2';

            const ctx = canvas.getContext('2d')!;
            ctx.save();

            // Draw straight lines for the rectangle
            ctx.beginPath();
            ctx.moveTo(region[0].x - minX, region[0].y - minY);

            for (let i = 1; i < region.length; i++) {
                const p = region[i];
                ctx.lineTo(p.x - minX, p.y - minY);
            }

            ctx.closePath();
            ctx.clip();

            // Draw the wall texture onto the fragment
            ctx.drawImage(tempCanvas,
                minX,
                minY,
                canvas.width,
                canvas.height,
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.restore();

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

        // Clean up temporary canvas
        tempCanvas.width = 0;
        tempCanvas.height = 0;
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
        if (backgroundCanvas) {
            backgroundCanvas.remove();
            backgroundCanvas = null;
        }
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });

    return (
        <div class={wallContainerStyle} id="Outer-Wall" ref={containerRef}>
            <div class={backgroundStyle}></div>
            <NTAwait func={() => props.context.backend.assets.getMetadata(7003)}>
                {(asset) => (
                    <div style={{ display: 'none' }}>
                        <GraphicalAsset
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
    background-color: red; // This is the only background we need
`;

const backgroundStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
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