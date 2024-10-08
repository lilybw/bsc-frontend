import { Component, onMount, onCleanup, createSignal, For, createMemo } from "solid-js";
import { ColonyInfoResponseDTO, LocationInfoResponseDTO, PlayerID } from "../../integrations/main_backend/mainBackendDTOs";
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

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

interface PathGraphProps extends IBackendBased, IInternationalized, IBufferBased {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
    multiplayerIntegration: IMultiplayerIntegration;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
    const [GAS, setGAS] = createSignal(1);

    const camera: Camera = createWrappedSignal({ x: 0, y: 0 });


    const calculateScalars = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setDNS({ 
            x: viewportWidth / EXPECTED_WIDTH, 
            y: viewportHeight / EXPECTED_HEIGHT 
        });
        setGAS(Math.min(viewportWidth / EXPECTED_WIDTH, viewportHeight / EXPECTED_HEIGHT));
    };

    const debouncedCalculateScalars = debounce(calculateScalars, 250);

    const fetchPaths = async () => {
        try {
            const pathData = await props.backend.getColonyPathGraph(props.colony.id);
            if (pathData.err || !pathData.res) {
                throw new Error(pathData.err || "No response data");
            }
            setPaths(pathData.res.paths);
        } catch (error) {
            console.error("Error fetching paths:", error);
        }
    };

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        const colonyLocationId = data.locationID;

        const newLocation = props.colony.locations.find(l => l.id === colonyLocationId);
        if (!newLocation) return;
        
        if (data.playerID === props.localPlayerId) {
            camera.set({
                x: newLocation.transform.xOffset,
                y: newLocation.transform.yOffset
            });
        }
    };

    onMount(() => {
        fetchPaths();
        calculateScalars();
        window.addEventListener('resize', debouncedCalculateScalars);

        const subscription = props.plexer.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove);

        onCleanup(() => {
            window.removeEventListener('resize', debouncedCalculateScalars);
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
                <svg width="100%" height="100%">
                    <For each={paths()}>
                        {(path) => {
                            const fromLocation = props.colony.locations.find(l => l.id === path.from);
                            const toLocation = props.colony.locations.find(l => l.id === path.to);
                            if (!fromLocation || !toLocation) return null;
                            return (
                                <line
                                    x1={fromLocation.transform.xOffset}
                                    y1={fromLocation.transform.yOffset}
                                    x2={toLocation.transform.xOffset}
                                    y2={toLocation.transform.yOffset}
                                    stroke="black"
                                    stroke-width={2 / GAS()}
                                />
                            );
                        }}
                    </For>
                </svg>
                <For each={props.colony.locations}>
                    {(location) => (
                        <NTAwait
                            func={() => props.backend.getLocationInfo(location.id)}
                            fallback={(e) => e}
                        >
                            {(locationInfo) => (
                                <Location
                                    colonyLocation={location}
                                    location={locationInfo.res!}
                                    dns={DNS}
                                    gas={GAS}
                                    plexer={props.plexer}
                                    camera={camera}
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
            {/* Add Player component here */}
            <Player
                transform={props.colony.locations[0].transform}  // Assuming first location is starting point
                dns={DNS}
                gas={GAS}
                camera={camera}
                isLocal={true}
            />
        </div>
    );
};

function debounce(func: Function, wait: number) {
    let timeout: number | undefined;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait) as unknown as number;
    };
}

export default PathGraph;