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
    element: HTMLDivElement;
    points: Point[];
    isActive: boolean;
    hasDropped: boolean;
    centroid: Point;
}

const FRAME_TIME = 1000 / 60;
const FRAGMENT_LIFETIME = 3000;
const GRAVITY = 0.1;

const Wall: Component<WallProps> = (props) => {
    let containerRef: HTMLDivElement | undefined;
    let lastHealth = props.maxHealth || 100;
    let fragments: Fragment[] = [];
    let animationFrame: number;
    let wallImage: HTMLImageElement | null = null;
    let lastFrameTime = performance.now();
    let backgroundCanvas: HTMLCanvasElement | null = null;
    let isGeneratingFragments = false;

    const generateGridFragments = (width: number, height: number): Point[][] => {
        const regions: Point[][] = [];
        const numColumns = 4;
        const baseWidth = width / numColumns;
        const baseHeight = baseWidth * 3; // Making cells 3 times taller than wide
        const numRows = Math.ceil(height / baseHeight);

        console.log(`Wall dimensions: ${width}x${height}`);
        console.log(`Cell dimensions: ${baseWidth}x${baseHeight}`);
        console.log(`Grid size: ${numColumns}x${numRows}`);
        console.log(`Expected total cells: ${numColumns * numRows}`);

        // Store edge deformations so they can be shared
        const edgeDeformations: Map<string, number[]> = new Map();

        // Helper to get/create shared edge deformation
        const getEdgeDeformation = (x1: number, y1: number, x2: number, y2: number): number[] => {
            const key = `${x1},${y1}-${x2},${y2}`;
            const reverseKey = `${x2},${y2}-${x1},${y1}`;

            if (edgeDeformations.has(key)) {
                return edgeDeformations.get(key)!;
            }
            if (edgeDeformations.has(reverseKey)) {
                return edgeDeformations.get(reverseKey)!.slice().reverse();
            }

            const baseOffset = width * 0.15;    // 15% offset
            const maxVariation = width * 0.1;   // 10% additional variation
            const segments = 8;
            const deformations = [];

            for (let i = 0; i < segments; i++) {
                const variation = Math.random() * maxVariation;
                deformations.push(baseOffset + variation);
            }

            edgeDeformations.set(key, deformations);
            return deformations;
        };

        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numColumns; col++) {
                // Base rectangle coordinates
                const x1 = col * baseWidth;
                const y1 = row * baseHeight;
                const x2 = (col + 1) * baseWidth;
                const y2 = (row + 1) * baseHeight;

                // Skip if this cell would extend beyond the wall height
                if (y1 >= height) continue;

                const region: Point[] = [];

                // Start with top-left corner
                region.push({ x: x1, y: y1 });

                // Top edge
                const topDeforms = getEdgeDeformation(x1, y1, x2, y1);
                for (let i = 0; i < topDeforms.length; i++) {
                    const t = (i + 1) / (topDeforms.length + 1);
                    region.push({
                        x: x1 + (x2 - x1) * t,
                        y: y1 - topDeforms[i]
                    });
                }

                region.push({ x: x2, y: y1 });

                // Right edge
                const rightDeforms = getEdgeDeformation(x2, y1, x2, y2);
                for (let i = 0; i < rightDeforms.length; i++) {
                    const t = (i + 1) / (rightDeforms.length + 1);
                    region.push({
                        x: x2 + rightDeforms[i],
                        y: y1 + (y2 - y1) * t
                    });
                }

                region.push({ x: x2, y: y2 });

                // Bottom edge
                const bottomDeforms = getEdgeDeformation(x2, y2, x1, y2);
                for (let i = 0; i < bottomDeforms.length; i++) {
                    const t = (i + 1) / (bottomDeforms.length + 1);
                    region.push({
                        x: x2 - (x2 - x1) * t,
                        y: y2 + bottomDeforms[i]
                    });
                }

                region.push({ x: x1, y: y2 });

                // Left edge
                const leftDeforms = getEdgeDeformation(x1, y2, x1, y1);
                for (let i = 0; i < leftDeforms.length; i++) {
                    const t = (i + 1) / (leftDeforms.length + 1);
                    region.push({
                        x: x1 - leftDeforms[i],
                        y: y2 - (y2 - y1) * t
                    });
                }

                region.push({ x: x1, y: y1 });
                regions.push(region);
            }
        }

        console.log(`Final region count: ${regions.length}`);
        return regions;
    };

    const createFragments = () => {
        if (!containerRef || !wallImage || isGeneratingFragments) {
            console.log("Skipping fragment generation - already in progress or missing dependencies");
            return;
        }

        isGeneratingFragments = true;
        console.log("Starting fragment generation");

        const width = containerRef.clientWidth;
        const height = containerRef.clientHeight;

        // Clean up any existing fragments
        fragments.forEach(f => {
            if (f.element) f.element.remove();
        });
        fragments = [];

        const regions = generateGridFragments(width, height);

        // Store the image source to avoid null checks
        const wallImageSrc = wallImage.src;

        // Create fragments
        regions.forEach(region => {
            const xs = region.map(p => p.x);
            const ys = region.map(p => p.y);

            const minX = Math.max(0, Math.min(...xs));
            const maxX = Math.min(width, Math.max(...xs));
            const minY = Math.max(0, Math.min(...ys));
            const maxY = Math.min(height, Math.max(...ys));

            const element = document.createElement('div');
            element.className = fragmentStyle;

            // Set size and position
            element.style.width = `${maxX - minX}px`;
            element.style.height = `${maxY - minY}px`;
            element.style.left = `${minX}px`;
            element.style.top = `${minY}px`;

            // Set background image using stored source
            element.style.backgroundImage = `url(${wallImageSrc})`;
            element.style.backgroundPosition = `-${minX}px -${minY}px`;

            // Create clip path from points
            const clipPoints = region.map(p =>
                `${p.x - minX}px ${p.y - minY}px`
            ).join(', ');
            element.style.clipPath = `polygon(${clipPoints})`;

            const centroid = {
                x: region.reduce((sum, p) => sum + p.x, 0) / region.length,
                y: region.reduce((sum, p) => sum + p.y, 0) / region.length
            };

            const fragment: Fragment = {
                element,
                points: region,
                isActive: true,
                hasDropped: false,
                centroid
            };

            fragments.push(fragment);
            containerRef?.appendChild(element);
        });

        isGeneratingFragments = false;
        console.log("Finished fragment generation");
    };

    const dropFragments = (percentToDrop: number) => {
        const availableFragments = fragments.filter(f => f.isActive && !f.hasDropped);
        const numToDrop = Math.ceil(availableFragments.length * (percentToDrop / 100));

        for (let i = 0; i < numToDrop && availableFragments.length > 0; i++) {
            const index = Math.floor(Math.random() * availableFragments.length);
            const fragment = availableFragments[index];

            if (fragment) {
                const sidewaysDirection = fragment.centroid.x > containerRef!.clientWidth / 2 ? 1 : -1;
                const rotation = sidewaysDirection * (Math.random() * 45);

                fragment.hasDropped = true;
                fragment.element.classList.add(fragmentDropAnimation(sidewaysDirection, rotation));

                // Remove fragment after animation
                fragment.element.addEventListener('transitionend', () => {
                    fragment.isActive = false;
                    fragment.element.remove();
                }, { once: true });
            }

            availableFragments.splice(index, 1);
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
            {/* Background image */}

            {/* Fragment texture image */}
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
    width: 72px;    // Fixed width
    height: 100vh;
    overflow: hidden;
    transform-style: preserve-3d;
    perspective: 1000px;
    background: linear-gradient(
        to right,
        #333333,
        #666666
    );
    background-size: cover;  // For the image we set later
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

const fragmentStyle = css`
    position: absolute;
    background-repeat: no-repeat;
    transition: transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 1s ease-out;
`;

const fragmentDropAnimation = (sidewaysDirection: number, rotation: number) => css`
    transform: translate(${sidewaysDirection * 100}px, 500px) rotate(${rotation}deg);
    opacity: 0;
`;

export default Wall;