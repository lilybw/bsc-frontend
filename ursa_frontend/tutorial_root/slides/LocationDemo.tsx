import { Component, createMemo, createSignal, createResource, onMount } from 'solid-js';
import VideoFrame from './VideoFrame';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import ImageBufferButton from '@/components/base/ImageBufferButton';
import StarryBackground from '@/components/base/StarryBackground';
import ActionInput from '@/components/colony/MainActionInput';
import NTAwait from '@/components/util/NoThrowAwait';
import { TypeIconTuple, ActionContext, BufferSubscriber } from '@/ts/actionContext';
import { createArrayStore } from '@/ts/arrayStore';
import { IInternationalized, IBackendBased, IStyleOverwritable } from '@/ts/types';
import LocationCard from '@/components/colony/location/LocationCard';
import { KnownLocations } from '@/integrations/main_backend/constants';
import { createDemoEnvironment, createDemoPhaseManager } from '@tutorial/utils/demoUtils';
import { typeText } from '@tutorial/utils/tutorialUtils';
import { tutorialStyles } from '@tutorial/styles/tutorialStyles';

interface LocationDemoProps extends IStyleOverwritable, IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

const DEMO_TIMING = {
    typeDelay: 500,
    baseDelay: 1000,
    locationCardDelay: 1500,
    completionDelay: 3500,
    transitionDelay: 2000
} as const;

const LocationDemo: Component<LocationDemoProps> = (props) => {
    // State management
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [actionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [triggerEnter, setTriggerEnter] = createSignal(0);
    const [movePlayerToLocation, setMovePlayerToLocation] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [hasEntered, setHasEntered] = createSignal(false);
    const [locationButtonText, setLocationButtonText] = createSignal(
        props.text.get('LOCATION.HOME.NAME').get()
    );

    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
    const demoPhase = createDemoPhaseManager<'navigation' | 'entry'>('navigation');
    const demoEnv = createDemoEnvironment(KnownLocations.Home);

    const [locationInfo] = createResource(async () => {
        const response = await props.backend.locations.getInfo(KnownLocations.Home);
        return response.res ?? demoEnv.locationInfo;
    });

    const locationReached = () => {
        if (hasEntered()) return;

        setMovePlayerToLocation(true);
        setHasEntered(true);

        setTimeout(() => {
            demoPhase.setPhase('entry');
            setInputBuffer('');

            const enterCommand = props.text.get('LOCATION.USER_ACTION.ENTER').get();
            setLocationButtonText(enterCommand);

            typeText({
                text: enterCommand,
                delay: DEMO_TIMING.typeDelay,
                onType: setInputBuffer,
                onComplete: () => {
                    setTimeout(() => {
                        setTriggerEnter(prev => prev + 1);
                        setTimeout(() => setShowLocationCard(true), DEMO_TIMING.locationCardDelay);
                        setTimeout(() => props.onSlideCompleted(), DEMO_TIMING.completionDelay);
                    }, DEMO_TIMING.baseDelay);
                }
            });
        }, DEMO_TIMING.transitionDelay);
    };

    const closeLocationCard = () => {
        setShowLocationCard(false);
        props.onSlideCompleted();
    };

    onMount(() => {
        const nameOfLocation = props.text.get('LOCATION.HOME.NAME').get();
        typeText({
            text: nameOfLocation,
            delay: DEMO_TIMING.typeDelay,
            onType: setInputBuffer,
            onComplete: () => {
                setTimeout(() => setTriggerEnter(prev => prev + 1), DEMO_TIMING.baseDelay);
            }
        });
    });

    const computedPlayerStyle = createMemo(() =>
        tutorialStyles.generators.playerCharacter(movePlayerToLocation())
    );

    return (
        <div class={tutorialStyles.layout.container}>
            <StarryBackground backend={props.backend} />
            {props.text.SubTitle(
                demoPhase.phase() === 'navigation'
                    ? 'TUTORIAL.NAVIGATION_DEMO.DESCRIPTION'
                    : 'TUTORIAL.LOCATION_DEMO.DESCRIPTION'
            )({ styleOverwrite: tutorialStyles.typography.subtitle })}

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
                    name={locationButtonText()}
                    buffer={inputBuffer}
                    onActivation={locationReached}
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
                        location={locationInfo() ?? demoEnv.locationInfo}
                        onClose={closeLocationCard}
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

export default LocationDemo;