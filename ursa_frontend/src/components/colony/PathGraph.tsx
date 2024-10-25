import { Component, onMount, onCleanup, createSignal, For, createMemo, createEffect, from, Accessor, AccessorArray } from "solid-js";
import { ColonyInfoResponseDTO, ColonyLocationInformation, ColonyPathGraphResponseDTO, PlayerID, TransformDTO, uint32 } from "../../integrations/main_backend/mainBackendDTOs";
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
import { Styles } from "../../sharedCSS";
import { ApplicationContext } from "../../meta/types";

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

interface PathGraphProps extends IBackendBased, IInternationalized {
    colony: ColonyInfoResponseDTO;
    ownerID: PlayerID;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
    multiplayerIntegration: IMultiplayerIntegration;
    existingClients: ArrayStore<ClientDTO>;
    bufferSubscribers: ArrayStore<BufferSubscriber<string>>;
    buffer: WrappedSignal<string>;
    actionContext: WrappedSignal<TypeIconTuple>;
    graph: ColonyPathGraphResponseDTO;
}

function arrayToMap(array: ColonyLocationInformation[]) {
    const map = new Map()

    for (const element of array) {
        map.set(element.id, createWrappedSignal(element.transform))
    }

    return map
}
type ColonyLocationID = uint32;
const loadPathMap = (paths: ColonyPathGraphResponseDTO["paths"]): Map<ColonyLocationID, ColonyLocationID[]> => {
    const pathMap = new Map<ColonyLocationID, ColonyLocationID[]>();
    for (const path of paths) {
        if (!pathMap.has(path.from)) {
            pathMap.set(path.from, []);
        }
        pathMap.get(path.from)!.push(path.to);
    }
    return pathMap;
}
const findColonyLocationIDOf = (location: KnownLocations, colony: ColonyInfoResponseDTO): ColonyLocationID => {
    const locationInfo = colony.locations.find(loc => loc.locationID === location);
    if (!locationInfo) {
        return -1;
    }
    return locationInfo.id;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const [GAS, setGAS] = createSignal(1);
    const colonyLocation = createArrayStore<ColonyLocationInformation>(props.colony.locations)
    const camera = createWrappedSignal({x: 0, y: 0})
    const [viewportDimensions, setViewportDimensions] = createSignal({width: window.innerWidth, height: window.innerHeight});
    const [currentLocationOfLocalPlayer, setCurrentLocationOfLocalPlayer] = createSignal(
        props.colony.locations.find(loc => loc.locationID === KnownLocations.Home)?.id!);

    const transformMap = new Map<ColonyLocationID, WrappedSignal<TransformDTO>>(arrayToMap(props.colony.locations))
    const pathMap = new Map<ColonyLocationID, ColonyLocationID[]>(loadPathMap(props.graph.paths))
    const log = props.backend.logger.copyFor("path graph");

    createEffect(() => {
        const currentDNS = DNS()
        const currentGAS = GAS()

        for (const colonyLocationInfo of colonyLocation.get) {
            const computedTransform: TransformDTO = {
                ...colonyLocationInfo.transform,
                // Camera is applied to the parent. Not here.
                xOffset: colonyLocationInfo.transform.xOffset * currentDNS.x,
                yOffset: colonyLocationInfo.transform.yOffset * currentDNS.y,
                xScale: colonyLocationInfo.transform.xScale * currentGAS,
                yScale: colonyLocationInfo.transform.yScale * currentGAS
            }

            transformMap.get(colonyLocationInfo.id)!.set(computedTransform)
            colonyLocation.mutateByPredicate((e) => e === colonyLocationInfo, (element) => {
                element.transform = computedTransform
                return element
            })
        }
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
    };

    const centerCameraOnPoint = (x: number, y: number) => {
        const dim = viewportDimensions();
        const dns = DNS();
        camera.set({
            x: (-1 * x * dns.x) + (dim.width * .5), 
            y: (-1 * y * dns.y) + (dim.height * .5)
        })
    }

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        log.subtrace(`Handling player move: ${JSON.stringify(data)}`);
        if (data.playerID === props.localPlayerId) {
            const targetLocation = colonyLocation.findFirst(loc => loc.id === data.colonyLocationID);

            if (!targetLocation) {
                log.error(`Unable to find location with ID on player move: ${data.colonyLocationID}`);
                return;
            }

            setCurrentLocationOfLocalPlayer(targetLocation.locationID);
            centerCameraOnPoint(
                targetLocation.transform.xOffset,
                targetLocation.transform.yOffset
            );
        } else {
            log.trace(`Updating location of player ${data.playerID} to ${data.colonyLocationID}`);
            props.existingClients.mutateByPredicate((client) => client.id === data.playerID, (client) => {
                //locationID is id of Colony Location
                return {...client, state: {...client.state, lastKnownPosition: data.colonyLocationID}};
            });
        }
    };

    onMount(() => {
        calculateScalars();
        window.addEventListener('resize', calculateScalars);
        const playerMoveSubID = props.plexer.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove);

        onCleanup(() => {
            window.removeEventListener('resize', calculateScalars);
            props.plexer.unsubscribe(playerMoveSubID);
        });

        //Set initial camera position
        //Only works because the createEffect statement is evaluated before this onMount as of right now
        const trans = colonyLocation.findFirst(loc => loc.locationID === KnownLocations.Home)!.transform;
        centerCameraOnPoint(trans.xOffset, trans.yOffset);
    });

    const computedCameraContainerStyles = createMemo(() => {
        const cameraState = camera.get()
        return css`
            ${cameraContainer}
            top: ${cameraState.y}px;
            left: ${cameraState.x}px;
        `}
    ); 

    const computedNonLocalPlayerStyle = (client: ClientDTO) => createMemo(() => {
        const transform = transformMap.get(client.state.lastKnownPosition)!.get()
        return css`
            ${localPlayerStyle}
            background-color: green;
            ${Styles.transformToCSSVariables(transform)}
            ${Styles.TRANSFORM_APPLICATOR}
        `
    })

    return (
        <div class={pathGraphContainerStyle} id={props.colony.name+"-path-graph"}>
            <div class={computedCameraContainerStyles()} id="camera-container">
                <svg id="paths" class={svgContainerStyle}>
                    <For each={props.graph.paths}>{(path) => {
                        let fromLocation = transformMap.get(path.from);
                        let toLocation = transformMap.get(path.to);
                        if (!fromLocation || !toLocation) return null;
                        
                        const transformA = fromLocation.get()
                        const transformB = toLocation.get()
                        return (
                            <line
                                x1={transformA.xOffset}
                                y1={transformA.yOffset}
                                x2={transformB.xOffset}
                                y2={transformB.yOffset}
                                stroke="white"
                                stroke-width={10}
                            />
                        );
                    }}</For>
                </svg>

                <For each={colonyLocation.get}>
                    {(colonyLocation) => (
                        <NTAwait
                            func={() => props.backend.locations.getInfo(colonyLocation.locationID)}
                        >
                            {(locationInfo) => (
                                <Location
                                    multiplayer={props.multiplayerIntegration}
                                    colony={props.colony}
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

                
                <For each={props.existingClients.get}>{ client => 
                    <div class={computedNonLocalPlayerStyle(client)()} />
                }</For>
            </div>

            <ActionInput subscribers={props.bufferSubscribers} 
                text={props.text}
                backend={props.backend}
                actionContext={props.actionContext.get}
                setInputBuffer={props.buffer.set}
                inputBuffer={props.buffer.get}
            />
            <div id="local-player" class={localPlayerStyle}/>
        </div>
    );
};
export default PathGraph;

const localPlayerStyle = css`
position: absolute;
z-index: 200;
top: 50%;
left: 50%;
width: 20px;
height: 20px;
background-color: blue;
border-radius: 50%;
transform: translate(-50%, -50%);
`

const svgContainerStyle = css`
position: absolute; 
top: 0;
left: 0;
width: 100vw;
height: 100vh; 
z-index: 10; 
overflow: visible !important;
`

const cameraContainer = css`
position: absolute;
top: 0;
left: 0;
overflow: visible;
transition: top 0.5s ease-in-out, left 0.5s ease-in-out;
`

const pathGraphContainerStyle = css`
position: absolute;
left: 0;
top: 0;
width: 100vw;
height: 100vh;
overflow: visible;
`