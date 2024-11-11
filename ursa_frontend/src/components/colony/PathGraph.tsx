import { Component, onMount, onCleanup, createSignal, For, createMemo, createEffect, untrack } from 'solid-js';
import {
    ColonyInfoResponseDTO,
    ColonyLocationInformation,
    ColonyPathGraphResponseDTO,
    PlayerID,
    TransformDTO,
    uint32,
} from '../../integrations/main_backend/mainBackendDTOs';
import { css } from '@emotion/css';
import { LOCATION_UPGRADE_EVENT, MINIGAME_WON_EVENT, OriginType, PLAYER_MOVE_EVENT, PlayerMoveMessageDTO } from '../../integrations/multiplayer_backend/EventSpecifications';
import Location from '../colony/location/Location';
import { createDelayedSignal, createWrappedSignal, WrappedSignal } from '../../ts/wrappedSignal';
import { ClientDTO } from '../../integrations/multiplayer_backend/multiplayerDTO';
import NTAwait from '../util/NoThrowAwait';
import { KnownLocations } from '../../integrations/main_backend/constants';
import { BufferSubscriber, TypeIconTuple } from '../../ts/actionContext';
import { ArrayStore, createArrayStore } from '../../ts/arrayStore';
import ActionInput from './MainActionInput';
import { ApplicationContext, ColonyState, MultiplayerMode } from '../../meta/types';
import Player from './Player';
import { arrayToMap, ColonyAssetWOriginalTransform, ColonyLocationID, ColonyLocationInfoWOriginalTransform, Line, loadPathMap, loadPathsFromInitial } from './PathGraphHelpers';
import AssetCollection from './AssetCollection';

export const EXPECTED_WIDTH = 1920;
export const EXPECTED_HEIGHT = 1080;

interface PathGraphProps {
    colony: ColonyInfoResponseDTO;
    ownerID: PlayerID;

    context: ApplicationContext;

    clients: ArrayStore<ClientDTO>;
    bufferSubscribers: ArrayStore<BufferSubscriber<string>>;
    buffer: WrappedSignal<string>;
    actionContext: WrappedSignal<TypeIconTuple>;
    graph: ColonyPathGraphResponseDTO;
}

