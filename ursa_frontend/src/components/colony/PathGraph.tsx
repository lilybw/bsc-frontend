import { Component, onMount, onCleanup, createSignal, For, createMemo, createEffect } from "solid-js";
import { ColonyInfoResponseDTO, LocationInfoResponseDTO, PlayerID, TransformDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { IBackendBased, IInternationalized, IBufferBased } from "../../ts/types";
import { IEventMultiplexer } from "../../integrations/multiplayer_backend/eventMultiplexer";
import { PLAYER_MOVE_EVENT, PlayerMoveMessageDTO } from "../../integrations/multiplayer_backend/EventSpecifications";
import Location from "../colony/location/Location";
import NTAwait from "../util/Await";
import { Camera } from "../../ts/camera";
import { createWrappedSignal } from '../../ts/wrappedSignal';
import { IMultiplayerIntegration } from "../../integrations/multiplayer_backend/multiplayerBackend";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";
import Player from "../Player";
import { ClientDTO } from "../../integrations/multiplayer_backend/multiplayerDTO";
import { error } from "console";

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

interface PathGraphProps extends IBackendBased, IInternationalized, IBufferBased {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
    multiplayerIntegration: IMultiplayerIntegration;
    existingClients: ClientDTO[]
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

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const [GAS, setGAS] = createSignal(1);
    const [locationTransforms, setLocationTransform] = createSignal<Map<Number, TransformDTO>>(new Map())
    const camera: Camera = createWrappedSignal({ x: 0, y: 0 });
    /**
     * This map shows relationships between the players positions and the location that is the position in the graph.
     */
    const [nonLocalPlayerPositions, setNonLocalPlayerPositions] = createSignal<Map<PlayerID, Number>>(unwrappedFromProps(props.existingClients))

    
    createEffect(() => {
        const currentDNS = DNS()

        const transforms = new Map()
        const tempGAS = Math.min(currentDNS.x, currentDNS.y)

        for (const colonyLocationInfo of props.colony.locations) {
            const computedTransform: TransformDTO = {
                ...colonyLocationInfo.transform,
                xOffset: colonyLocationInfo.transform.xOffset * currentDNS.x - camera.get().x,
                yOffset: colonyLocationInfo.transform.yOffset * currentDNS.y - camera.get().y,
                xScale: colonyLocationInfo.transform.xScale * tempGAS,
                yScale: colonyLocationInfo.transform.yScale * tempGAS
            }

            transforms.set(colonyLocationInfo.id, computedTransform)
        }

        setLocationTransform(transforms)
    }) 

    const calculateScalars = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setDNS({ 
            x: viewportWidth / EXPECTED_WIDTH, 
            y: viewportHeight / EXPECTED_HEIGHT 
        });
        setGAS(Math.min(viewportWidth / EXPECTED_WIDTH, viewportHeight / EXPECTED_HEIGHT));
    };

    const fetchPaths = async () => {
        const pathData = await props.backend.getColonyPathGraph(props.colony.id);

        if (!pathData.err && pathData.res != null) {
            setPaths(pathData.res.paths);
        }
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

    const containerTransform = createMemo(() => {
        const cameraPos = camera.get();
        return `translate(${-cameraPos.x * GAS() + window.innerWidth / 2}px, ${-cameraPos.y * GAS() + window.innerHeight / 2}px) scale(${GAS()})`;
    });

    return (
        <div class={css`
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            position: relative;
        `}>
            <div class={css`
                position: absolute;
                transform: ${containerTransform()};
            `}>
                <NTAwait
                    func={() => props.backend.getColonyPathGraph(props.colony.id)}
                >
                    {(pathData) => 
                        <svg width="100%" height="100%">
                            <For each={paths()}>
                                {(path) => {
                                    const fromLocation = locationTransforms().get(path.from);
                                    const toLocation = locationTransforms().get(path.to);
                                    if (!fromLocation || !toLocation) return null;
                                    return (
                                        <line
                                            x1={fromLocation.xOffset}
                                            y1={fromLocation.yOffset}
                                            x2={toLocation.xOffset}
                                            y2={toLocation.yOffset}
                                            stroke="black"
                                            stroke-width={2 / GAS()}
                                        />
                                    );
                                }}
                            </For>
                        </svg>
                    }
                </NTAwait>
        
                <For each={props.colony.locations}>
                    {(location) => (
                        <NTAwait
                            func={() => props.backend.getLocationInfo(location.locationID)}
                        >
                            {(locationInfo) => (
                                <Location
                                    colonyLocation={{...location, transform: locationTransforms().get(location.id)!}}
                                    location={locationInfo.res!}
                                    gas={GAS}
                                    plexer={props.plexer}
                                    backend={props.backend}
                                    buffer={props.buffer}
                                    text={props.text}
                                    register={() => { return () => {}; }}
                                />
                            )}
                        </NTAwait>
                    )}
                </For>
            </div>
        </div>
    );
};


export default PathGraph;