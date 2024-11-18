import { Component, createMemo, createResource, createSignal, For, onCleanup, onMount } from "solid-js";
import { css } from "@emotion/css";
import BufferBasedButton from "@/components/base/BufferBasedButton";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import StarryBackground from "@/components/base/StarryBackground";
import ActionInput from "@/components/colony/MainActionInput";
import LocationCard from "@/components/colony/location/LocationCard";
import NTAwait from "@/components/util/NoThrowAwait";
import { ActionContext, BufferSubscriber } from "@/ts/actionContext";
import { createArrayStore } from "@/ts/arrayStore";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "@/ts/types";
import { createWrappedSignal } from "@/ts/wrappedSignal";
import { KnownLocations } from '@/integrations/main_backend/constants';
import { calculateRenderablePaths, getTargetCenterPosition, Path, Location } from "@tutorial/utils/navigationUtils";
import { createDefaultLocationInfo, createDemoEnvironment, createDemoPhaseManager } from "@tutorial/utils/demoUtils";
import { calculateLocationOffset, calculateScaledPositions, calculateViewportScalars } from "@tutorial/utils/tutorialUtils";
import { tutorialStyles } from "@tutorial/styles/tutorialStyles";

interface LocationTrialProps extends IBackendBased, IInternationalized, IStyleOverwritable {
    onSlideCompleted: () => void;
}

const LocationTrial: Component<LocationTrialProps> = (props) => {
    // Mock locations and paths setup
    const MOCK_LOCATIONS: Location[] = [
        {
            id: 1,
            name: props.text.get('LOCATION.HOME.NAME').get,
            transform: {
                xOffset: 960,
                yOffset: 540,
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        {
            id: 2,
            name: props.text.get('LOCATION.OUTER_WALLS.NAME').get,
            transform: {
                xOffset: 1500,
                yOffset: 540,
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        }
    ];

    const MOCK_PATHS: Path[] = [{ from: 1, to: 2 }];

    // State management
    const demoPhase = createDemoPhaseManager<'navigation' | 'entry'>('navigation');
    const [visitedLocations, setVisitedLocations] = createSignal<Set<number>>(new Set([1]));
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [currentLocation, setCurrentLocation] = createSignal(1);
    const [viewportDimensions, setViewportDimensions] = createSignal(
        calculateViewportScalars(window.innerWidth, window.innerHeight)
    );
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const worldOffset = createWrappedSignal({ x: 0, y: 0 });
    const [buffer, setBuffer] = createSignal('');

    // Store initialization
    const pathStore = createArrayStore(MOCK_PATHS);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    // Demo environment setup
    const demoEnv = createDemoEnvironment(KnownLocations.OuterWalls);
    const [locationInfo] = createResource(async () => {
        const response = await props.backend.locations.getInfo(KnownLocations.OuterWalls);
        if (response.err) {
            throw new Error(response.err);
        }
        return response.res ?? createDefaultLocationInfo(KnownLocations.OuterWalls);
    });

    // Computed values
    const scaledPositions = createMemo(() =>
        calculateScaledPositions(MOCK_LOCATIONS, DNS())
    );

    const renderablePaths = createMemo(() =>
        calculateRenderablePaths(
            pathStore.get,
            (id) => getTargetCenterPosition(id, MOCK_LOCATIONS, scaledPositions())
        )
    );

    // Location management
    const moveToLocation = (fromLocationId: number, toLocationId: number) => {
        const toLocation = scaledPositions().find(l => l.id === toLocationId);
        if (!toLocation) return;

        const newOffset = calculateLocationOffset(toLocation, viewportDimensions());
        worldOffset.set(newOffset);
    };

    const handleMove = () => {
        if (demoPhase.phase() === 'navigation' && currentLocation() === 1) {
            moveToLocation(1, 2);
            setCurrentLocation(2);
            demoPhase.setPhase('entry');
            setVisitedLocations(prev => {
                const newSet = new Set(prev);
                newSet.add(2);
                return newSet;
            });
            setBuffer('');
        } else if (demoPhase.phase() === 'entry' && currentLocation() === 2) {
            setShowLocationCard(true);
            props.onSlideCompleted();
        }
    };

    // Setup buffer subscriber
    bufferSubscribers.add((inputBuffer: string) => {
        const enterCommand = props.text.get('LOCATION.USER_ACTION.ENTER').get();
        const outerWallsName = props.text.get('LOCATION.OUTER_WALLS.NAME').get();

        if (demoPhase.phase() === 'navigation' &&
            currentLocation() === 1 &&
            inputBuffer === outerWallsName) {
            handleMove();
            return { consumed: true };
        } else if (demoPhase.phase() === 'entry' &&
            currentLocation() === 2 &&
            inputBuffer === enterCommand) {
            handleMove();
            return { consumed: true };
        }

        return { consumed: false };
    });

    // Lifecycle
    onMount(() => {
        const handleResize = () => {
            const dims = calculateViewportScalars(window.innerWidth, window.innerHeight);
            setViewportDimensions(dims);
            setDNS(dims.dns);
            moveToLocation(currentLocation(), currentLocation());
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        onCleanup(() => window.removeEventListener('resize', handleResize));
    });

    return (
        <div class={tutorialStyles.layout.container}>
            <StarryBackground backend={props.backend} />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({
                styleOverwrite: tutorialStyles.typography.title
            })}
            {props.text.SubTitle('TUTORIAL.LOCATION_TRIAL.DESCRIPTION')({
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
                                position: path.fromPos
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
                                onActivation={handleMove}
                                name={demoPhase.phase() === 'entry' && location.id === 2
                                    ? props.text.get('LOCATION.USER_ACTION.ENTER').get()
                                    : location.name}
                                buffer={buffer}
                                register={bufferSubscribers.add}
                                charBaseStyleOverwrite={tutorialStyles.typography.nameplate}
                                enable={() => {
                                    if (location.id === 1) return false;
                                    if (demoPhase.phase() === 'navigation') return true;
                                    return demoPhase.phase() === 'entry' && location.id === 2;
                                }}
                            />
                            <div class={tutorialStyles.generators.locationStyle({
                                position: location.scaledPosition,
                                zIndex: location.transform.zIndex,
                                isCurrentLocation: location.id === currentLocation(),
                                canMoveTo: demoPhase.phase() === 'navigation' && location.id === 2,
                                isVisited: visitedLocations().has(location.id)
                            })}>
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

            <div class={tutorialStyles.elements.localPlayer} />

            <ActionInput
                subscribers={bufferSubscribers}
                text={props.text}
                backend={props.backend}
                actionContext={createMemo(() => ActionContext.NAVIGATION)}
                setInputBuffer={setBuffer}
                inputBuffer={buffer}
            />

            {showLocationCard() && (
                <LocationCard
                    colony={demoEnv.colony}
                    colonyLocation={demoEnv.colonyLocation}
                    location={locationInfo() ?? demoEnv.locationInfo}
                    events={demoEnv.events}
                    multiplayer={demoEnv.multiplayer}
                    onClose={() => setShowLocationCard(false)}
                    buffer={buffer}
                    register={bufferSubscribers.add}
                    text={props.text}
                    backend={props.backend}
                />
            )}
        </div>
    );
};

export default LocationTrial;