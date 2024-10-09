import { Component, onMount, onCleanup, createSignal, For, createMemo, createEffect, from } from "solid-js";
import { ColonyInfoResponseDTO, ColonyLocationInformation, PlayerID, TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { IBackendBased, IInternationalized, IBufferBased } from "../../ts/types";
import { IEventMultiplexer } from "../../integrations/multiplayer_backend/eventMultiplexer";
import { PLAYER_MOVE_EVENT, PlayerMoveMessageDTO } from "../../integrations/multiplayer_backend/EventSpecifications";
import Location from "../colony/location/Location";
import { Camera } from "../../ts/camera";
import { createWrappedSignal, WrappedSignal } from '../../ts/wrappedSignal';
import { IMultiplayerIntegration } from "../../integrations/multiplayer_backend/multiplayerBackend";
import { ClientDTO } from "../../integrations/multiplayer_backend/multiplayerDTO";
import NTAwait from "../util/NoThrowAwait";
import { KnownLocations } from "../../integrations/main_backend/constants";
import { BufferSubscriber, TypeIconTuple } from "../../ts/actionContext";
import { ArrayStore, createArrayStore } from "../../ts/arrayStore";
import ActionInput from "./MainActionInput";

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

interface PathGraphProps extends IBackendBased, IInternationalized {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
    multiplayerIntegration: IMultiplayerIntegration;
    existingClients: ArrayStore<ClientDTO>;
    bufferSubscribers: ArrayStore<BufferSubscriber<string>>;
    buffer: WrappedSignal<string>;
    actionContext: WrappedSignal<TypeIconTuple>;
}

const UNIT_TRANSFORM: TransformDTO = {
    xOffset: 0,
    yOffset: 0,
    yScale: 1,
    xScale: 1,
    zIndex: 0
}

function unwrappedFromProps(clients: ClientDTO[]) {
    const map = new Map()
    for (const client of clients) {
        map.set(client.id, client.state.lastKnownPosition)
    }
    return map
}

const findByLocationID = (locations: ColonyLocationInformation[], locationID: number) => {
    for (const location of locations) {
        if (location.locationID === locationID) {
            return location;
        }
    }
    return null;
}

const getInitialCameraPosition = (home: ColonyLocationInformation) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {x: home.transform.xOffset + (viewportWidth * .5), y: home.transform.yOffset + (viewportHeight * .5)}
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const [GAS, setGAS] = createSignal(1);
    const colonyLocation = createArrayStore<ColonyLocationInformation>(props.colony.locations)
    const [worldOffset, setWorldOffset] = createSignal({ x: 0, y: 0 });
    const [currentLocationId, setCurrentLocationId] = createSignal(KnownLocations.Home);

    const calculateScalars = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setDNS({ 
            x: viewportWidth / EXPECTED_WIDTH, 
            y: viewportHeight / EXPECTED_HEIGHT 
        });
        setGAS(Math.sqrt(Math.min(viewportWidth / EXPECTED_WIDTH, viewportHeight / EXPECTED_HEIGHT)));
    };

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        if (data.playerID === props.localPlayerId) {
            const oldLocation = findByLocationID(props.colony.locations, currentLocationId());
            const newLocation = findByLocationID(props.colony.locations, data.locationID);
            
            if (oldLocation && newLocation) {
                const movementVector = {
                    x: oldLocation.transform.xOffset - newLocation.transform.xOffset,
                    y: oldLocation.transform.yOffset - newLocation.transform.yOffset
                };
                
                setWorldOffset(prevOffset => {
                    const newOffset = {
                        x: prevOffset.x + movementVector.x,
                        y: prevOffset.y + movementVector.y
                    };
                    console.log('New world offset:', newOffset);
                    return newOffset;
                });
            }
            
            setCurrentLocationId(data.locationID);
        } else {
            props.existingClients.mutateByPredicate((client) => client.id === data.playerID, (client) => {
                client.state.lastKnownPosition = data.locationID;
                return client;
            });
        }
    };

    const setWorldOffsetWrapper = (movementVector: { x: number; y: number }) => {
        setWorldOffset(prevOffset => {
            const newOffset = {
                x: prevOffset.x + movementVector.x,
                y: prevOffset.y + movementVector.y
            };
            console.log('New world offset from wrapper:', newOffset);
            return newOffset;
        });
    };

    const getCurrentLocationId = () => currentLocationId();

    onMount(() => {
        calculateScalars();
        window.addEventListener('resize', calculateScalars);

        const subscription = props.plexer.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove);

        onCleanup(() => {
            window.removeEventListener('resize', calculateScalars);
            props.plexer.unsubscribe(subscription);
        });
    });

    return (
        <div class={pathGraphContainerStyle}>
            <NTAwait func={() => props.backend.getColonyPathGraph(props.colony.id)}>
                {(pathData) => 
                    <svg width="100%" height="100%">
                        <For each={pathData.paths}>
                            {(path) => {
                                let fromLocation = colonyLocation.get().find(loc => loc.id === path.from);
                                let toLocation = colonyLocation.get().find(loc => loc.id === path.to);
                                if (!fromLocation || !toLocation) return null;
                                return (
                                    <line
                                        x1={fromLocation.transform.xOffset + worldOffset().x}
                                        y1={fromLocation.transform.yOffset + worldOffset().y}
                                        x2={toLocation.transform.xOffset + worldOffset().x}
                                        y2={toLocation.transform.yOffset + worldOffset().y}
                                        stroke="white"
                                        stroke-width={10}
                                    />
                                );
                            }}
                        </For>
                    </svg>
                }
            </NTAwait>
    
            <For each={colonyLocation.get()}>
                {(colonyLocation) => (
                    <NTAwait
                        func={() => props.backend.getLocationInfo(colonyLocation.locationID)}
                    >
                        {(locationInfo) => (
                            <Location
                                colonyLocation={colonyLocation}
                                location={locationInfo}
                                worldOffset={worldOffset()}
                                gas={GAS}
                                dns={DNS}
                                plexer={props.plexer}
                                backend={props.backend}
                                buffer={props.buffer.get}
                                actionContext={props.actionContext}
                                text={props.text}
                                register={props.bufferSubscribers.add}
                                setWorldOffset={setWorldOffsetWrapper}
                                getCurrentLocationId={getCurrentLocationId}
                            />
                        )}
                    </NTAwait>
                )}
            </For>

            <ActionInput subscribers={props.bufferSubscribers.get} 
                text={props.text}
                backend={props.backend}
                actionContext={props.actionContext.get} 
                setInputBuffer={props.buffer.set}
                inputBuffer={props.buffer.get}
            />
        </div>
    );
};

export default PathGraph;

const pathGraphContainerStyle = css`
position: absolute;
left: 0;
top: 0;
width: 100vw;
height: 100vh;
overflow: visible;
`