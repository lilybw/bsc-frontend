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
  LobbyClosingMessageDTO,
  ENTER_LOCATION_EVENT,
  EnterLocationMessageDTO
} from "../../integrations/multiplayer_backend/EventSpecifications-v0.0.7";
import Location from "../colony/location/Location";
import NTAwait from "../util/Await";
import { Camera } from "../../ts/camera";

interface PathGraphProps extends IBackendBased, IInternationalized, IBufferBased {
    colony: ColonyInfoResponseDTO;
    plexer: IEventMultiplexer;
    localPlayerId: PlayerID;
}

interface Position {
    x: number;
    y: number;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const [paths, setPaths] = createSignal<{ from: number; to: number }[]>([]);
    const [playerPositions, setPlayerPositions] = createSignal<Map<PlayerID, number>>(new Map());
    const [viewportDimensions, setViewportDimensions] = createSignal({ width: 1920, height: 1080 });
    const [scaleFactor, setScaleFactor] = createSignal(1);

    const camera: Camera = { 
        get: () => ({ x: 0, y: 0 }), 
        set: (pos) => {
            // Update camera position logic here
        } 
    };

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

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        const newLocation = props.colony.locations.find(l => l.id === data.locationID);
        if (!newLocation) return;

        if (data.playerID === props.localPlayerId) {
            camera.set({
                x: newLocation.transform.xOffset,
                y: newLocation.transform.yOffset
            });
        }
        setPlayerPositions(prev => {
            const newPositions = new Map(prev);
            newPositions.set(data.playerID, data.locationID);
            return newPositions;
        });
    };

    const handlePlayerLeft = (data: PlayerLeftMessageDTO) => {
        setPlayerPositions(prev => {
            const newPositions = new Map(prev);
            newPositions.delete(data.id);
            return newPositions;
        });
    };

    const handleLobbyClosing = (data: LobbyClosingMessageDTO) => {
        console.log("Lobby is closing");
        // Implement appropriate UI feedback or navigation here
    };

    const handleEnterLocation = (data: EnterLocationMessageDTO) => {
        // This event might be useful for showing which locations other players are entering
        console.log(`Player ${data.senderID} entered location ${data.id}`);
    };

    createEffect(() => {
        fetchPaths();
        calculateScalars();
        window.addEventListener('resize', debouncedCalculateScalars);

        const subscriptions = [
            props.plexer.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove),
            props.plexer.subscribe(PLAYER_LEFT_EVENT, handlePlayerLeft),
            props.plexer.subscribe(LOBBY_CLOSING_EVENT, handleLobbyClosing),
            props.plexer.subscribe(ENTER_LOCATION_EVENT, handleEnterLocation)
        ];

        return () => {
            window.removeEventListener('resize', debouncedCalculateScalars);
            subscriptions.forEach(id => props.plexer.unsubscribe(id));
        };
    });

    const getRelativePosition = (locationId: number): Position => {
        const location = props.colony.locations.find(l => l.id === locationId);
        if (!location) return { x: 0, y: 0 };

        const cameraPos = camera.get();
        return {
            x: (location.transform.xOffset - cameraPos.x) * scaleFactor() + viewportDimensions().width / 2,
            y: (location.transform.yOffset - cameraPos.y) * scaleFactor() + viewportDimensions().height / 2
        };
    };

    return (
        <div class={containerStyle} style={{ width: `${viewportDimensions().width}px`, height: `${viewportDimensions().height}px` }}>
            <svg width="100%" height="100%">
                <For each={paths()}>
                    {(path) => {
                        const fromPos = getRelativePosition(path.from);
                        const toPos = getRelativePosition(path.to);
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
            <For each={Array.from(playerPositions().entries())}>
                {([playerId, locationId]) => {
                    if (playerId === props.localPlayerId) return null;
                    const pos = getRelativePosition(locationId);
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${pos.x - 10 * scaleFactor()}px`,
                            top: `${pos.y - 10 * scaleFactor()}px`,
                            width: `${20 * scaleFactor()}px`,
                            height: `${20 * scaleFactor()}px`,
                            background: 'red',
                            'border-radius': '50%'
                        }}></div>
                    );
                }}
            </For>
            {/* Local player */}
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