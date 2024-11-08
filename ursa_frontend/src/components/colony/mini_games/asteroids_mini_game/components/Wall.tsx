import { Accessor, Component, createEffect, createMemo, onCleanup } from 'solid-js';
import { css } from '@emotion/css';
import NTAwait from '@/components/util/NoThrowAwait';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import { ApplicationContext } from '@/meta/types';

interface WallProps {
    context: ApplicationContext;
    health: Accessor<number>;
    maxHealth?: number;
    position: Accessor<{ x: number; y: number }>;
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

const Wall: Component<WallProps> = (props) => {
    let containerRef: HTMLDivElement | undefined;
    let lastHealth = props.maxHealth || 100;
    let fragments: Fragment[] = [];
    let wallImage: HTMLImageElement | null = null;
    let isGeneratingFragments = false;

    const nearestFragments = createMemo(() => {
        const pos = props.position();
        if (!fragments.length) return [];

        // Calculate distances for all active fragments
        const fragmentsWithDistance = fragments
            .filter(f => f.isActive && !f.hasDropped)
            .map(fragment => ({
                fragment,
                distance: Math.sqrt(
                    Math.pow(fragment.centroid.x - pos.x, 2) +
                    Math.pow(fragment.centroid.y - pos.y, 2)
                )
            }));

        // Sort by distance
        return fragmentsWithDistance.sort((a, b) => a.distance - b.distance);
    });

    const generateGridFragments = (width: number, height: number): Point[][] => {
        const regions: Point[][] = [];
        const numColumns = 4;
        const baseWidth = width / numColumns;
        const baseHeight = baseWidth * 3; // Making cells 3 times taller than wide
        const numRows = Math.ceil(height / baseHeight);

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

        return regions;
    };

    const createFragments = () => {
        if (!containerRef || !wallImage || isGeneratingFragments) {
            return;
        }

        isGeneratingFragments = true;

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
    };

    const dropFragments = (percentToDrop: number, impactPosition?: Point) => {
        const availableFragments = fragments.filter(f => f.isActive && !f.hasDropped);
        const numToDrop = Math.ceil(availableFragments.length * (percentToDrop / 100));

        if (impactPosition) {
            // Get the sorted fragments by distance
            const sortedFragments = nearestFragments();

            // Calculate how many fragments should drop based on proximity
            const proximityDropCount = Math.ceil(numToDrop * (1 / 6)); // Two thirds of total drops
            const randomDropCount = numToDrop - proximityDropCount;

            // Drop nearest fragments first
            for (let i = 0; i < proximityDropCount && i < sortedFragments.length; i++) {
                const fragment = sortedFragments[i].fragment;
                if (fragment && fragment.isActive && !fragment.hasDropped) {
                    dropSingleFragment(fragment, impactPosition);
                }
            }

            // Drop remaining fragments randomly
            const remainingFragments = fragments.filter(
                f => f.isActive && !f.hasDropped &&
                    !sortedFragments.slice(0, proximityDropCount).find(sf => sf.fragment === f)
            );

            for (let i = 0; i < randomDropCount && remainingFragments.length > 0; i++) {
                const index = Math.floor(Math.random() * remainingFragments.length);
                const fragment = remainingFragments[index];
                if (fragment) {
                    dropSingleFragment(fragment, impactPosition);
                }
                remainingFragments.splice(index, 1);
            }
        } else {
            // Fallback to original random dropping if no position provided
            for (let i = 0; i < numToDrop && availableFragments.length > 0; i++) {
                const index = Math.floor(Math.random() * availableFragments.length);
                const fragment = availableFragments[index];
                if (fragment) {
                    dropSingleFragment(fragment);
                }
                availableFragments.splice(index, 1);
            }
        }
    };

    const dropSingleFragment = (fragment: Fragment, impactPosition?: Point) => {
        const containerWidth = containerRef?.clientWidth || 0;
        let sidewaysDirection: number;
        let distance: number;

        if (impactPosition) {
            const horizontalDistance = fragment.centroid.x - impactPosition.x;
            sidewaysDirection = Math.sign(horizontalDistance) || (Math.random() > 0.5 ? 1 : -1);
            distance = 50 + Math.random() * 100;
        } else {
            sidewaysDirection = fragment.centroid.x > containerWidth / 2 ? 1 : -1;
            distance = 50 + Math.random() * 100;
        }

        // Create outer div for horizontal movement
        const outerDiv = document.createElement('div');
        outerDiv.className = fragmentOuterStyle(sidewaysDirection, distance);

        // Position the outer div at the fragment's original position
        outerDiv.style.left = fragment.element.style.left;
        outerDiv.style.top = fragment.element.style.top;
        outerDiv.style.transform = fragment.element.style.transform;

        // Create inner div for vertical movement
        const innerDiv = document.createElement('div');
        innerDiv.className = fragmentInnerStyle;

        // Move the original fragment element's properties to a new div
        const fragmentDiv = document.createElement('div');
        fragmentDiv.className = fragmentStyle;
        fragmentDiv.style.backgroundImage = fragment.element.style.backgroundImage;
        fragmentDiv.style.backgroundPosition = fragment.element.style.backgroundPosition;
        fragmentDiv.style.clipPath = fragment.element.style.clipPath;
        fragmentDiv.style.width = fragment.element.style.width;
        fragmentDiv.style.height = fragment.element.style.height;
        fragmentDiv.style.left = '0';
        fragmentDiv.style.top = '0';

        // Build the hierarchy
        innerDiv.appendChild(fragmentDiv);
        outerDiv.appendChild(innerDiv);

        // Replace the original element with our new structure
        fragment.element.parentNode?.replaceChild(outerDiv, fragment.element);
        fragment.element = fragmentDiv;

        fragment.hasDropped = true;

        // Single event listener with counter
        let animationsCompleted = 0;
        const onAnimationEnd = () => {
            animationsCompleted++;
            if (animationsCompleted === 2) {
                fragment.isActive = false;
                outerDiv.remove();
            }
        };

        // Add listeners that will auto-cleanup after firing once
        outerDiv.addEventListener('animationend', onAnimationEnd, { once: true });
        innerDiv.addEventListener('animationend', onAnimationEnd, { once: true });
    };

    createEffect(() => {
        const currentHealth = props.health();
        const currentPosition = props.position();

        if (currentHealth < lastHealth) {
            const percentLost = ((lastHealth - currentHealth) / lastHealth) * 100;
            dropFragments(percentLost, currentPosition);
            lastHealth = currentHealth;
        }
    });

    onCleanup(() => {
        fragments.forEach(f => {
            if (f.element) f.element.remove();
        });
    });

    return (
        <div class={wallContainerStyle} id="Outer-Wall" ref={containerRef}>
            <div class={backgroundStyle}></div>
            {/* Background image */}
            <NTAwait func={() => props.context.backend.assets.getMetadata(7004)}>
                {(asset) => (
                    <div style={{ display: 'none' }}>
                        <GraphicalAsset
                            backend={props.context.backend}
                            metadata={asset}
                            onImageLoad={(img) => {
                                if (containerRef) {
                                    containerRef.style.backgroundImage = `url(${img.src})`;
                                    containerRef.style.backgroundSize = '100% auto'; // 100% width, auto height
                                    containerRef.style.backgroundPosition = 'center';
                                    containerRef.style.backgroundRepeat = 'repeat-y'; // Only repeat vertically
                                }
                            }}
                        />
                    </div>
                )}
            </NTAwait>

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
    width: 72px;
    height: 100vh;
    overflow: visible;
    transform-style: preserve-3d;
    perspective: 1000px;
    background: linear-gradient(
        to right,
        #333333,
        #666666
    );
    background-size: 100% auto;
    background-position: center;
    background-repeat: repeat-y;
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
    z-index: 1;
`;

const fragmentOuterStyle = (sidewaysDirection: number, distance: number) => css`
    position: absolute;
    overflow: visible;
    animation: slide-horizontal 1.5s ease-out forwards;

    @keyframes slide-horizontal {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(${sidewaysDirection * distance}px);
        }
    }
`;

const fragmentInnerStyle = css`
    position: relative;
    overflow: visible;
    animation: slide-vertical 1.5s ease-in forwards;

    @keyframes slide-vertical {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(500px);
        }
    }
`;

export default Wall;