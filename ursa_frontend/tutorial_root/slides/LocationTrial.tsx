import { Component, createEffect, createMemo, createResource, createSignal, For, onCleanup, onMount } from "solid-js";
import { css } from "@emotion/css";
import BufferBasedButton from "@/components/base/BufferBasedButton";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import StarryBackground from "@/components/base/StarryBackground";
import ActionInput from "@/components/colony/MainActionInput";
import LocationCard from "@/components/colony/location/LocationCard";
import NTAwait from "@/components/util/NoThrowAwait";
import { Position } from "@/components/colony/mini_games/asteroids_mini_game/entities/BaseEntity";
import { ActionContext, BufferSubscriber } from "@/ts/actionContext";
import { createArrayStore } from "@/ts/arrayStore";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "@/ts/types";
import { createWrappedSignal } from "@/ts/wrappedSignal";
import { MultiplayerMode, ColonyState } from "@/meta/types";
import { KnownLocations } from "@/integrations/main_backend/constants";
import { ColonyLocationInformation, LocationInfoResponseDTO } from "@/integrations/main_backend/mainBackendDTOs";
import { IMultiplayerIntegration } from "@/integrations/multiplayer_backend/multiplayerBackend";
import { IEventMultiplexer } from "@/integrations/multiplayer_backend/eventMultiplexer";

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

interface LocationTrialProps extends IBackendBased, IInternationalized, IStyleOverwritable {
    onSlideCompleted: () => void;
}

