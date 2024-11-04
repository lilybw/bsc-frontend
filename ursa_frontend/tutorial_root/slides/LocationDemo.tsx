import { Component } from 'solid-js';
import { css } from '@emotion/css';
import { createMemo, createSignal, createResource } from 'solid-js';
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
import { ColonyInfoResponseDTO, ColonyLocationInformation, LocationInfoResponseDTO } from '@/integrations/main_backend/mainBackendDTOs';
import { IMultiplayerIntegration } from '@/integrations/multiplayer_backend/multiplayerBackend';
import { MultiplayerMode, ColonyState, ResCodeErr } from '@/meta/types';
import { HealthCheckDTO, LobbyStateResponseDTO } from '@/integrations/multiplayer_backend/multiplayerDTO';

interface LocationDemoProps extends IStyleOverwritable, IInternationalized, IBackendBased {
    onSlideCompleted: () => void;
}

const timeBetweenKeyStrokesMS = 500;
const baseDelayBeforeDemoStart = 1000;

const LocationDemo: Component<LocationDemoProps> = (props) => {
    const [inputBuffer, setInputBuffer] = createSignal('');
    const [actionContext, setActionContext] = createSignal<TypeIconTuple>(ActionContext.NAVIGATION);
    const [triggerEnter, setTriggerEnter] = createSignal(0);
    const [movePlayerToLocation, setMovePlayerToLocation] = createSignal(false);
    const [showLocationCard, setShowLocationCard] = createSignal(false);
    const [demoPhase, setDemoPhase] = createSignal<'navigation' | 'entry'>('navigation');
    const [multiplayerMode] = createSignal<MultiplayerMode>(MultiplayerMode.AS_OWNER);
    const [colonyState] = createSignal<ColonyState>(ColonyState.CLOSED);
    const [locationButtonText, setLocationButtonText] = createSignal(props.text.get('LOCATION.HOME.NAME').get());
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
    const [hasEntered, setHasEntered] = createSignal(false);

    const mockEvents = {
        emit: () => Promise.resolve(0),
        subscribe: () => 0,
        unsubscribe: (..._ids: number[]) => true
    };

    const mockMultiplayer: IMultiplayerIntegration = {
        connect: () => Promise.resolve("mock-connection"),
        disconnect: () => Promise.resolve(),
        getMode: multiplayerMode,
        getState: colonyState,
        getCode: () => null,
        getServerStatus: async (): Promise<ResCodeErr<HealthCheckDTO>> => ({
            res: null,
            code: 200,
            err: "Tutorial mode - no server status available"
        }),
        getLobbyState: async (): Promise<ResCodeErr<LobbyStateResponseDTO>> => ({
            res: null,
            code: 200,
            err: "Tutorial mode - no lobby state available"
        })
    };

    const colony: ColonyInfoResponseDTO = {
        id: 1,
        name: "Tutorial Colony",
        accLevel: 1,
        latestVisit: new Date().toISOString(),
        assets: [],
        locations: []
    };

    const colonyLocation: ColonyLocationInformation = {
        id: 1,
        locationID: KnownLocations.Home,
        level: 0,
        transform: {
            xOffset: 0,
            yOffset: 0,
            zIndex: 1,
            xScale: 1,
            yScale: 1
        }
    };

    const defaultLocationInfo: LocationInfoResponseDTO = {
        id: KnownLocations.Home,
        name: 'LOCATION.HOME.NAME',
        description: 'LOCATION.HOME.DESCRIPTION',
        appearances: [{ level: 0, splashArt: 1010, assetCollectionID: 1 }],
        minigameID: 0
    };

    const [locationInfo] = createResource(async () => {
        const response = await props.backend.locations.getInfo(KnownLocations.Home);
        if (response.err) {
            throw new Error(response.err);
        }
        return response.res ?? defaultLocationInfo;
    });

    // Phase 1: Navigate to home
    const nameOfLocation = props.text.get('LOCATION.HOME.NAME');
    for (let i = 0; i < nameOfLocation.get().length; i++) {
        setTimeout(
            () => {
                setInputBuffer(inputBuffer() + nameOfLocation.get()[i]);
            },
            baseDelayBeforeDemoStart + i * timeBetweenKeyStrokesMS,
        );
    }

    setTimeout(
        () => {
            setTriggerEnter(prev => prev + 1);
        },
        baseDelayBeforeDemoStart * 2 + nameOfLocation.get().length * timeBetweenKeyStrokesMS,
    );

    // Phase 2: Enter location
    const locationReached = () => {
        if (hasEntered()) return; // Prevent multiple entries

        setMovePlayerToLocation(true);
        setHasEntered(true); // Mark as entered

        setTimeout(() => {
            setDemoPhase('entry');
            setInputBuffer('');
            const enterCommand = props.text.get('LOCATION.USER_ACTION.ENTER').get();
            setLocationButtonText(enterCommand);

            // Type out ENTER command
            for (let i = 0; i < enterCommand.length; i++) {
                setTimeout(
                    () => {
                        setInputBuffer(inputBuffer() + enterCommand[i]);
                    },
                    i * timeBetweenKeyStrokesMS,
                );
            }

            // Trigger enter command
            setTimeout(
                () => {
                    setTriggerEnter(prev => prev + 1);
                    setTimeout(
                        () => {
                            setShowLocationCard(true);
                        }, 1500)
                },
                enterCommand.length * timeBetweenKeyStrokesMS + baseDelayBeforeDemoStart,
            );

            setTimeout(
                () => {
                    props.onSlideCompleted();
                }, enterCommand.length * timeBetweenKeyStrokesMS + baseDelayBeforeDemoStart + 2000);
        }, 2000);
    };

    const closeLocationCard = () => {
        setShowLocationCard(false);
        props.onSlideCompleted();
    };

    const computedPlayerStyle = createMemo(
        () => css`
            ${playerCharacterStyle} ${movePlayerToLocation() ? playerAtLocation : ''}
        `,
    );

    return (
        <div class="location-demo">
            <StarryBackground />
            {props.text.SubTitle(
                demoPhase() === 'navigation'
                    ? 'TUTORIAL.NAVIGATION_DEMO.DESCRIPTION'
                    : 'TUTORIAL.LOCATION_DEMO.DESCRIPTION'
            )({})}
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
                    name={locationButtonText()}
                    buffer={inputBuffer}
                    onActivation={locationReached}
                    asset={1009}
                    styleOverwrite={locationPinStyle}
                    backend={props.backend}
                />
                <NTAwait func={() => props.backend.assets.getMetadata(4001)}>
                    {(asset) => <GraphicalAsset styleOverwrite={computedPlayerStyle()} metadata={asset} backend={props.backend} />}
                </NTAwait>
                {showLocationCard() && (
                    <LocationCard
                        colony={colony}
                        colonyLocation={colonyLocation}
                        location={locationInfo() ?? defaultLocationInfo}
                        events={mockEvents}
                        multiplayer={mockMultiplayer}
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

const movementPathStyle = css`
    border-bottom: 1px dashed white;
    height: 66%;
    width: 50%;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
`;

const locationPinStyle = css`
    position: absolute;
    right: 5vw;
    bottom: 20vh;
`;

const playerCharacterStyle = css`
    position: absolute;
    --dude-size: 8vw;
    width: var(--dude-size);
    height: var(--dude-size);
    transition: left 2s;
    left: 5vw;
    bottom: 20vh;
`;

const playerAtLocation = css`
    left: 70%;
`;

export default LocationDemo;