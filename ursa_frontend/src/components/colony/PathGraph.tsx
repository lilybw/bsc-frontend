import { Component, createEffect, createSignal, For } from "solid-js";
import { ColonyInfoResponseDTO, LocationInfoResponseDTO, PlayerID } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { IBackendBased, IInternationalized, IBufferBased } from "../../ts/types";
import { IEventMultiplexer } from "../../integrations/multiplayer_backend/eventMultiplexer";
import { 
  PLAYER_MOVE_EVENT, 
  PlayerMoveMessageDTO, 
  PLAYER_LEFT_EVENT,
  PlayerLeftMessageDTO,
  LOBBY_CLOSING_EVENT,
  LobbyClosingMessageDTO
} from "../../integrations/multiplayer_backend/EventSpecifications-v0.0.7";
import Location from "../colony/location/Location";
import NTAwait from "../util/Await";
import { Camera } from "../../ts/camera";
import { createWrappedSignal } from '../../ts/wrappedSignal';

interface PathGraphProps extends IBackendBased, IInternationalized, IBufferBased {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
}

interface Position {
    x: number;
    y: number;
}

interface PlayerState {
    currentLocationId: number;
    position: Position;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [playerStates, setPlayerStates] = createSignal<Map<PlayerID, PlayerState>>(new Map());
    const [viewportDimensions, setViewportDimensions] = createSignal({ width: 1920, height: 1080 });
    const [scaleFactor, setScaleFactor] = createSignal(1);

    const camera: Camera = createWrappedSignal({ x: 0, y: 0 });

    const calculateScalars = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        setViewportDimensions({ width: viewportWidth, height: viewportHeight });
        setScaleFactor(Math.min(viewportWidth / 1920, viewportHeight / 1080));
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

    const getLocationPosition = (locationId: number): Position => {
        const location = props.colony.locations.find(l => l.id === locationId);
        return location ? { x: location.transform.xOffset, y: location.transform.yOffset } : { x: 0, y: 0 };
    };

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        const newLocation = getLocationPosition(data.locationID);
        
        if (data.playerID === props.localPlayerId) {
            // Move the world instead of the local player
            camera.set(prev => ({
                x: prev.x - (newLocation.x - prev.x),
                y: prev.y - (newLocation.y - prev.y)
            }));

            // Emit the move event to the plexer
            props.plexer.emit(PLAYER_MOVE_EVENT, {
                playerID: props.localPlayerId,
                locationID: data.locationID
            });
        } else {
            // Update other players' positions
            setPlayerStates(prev => {
                const newStates = new Map(prev);
                newStates.set(data.playerID, {
                    currentLocationId: data.locationID,
                    position: newLocation
                });
                return newStates;
            });
        }
    };

    const handlePlayerLeft = (data: PlayerLeftMessageDTO) => {
        setPlayerStates(prev => {
            const newStates = new Map(prev);
            newStates.delete(data.id);
            return newStates;
        });
    };

    const handleLobbyClosing = (data: LobbyClosingMessageDTO) => {
        console.log("Lobby is closing");
        // Implement appropriate UI feedback or navigation here
    };

    createEffect(() => {
        fetchPaths();
        calculateScalars();
        window.addEventListener('resize', debouncedCalculateScalars);

        const subscriptions = [
            props.plexer.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove),
            props.plexer.subscribe(PLAYER_LEFT_EVENT, handlePlayerLeft),
            props.plexer.subscribe(LOBBY_CLOSING_EVENT, handleLobbyClosing)
        ];

        return () => {
            window.removeEventListener('resize', debouncedCalculateScalars);
            subscriptions.forEach(id => props.plexer.unsubscribe(id));
        };
    });

    const getRelativePosition = (position: Position): Position => {
        const offset = camera.get();
        return {
            x: (position.x + offset.x) * scaleFactor() + viewportDimensions().width / 2,
            y: (position.y + offset.y) * scaleFactor() + viewportDimensions().height / 2
        };
    };

    return (
        <div class={containerStyle} style={{ width: `${viewportDimensions().width}px`, height: `${viewportDimensions().height}px` }}>
            <svg width="100%" height="100%">
                <For each={paths()}>
                    {(path) => {
                        const fromPos = getRelativePosition(getLocationPosition(path.from));
                        const toPos = getRelativePosition(getLocationPosition(path.to));
                        return (
                            <line
                                x1={fromPos.x}
                                y1={fromPos.y}
                                x2={toPos.x}
                                y2={toPos.y}
                                stroke="black"
                                stroke-width={2 * scaleFactor()}
                            />
                        );
                    }}
                </For>
            </svg>
            <For each={props.colony.locations}>
                {(location) => (
                    <NTAwait
                        func={() => props.backend.getLocationInfo(location.id)}
                        fallback={(error) => () => <div>Error loading location: {error.message}</div>}
                    >
                        {(locationInfo) =>
                            isLocationInfoResponseDTO(locationInfo) ? (
                                <Location
                                    colonyLocation={location}
                                    location={locationInfo}
                                    dns={() => ({ x: scaleFactor(), y: scaleFactor() })}
                                    gas={() => scaleFactor()}
                                    plexer={props.plexer}
                                    camera={camera}
                                    backend={props.backend}
                                    buffer={props.buffer}
                                    text={props.text}
                                    styleOverwrite=""
                                    register={() => { return () => {}; }}
                                />
                            ) : (
                                <div>Error loading location data</div>
                            )
                        }
                    </NTAwait>
                )}
            </For>
            <For each={Array.from(playerStates().entries())}>
                {([playerId, state]) => {
                    if (playerId === props.localPlayerId) return null;
                    const pos = getRelativePosition(state.position);
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${pos.x - 10 * scaleFactor()}px`,
                            top: `${pos.y - 10 * scaleFactor()}px`,
                            width: `${20 * scaleFactor()}px`,
                            height: `${20 * scaleFactor()}px`,
                            background: 'red',
                            'border-radius': '50%',
                            transition: 'left 0.3s, top 0.3s'
                        }}></div>
                    );
                }}
            </For>
            {/* Local player (always centered) */}
            <div style={{
                position: 'absolute',
                left: `${viewportDimensions().width / 2 - 10 * scaleFactor()}px`,
                top: `${viewportDimensions().height / 2 - 10 * scaleFactor()}px`,
                width: `${20 * scaleFactor()}px`,
                height: `${20 * scaleFactor()}px`,
                background: 'blue',
                'border-radius': '50%'
            }}></div>
        </div>
    );
};

function isLocationInfoResponseDTO(data: any): data is LocationInfoResponseDTO {
    return (
        data &&
        typeof data.id === "number" &&
        typeof data.name === "string" &&
        typeof data.description === "string" &&
        Array.isArray(data.appearances) &&
        typeof data.minigameID === "number"
    );
}

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

const containerStyle = css`
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
`;

export default PathGraph;