const LocationTrial: Component<LocationTrialProps> = (props) => {
    const MOCK_LOCATIONS = [
        {
            id: 1,
            name: props.text.get('LOCATION.HOME.NAME').get,
            transform: {
                xOffset: 960,  // Center
                yOffset: 540,  // Center
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        },
        {
            id: 2,
            name: props.text.get('LOCATION.OUTER_WALLS.NAME').get,
            transform: {
                xOffset: 1500,  // Right of center
                yOffset: 540,   // Center
                xScale: 1,
                yScale: 1,
                zIndex: 1
            }
        }
    ];

    const MOCK_PATHS = [
        { from: 1, to: 2 }
    ];

    const [phase, setPhase] = createSignal<'navigation' | 'entry'>('navigation');
    const [visitedLocations, setVisitedLocations] = createSignal<Set<number>>(new Set([1]));
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const pathStore = createArrayStore(MOCK_PATHS);
    const worldOffset = createWrappedSignal({ x: 0, y: 0 });
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const [currentLocationOfLocalPlayer, setCurrentLocationOfLocalPlayer] = createSignal(1);
    const [viewportDimensions, setViewportDimensions] = createSignal({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [buffer, setBuffer] = createSignal('');
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
    const defaultLocationInfo: LocationInfoResponseDTO = {
        id: KnownLocations.OuterWalls,
        name: 'LOCATION.OUTER_WALLS.NAME',
        description: 'LOCATION.OUTER_WALLS.DESCRIPTION',
        appearances: [{ level: 0, splashArt: 1010, assetCollectionID: 1 }],
        minigameID: 0
    };

    // Add resource-based location info fetch
    const [locationInfo] = createResource(async () => {
        const response = await props.backend.locations.getInfo(KnownLocations.OuterWalls);
        if (response.err) {
            throw new Error(response.err);
        }
        return response.res ?? defaultLocationInfo;
    });

    // Updated mock events to match navigation trial
    const mockEvents: IEventMultiplexer = {
        emit: () => Promise.resolve(0),
        subscribe: () => 0,
        unsubscribe: (..._ids: number[]) => true
    };

    const mockMultiplayer: IMultiplayerIntegration = {
        connect: () => Promise.resolve(undefined),
        disconnect: () => Promise.resolve(),
        getMode: () => MultiplayerMode.AS_OWNER,
        getState: () => ColonyState.CLOSED,
        getCode: () => null,
        getServerStatus: async () => ({
            res: null,
            code: 200,
            err: "Tutorial mode"
        }),
        getLobbyState: async () => ({
            res: null,
            code: 200,
            err: "Tutorial mode"
        })
    };

    const mockColony = {
        id: 1,
        name: "Tutorial Colony",
        accLevel: 1,
        latestVisit: new Date().toISOString(),
        assets: [],
        locations: []
    };

    const colonyLocation: ColonyLocationInformation = {
        id: 2,
        locationID: KnownLocations.OuterWalls,
        level: 0,
        transform: {
            xOffset: 0,
            yOffset: 0,
            zIndex: 1,
            xScale: 1,
            yScale: 1
        }
    };

    const getScaledPositions = createMemo(() => {
        const currentDNS = DNS();
        return MOCK_LOCATIONS.map(location => ({
            ...location,
            scaledPosition: {
                x: location.transform.xOffset * currentDNS.x,
                y: location.transform.yOffset * currentDNS.y
            }
        }));
    });

    const getTargetCenterPosition = (locationId: string): Position | null => {
        const scaledPositions = getScaledPositions();
        const scaledLocation = scaledPositions.find(loc => loc.id.toString() === locationId);

        if (!scaledLocation) return null;

        return {
            x: scaledLocation.scaledPosition.x / window.innerWidth,
            y: scaledLocation.scaledPosition.y / window.innerHeight
        };
    };

    const renderablePaths = createMemo(() => {
        return pathStore.get.map(path => {
            const fromPosition = getTargetCenterPosition(path.from.toString());
            const toPosition = getTargetCenterPosition(path.to.toString());

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
        }).filter(Boolean);
    });

    const calculateScalars = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        setViewportDimensions({ width: newWidth, height: newHeight });
        setDNS({
            x: newWidth / EXPECTED_WIDTH,
            y: newHeight / EXPECTED_HEIGHT,
        });
        moveToLocation(currentLocationOfLocalPlayer(), currentLocationOfLocalPlayer());
    };

    const moveToLocation = (fromLocationId: number, toLocationId: number) => {
        const scaledLocations = getScaledPositions();
        const toLocation = scaledLocations.find(l => l.id === toLocationId);
        if (!toLocation) return;

        const viewport = viewportDimensions();
        const newOffset = {
            x: viewport.width / 2 - toLocation.scaledPosition.x,
            y: viewport.height / 2 - toLocation.scaledPosition.y
        };

        worldOffset.set(newOffset);
    };

    const handleMove = () => {
        if (phase() === 'navigation' && currentLocationOfLocalPlayer() === 1) {
            moveToLocation(1, 2);
            setCurrentLocationOfLocalPlayer(2);
            setPhase('entry');
            setVisitedLocations(prev => {
                const newSet = new Set(prev);
                newSet.add(2);
                return newSet;
            });
            setBuffer(''); // Just clear the buffer, don't auto-fill ENTER
        } else if (phase() === 'entry' && currentLocationOfLocalPlayer() === 2) {
            setShowLocationCard(true);

            props.onSlideCompleted();
        }
    };

    const closeLocationCard = () => {
        setShowLocationCard(false);
    };

    bufferSubscribers.add((inputBuffer: string) => {
        // Get the command texts once to avoid multiple calls
        const enterCommand = props.text.get('LOCATION.USER_ACTION.ENTER').get();
        const outerWallsName = props.text.get('LOCATION.OUTER_WALLS.NAME').get();

        if (phase() === 'navigation') {
            // We're at home, only allow moving to Outer Walls by exact name
            if (currentLocationOfLocalPlayer() === 1 && inputBuffer === outerWallsName) {
                handleMove();
                return { consumed: true };
            }
        } else if (phase() === 'entry') {
            // We're at Outer Walls, only allow ENTER command
            if (currentLocationOfLocalPlayer() === 2 && inputBuffer === enterCommand) {
                handleMove();
                return { consumed: true };
            }
        }

        // Don't consume the input if it doesn't match exactly what we want
        return { consumed: false };
    });

    onMount(() => {
        calculateScalars();
        window.addEventListener('resize', calculateScalars);

        const homePos = getScaledPositions().find(l => l.id === 1)?.scaledPosition;
        if (homePos) {
            const viewport = viewportDimensions();
            worldOffset.set({
                x: viewport.width / 2 - homePos.x,
                y: viewport.height / 2 - homePos.y
            });
        }

        onCleanup(() => {
            window.removeEventListener('resize', calculateScalars);
        });
    });

    const computedCameraStyle = createMemo(() => {
        const offset = worldOffset.get();
        return css`
            position: absolute;
            top: 0;
            left: 0;
            overflow: visible;
            transition: all 0.5s ease-in-out;
            transform: translate(${offset.x}px, ${offset.y}px);
        `;
    });

    const getLocationStyle = (location: { id: number; scaledPosition: { x: number; y: number }; transform: { zIndex: number } }) => {
        const isCurrentLocation = location.id === currentLocationOfLocalPlayer();
        const canMoveTo = phase() === 'navigation' && location.id === 2;
        const isVisited = visitedLocations().has(location.id);

        return css`
            position: absolute;
            width: 64px;
            height: 64px;
            transform: translate(-50%, -50%);
            left: ${location.scaledPosition.x}px;
            top: ${location.scaledPosition.y}px;
            z-index: ${location.transform.zIndex};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 50%;
            background-color: black;
            ${isCurrentLocation ? 'border: 3px solid #3b82f6;' : ''}
            ${canMoveTo ? 'border: 2px solid rgba(59, 130, 246, 0.5);' : ''}
            ${isVisited ? 'box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);' : ''}
            transition: all 0.3s ease-in-out;
        `;
    };

    const lineStyle = (path: { length: number; angle: number; fromPos: Position }) => css`
        position: absolute;
        width: ${path.length}px;
        height: 12px;
        left: ${path.fromPos.x * window.innerWidth}px;
        top: ${path.fromPos.y * window.innerHeight}px;
        transform-origin: 0 50%;
        transform: rotate(${path.angle}deg);
        z-index: 1;
        pointer-events: none;
        background: linear-gradient(
            to top,
            transparent 0%,
            rgba(255, 255, 255, 0.8) 50%,
            transparent 100%
        );
        box-shadow: 
            0 0 10px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2);
        border-radius: 6px;
    `;

    const lineGlowStyle = (path: { length: number; angle: number; fromPos: Position }) => css`
        ${lineStyle(path)}
        opacity: 0.3;
        filter: blur(4px);
        height: 16px;
        background: linear-gradient(
            to top,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
        );
    `;

    const buttonStyle = (location: { scaledPosition: { x: number; y: number }, transform: { zIndex: number } }) => css`
        position: absolute;
        left: ${location.scaledPosition.x}px;
        top: ${location.scaledPosition.y - 50}px;
        transform: translate(-50%, -50%);
        z-index: ${location.transform.zIndex + 1};
    `;

    const locationIconStyle = (location: { id: number }) => css`
        width: 100%;
        height: 100%;
        object-fit: cover;
        ${visitedLocations().has(location.id) ? 'opacity: 1;' : 'opacity: 0.7;'}
    `;

    return (
        <div class={pathGraphContainerStyle}>
            <StarryBackground />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({ styleOverwrite: trialTitleStyleOverwrite })}
            {props.text.SubTitle('TUTORIAL.LOCATION_TRIAL.DESCRIPTION')({ styleOverwrite: subtitleStyleOverwrite })}

            <div class={computedCameraStyle()}>
                <For each={renderablePaths()}>
                    {(path) => {
                        if (!path) return null;
                        return (
                            <>
                                <div class={lineStyle(path)} />
                                <div class={lineGlowStyle(path)} />
                            </>
                        );
                    }}
                </For>

                <For each={getScaledPositions()}>
                    {(location) => (
                        <div class={locationContainerStyle}>
                            <BufferBasedButton
                                styleOverwrite={buttonStyle(location)}
                                onActivation={handleMove}
                                name={phase() === 'entry' && location.id === 2
                                    ? props.text.get('LOCATION.USER_ACTION.ENTER').get()
                                    : location.name}
                                buffer={buffer}
                                register={bufferSubscribers.add}
                                charBaseStyleOverwrite={namePlateTextOverwrite}
                                enable={() => {
                                    if (location.id === 1) {
                                        // Home button is always disabled
                                        return false;
                                    }
                                    if (phase() === 'navigation') {
                                        // Only enable Outer Walls during navigation
                                        return true;
                                    }
                                    if (phase() === 'entry' && location.id === 2) {
                                        // Only enable Outer Walls during entry
                                        return true;
                                    }
                                    return false;
                                }}
                            />
                            <div class={getLocationStyle(location)}>
                                <NTAwait func={() => props.backend.assets.getMetadata(1009)}>
                                    {(asset) => (
                                        <GraphicalAsset
                                            metadata={asset}
                                            backend={props.backend}
                                            styleOverwrite={locationIconStyle(location)}
                                        />
                                    )}
                                </NTAwait>
                            </div>
                        </div>
                    )}
                </For>
            </div>

            <div class={localPlayerStyle} />

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
                    colony={mockColony}
                    colonyLocation={colonyLocation}
                    location={locationInfo() ?? defaultLocationInfo}
                    events={mockEvents}
                    multiplayer={mockMultiplayer}
                    onClose={closeLocationCard}
                    buffer={buffer}
                    register={bufferSubscribers.add}
                    text={props.text}
                    backend={props.backend}
                />
            )}
        </div>
    );
};

const trialTitleStyleOverwrite = css`
    position: absolute;
    font-size: 4rem;
    letter-spacing: 0;
    z-index: 100;
    left: 50%;
    top: 10%;
    transform: translateX(-50%);
`;

const subtitleStyleOverwrite = css`
    position: absolute;
    bottom: 10vh;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    z-index: 100;
`;

const locationContainerStyle = css`
    position: absolute;
    left: 0;
    top: 0;
`;

const namePlateTextOverwrite = css`
    text-shadow: 5px 5px 10px black;
`;

const localPlayerStyle = css`
    position: absolute;
    z-index: 200;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    background-color: #ef4444;
    border-radius: 50%;
`;

const cameraContainer = css`
    position: absolute;
    top: 0;
    left: 0;
    overflow: visible;
    transition: all 0.5s ease-in-out;
`;

const pathGraphContainerStyle = css`
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    overflow: visible;
`;

export default LocationTrial;


