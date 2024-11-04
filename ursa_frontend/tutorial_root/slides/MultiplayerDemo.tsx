import { JSX, createSignal, createMemo, Show, onMount, Component } from 'solid-js';
import { css } from '@emotion/css';
import VideoFrame from './VideoFrame';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import ImageBufferButton from '@/components/base/ImageBufferButton';
import StarryBackground from '@/components/base/StarryBackground';
import ActionInput from '@/components/colony/MainActionInput';
import NTAwait from '@/components/util/NoThrowAwait';
import { TypeIconTuple, ActionContext, BufferSubscriber } from '@/ts/actionContext';
import { createArrayStore } from '@/ts/arrayStore';
import { IInternationalized, IBackendBased } from '@/ts/types';
import { ColonyState, MultiplayerMode } from '@/meta/types';
import { KnownLocations } from '@/integrations/main_backend/constants';
import LocationCard from '@/components/colony/location/LocationCard';
import { IMultiplayerIntegration } from '@/integrations/multiplayer_backend/multiplayerBackend';
import { IEventMultiplexer } from '@/integrations/multiplayer_backend/eventMultiplexer';
import { ColonyInfoResponseDTO } from '@/integrations/main_backend/mainBackendDTOs';

interface MultiplayerDemoProps extends IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

const timeBetweenKeyStrokesMS = 500;

enum DemoStep {
    MOVE_TO_SPACEPORT,
    ENTER_SPACE_PORT,
    OPEN_COLONY,
    CLOSE_COLONY,
    COMPLETED
}

