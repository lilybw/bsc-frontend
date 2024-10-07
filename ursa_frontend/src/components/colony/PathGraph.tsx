import { Component, onMount, onCleanup, createSignal, For } from "solid-js";
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
import { LobbyStateResponseDTO, ClientDTO } from "../../integrations/multiplayer_backend/multiplayerDTO";
import { IMultiplayerIntegration } from "../../integrations/multiplayer_backend/multiplayerBackend";
import { gameContainerStyle, localPlayerStyle, gameElementStyle, playerLabelStyle } from "./styles/Pathgraph.styles";

interface PathGraphProps extends IBackendBased, IInternationalized, IBufferBased {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
    multiplayerIntegration: IMultiplayerIntegration;
}

interface Position {
    x: number;
    y: number;
}

interface PlayerState {
    currentLocationId: number;
    position: Position;
    IGN: string;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [playerStates, setPlayerStates] = createSignal<Map<PlayerID, PlayerState>>(new Map());
    const [viewportDimensions, setViewportDimensions] = createSignal({ width: 1920, height: 1080 });
    const [scaleFactor, setScaleFactor] = createSignal(1);
    const [cameraPosition, setCameraPosition] = createSignal<Position>({ x: 0, y: 0 });

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

    const initializePlayerStates = async () => {
        try {
            const lobbyStateResponse = await props.multiplayerIntegration.getLobbyState();
            if (lobbyStateResponse.err || !lobbyStateResponse.res) {
                throw new Error(lobbyStateResponse.err || "No response data");
            }
            const lobbyState: LobbyStateResponseDTO = lobbyStateResponse.res;
            
            const newPlayerStates = new Map<PlayerID, PlayerState>();
            lobbyState.clients.forEach((client: ClientDTO) => {
                if (client.id !== props.localPlayerId) {
                    const position = getLocationPosition(client.state.lastKnownPosition);
                    newPlayerStates.set(client.id, {
                        currentLocationId: client.state.lastKnownPosition,
                        position,
                        IGN: client.IGN
                    });
                } else {
                    // Set initial camera position based on local player's position
                    const localPlayerPosition = getLocationPosition(client.state.lastKnownPosition);
                    setCameraPosition(localPlayerPosition);
                }
            });
            setPlayerStates(newPlayerStates);
        } catch (error) {
            console.error("Error initializing player states:", error);
        }
    };

    const movePlayer = (playerId: PlayerID, newLocationId: number) => {
        const newPosition = getLocationPosition(newLocationId);

        if (playerId === props.localPlayerId) {
            // Move the camera (which moves everything else)
            setCameraPosition(newPosition);
        } else {
            // Update other player's position
            setPlayerStates(prev => {
                const newStates = new Map(prev);
                const currentState = newStates.get(playerId);
                if (currentState) {
                    newStates.set(playerId, {
                        ...currentState,
                        currentLocationId: newLocationId,
                        position: newPosition
                    });
                }
                return newStates;
            });
        }
    };

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        movePlayer(data.playerID, data.locationID);

        if (data.playerID === props.localPlayerId) {
            props.plexer.emit(PLAYER_MOVE_EVENT, {
                playerID: props.localPlayerId,
                locationID: data.locationID
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

    onMount(() => {
        fetchPaths();
        initializePlayerStates();
        calculateScalars();
        window.addEventListener('resize', debouncedCalculateScalars);

        const subscriptions = [
            props.plexer.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove),
            props.plexer.subscribe(PLAYER_LEFT_EVENT, handlePlayerLeft),
            props.plexer.subscribe(LOBBY_CLOSING_EVENT, handleLobbyClosing)
        ];

        onCleanup(() => {
            window.removeEventListener('resize', debouncedCalculateScalars);
            subscriptions.forEach(id => props.plexer.unsubscribe(id));
        });
    });

    return (
        <div class={css`
            width: ${viewportDimensions().width}px;
            height: ${viewportDimensions().height}px;
            overflow: hidden;
            position: relative;
        `}>
            <div class={css`
                ${gameContainerStyle}
                transform: translate(${-cameraPosition().x * scaleFactor() + viewportDimensions().width / 2}px, ${-cameraPosition().y * scaleFactor() + viewportDimensions().height / 2}px) scale(${scaleFactor()});
            `}>
                <svg width="100%" height="100%">
                    <For each={paths()}>
                        {(path) => {
                            const fromPos = getLocationPosition(path.from);
                            const toPos = getLocationPosition(path.to);
                            return (
                                <line
                                    x1={fromPos.x}
                                    y1={fromPos.y}
                                    x2={toPos.x}
                                    y2={toPos.y}
                                    stroke="black"
                                    stroke-width={2 / scaleFactor()}
                                />
                            );
                        }}
                    </For>
                </svg>
                <For each={props.colony.locations}>
                    {(location) => (
                        <NTAwait
                            func={() => props.backend.getLocationInfo(location.id)}
                            fallback={(error) => () => (
                                <div class={css`
                                    position: absolute;
                                    left: ${location.transform.xOffset}px;
                                    top: ${location.transform.yOffset}px;
                                `}>
                                    Error loading location: {error.message}
                                </div>
                            )}
                        >
                            {(locationInfo) =>
                                isLocationInfoResponseDTO(locationInfo) ? (
                                    <Location
                                        colonyLocation={location}
                                        location={locationInfo}
                                        dns={() => ({ x: 1, y: 1 })}
                                        gas={() => 1}
                                        plexer={props.plexer}
                                        camera={camera}
                                        backend={props.backend}
                                        buffer={props.buffer}
                                        text={props.text}
                                        styleOverwrite={css`
                                            position: absolute;
                                            left: ${location.transform.xOffset}px;
                                            top: ${location.transform.yOffset}px;
                                        `}
                                        register={() => { return () => {}; }}
                                    />
                                ) : (
                                    <div class={css`
                                        position: absolute;
                                        left: ${location.transform.xOffset}px;
                                        top: ${location.transform.yOffset}px;
                                    `}>
                                        Error loading location data
                                    </div>
                                )
                            }
                        </NTAwait>
                    )}
                </For>
                <For each={Array.from(playerStates().entries())}>
                    {([playerId, state]) => (
                        <div class={css`
                            ${gameElementStyle}
                            left: ${state.position.x}px;
                            top: ${state.position.y}px;
                            width: 20px;
                            height: 20px;
                            background-color: red;
                            border-radius: 50%;
                        `}>
                            <div class={playerLabelStyle}>
                                {state.IGN}
                            </div>
                        </div>
                    )}
                </For>
            </div>
            <div class={localPlayerStyle} />
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

export default PathGraph;