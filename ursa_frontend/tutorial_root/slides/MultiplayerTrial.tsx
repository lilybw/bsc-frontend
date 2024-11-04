import { Component, createSignal, createMemo, For, onMount, onCleanup } from 'solid-js';
import { css } from '@emotion/css';
import StarryBackground from '@/components/base/StarryBackground';
import ActionInput from '@/components/colony/MainActionInput';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import BufferBasedButton from '@/components/base/BufferBasedButton';
import NTAwait from '@/components/util/NoThrowAwait';
import { TypeIconTuple, ActionContext, BufferSubscriber } from '@/ts/actionContext';
import { createArrayStore } from '@/ts/arrayStore';
import { IBackendBased, IInternationalized } from '@/ts/types';
import { createWrappedSignal } from '@/ts/wrappedSignal';
import { ColonyState, MultiplayerMode } from '@/meta/types';
import { KnownLocations } from '@/integrations/main_backend/constants';
import LocationCard from '@/components/colony/location/LocationCard';
import { IMultiplayerIntegration } from '@/integrations/multiplayer_backend/multiplayerBackend';
import { Position } from '@/components/colony/mini_games/asteroids_mini_game/entities/BaseEntity';

interface MultiplayerTrialProps extends IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

enum TrialStep {
    MOVE_TO_SPACEPORT,
    ENTER_SPACE_PORT,
    OPEN_COLONY,
    CLOSE_COLONY,
    COMPLETED
}

const MOCK_LOCATIONS = [
    {
        id: 1,
        name: 'LOCATION.HOME.NAME',
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
        name: 'LOCATION.SPACE_PORT.NAME',
        transform: {
            xOffset: 1500,  // Right of center
            yOffset: 540,   // Same height
            xScale: 1,
            yScale: 1,
            zIndex: 1
        }
    }
];

const MOCK_PATHS = [
    { from: 1, to: 2 }  // Single path from home to space port
];

const pathStore = createArrayStore(MOCK_PATHS);

