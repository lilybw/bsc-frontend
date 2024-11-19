import { Component, createSignal, createMemo, createResource, For, onMount, onCleanup } from "solid-js";
import StarryBackground from "@/components/base/StarryBackground";
import ActionInput from "@/components/colony/MainActionInput";
import LocationCard from "@/components/colony/location/LocationCard";
import BufferBasedButton from "@/components/base/BufferBasedButton";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import NTAwait from "@/components/util/NoThrowAwait";
import { TypeIconTuple, ActionContext, BufferSubscriber } from "@/ts/actionContext";
import { createArrayStore } from "@/ts/arrayStore";
import { IBackendBased, IInternationalized } from "@/ts/types";
import { createWrappedSignal } from "@/ts/wrappedSignal";
import { KnownLocations } from '@/integrations/main_backend/constants';
import { calculateRenderablePaths, getTargetCenterPosition, Location, Path } from "@tutorial/utils/navigationUtils";
import { createDefaultLocationInfo, createDemoEnvironment } from "@tutorial/utils/demoUtils";
import { calculateLocationOffset, calculateScaledPositions, calculateViewportScalars } from "@tutorial/utils/tutorialUtils";
import { tutorialStyles } from "@tutorial/styles/tutorialStyles";
import { IMultiplayerIntegration } from '@/integrations/multiplayer_backend/multiplayerBackend';

interface MultiplayerTrialProps extends IBackendBased, IInternationalized {
    onSlideCompleted: () => void;
}

enum TrialStep {
    MOVE_TO_SPACEPORT,
    ENTER_SPACE_PORT,
    OPEN_COLONY,
    CLOSE_COLONY
}

const MOCK_LOCATIONS: Location[] = [
    {
        id: 1,
        name: 'LOCATION.HOME.NAME',
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
        name: 'LOCATION.SPACE_PORT.NAME',
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

const MultiplayerTrial: Component<MultiplayerTrialProps> = (props) => {
    // State management
    const [currentStep, setCurrentStep] = createSignal<TrialStep>(TrialStep.MOVE_TO_SPACEPORT);
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [actionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [visitedLocations, setVisitedLocations] = createSignal<Set<number>>(new Set([1]));
    const [currentLocation, setCurrentLocation] = createSignal(1);
    const [viewportDimensions, setViewportDimensions] = createSignal(
        calculateViewportScalars(window.innerWidth, window.innerHeight)
    );
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const worldOffset = createWrappedSignal({ x: 0, y: 0 });
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [currentCode, setCurrentCode] = createSignal<number | null>();

    // Store initialization
    const pathStore = createArrayStore(MOCK_PATHS);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    // Demo environment setup
    const demoEnv = createDemoEnvironment(KnownLocations.SpacePort);

    // Multiplayer state
    const [mockMultiplayerState, setMockMultiplayerState] = createSignal<IMultiplayerIntegration>({
        ...demoEnv.multiplayer,
        getCode: () => null
    });

    const [locationInfo] = createResource(async () => {
        const response = await props.backend.locations.getInfo(KnownLocations.SpacePort);
        return response.res ?? createDefaultLocationInfo(KnownLocations.SpacePort);
    });

    // Computed values
    const scaledPositions = createMemo(() =>
        calculateScaledPositions(MOCK_LOCATIONS, DNS())
    );

    const generateRandomCode = () => Math.floor(Math.random() * 1000000);

    const renderablePaths = createMemo(() =>
        calculateRenderablePaths(
            pathStore.get,
            (id) => getTargetCenterPosition(id, MOCK_LOCATIONS, scaledPositions())
        )
    );

    // Location management
    const moveToLocation = (toLocationId: number) => {
        const toLocation = scaledPositions().find(l => l.id === toLocationId);
        if (!toLocation) return;

        const newOffset = calculateLocationOffset(toLocation, viewportDimensions());
        worldOffset.set(newOffset);
    };

    // Handlers
    const handleSpacePortMove = () => {
        if (currentStep() !== TrialStep.MOVE_TO_SPACEPORT) return;
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
        const code = currentCode() ?? generateRandomCode();
        setCurrentCode(code);
        setMockMultiplayerState({
            ...demoEnv.multiplayer,
            getCode: () => code
        });
        setCurrentStep(TrialStep.CLOSE_COLONY);
        setInputBuffer('');
    };

    const handleColonyClose = () => {
        if (currentStep() !== TrialStep.CLOSE_COLONY) return;
        setCurrentCode(null);
        setMockMultiplayerState({
            ...demoEnv.multiplayer,
            getCode: () => null
        });

        // Complete the slide on first colony close
        props.onSlideCompleted();

        // But allow for reopening if location card is still shown
        if (showLocationCard()) {
            setCurrentStep(TrialStep.OPEN_COLONY);
        }
        setInputBuffer('');
    };

    const handleLocationCardClose = () => {
        setShowLocationCard(false);
        // Always go back to ENTER_SPACE_PORT when closing card
        setCurrentStep(TrialStep.ENTER_SPACE_PORT);
    };

    // Buffer subscription
    bufferSubscribers.add((inputBuffer: string) => {
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

    // Lifecycle
    onMount(() => {
        const handleResize = () => {
            const dims = calculateViewportScalars(window.innerWidth, window.innerHeight);
            setViewportDimensions(dims);
            setDNS(dims.dns);
            moveToLocation(currentLocation());
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Initial position setup
        const homePos = scaledPositions().find(l => l.id === 1)?.scaledPosition;
        if (homePos) {
            const viewport = viewportDimensions();
            worldOffset.set({
                x: viewport.width / 2 - homePos.x,
                y: viewport.height / 2 - homePos.y
            });
        }

        onCleanup(() => window.removeEventListener('resize', handleResize));
    });

    return (
        <div class={tutorialStyles.layout.container}>
            <StarryBackground backend={props.backend} />
            {props.text.Title('TUTORIAL.TRIAL.TITLE')({
                styleOverwrite: tutorialStyles.typography.title
            })}
            {props.text.SubTitle('TUTORIAL.MULTPLAYER.DESCRIPTION')({
                styleOverwrite: tutorialStyles.typography.subtitle
            })}

            <div class={`${tutorialStyles.layout.camera} ${tutorialStyles.generators.cameraTransform(worldOffset.get())}`}>
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
                                        : props.text.get(location.name.toString()).get()
                                }
                                buffer={inputBuffer}
                                register={bufferSubscribers.add}
                                enable={() => location.id !== 1}
                                charBaseStyleOverwrite={tutorialStyles.typography.nameplate}
                            />
                            <div class={tutorialStyles.generators.locationStyle({
                                position: location.scaledPosition,
                                zIndex: location.transform.zIndex,
                                isCurrentLocation: location.id === currentLocation(),
                                canMoveTo: currentStep() === TrialStep.MOVE_TO_SPACEPORT && location.id === 2,
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
                actionContext={actionContext}
                setInputBuffer={setInputBuffer}
                inputBuffer={inputBuffer}
            />

            {showLocationCard() && (
                <LocationCard
                    colony={demoEnv.colony}
                    colonyLocation={demoEnv.colonyLocation}
                    location={locationInfo() ?? demoEnv.locationInfo}
                    events={demoEnv.events}
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

export default MultiplayerTrial;