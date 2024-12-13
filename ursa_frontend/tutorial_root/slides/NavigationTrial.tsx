import { Component, createEffect, createMemo, createSignal, For, onCleanup, onMount } from "solid-js";
import { css } from "@emotion/css";
import BufferBasedButton from "@/components/base/BufferBasedButton";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import StarryBackground from "@/components/base/StarryBackground";
import ActionInput from "@/components/colony/MainActionInput";
import NTAwait from "@/components/util/NoThrowAwait";
import { PLAYER_MOVE_EVENT } from "@/integrations/multiplayer_backend/EventSpecifications";
import { ApplicationContext } from "@/meta/types";
import { ActionContext, BufferSubscriber } from "@/ts/actionContext";
import { createArrayStore } from "@/ts/arrayStore";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "@/ts/types";
import { createWrappedSignal } from "@/ts/wrappedSignal";
import { calculateLocationOffset, calculatePaths, calculateScaledPositions, calculateViewportScalars } from "@tutorial/utils/tutorialUtils";
import { getTargetCenterPosition, loadPathMap, RenderablePath } from "@tutorial/utils/navigationUtils";
import { tutorialStyles } from "@tutorial/styles/tutorialStyles";


interface NavigationTrialProps extends IBackendBased, IInternationalized, IStyleOverwritable {
    onSlideCompleted: () => void;
    context: ApplicationContext;
}

interface EntityRef {
    type: "location";
    element: HTMLElement;
}

