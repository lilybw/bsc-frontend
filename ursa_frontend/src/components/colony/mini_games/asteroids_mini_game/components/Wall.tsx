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

        // Add corners with zero inset to ensure coverage
        points.push({ x: 0, y: 0 });
        points.push({ x: width, y: 0 });
        points.push({ x: width, y: height });
        points.push({ x: 0, y: height });

        // Calculate spacing to ensure more even coverage
        const horizontalSpacing = Math.max(
            MIN_EDGE_SPACING,
            width / MAX_EDGE_POINTS
        );

        const verticalSpacing = Math.max(
            MIN_EDGE_SPACING,
            height / MAX_EDGE_POINTS
        );

        // Reduced variance for more consistent coverage
        const variance = Math.min(horizontalSpacing, verticalSpacing) * 0.15;

        // Add edge points with less randomness
        for (let x = horizontalSpacing; x < width - horizontalSpacing / 2; x += horizontalSpacing) {
            points.push({
                x: x + (Math.random() - 0.5) * variance,
                y: (Math.random() - 0.5) * variance
            });
            points.push({
                x: x + (Math.random() - 0.5) * variance,
                y: height + (Math.random() - 0.5) * variance
            });
        }

        for (let y = verticalSpacing; y < height - verticalSpacing / 2; y += verticalSpacing) {
            points.push({
                x: (Math.random() - 0.5) * variance,
                y: y + (Math.random() - 0.5) * variance
            });
            points.push({
                x: width + (Math.random() - 0.5) * variance,
                y: y + (Math.random() - 0.5) * variance
            });
        }

        // Add more interior points for better coverage
        const minInteriorSpacing = Math.min(horizontalSpacing, verticalSpacing) * 0.4;
        const attempts = INTERIOR_POINTS * 3;

        for (let i = 0; i < attempts && points.length < INTERIOR_POINTS + points.length; i++) {
            const newPoint = {
                x: Math.random() * width,
                y: Math.random() * height
            };

            if (points.every(p => distance(newPoint, p) >= minInteriorSpacing)) {
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

        // Create and append the background canvas first
        const backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = width;
        backgroundCanvas.height = height;
        backgroundCanvas.style.position = 'absolute';
        backgroundCanvas.style.left = '0';
        backgroundCanvas.style.top = '0';
        backgroundCanvas.style.width = '100%';
        backgroundCanvas.style.height = '100%';
        backgroundCanvas.style.zIndex = '1';

        const bgCtx = backgroundCanvas.getContext('2d')!;
        const pattern = bgCtx.createPattern(wallImage, 'repeat');
        if (pattern) {
            bgCtx.fillStyle = pattern;
            bgCtx.fillRect(0, 0, width, height);
        }

        containerRef.appendChild(backgroundCanvas);

        const points = generatePoints(width, height);

        // Create edges with overlap to prevent gaps
        const edges: Edge[] = [];
        points.forEach(point => {
            const nearestPoints = findNearestPoints(point, points, MAX_CONNECTIONS);
            nearestPoints.forEach(nearPoint => {
                edges.push({ p1: point, p2: nearPoint });
            });
        });

        // Create regions with overlap
        const regions: Point[][] = [];
        let usedPoints = new Set<Point>();

        edges.forEach(edge => {
            if (!usedPoints.has(edge.p1)) {
                const region: Point[] = [edge.p1];
                let currentPoint = edge.p2;
                let attempts = 0;

                while (attempts < 8) { // Increased from 5 for better coverage
                    const nearPoints = findNearestPoints(currentPoint, points, MAX_CONNECTIONS)
                        .filter(p => !region.includes(p));

                    if (nearPoints.length > 0) {
                        region.push(currentPoint);
                        currentPoint = nearPoints[0];
                        attempts = 0;
                    } else {
                        attempts++;
                    }

                    if (region.length >= 6) break; // Increased from 5 for better coverage
                }

                if (region.length >= 3) {
                    // Add extra points to ensure edge coverage
                    if (region[0].x <= MIN_EDGE_SPACING) {
                        region.push({ x: 0, y: region[0].y });
                    }
                    if (region[0].x >= width - MIN_EDGE_SPACING) {
                        region.push({ x: width, y: region[0].y });
                    }
                    if (region[0].y <= MIN_EDGE_SPACING) {
                        region.push({ x: region[0].x, y: 0 });
                    }
                    if (region[0].y >= height - MIN_EDGE_SPACING) {
                        region.push({ x: region[0].x, y: height });
                    }

                    regions.push(region);
                    region.forEach(p => usedPoints.add(p));
                }
            }
        });

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

        // Create fragments with overlap
        regions.forEach(region => {
            const xs = region.map(p => p.x);
            const ys = region.map(p => p.y);

            // Add padding to prevent gaps
            const padding = 2;
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

            // Create fragment path with smooth edges
            ctx.beginPath();
            ctx.moveTo(region[0].x - minX, region[0].y - minY);

            // Draw smooth curves between points
            for (let i = 1; i < region.length; i++) {
                const p1 = region[i - 1];
                const p2 = region[i];
                const xc = (p1.x + p2.x) / 2;
                const yc = (p1.y + p2.y) / 2;

                ctx.quadraticCurveTo(
                    p1.x - minX,
                    p1.y - minY,
                    xc - minX,
                    yc - minY
                );
            }

            // Close the path with a smooth curve
            const last = region[region.length - 1];
            const first = region[0];
            const xc = (last.x + first.x) / 2;
            const yc = (last.y + first.y) / 2;

            ctx.quadraticCurveTo(
                last.x - minX,
                last.y - minY,
                xc - minX,
                yc - minY
            );

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

            // Add a subtle shadow effect to hide potential gaps
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 1;
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

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
    background-color: red; // Fallback color
`;

const backgroundStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-color: red;
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