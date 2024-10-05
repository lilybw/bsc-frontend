import { JSX, createSignal, createMemo, Show, onMount } from "solid-js";
import { css } from "@emotion/css";
import StarryBackground from "../../src/components/StarryBackground";
import ActionInput from "../../src/components/colony/MainActionInput";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../src/ts/actionContext";
import { createArrayStore } from "../../src/ts/wrappedStore";
import VideoFrame from "./VideoFrame";
import ImageBufferButton from "../../src/components/ImageBufferButton";
import NTAwait from "../../src/components/util/NoThrowAwait";
import GraphicalAsset from "../../src/components/GraphicalAsset";
import SpacePortInterface from "./tutorial utility components/Spaceport";
import { IBackendBased, IInternationalized } from "../../src/ts/types";

interface MultiplayerDemoProps extends IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

const timeBetweenKeyStrokesMS = 500;
const baseDelayBeforeDemoStart = 1000;

enum DemoStep {
    ENTER_SPACE_PORT,
    OPEN_COLONY,
    COMPLETED
}

export default function MultiplayerDemo(props: MultiplayerDemoProps): JSX.Element {
    const [inputBuffer, setInputBuffer] = createSignal<string>('');
    const [actionContext, setActionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [triggerEnter, setTriggerEnter] = createSignal<() => void>(() => {});
    const [movePlayerToLocation, setMovePlayerToLocation] = createSignal<boolean>(false);
    const [currentStep, setCurrentStep] = createSignal<DemoStep>(DemoStep.ENTER_SPACE_PORT);
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

    const nameOfLocation = props.text.get('LOCATION.SPACE_PORT.NAME');
    const openButtonText = props.text.get('COLONY.UI_BUTTON.OPEN');
    
    onMount(() => {
        setTimeout(props.onSlideCompleted, 100);
    })

    const runSpacePortDemo = () => {
        setInputBuffer('');
        for (let i = 0; i < nameOfLocation.get().length; i++) {
            setTimeout(() => {
                setInputBuffer(inputBuffer() + nameOfLocation.get()[i]);
            }, baseDelayBeforeDemoStart + i * timeBetweenKeyStrokesMS);
        }
        setTimeout(() => {
            triggerEnter()();
        }, baseDelayBeforeDemoStart * 2 + nameOfLocation.get().length * timeBetweenKeyStrokesMS);
    };

    const runOpenColonyDemo = () => {
        setInputBuffer('');
        for (let i = 0; i < openButtonText.get().length; i++) {
            setTimeout(() => {
                setInputBuffer(inputBuffer() + openButtonText.get()[i]);
            }, baseDelayBeforeDemoStart + i * timeBetweenKeyStrokesMS);
        }
        setTimeout(() => {
            triggerEnter()();
        }, baseDelayBeforeDemoStart * 2 + openButtonText.get().length * timeBetweenKeyStrokesMS);
    };

    const computedPlayerStyle = createMemo(
        () => css`${playerCharStyleOverwrite} ${movePlayerToLocation() ? playerAtLocation : ''}`
    );

    const buttonPressed = () => {
        setMovePlayerToLocation(true);
        setTimeout(() => {
            setCurrentStep(DemoStep.OPEN_COLONY);
            runOpenColonyDemo();
        }, 2000);
    };

    const handleOpenColony = () => {
        console.log("Opening colony...");
        setCurrentStep(DemoStep.COMPLETED);
    };

    const handleJoinColony = () => {
        console.log("Joining colony...");
    };

    const handleLeaveSpacePort = () => {
        console.log("Leaving space port...");
        setCurrentStep(DemoStep.COMPLETED);
    };

    const handleSpacePortCompleted = () => {
        setCurrentStep(DemoStep.COMPLETED);
        props.onSlideCompleted();
    };

    // Start the demo when the component mounts
    runSpacePortDemo();

    return (
        <div class="multiplayer-demo">
            <StarryBackground />
            
            <Show when={currentStep() === DemoStep.ENTER_SPACE_PORT}>
                <VideoFrame styleOverwrite={videoDemoFrameStyle} backend={props.backend}> 
                    {props.text.SubTitle('TUTORIAL.MULTPLAYER.DESCRIPTION')({})}
                    <ActionInput subscribers={bufferSubscribers.get} 
                        text={props.text}
                        backend={props.backend}
                        actionContext={actionContext} 
                        setInputBuffer={setInputBuffer}
                        inputBuffer={inputBuffer}
                        triggerEnter={setTriggerEnter}
                        demoMode={true}
                    />
                    <div class={movementPathStyle}></div>
                    <ImageBufferButton 
                        styleOverwrite={locationPinStyleOverwrite}
                        register={bufferSubscribers.add} 
                        name={nameOfLocation.get()} 
                        buffer={inputBuffer}
                        onActivation={buttonPressed} 
                        asset={1009} 
                        backend={props.backend}
                    />
                    <NTAwait func={() => props.backend.getAssetMetadata(4001)}>
                        {(asset) => (
                            <GraphicalAsset 
                                styleOverwrite={computedPlayerStyle()}
                                metadata={asset} 
                                backend={props.backend}
                            />
                        )}
                    </NTAwait>
                </VideoFrame>
            </Show>

            <Show when={currentStep() === DemoStep.OPEN_COLONY}>
                <VideoFrame styleOverwrite={videoDemoFrameStyle} backend={props.backend}>
                    <SpacePortInterface
                        text={props.text}
                        onOpen={handleOpenColony}
                        onJoin={handleJoinColony}
                        onLeave={handleLeaveSpacePort}
                        onSlideCompleted={handleSpacePortCompleted}
                        backend={props.backend}
                    />
                </VideoFrame>
            </Show>

            <Show when={currentStep() === DemoStep.COMPLETED}>
                <VideoFrame styleOverwrite={videoDemoFrameStyle} backend={props.backend}>
                    <div>Tutorial completed!</div>
                </VideoFrame>
            </Show>
        </div>
    );
}

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

const openButtonStyleOverwrite = css`
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
`;

const videoDemoFrameStyle = css`
margin-top: 2rem;
`;