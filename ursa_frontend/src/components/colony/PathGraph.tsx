import { Component, onMount, onCleanup, createSignal, For, createMemo, createEffect, from, Accessor, AccessorArray } from "solid-js";
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

function arrayToMap(array: ColonyLocationInformation[]) {
    const map = new Map()

    for (const element of array) {
        map.set(element.id, createWrappedSignal(element.transform))
    }

    return map
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const [GAS, setGAS] = createSignal(1);
    const colonyLocation = createArrayStore<ColonyLocationInformation>(props.colony.locations)
    const [locationTransforms, setLocationTransform] = createSignal<Map<Number, TransformDTO>>(new Map())
    const transformMap = new Map<Number, WrappedSignal<TransformDTO>>(arrayToMap(props.colony.locations))
    const camera = createWrappedSignal({x: 0, y: 0})
    const [viewportDimensions, setViewportDimensions] = createSignal({width: window.innerWidth, height: window.innerHeight});
    const [triggerRecalculation, setTriggerRecalculation] = createSignal(0);

    createEffect(() => {
        const currentDNS = DNS()
        const currentGAS = GAS()
        const currentCamera = camera.get()
        const { width, height } = viewportDimensions()
        triggerRecalculation(); // Depend on this to ensure the effect runs when calculateScalars is called

        // Calculate the center offset
        const centerOffsetX = width / 2
        const centerOffsetY = height / 2

        for (const colonyLocationInfo of colonyLocation.get) {
            const computedTransform: TransformDTO = {
                ...colonyLocationInfo.transform,
                // Apply camera offset to each location and center it
                xOffset: ((colonyLocationInfo.transform.xOffset * currentDNS.x) - ((currentCamera.x * currentDNS.x) - centerOffsetX)),
                yOffset: ((colonyLocationInfo.transform.yOffset * currentDNS.y) - ((currentCamera.y * currentDNS.y) - centerOffsetY)),
                xScale: colonyLocationInfo.transform.xScale * currentGAS,
                yScale: colonyLocationInfo.transform.yScale * currentGAS
            }

            transformMap.get(colonyLocationInfo.id)!.set(computedTransform)
            colonyLocation.mutateByPredicate((e) => e === colonyLocationInfo, (element) => {
                element.transform = computedTransform
                return element
            })
        }

        console.log("Recalculated transforms. Camera position:", currentCamera, "Viewport:", { width, height })
    })

    const calculateScalars = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        setViewportDimensions({ width: newWidth, height: newHeight });
        setDNS({ 
            x: newWidth / EXPECTED_WIDTH,
            y: newHeight / EXPECTED_HEIGHT 
        });
        setGAS(Math.sqrt(Math.min(newWidth / EXPECTED_WIDTH, newHeight / EXPECTED_HEIGHT)))
        setTriggerRecalculation(prev => prev + 1); // Force effect to run
    };

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        console.log("Player Moved" + JSON.stringify(data))

        if (data.playerID === props.localPlayerId) {
            const targetLocation = colonyLocation.findFirst(loc => loc.id === data.locationID);

            if (!targetLocation) {
                return;
            }

            camera.set({
                x: targetLocation.transform.xOffset,
                y: targetLocation.transform.yOffset
            });

            console.log("Moving camera to:", camera.get())
        } else {
            props.existingClients.mutateByPredicate((client) => client.id === data.playerID, (client) => {
                client.state.lastKnownPosition = data.locationID;
                return client;
            });
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

    const svgContainerStyles = createMemo(() => css`
        position: absolute;
        top: ${camera.get().y} px;
        left: ${camera.get().x} px;
    `) 

    return (
        <div class={pathGraphContainerStyle}>
            <NTAwait func={() => props.backend.getColonyPathGraph(props.colony.id)}>
                {(pathData) => 
                    <svg width="100%" height="100%" class={svgContainerStyles()}>
                        <For each={pathData.paths}>
                            {(path) => {
                                let fromLocation = transformMap.get(path.from);
                                let toLocation = transformMap.get(path.to);
                                if (!fromLocation || !toLocation) return null;
                                
                                const transformA = fromLocation.get()
                                const transformB = toLocation.get()

                                const cameraState = camera.get()
                                return (
                                    <line
                                        x1={transformA.xOffset + cameraState.x}
                                        y1={transformA.yOffset + cameraState.y}
                                        x2={transformB.xOffset + cameraState.x}
                                        y2={transformB.yOffset + cameraState.y}
                                        stroke="white"
                                        stroke-width={10}
                                    />
                                );
                            }}
                        </For>
                    </svg>
                }
            </NTAwait>
    
            <For each={colonyLocation.get}>
                {(colonyLocation) => (
                    <NTAwait
                        func={() => props.backend.getLocationInfo(colonyLocation.locationID)}
                    >
                        {(locationInfo) => (
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
                                transform={transformMap.get(colonyLocation.id)!}
                            />
                        )}
                    </NTAwait>
                )}
            </For>

            <ActionInput subscribers={props.bufferSubscribers} 
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