const NavigationTrial: Component<NavigationTrialProps> = (props) => {
    // Initialize base state
    const [visitedLocations, setVisitedLocations] = createSignal<Set<number>>(new Set([1]));
    const [currentLocation, setCurrentLocation] = createSignal(1);
    const [viewportDimensions, setViewportDimensions] = createSignal(
        calculateViewportScalars(window.innerWidth, window.innerHeight)
    );
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const worldOffset = createWrappedSignal({ x: 0, y: 0 });
    const [buffer, setBuffer] = createSignal('');
    const [elementsReady, setElementsReady] = createSignal(false);

    // Initialize stores
    const MOCK_LOCATIONS = [
        // Center region
        {
            id: 1,
            name: props.context.text.get('LOCATION.HOME.NAME').get,
            transform: {
                xOffset: 960,  // Center
                yOffset: 540,  // Center
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        // Upper region, slightly off-center
        {
            id: 2,
            name: props.context.text.get('LOCATION.TOWN_HALL.NAME').get,
            transform: {
                xOffset: 1280,  // Moved right from previous
                yOffset: 200,   // Higher up
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        // Lower left region
        {
            id: 3,
            name: props.context.text.get('LOCATION.SHIELD_GENERATOR.NAME').get,
            transform: {
                xOffset: 400,   // Further left
                yOffset: 920,   // Lower down
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        // Right region
        {
            id: 4,
            name: props.context.text.get('LOCATION.AQUIFER_PLANT.NAME').get,
            transform: {
                xOffset: 1600,  // Further right
                yOffset: 680,   // Middle-low
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        // Upper left region
        {
            id: 5,
            name: props.context.text.get('LOCATION.AGRICULTURE_CENTER.NAME').get,
            transform: {
                xOffset: 320,   // Left side
                yOffset: 320,   // Upper area
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        // Lower right region
        {
            id: 6,
            name: props.context.text.get('LOCATION.VEHICLE_STORAGE.NAME').get,
            transform: {
                xOffset: 1200,  // Right of center
                yOffset: 880,   // Lower area
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        }
    ];

    const MOCK_PATHS = [
        // Paths from HOME (central hub)
        { from: 1, to: 2 },
        { from: 1, to: 5 },
        { from: 1, to: 6 },

        // Upper circuit
        { from: 2, to: 4 },
        { from: 2, to: 5 },

        // Lower circuit
        { from: 3, to: 6 },
        { from: 6, to: 4 },

        // Cross connections
        { from: 5, to: 3 },
        { from: 4, to: 1 },
    ];
    const pathStore = createArrayStore(MOCK_PATHS);
    const locationStore = createArrayStore(MOCK_LOCATIONS);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
    const elementRefs = new Map<string, EntityRef>();

    // Initialize path mapping
    const pathMap = loadPathMap(MOCK_PATHS);
    const log = props.backend.logger.copyFor('navigation trial');

    // Computed values
    const scaledPositions = createMemo(() =>
        calculateScaledPositions(MOCK_LOCATIONS, DNS())
    );

    const renderablePaths = createMemo(() =>
        calculatePaths(pathStore.get, (id) =>
            getTargetCenterPosition(id, MOCK_LOCATIONS, scaledPositions())
        ).filter((path): path is RenderablePath => path !== null)
    );

    const checkCompletion = () => {
        const allLocations = new Set(MOCK_LOCATIONS.map(loc => loc.id));
        const visited = visitedLocations();
        const allVisited = Array.from(allLocations).every(id => visited.has(id));

        if (allVisited) {
            props.onSlideCompleted();
        }
    };

    const moveToLocation = (fromLocationId: number, toLocationId: number) => {
        const toLocation = scaledPositions().find(l => l.id === toLocationId);
        if (!toLocation) return;

        const newOffset = calculateLocationOffset(
            toLocation,
            viewportDimensions()
        );

        worldOffset.set(newOffset);
    };

    const handleMove = (locationId: number) => {
        const paths = pathMap.get(currentLocation());
        if (paths?.includes(locationId)) {
            props.context.events.emit(PLAYER_MOVE_EVENT, {
                playerID: props.backend.player.local.id,
                colonyLocationID: locationId
            });
        }
    };

    const handlePlayerMove = (data: { playerID: number; colonyLocationID: number }) => {
        if (data.playerID !== props.backend.player.local.id) return;

        const currentLoc = currentLocation();
        const paths = pathMap.get(currentLoc);
        if (!paths?.includes(data.colonyLocationID)) return;

        setVisitedLocations(prev => {
            const newSet = new Set(prev);
            newSet.add(data.colonyLocationID);
            return newSet;
        });

        moveToLocation(currentLoc, data.colonyLocationID);
        setCurrentLocation(data.colonyLocationID);
        checkCompletion();
    };

    onMount(() => {
        const handleResize = () => {
            const dims = calculateViewportScalars(window.innerWidth, window.innerHeight);
            setViewportDimensions(dims);
            setDNS(dims.dns);
            moveToLocation(currentLocation(), currentLocation());
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const moveHandlerId = props.context.events.subscribe(
            PLAYER_MOVE_EVENT,
            handlePlayerMove
        );

        const homePos = scaledPositions().find(l => l.id === 1);
        if (homePos) {
            const offset = calculateLocationOffset(
                homePos,
                viewportDimensions()
            );
            worldOffset.set(offset);
        }

        onCleanup(() => {
            window.removeEventListener('resize', handleResize);
            props.context.events.unsubscribe(moveHandlerId);
        });
    });

    // Buffer subscriber
    bufferSubscribers.add((inputBuffer: string) => {
        const targetLocation = locationStore.findFirst(loc =>
            loc.name() === inputBuffer
        );

        if (targetLocation) {
            handleMove(targetLocation.id);
            return { consumed: true };
        }
        return { consumed: false };
    });

    return (
        <div class={tutorialStyles.layout.container}>
            <StarryBackground backend={props.backend} />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({
                styleOverwrite: tutorialStyles.typography.title
            })}
            {props.text.SubTitle('TUTORIAL.NAVIGATION_TRIAL.DESCRIPTION')({
                styleOverwrite: tutorialStyles.typography.subtitle
            })}

            <div class={css`
                ${tutorialStyles.layout.camera}
                ${tutorialStyles.generators.cameraTransform(worldOffset.get())}
            `}>
                <For each={renderablePaths()}>
                    {(path) => (
                        <>
                            <div class={tutorialStyles.generators.pathLine({
                                length: path.length,
                                angle: path.angle,
                                position: path.fromPos,
                                isGlow: false
                            })} />
                            <div class={tutorialStyles.generators.pathLine({
                                length: path.length,
                                angle: path.angle,
                                position: path.fromPos,
                                isGlow: true
                            })} />
                        </>
                    )}
                </For>

                <For each={scaledPositions()}>
                    {(location) => (
                        <div class={tutorialStyles.layout.locationContainer}>
                            <BufferBasedButton
                                styleOverwrite={tutorialStyles.generators.locationButton({
                                    position: location.scaledPosition,
                                    zIndex: location.transform.zIndex
                                })}
                                onActivation={() => handleMove(location.id)}
                                name={location.name}
                                buffer={buffer}
                                register={bufferSubscribers.add}
                                charBaseStyleOverwrite={tutorialStyles.typography.nameplate}
                            />
                            <div
                                class={tutorialStyles.generators.locationStyle({
                                    position: location.scaledPosition,
                                    zIndex: location.transform.zIndex,
                                    isCurrentLocation: location.id === currentLocation(),
                                    canMoveTo: pathMap.get(currentLocation())?.includes(location.id) || false,
                                    isVisited: visitedLocations().has(location.id)
                                })}
                                ref={(el) => {
                                    if (el) {
                                        elementRefs.set(location.id.toString(), {
                                            type: "location",
                                            element: el
                                        });
                                        if (elementRefs.size === MOCK_LOCATIONS.length) {
                                            setElementsReady(true);
                                        }
                                    }
                                }}
                            >
                                <NTAwait func={() => props.backend.assets.getMetadata(1009)}>
                                    {(asset) => (
                                        <GraphicalAsset
                                            metadata={asset}
                                            backend={props.backend}
                                            styleOverwrite={tutorialStyles.generators.locationAsset(
                                                visitedLocations().has(location.id)
                                            )}
                                        />
                                    )}
                                </NTAwait>
                            </div>
                        </div>
                    )}
                </For>
            </div>

            {/*player*/}
            <NTAwait func={() => props.backend.assets.getMetadata(4002)}>
                {(asset) => (
                    <div class={tutorialStyles.elements.localPlayer}>
                        <GraphicalAsset
                            metadata={asset}
                            backend={props.backend}
                        />
                    </div>
                )}
            </NTAwait>

            <ActionInput
                subscribers={bufferSubscribers}
                text={props.text}
                backend={props.backend}
                actionContext={createMemo(() => ActionContext.NAVIGATION)}
                setInputBuffer={setBuffer}
                inputBuffer={buffer}
            />
        </div>
    );
};

export default NavigationTrial;