const PathGraph: Component<PathGraphProps> = (props) => {
    const DNS = createDelayedSignal({ x: 1, y: 1 });
    const GAS = createDelayedSignal(1);
    const colonyLocations = createArrayStore<ColonyLocationInfoWOriginalTransform>(
        props.colony.locations.map((loc) => ({ ...loc, originalTransform: loc.transform })),
    );
    const colonyAssets = createArrayStore<ColonyAssetWOriginalTransform>(
        props.colony.assets.map(colAss => ({ ...colAss, 
            originalTransform: colAss.transform, 
            wrappedTransform: createWrappedSignal(colAss.transform) 
        }))
    );
    const camera = createWrappedSignal({ x: 0, y: 0 });
    const [viewportDimensions, setViewportDimensions] = createSignal({ width: window.innerWidth, height: window.innerHeight });
    const [currentLocationOfLocalPlayer, setCurrentLocationOfLocalPlayer] = createSignal<ColonyLocationInfoWOriginalTransform>();

    const computedPaths = createArrayStore<Line>(loadPathsFromInitial(props.graph.paths));
    const transformMap = new Map<ColonyLocationID, WrappedSignal<TransformDTO>>(arrayToMap(props.colony.locations));
    const pathMap = new Map<ColonyLocationID, ColonyLocationID[]>(loadPathMap(props.graph.paths));
    const log = props.context.logger.copyFor('path graph');
    log.trace('initialized');

    const getLocationEnabler = (colLocID: ColonyLocationID) => {
        return createMemo(() => {
            const currentLoc = currentLocationOfLocalPlayer();
            if (!currentLoc) {
                return false;
            }

            const path = pathMap.get(currentLoc.id);
            if (!path) {
                return false;
            }

            return path.includes(colLocID) || colLocID === currentLoc.id;
        })
    }

    createEffect(() => {
        const currentDNS = DNS.get();
        const currentGAS = GAS.get();

        untrack(() => {
            //Updating transforms of locations and paths
            for (const colLoc of colonyLocations.get) {
                //Issue here, we are taking from the previous transform, and not the initial
                const computedTransform: TransformDTO = {
                    ...colLoc.originalTransform,
                    // Camera is applied to the parent (camera-container). Not here.
                    xOffset: colLoc.originalTransform.xOffset * currentDNS.x,
                    yOffset: colLoc.originalTransform.yOffset * currentDNS.y,
                    xScale: colLoc.originalTransform.xScale * currentGAS,
                    yScale: colLoc.originalTransform.yScale * currentGAS,
                };

                transformMap.get(colLoc.id)!.set(computedTransform);
                colonyLocations.mutateByPredicate(
                    (e) => e.id === colLoc.id,
                    (element) => ({
                        ...element,
                        transform: computedTransform,
                    }),
                );

                computedPaths.mutateByPredicate(
                    (l) => l.from === colLoc.id,
                    (l) => ({
                        ...l,
                        x1: computedTransform.xOffset,
                        y1: computedTransform.yOffset,
                    }),
                );
                computedPaths.mutateByPredicate(
                    (l) => l.to === colLoc.id,
                    (l) => ({
                        ...l,
                        x2: computedTransform.xOffset,
                        y2: computedTransform.yOffset,
                    }),
                );
            }

            //Update camera position
            const currentLocOfLocalPlayer = currentLocationOfLocalPlayer(); //Not tracked as we're inside untrack
            if (currentLocOfLocalPlayer) {
                centerCameraOnPoint(currentLocOfLocalPlayer.transform.xOffset, currentLocOfLocalPlayer.transform.yOffset);
            }

            //Updating transforms of all colony assets
            for (const colAss of colonyAssets.get) {
                const og = colAss.originalTransform;
                colAss.wrappedTransform.set({
                    ...colAss.transform,
                    xOffset: og.xOffset * currentDNS.x,
                    yOffset: og.yOffset * currentDNS.y,
                    xScale: og.xScale * currentGAS,
                    yScale: og.yScale * currentGAS,
                })
            }
        });
    });

    const centerCameraOnPoint = (x: number, y: number) => {
        const dim = viewportDimensions();
        camera.set({
            x: -1 * x + dim.width * 0.5,
            y: -1 * y + dim.height * 0.5,
        });
    };

    const handlePlayerMove = (data: PlayerMoveMessageDTO) => {
        log.subtrace(`Handling player move: ${JSON.stringify(data)}`);
        if (data.playerID === props.context.backend.player.local.id) {
            const targetLocation = colonyLocations.findFirst((loc) => loc.id === data.colonyLocationID);

            if (!targetLocation) {
                log.error(`Unable to find location with ID on player move: ${data.colonyLocationID}`);
                return;
            }

            setCurrentLocationOfLocalPlayer(targetLocation);
            centerCameraOnPoint(targetLocation.transform.xOffset, targetLocation.transform.yOffset);
        } else {
            log.trace(`Updating location of player ${data.playerID} to ${data.colonyLocationID}`);
            props.clients.mutateByPredicate(
                (client) => client.id === data.playerID,
                (client) => {
                    //locationID is id of Colony Location
                    return { ...client, state: { ...client.state, lastKnownPosition: data.colonyLocationID } };
                },
            );
        }
    };

    const calculateScalars = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        setViewportDimensions({ width: newWidth, height: newHeight });
        const dns = {
            x: newWidth / EXPECTED_WIDTH,
            y: newHeight / EXPECTED_HEIGHT,
        };
        DNS.set(dns);
        GAS.set(Math.sqrt(Math.min(dns.x, dns.y)));
    };

    onMount(() => {
        calculateScalars();
        window.addEventListener('resize', calculateScalars);
        const playerMoveSubID = props.context.events.subscribe(PLAYER_MOVE_EVENT, handlePlayerMove);

        let generalSpawnLocation;
        if (props.context.multiplayer.getState() === ColonyState.OPEN) {
            generalSpawnLocation = colonyLocations.findFirst((colLoc) => colLoc.locationID === KnownLocations.SpacePort)!;
        } else {
            generalSpawnLocation = colonyLocations.findFirst((colLoc) => colLoc.locationID === KnownLocations.Home)!;
        }
        log.trace(`Setting initial location of local player to ${generalSpawnLocation.id}`);

        props.clients.mutateByPredicate(
            (c) => !c.state.lastKnownPosition || c.state.lastKnownPosition === 0,
            (c) => {
                return {
                    ...c,
                    state: {
                        ...c.state,
                        lastKnownPosition: generalSpawnLocation.id,
                    },
                };
            },
        );

        const locUpgradeSubID = props.context.events.subscribe(LOCATION_UPGRADE_EVENT, (e) => {
            log.info(`Upgrading location: ${e.colonyLocationID} to level ${e.level}`);
            colonyLocations.mutateByPredicate(
                loc => loc.id === e.colonyLocationID,
                loc => {
                    return {
                        ...loc,
                        level: e.level,
                    }
                }
            )
        })

        //Set initial camera position
        //Only works because the createEffect statement is evaluated before this onMount as of right now
        setCurrentLocationOfLocalPlayer(generalSpawnLocation);
        centerCameraOnPoint(generalSpawnLocation.transform.xOffset, generalSpawnLocation.transform.yOffset);

        onCleanup(() => {
            window.removeEventListener('resize', calculateScalars);
            props.context.events.unsubscribe(playerMoveSubID, locUpgradeSubID);
        });
    });

    const computedCameraContainerStyles = createMemo(() => {
        const cameraState = camera.get();
        return css`
            ${cameraContainer}
            top: ${cameraState.y}px;
            left: ${cameraState.x}px;
        `;
    });

    return (
        <div class={pathGraphContainerStyle} id={props.colony.name + '-path-graph'}>
            <div class={computedCameraContainerStyles()} id="camera-container">
                <svg id="paths" class={svgContainerStyle}>
                    <For each={computedPaths.get}>
                        {(line) => <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="white" stroke-width={10} />}
                    </For>
                </svg>

                <For each={colonyLocations.get}>
                    {(colonyLocation) => (
                        <NTAwait func={() => props.context.backend.locations.getInfo(colonyLocation.locationID)}>
                            {(locationInfo) => (
                                <Location
                                    multiplayer={props.context.multiplayer}
                                    colony={props.colony}
                                    colonyLocation={colonyLocation}
                                    location={locationInfo}
                                    gas={GAS.get}
                                    plexer={props.context.events}
                                    backend={props.context.backend}
                                    buffer={props.buffer.get}
                                    actionContext={props.actionContext}
                                    text={props.context.text}
                                    register={props.bufferSubscribers.add}
                                    transform={transformMap.get(colonyLocation.id)!}
                                    enable={getLocationEnabler(colonyLocation.id)}
                                />
                            )}
                        </NTAwait>
                    )}
                </For>

                <For each={props.clients.get}>
                    {(client) => <Player GAS={GAS.get} client={client} transformMap={transformMap} backend={props.context.backend} showNamePlate />}
                </For>

                <For each={colonyAssets.get}>{asset => (
                    <AssetCollection 
                        backend={props.context.backend}
                        id={asset.assetCollectionID}
                        topLevelTransform={asset.wrappedTransform}
                    />
                )}</For>
            </div>

            <ActionInput
                subscribers={props.bufferSubscribers}
                text={props.context.text}
                backend={props.context.backend}
                actionContext={props.actionContext.get}
                setInputBuffer={props.buffer.set}
                inputBuffer={props.buffer.get}
            />
            <Player
                client={{
                    id: props.context.backend.player.local.id,
                    type: props.context.multiplayer.getMode() === MultiplayerMode.AS_GUEST ? OriginType.Guest : OriginType.Owner,
                    IGN: props.context.backend.player.local.firstName,
                    state: {
                        lastKnownPosition: currentLocationOfLocalPlayer()?.id || 0,
                        msOfLastMessage: 0,
                    },
                }}
                GAS={GAS.get}
                transformMap={new Map()}
                backend={props.context.backend}
                styleOverwrite={localPlayerStyle}
                isLocalPlayer={true}
            />
        </div>
    );
};
export default PathGraph;

const localPlayerStyle = css`
    z-index: 200;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
`;

const svgContainerStyle = css`
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10;
    overflow: visible !important;

    filter: drop-shadow(0 0 10px black) drop-shadow(0 10px 10px grey);
`;

const cameraContainer = css`
    position: absolute;
    top: 0;
    left: 0;
    overflow: visible;
    transition:
        top 0.5s ease-in-out,
        left 0.5s ease-in-out;
`;

const pathGraphContainerStyle = css`
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    overflow: visible;
`;