const MultiplayerDemo: Component<MultiplayerDemoProps> = (props) => {
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [actionContext, setActionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [triggerEnter, setTriggerEnter] = createSignal(0);
    const [movePlayerToLocation, setMovePlayerToLocation] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [currentStep, setCurrentStep] = createSignal<DemoStep>(DemoStep.MOVE_TO_SPACEPORT);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    // Mock data for SpacePort location card
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

    const [mockMultiplayerState, setMockMultiplayerState] = createSignal<IMultiplayerIntegration>({
        ...mockMultiplayer,
        getCode: () => null
    });

    const mockColony: ColonyInfoResponseDTO = {
        id: 1,
        accLevel: 1,
        name: "Tutorial Colony",
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
        id: 1,
        locationID: KnownLocations.SpacePort,
        level: 0,
        transform: {
            xOffset: 0,
            yOffset: 0,
            zIndex: 1,
            xScale: 1,
            yScale: 1
        }
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

    bufferSubscribers.add((inputBuffer: string) => {
        const phase = currentStep();

        switch (phase) {
            case DemoStep.MOVE_TO_SPACEPORT:
                if (inputBuffer === props.text.get('LOCATION.SPACE_PORT.NAME').get()) {
                    handleSpacePortReached();
                    return { consumed: true };
                }
                break;
            case DemoStep.OPEN_COLONY:
                if (inputBuffer === props.text.get('LOCATION.SPACE_PORT.OPEN_COLONY').get()) {
                    return { consumed: true };
                }
                break;
            case DemoStep.CLOSE_COLONY:
                if (inputBuffer === props.text.get('LOCATION.SPACE_PORT.CLOSE_COLONY').get()) {
                    return { consumed: true };
                }
                break;
        }
        return { consumed: false };
    });

    const typeText = (text: string, targetPhase: DemoStep) => {
        if (currentStep() !== targetPhase) return 0;

        // Clear immediately
        setInputBuffer('');

        // Use a promise to ensure sequential typing
        return new Promise<number>((resolve) => {
            let currentIndex = 0;
            const intervalId = setInterval(() => {
                if (currentStep() !== targetPhase) {
                    clearInterval(intervalId);
                    resolve(0);
                    return;
                }

                if (currentIndex < text.length) {
                    setInputBuffer(text.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(intervalId);
                    resolve(1000);
                }
            }, timeBetweenKeyStrokesMS);
        });
    };

    const moveToSpacePort = async () => {
        if (currentStep() !== DemoStep.MOVE_TO_SPACEPORT) return;
        setMovePlayerToLocation(true);

        setTimeout(() => {
            if (currentStep() === DemoStep.MOVE_TO_SPACEPORT) {
                setShowLocationCard(true);
                setCurrentStep(DemoStep.ENTER_SPACE_PORT);
                startOpenColonyPhase();
            }
        }, 2000);
    };

    const startOpenColonyPhase = async () => {
        if (currentStep() !== DemoStep.ENTER_SPACE_PORT) return;
        setCurrentStep(DemoStep.OPEN_COLONY);

        const openColonyText = props.text.get('LOCATION.SPACE_PORT.OPEN_COLONY').get();
        const typingTime = await typeText(openColonyText, DemoStep.OPEN_COLONY);

        setTimeout(() => {
            if (currentStep() === DemoStep.OPEN_COLONY) {
                setTriggerEnter(prev => prev + 1);
                setTimeout(() => {
                    setMockMultiplayerState({
                        ...mockMultiplayer,
                        getCode: () => 123456
                    });
                    setTimeout(() => startCloseColonyPhase(), 1000);
                }, 1500);
            }
        }, typingTime);
    };

    const startCloseColonyPhase = async () => {
        if (currentStep() !== DemoStep.OPEN_COLONY) return;
        setCurrentStep(DemoStep.CLOSE_COLONY);

        const closeColonyText = props.text.get('LOCATION.SPACE_PORT.CLOSE_COLONY').get();
        const typingTime = await typeText(closeColonyText, DemoStep.CLOSE_COLONY);

        setTimeout(() => {
            if (currentStep() === DemoStep.CLOSE_COLONY) {
                setTriggerEnter(prev => prev + 1);
                setTimeout(() => {
                    setMockMultiplayerState({
                        ...mockMultiplayer,
                        getCode: () => null
                    });
                    setTimeout(() => completeDemonstration(), 1000);
                }, 1500);
            }
        }, typingTime);
    };

    const completeDemonstration = () => {
        setCurrentStep(DemoStep.COMPLETED);
        props.onSlideCompleted();
    };

    // Simpler main handler that starts the sequence
    const handleSpacePortReached = () => {
        moveToSpacePort();
    };

    // Start demo sequence
    onMount(async () => {
        const spacePortName = props.text.get('LOCATION.SPACE_PORT.NAME').get();
        const typingTime = await typeText(spacePortName, DemoStep.MOVE_TO_SPACEPORT);

        setTimeout(() => {
            if (currentStep() === DemoStep.MOVE_TO_SPACEPORT) {
                setTriggerEnter(prev => prev + 1);
                moveToSpacePort();
            }
        }, typingTime);
    });

    const computedPlayerStyle = createMemo(() => css`
        ${playerCharStyleOverwrite} 
        ${movePlayerToLocation() ? playerAtLocation : ''}
    `);

    return (
        <div class="multiplayer-demo">
            <StarryBackground />
            <VideoFrame backend={props.backend}>
                <ActionInput
                    subscribers={bufferSubscribers}
                    text={props.text}
                    backend={props.backend}
                    actionContext={actionContext}
                    setInputBuffer={setInputBuffer}
                    inputBuffer={inputBuffer}
                    manTriggerEnter={triggerEnter}
                    demoMode={true}
                />
                <div class={movementPathStyle}></div>
                <ImageBufferButton
                    register={bufferSubscribers.add}
                    name={props.text.get('LOCATION.SPACE_PORT.NAME').get()}
                    buffer={inputBuffer}
                    onActivation={handleSpacePortReached}
                    asset={1009}
                    styleOverwrite={locationPinStyleOverwrite}
                    backend={props.backend}
                />
                <NTAwait func={() => props.backend.assets.getMetadata(4001)}>
                    {(asset) => (
                        <GraphicalAsset
                            styleOverwrite={computedPlayerStyle()}
                            metadata={asset}
                            backend={props.backend}
                        />
                    )}
                </NTAwait>
                {showLocationCard() && (
                    <LocationCard
                        colony={mockColony}
                        colonyLocation={mockColonyLocation}
                        location={defaultLocationInfo}
                        events={mockEvents}
                        multiplayer={mockMultiplayerState()}
                        onClose={() => setShowLocationCard(false)}
                        buffer={inputBuffer}
                        register={bufferSubscribers.add}
                        text={props.text}
                        backend={props.backend}
                    />
                )}
            </VideoFrame>
        </div>
    );
};

const movementPathStyle = css`
    border-bottom: 1px dashed white;
    height: 66%;
    width: 50%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
`;

const shared = css`
    position: absolute;
    --edge-offset: 5vw;
    bottom: 20vh;
`;

const playerCharStyleOverwrite = css`
    ${shared}
    left: var(--edge-offset);
    --dude-size: 8vw;
    width: var(--dude-size);
    height: var(--dude-size);
    transition: left 2s;
`;

const playerAtLocation = css`
    left: 70%;
`;

const locationPinStyleOverwrite = css`
    ${shared}
    right: var(--edge-offset);
`;

export default MultiplayerDemo;