const MultiplayerTrial: Component<MultiplayerTrialProps> = (props) => {
    const [currentStep, setCurrentStep] = createSignal<TrialStep>(TrialStep.MOVE_TO_SPACEPORT);
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [actionContext, setActionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [movePlayerToLocation, setMovePlayerToLocation] = createSignal(false);
    const [visitedLocations, setVisitedLocations] = createSignal<Set<number>>(new Set([1]));
    const [currentLocation, setCurrentLocation] = createSignal(1);
    const [viewportDimensions, setViewportDimensions] = createSignal({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const worldOffset = createWrappedSignal({ x: 0, y: 0 });
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    const mockEvents = {
        emit: () => Promise.resolve(0),
        subscribe: () => 0,
        unsubscribe: (..._ids: number[]) => true
    };

    const mockMultiplayer = {
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

    const [mockMultiplayerState, setMockMultiplayerState] = createSignal<IMultiplayerIntegration>({
        ...mockMultiplayer,
        getCode: () => null
    });

    const mockColony = {
        id: 1,
        name: "Tutorial Colony",
        accLevel: 1,
        latestVisit: new Date().toISOString(),
        assets: [{
            assetCollectionID: 1,
            transform: {
                xOffset: 0,
                yOffset: 0,
                zIndex: 1,
                xScale: 1,
                yScale: 1
            }
        }],
        locations: [{
            id: 1,
            level: 0,
            locationID: KnownLocations.SpacePort,
            transform: {
                xOffset: 0,
                yOffset: 0,
                zIndex: 1,
                xScale: 1,
                yScale: 1
            }
        }]
    };

    const mockColonyLocation = {
        id: 2,
        locationID: KnownLocations.SpacePort,
        level: 0,
        transform: MOCK_LOCATIONS[1].transform
    };

    const defaultLocationInfo = {
        id: KnownLocations.SpacePort,
        name: 'LOCATION.SPACE_PORT.NAME',
        description: 'LOCATION.SPACE_PORT.DESCRIPTION',
        appearances: [{
            level: 1,
            splashArt: 5007,
            assetCollectionID: 1
        }],
        minigameID: 0
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

    const calculateScalars = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        setViewportDimensions({ width: newWidth, height: newHeight });
        setDNS({
            x: newWidth / EXPECTED_WIDTH,
            y: newHeight / EXPECTED_HEIGHT,
        });
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

    const moveToLocation = (toLocationId: number) => {
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

    const handleLocationCardClose = () => {
        setShowLocationCard(false);
        // Always go back to ENTER_SPACE_PORT when closing card
        setCurrentStep(TrialStep.ENTER_SPACE_PORT);
        // If colony is closed when leaving, complete the trial only if it was previously opened
        if (mockMultiplayerState().getCode() === null && currentStep() === TrialStep.CLOSE_COLONY) {
            setCurrentStep(TrialStep.COMPLETED);
            props.onSlideCompleted();
        }
    };

    const handleSpacePortMove = () => {
        if (currentStep() !== TrialStep.MOVE_TO_SPACEPORT) return;
        setMovePlayerToLocation(true);
        moveToLocation(2);
        setCurrentLocation(2);
        setVisitedLocations(prev => {
            const newSet = new Set(prev);
            newSet.add(2);
            return newSet;
        });
        setCurrentStep(TrialStep.ENTER_SPACE_PORT);
        setInputBuffer('');
    };

    const handleSpacePortEnter = () => {
        if (currentStep() !== TrialStep.ENTER_SPACE_PORT) return;
        setShowLocationCard(true);

        // If colony is open, go to close phase, otherwise open phase
        if (mockMultiplayerState().getCode() !== null) {
            setCurrentStep(TrialStep.CLOSE_COLONY);
        } else {
            setCurrentStep(TrialStep.OPEN_COLONY);
        }
        setInputBuffer('');
    };

    const handleColonyOpen = () => {
        if (currentStep() !== TrialStep.OPEN_COLONY) return;
        setMockMultiplayerState({
            ...mockMultiplayer,
            getCode: () => 123456
        });
        setCurrentStep(TrialStep.CLOSE_COLONY);
        setInputBuffer('');
    };

    const handleColonyClose = () => {
        if (currentStep() !== TrialStep.CLOSE_COLONY) return;
        setMockMultiplayerState({
            ...mockMultiplayer,
            getCode: () => null
        });

        // Complete the slide on first colony close
        props.onSlideCompleted();

        // But allow for reopening if location card is still shown
        if (showLocationCard()) {
            setCurrentStep(TrialStep.OPEN_COLONY);
        } else {
            setCurrentStep(TrialStep.COMPLETED);
        }
        setInputBuffer('');
    };

    bufferSubscribers.add((inputBuffer: string) => {
        { props.text.SubTitle('TUTORIAL.TRIAL.YOUR_TURN')({ styleOverwrite: subtitleStyleOverwrite }) }

        const step = currentStep();
        const enterCommand = props.text.get('LOCATION.USER_ACTION.ENTER').get();

        switch (step) {
            case TrialStep.MOVE_TO_SPACEPORT:
                if (inputBuffer === props.text.get('LOCATION.SPACE_PORT.NAME').get()) {
                    handleSpacePortMove();
                    return { consumed: true };
                }
                break;
            case TrialStep.ENTER_SPACE_PORT:
                if (inputBuffer === enterCommand) {
                    handleSpacePortEnter();
                    return { consumed: true };
                }
                break;
            case TrialStep.OPEN_COLONY:
                if (inputBuffer === props.text.get('LOCATION.SPACE_PORT.OPEN_COLONY').get()) {
                    handleColonyOpen();
                    return { consumed: true };
                }
                break;
            case TrialStep.CLOSE_COLONY:
                if (inputBuffer === props.text.get('LOCATION.SPACE_PORT.CLOSE_COLONY').get()) {
                    handleColonyClose();
                    return { consumed: true };
                }
                break;
        }
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
        const isCurrentLocation = location.id === currentLocation();
        const canMoveTo = currentStep() === TrialStep.MOVE_TO_SPACEPORT && location.id === 2;
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

    return (
        <div class={containerStyle}>
            <StarryBackground />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({ styleOverwrite: trialTitleStyleOverwrite })}
            {props.text.SubTitle('TUTORIAL.MULTPLAYER.DESCRIPTION')({ styleOverwrite: subtitleStyleOverwrite })}
            <ActionInput
                subscribers={bufferSubscribers}
                text={props.text}
                backend={props.backend}
                actionContext={actionContext}
                setInputBuffer={setInputBuffer}
                inputBuffer={inputBuffer}
            />
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
                                onActivation={() => {
                                    if (currentStep() === TrialStep.MOVE_TO_SPACEPORT) {
                                        handleSpacePortMove();
                                    } else if (currentStep() === TrialStep.ENTER_SPACE_PORT) {
                                        handleSpacePortEnter();
                                    }
                                }}
                                name={
                                    location.id === 2 && currentLocation() === 2
                                        ? props.text.get('LOCATION.USER_ACTION.ENTER').get()
                                        : props.text.get(location.name).get()
                                }
                                buffer={inputBuffer}
                                register={bufferSubscribers.add}
                                enable={() => location.id !== 1}
                            />
                            <div class={getLocationStyle(location)}>
                                <NTAwait func={() => props.backend.assets.getMetadata(1009)}>
                                    {(asset) => (
                                        <GraphicalAsset
                                            metadata={asset}
                                            backend={props.backend}
                                            styleOverwrite={locationIconStyle}
                                        />
                                    )}
                                </NTAwait>
                            </div>
                        </div>
                    )}
                </For>
            </div>

            <div class={playerStyle} />

            {showLocationCard() && (
                <LocationCard
                    colony={mockColony}
                    colonyLocation={mockColonyLocation}
                    location={defaultLocationInfo}
                    events={mockEvents}
                    multiplayer={mockMultiplayerState()}
                    onClose={handleLocationCardClose}
                    buffer={inputBuffer}
                    register={bufferSubscribers.add}
                    text={props.text}
                    backend={props.backend}
                />
            )}
        </div>
    );
};

const containerStyle = css`
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
`;

const buttonStyle = (location: { scaledPosition: { x: number; y: number }, transform: { zIndex: number } }) => css`
    position: absolute;
    left: ${location.scaledPosition.x}px;
    top: ${location.scaledPosition.y - 50}px;
    transform: translate(-50%, -50%);
    z-index: ${location.transform.zIndex + 1};
`;

const locationContainerStyle = css`
    position: absolute;
    left: 0;
    top: 0;
`;

const playerStyle = css`
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

const locationIconStyle = css`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

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

export default MultiplayerTrial;