import { Component, createMemo, createSignal, onMount } from 'solid-js';
import VideoFrame from './VideoFrame';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import ImageBufferButton from '@/components/base/ImageBufferButton';
import StarryBackground from '@/components/base/StarryBackground';
import ActionInput from '@/components/colony/MainActionInput';
import NTAwait from '@/components/util/NoThrowAwait';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '@/ts/actionContext';
import { createArrayStore } from '@/ts/arrayStore';
import { IInternationalized, IBackendBased } from '@/ts/types';
import { KnownLocations } from '@/integrations/main_backend/constants';
import LocationCard from '@/components/colony/location/LocationCard';
import { createMockMultiplayer, typeText } from '@tutorial/utils/tutorialUtils';
import { createDemoPhaseManager, createDemoEnvironment } from '@tutorial/utils/demoUtils';
import { tutorialStyles } from '@tutorial/styles/tutorialStyles';

interface MultiplayerDemoProps extends IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

const DEMO_TIMING = {
    typeDelay: 500,
    phaseTransition: 2000,
    enterDelay: 1500,
    commandDelay: 1000
} as const;

type DemoStep = 'MOVE_TO_SPACEPORT' | 'ENTER_SPACE_PORT' | 'OPEN_COLONY' | 'CLOSE_COLONY' | 'COMPLETED';

const MultiplayerDemo: Component<MultiplayerDemoProps> = (props) => {
    // Basic state
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [actionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [triggerEnter, setTriggerEnter] = createSignal(0);
    const [movePlayerToLocation, setMovePlayerToLocation] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    // Demo environment setup
    const demoPhase = createDemoPhaseManager<DemoStep>('MOVE_TO_SPACEPORT');
    const [mockMultiplayerState, setMockMultiplayerState] = createSignal(createMockMultiplayer());

    const updateMultiplayerCode = (code: number | null) => {
        setMockMultiplayerState(prev => ({
            ...prev,
            getCode: () => code
        }));
    };

    const spacePortLocationInfo = {
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

    const demoEnv = createDemoEnvironment(KnownLocations.SpacePort, {
        locationInfo: spacePortLocationInfo
    });

    // Buffer handler
    bufferSubscribers.add((inputBuffer: string) => {
        const phase = demoPhase.phase();
        const commands = {
            spacePort: props.text.get('LOCATION.SPACE_PORT.NAME').get(),
            openColony: props.text.get('LOCATION.SPACE_PORT.OPEN_COLONY').get(),
            closeColony: props.text.get('LOCATION.SPACE_PORT.CLOSE_COLONY').get()
        };

        switch (phase) {
            case 'MOVE_TO_SPACEPORT':
                if (inputBuffer === commands.spacePort) {
                    handleSpacePortReached();
                    return { consumed: true };
                }
                break;
            case 'OPEN_COLONY':
                if (inputBuffer === commands.openColony) {
                    return { consumed: true };
                }
                break;
            case 'CLOSE_COLONY':
                if (inputBuffer === commands.closeColony) {
                    return { consumed: true };
                }
                break;
        }
        return { consumed: false };
    });

    // Phase management
    const moveToSpacePort = async () => {
        if (demoPhase.phase() !== 'MOVE_TO_SPACEPORT') return;
        setMovePlayerToLocation(true);

        setTimeout(() => {
            if (demoPhase.phase() === 'MOVE_TO_SPACEPORT') {
                setShowLocationCard(true);
                demoPhase.transition('ENTER_SPACE_PORT');
                startOpenColonyPhase();
            }
        }, DEMO_TIMING.phaseTransition);
    };

    const startOpenColonyPhase = async () => {
        if (demoPhase.phase() !== 'ENTER_SPACE_PORT') return;
        demoPhase.setPhase('OPEN_COLONY');

        const text = props.text.get('LOCATION.SPACE_PORT.OPEN_COLONY').get();
        setInputBuffer('');

        await typeText({
            text,
            delay: DEMO_TIMING.typeDelay,
            onType: setInputBuffer
        });
        setTriggerEnter(prev => prev + 1);

        setTimeout(() => {
            updateMultiplayerCode(123456);
            setTimeout(() => startCloseColonyPhase(), DEMO_TIMING.commandDelay);
        }, DEMO_TIMING.enterDelay);
    };

    const startCloseColonyPhase = async () => {
        if (demoPhase.phase() !== 'OPEN_COLONY') return;
        demoPhase.setPhase('CLOSE_COLONY');

        const text = props.text.get('LOCATION.SPACE_PORT.CLOSE_COLONY').get();
        setInputBuffer('');

        await typeText({
            text,
            delay: DEMO_TIMING.typeDelay,
            onType: setInputBuffer
        });
        setTriggerEnter(prev => prev + 1);

        setTimeout(() => {
            updateMultiplayerCode(null);
            setTimeout(() => {
                demoPhase.setPhase('COMPLETED');
                props.onSlideCompleted();
            }, DEMO_TIMING.commandDelay);
        }, DEMO_TIMING.enterDelay);
    };

    const handleSpacePortReached = () => moveToSpacePort();

    // Initialize demo
    onMount(async () => {
        const text = props.text.get('LOCATION.SPACE_PORT.NAME').get();
        await typeText({
            text,
            delay: DEMO_TIMING.typeDelay,
            onType: setInputBuffer
        });

        if (demoPhase.phase() === 'MOVE_TO_SPACEPORT') {
            setTriggerEnter(prev => prev + 1);
            moveToSpacePort();
        }
    });

    const computedPlayerStyle = createMemo(() =>
        tutorialStyles.generators.playerCharacter(movePlayerToLocation())
    );

    return (
        <div class={tutorialStyles.layout.container}>
            <StarryBackground />
            {props.text.SubTitle("TUTORIAL.MULTPLAYER.DESCRIPTION")({
                styleOverwrite: tutorialStyles.typography.subtitle
            })}
            <VideoFrame
                styleOverwrite={tutorialStyles.components.videoFrame}
                backend={props.backend}
            >
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
                <div class={tutorialStyles.elements.movementPath} />
                <ImageBufferButton
                    register={bufferSubscribers.add}
                    name={props.text.get('LOCATION.SPACE_PORT.NAME').get()}
                    buffer={inputBuffer}
                    onActivation={handleSpacePortReached}
                    asset={1009}
                    styleOverwrite={tutorialStyles.elements.locationPin}
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
                        {...demoEnv}
                        location={demoEnv.locationInfo}  // Explicitly provide location prop
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

export default MultiplayerDemo;