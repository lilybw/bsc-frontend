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
    const [locationTransforms, setLocationTransform] = createSignal<Map<Number, TransformDTO>>(new Map())
    const camera: Camera = createWrappedSignal(getInitialCameraPosition(findByLocationID(props.colony.locations, KnownLocations.Home)!));
    const [nonLocalPlayerPositions, setNonLocalPlayerPositions] = createSignal<Map<PlayerID, Number>>(unwrappedFromProps(props.existingClients))
    const colonyLocation = createArrayStore<ColonyLocationInformation>(props.colony.locations)

    createEffect(() => {
        const currentDNS = DNS()
        const transforms = new Map()
        const currentGAS = GAS()
        const viewportHeight = window.innerHeight

        for (const colonyLocationInfo of colonyLocation.get()) {
            const computedTransform: TransformDTO = {
                ...colonyLocationInfo.transform,
                // Adjust y-coordinate to match web rendering system
                xOffset: colonyLocationInfo.transform.xOffset * currentDNS.x - camera.get().x,
                yOffset: viewportHeight - (colonyLocationInfo.transform.yOffset * currentDNS.y) - camera.get().y,
                xScale: colonyLocationInfo.transform.xScale * currentGAS,
                yScale: colonyLocationInfo.transform.yScale * currentGAS
            }

            transforms.set(colonyLocationInfo.id, computedTransform)
            colonyLocation.mutateElement(colonyLocationInfo, (element) => {
                element.transform = computedTransform
                return element
            })
        }

        setLocationTransform(transforms)
        props.backend.logger.trace('Updated location transforms, camera: ' + JSON.stringify(camera.get()))
    }) 

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
            let transform = locationTransforms().get(data.locationID)

            if (!transform) {
                transform = UNIT_TRANSFORM
            }
            camera.set({
                x: transform.xOffset - (DNS().x * EXPECTED_WIDTH) / 2,
                y: transform.yOffset - (DNS().y * EXPECTED_HEIGHT) / 2
            });
        } else {
            const previousPosition = nonLocalPlayerPositions().get(data.playerID)

            if (previousPosition === data.locationID) return;

            const currentPositions = new Map(nonLocalPlayerPositions())
            currentPositions.set(data.playerID, data.locationID)
            setNonLocalPlayerPositions(currentPositions)
        }
    };

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
                                let fromLocation = locationTransforms().get(path.from);
                                let toLocation = locationTransforms().get(path.to);
                                if (!fromLocation) fromLocation = UNIT_TRANSFORM;
                                if (!toLocation) toLocation = UNIT_TRANSFORM;
                                return (
                                    <line
                                        x1={fromLocation.xOffset}
                                        y1={fromLocation.yOffset}
                                        x2={toLocation.xOffset}
                                        y2={toLocation.yOffset}
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
                        {(locationInfo) => {
                            console.log('Location info from backend:', locationInfo);
                            return (
                                <Location
                                    colonyLocation={colonyLocation}
                                    location={locationInfo}
                                    gas={GAS}
                                    plexer={props.plexer}
                                    backend={props.backend}
                                    buffer={props.buffer.get}
                                    actionContext={props.actionContext}
                                    text={props.text}
                                    register={props.bufferSubscribers.add}
                                />
                            );
                        }}
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