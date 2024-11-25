import { TransformDTO, uint32 } from "@/integrations/main_backend/mainBackendDTOs";
import { ApplicationContext, ResErr } from "@/meta/types";
import { JSX } from "solid-js/jsx-runtime";
import { KnownMinigames, loadComputedSettings, MinigameComponentInitFunc } from "../miniGame";
import { Accessor, createEffect, createMemo, createSignal, For, onCleanup, onMount, untrack } from "solid-js";
import { ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, ASTEROIDS_ASTEROID_SPAWN_EVENT, ASTEROIDS_PLAYER_PENALTY_EVENT, ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, AsteroidsAssignPlayerDataMessageDTO, AsteroidsAsteroidSpawnMessageDTO } from "@/integrations/multiplayer_backend/EventSpecifications";
import { createArrayStore } from "@/ts/arrayStore";
import { OnEventCallback } from "@/integrations/multiplayer_backend/eventMultiplexer";
import { css } from "@emotion/css";
import StarryBackground from "@/components/base/StarryBackground";
import ActionInput from "../../MainActionInput";
import { createCooldownSignal, createDelayedSignal, createWrappedSignal, WrappedSignal } from "@/ts/wrappedSignal";
import { ActionContext, BufferSubscriber } from "@/ts/actionContext";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import NTAwait from "@/components/util/NoThrowAwait";
import BufferBasedButton from "@/components/base/BufferBasedButton";
import { angle, angleBetween, Circle, Line, normalizeVec2, Vec2, Vec2_ZERO } from "@/ts/geometry";
import { Styles } from "@/styles/sharedCSS";
import Countdown from "@/components/util/Countdown";
import BurstEmitter, { BurstEmitterProps } from "../utils/BurstEmitter";
import PlanetSurface from "@/components/base/PlanetSurface";
import ColonyWall from "../utils/ColonyWall";
import { AsteroidsSettingsDTO } from "./AsteroidsGameLoop";
import PlanetMoonSystem from "@/components/base/PlanetWithMoon";
import { lerp } from "@/ts/ursaMath";
import { fireParticleStyle } from "./entities/particles/fireParticleStyle";
import ContinuousEmitter from "../utils/ContinuousEmitter";
import { AsteroidsStyles } from "../styles/AsteroidsStyles";
import { c } from "node_modules/vite/dist/node/types.d-aGj9QkWt";

interface AsteroidsDisplayComponentProps {
    context: ApplicationContext;
    settings: AsteroidsSettingsDTO;
}

export interface ExtendedAsteroidDTO extends AsteroidsAsteroidSpawnMessageDTO {
    /** Intentionally not reactive */
    startPosition: TransformDTO;
}

export interface ExtendedPlayerDTO extends AsteroidsAssignPlayerDataMessageDTO {
    disabled: WrappedSignal<boolean>;
    transform: WrappedSignal<TransformDTO>;
    barrelRotation: WrappedSignal<number>;
}

const INTERNAL_ORIGIN = 'asteroids_display_component';
const LASER_DURATION_MS = 500;
const CAMERA_SHAKE_DURATION_MS = 500;
function assignOrigin<T>(handler: OnEventCallback<T>): OnEventCallback<T> {
    handler.internalOrigin = INTERNAL_ORIGIN;
    return handler;
}

const toTransformPlayer = (data: AsteroidsAssignPlayerDataMessageDTO, viewport: Vec2) => {
    //Draws from original x and y relative values from server, so doesn't need to carry the
    //"original" transform to assure consistency
    return {
        xOffset: data.x * viewport.x,
        yOffset: data.y * viewport.y,
        zIndex: 10,
        xScale: 1,
        yScale: 1,
    };
}
const toTransformAsteroid = (data: AsteroidsAsteroidSpawnMessageDTO, viewport: Accessor<Vec2>) => {
    const dim = viewport();
    return {
        xOffset: dim.x * 1.05,
        yOffset: data.y * dim.y,
        zIndex: 11,
        xScale: 1,
        yScale: 1,
    };
}
const mapKeyOfAsteroid = (id: number): ComputedMapKey => `a-${id}`;
const mapKeyOfPlayer = (id: number): ComputedMapKey => `p-${id}`;
type ComputedMapKey = string;

export default function AsteroidsDisplayComponent({ context, settings }: AsteroidsDisplayComponentProps): JSX.Element {
    const log = context.logger.copyFor('ast disp comp');
    // Game state
    const players = createArrayStore<ExtendedPlayerDTO>();
    const asteroids = createArrayStore<ExtendedAsteroidDTO>();
    const [health, setHealth] = createSignal(settings.colonyHealth);
    // World state
    const viewportDim = createDelayedSignal<Vec2>({ x: window.innerWidth, y: window.innerHeight });
    const laserBeams = createArrayStore<Line>();
    const laserImpacts = createArrayStore<Circle>();
    const elements = new Map<ComputedMapKey, HTMLElement>();
    const explosions = createArrayStore<BurstEmitterProps>();
    const cameraShake = createCooldownSignal(false, { cooldown: CAMERA_SHAKE_DURATION_MS });
    const impactPositions = createArrayStore<Vec2>();
    // Inputs
    const buffer = createWrappedSignal<string>('');
    const subscribers = createArrayStore<BufferSubscriber<string>>();

    const actionContext = createMemo(() => {
        let fromLocalPlayerState = ActionContext.ASTEROIDS;
        players.forAny(p => p.id === context.backend.player.local.id, p => {
            fromLocalPlayerState = p.disabled.get() ? ActionContext.TEMPORARILY_DISABLED : ActionContext.ASTEROIDS;
        })  
        return fromLocalPlayerState;
    })

    createEffect(() => {
        // Accessor invoked, statement is now reactive
        const dim = viewportDim.get();

        // Untrack lets this ignore any updates to the array store
        untrack(() => {
            for (const player of players.get) {
                player.transform.set(toTransformPlayer(player, dim));
            }
        })
    });

    const disablePlayer = (player: ExtendedPlayerDTO, durationMS: number, reason: "miss" | "friendlyFire" | "firedUpon") => {
        player.disabled.set(true);
        setTimeout(() => { player.disabled.set(false); }, durationMS);
    }

    const triggerCameraShake = () => {
        cameraShake.set(true);
        setTimeout(() => cameraShake.set(false), CAMERA_SHAKE_DURATION_MS);
    }

    /** non-reactive copy, altough updated with element ref */
    let localPlayer: ExtendedPlayerDTO | undefined;
    onMount(() => {
        const subscribe = context.events.subscribe;
        const playerDataAssignSubID = subscribe(ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, assignOrigin((data) => {
            const instance: ExtendedPlayerDTO = {
                ...data,
                transform: createWrappedSignal(toTransformPlayer(data, viewportDim.get())),
                disabled: createWrappedSignal(false),
                barrelRotation: createWrappedSignal(Math.PI / 2),  // Initialize at 90 degrees
            }
            if (data.id === context.backend.player.local.id) {
                localPlayer = instance;
            }
            players.add(instance);
        }));
        const asteroidSpawnSubID = subscribe(ASTEROIDS_ASTEROID_SPAWN_EVENT, assignOrigin((data) => {
            const instance = {
                ...data,
                startPosition: toTransformAsteroid(data, viewportDim.get),
            }
            asteroids.add(instance);
        }));
        const asteroidImpactSubID = subscribe(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, assignOrigin((data) => {
            const center = getComputedCenter(data.id, "asteroid");
            log.trace("impact at " + JSON.stringify(center));
            impactPositions.add(center);
            setHealth(data.colonyHPLeft);
            asteroids.cullByPredicate(a => a.id === data.id);
            triggerCameraShake();
        }));
        const playerShootAtCodeSubID = subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, assignOrigin((data) => {
            players.forAny(p => p.code === data.code, playerHit => {
                playerHit.disabled.set(true);
                setTimeout(() => {
                    playerHit.disabled.set(false);
                }, settings.stunDurationS * 1000);
            });
            //Handles all animations
            onPlayerFire(data.code, players.findFirst(p => p.id === data.id));
        }));
        const playerPenaltySubID = subscribe(ASTEROIDS_PLAYER_PENALTY_EVENT, assignOrigin((data) => {
            disablePlayer(
                players.findFirst(p => p.id === data.playerID)!,
                data.timeoutDurationS * 1000, data.type as any
            );
        }));

        const onWindowResize = () => viewportDim.set(
            { x: window.innerWidth, y: window.innerHeight }
        );
        window.addEventListener('resize', onWindowResize);

        onCleanup(() => {
            context.events.unsubscribe(
                playerDataAssignSubID,
                asteroidSpawnSubID,
                asteroidImpactSubID,
                playerShootAtCodeSubID,
                playerPenaltySubID
            );
            window.removeEventListener('resize', onWindowResize);
        })
    })

    const maxParticleCount = 50;
    const queueAsteroidExplosion = (asteroid: ExtendedAsteroidDTO, theBigOne = false, incomingNormalized?: Vec2, center?: Vec2) => {
        const duration = theBigOne ? 1000 : 500;
        const removeFunc = explosions.add({
            coords: center ?? getComputedCenter(asteroid.id, "asteroid"),
            durationMS: duration,
            particleCount: theBigOne ? maxParticleCount : 20,
            size: theBigOne ? 35 : 20,
            incomingNormalized,
            incomingWeight: theBigOne ? 0 : .6,
            particleGeneratorFunc: (index, animation, children) => <div class={css`
                ${fireParticleStyle}
                ${animation}
            `}>{children}</div>,
        });
        setTimeout(removeFunc, duration);
    }

    /** Expensive as it uses element.getBoundingClientRect 
     * @returns 0 0 if no element was found
    */
    const getComputedCenter = (id: number, type: "player" | "asteroid"): Vec2 => {
        const mapKey = type === "player" ? mapKeyOfPlayer(id) : mapKeyOfAsteroid(id);
        const element = elements.get(mapKey);
        if (!element) {
            log.warn(`Could not find element for ${type} ${id}. Cannot compute center`);
            return Vec2_ZERO;
        }
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    const spawnLaser = (from: Vec2, to: Vec2) => {
        const removeBeam = laserBeams.add({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
        const removeImpact = laserImpacts.add({
            x: to.x,
            y: to.y,
            radius: 15  // Base radius for impact circle
        });

        setTimeout(() => {
            removeBeam();
            removeImpact();
        }, LASER_DURATION_MS);
    }

    const onPlayerFire = (charCode: string, player: ExtendedPlayerDTO = localPlayer!) => {
        // Events are never replicated back to sender (not counting mock server)
        // so if this is the local player, the event must be emitted
        if (player.id === context.backend.player.local.id) {
            context.events.emit(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, {
                code: charCode,
                id: context.backend.player.local.id,
            }, INTERNAL_ORIGIN);
        }

        const playerCenter = getComputedCenter(player.id, "player");

        //Handling shot on asteroid
        let centerLatestElementHit: Vec2 | undefined;
        const asteroidsHit: ExtendedAsteroidDTO[] = [];
        const asteroidsDestroyed: number[] = [];
        asteroids.mutateByPredicate(a => a.charCode === charCode, (asteroid) => {
            const newInstance = { ...asteroid, health: asteroid.health - 1 };
            asteroidsHit.push(newInstance);
            return newInstance;
        });
        for (const asteroid of asteroidsHit) {
            const asteroidCenter = getComputedCenter(asteroid.id, "asteroid");
            centerLatestElementHit = asteroidCenter;

            spawnLaser(playerCenter, asteroidCenter);
            const incomingVector = { x: (asteroidCenter.x - playerCenter.x), y: (asteroidCenter.y - playerCenter.y) };
            const normalized = normalizeVec2(incomingVector);

            const isDead = asteroid.health <= 0;
            queueAsteroidExplosion(asteroid, isDead, normalized, asteroidCenter);
            if (isDead) asteroidsDestroyed.push(asteroid.id);
        }
        asteroids.cullByPredicate(a => asteroidsDestroyed.includes(a.id));

        //Handling shot on player
        players.get.filter(p => p.code === charCode).forEach(player2 => {
            const player2Center = getComputedCenter(player2.id, "player");
            centerLatestElementHit = player2Center;
            spawnLaser(playerCenter, player2Center);
            disablePlayer(player2, settings.stunDurationS * 1000, "firedUpon");
        });

        if (centerLatestElementHit) {

            const anglePlayerTarget = angleBetween(playerCenter, centerLatestElementHit)

            player.barrelRotation.set(anglePlayerTarget)
        }
    }

    const computedCameraShakeStyles = createMemo(() => {
        return css([{ position: "absolute", width: "100%", height: "100%" },
        cameraShake.get() ? Styles.ANIM.SHAKE({ seconds: CAMERA_SHAKE_DURATION_MS / 1000, strength: 2 }) : ""
        ]);
    })

    return (
        <div id="asteroids-display-component" class={AsteroidsStyles.component}>
            <StarryBackground backend={context.backend} />
            <PlanetMoonSystem
                backend={context.backend}
                moonCount={1}
                styleOverwrite={AsteroidsStyles.planets.system1}
            />
            <PlanetMoonSystem
                backend={context.backend}
                moonCount={1}
                styleOverwrite={AsteroidsStyles.planets.system2}
            />

            <ActionInput
                subscribers={subscribers}
                text={context.text}
                backend={context.backend}
                actionContext={actionContext}
                setInputBuffer={buffer.set}
                inputBuffer={buffer.get}
                maintainFocus={true}
            />
            <Countdown duration={settings.survivalTimeS} styleOverwrite={timeLeftStyle} />

            <div id="camera-shake-container" class={computedCameraShakeStyles()}>
                <div class={healthStyle}>{'❤'.repeat(health())}</div>

                <PlanetSurface backend={context.backend} />
                <ColonyWall backend={context.backend} impactPositions={impactPositions} health={health} />

                <For each={players.get}>{player => {
                    return (
                        <div class={AsteroidsStyles.player.container(player.transform.get())}
                            ref={e => elements.set(mapKeyOfPlayer(player.id), e)}
                        >
                            {/* Static base image container */}
                            <NTAwait func={() => context.backend.assets.getMetadata(7007)}>{(asset) =>
                                <GraphicalAsset
                                    metadata={asset}
                                    backend={context.backend}
                                    styleOverwrite={AsteroidsStyles.player.base}
                                />
                            }</NTAwait>

                            <NTAwait func={() => context.backend.assets.getMetadata(7008)}>{(asset) =>
                                <GraphicalAsset
                                    metadata={asset}
                                    backend={context.backend}
                                    styleOverwrite={AsteroidsStyles.player.cannon(player.barrelRotation.get())}
                                />
                            }</NTAwait>

                            {/* Smoke Emitter */}
                            <ContinuousEmitter
                                coords={{ x: 50, y: 50 }}
                                relativePositioning
                                zIndex={10}
                                spawnRate={2}
                                spread={.35}
                                size={{x: 10, y: 20}}
                                particleSize={.3}
                                generatorFunc={(d, a, c) => 
                                    <div class={a} style={`background: radial-gradient(circle, ${d.index % 2 === 0 ? "grey" : "black"}, transparent 50%)`}>{c}
                                    </div>
                                }
                                active={player.disabled.get}
                            />

                            <BufferBasedButton
                                register={subscribers.add}
                                buffer={buffer.get}
                                onActivation={() => onPlayerFire(player.code, player)}
                                name={player.code}
                                styleOverwrite={AsteroidsStyles.player.button}
                                activationDelay={100}
                            />
                        </div>
                    );
                }}</For>

                {/* Laser beams container */}
                <svg class={AsteroidsStyles.laser.container}>
                    <For each={laserBeams.get}>{line =>
                        <g class={AsteroidsStyles.laser.fadeAnimation}>
                            <line
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="white"
                                stroke-width="6"
                            />
                            <line
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="red"
                                stroke-width="2"
                            />
                        </g>
                    }</For>
                </svg>

                <For each={asteroids.get}>{asteroid =>
                    <div
                        class={getAsteroidStyles(asteroid, viewportDim.get())}
                        ref={e => elements.set(mapKeyOfAsteroid(asteroid.id), e)}
                    >
                        <NTAwait func={() => context.backend.assets.getMetadata(7001)}>{(asset) =>
                            <GraphicalAsset
                                metadata={asset}
                                backend={context.backend}
                                styleOverwrite={css({
                                    position: "absolute",
                                    filter: `brightness(${1 - (asteroid.health * 0.2)})`,
                                    transform: `scale(${0.5 + (asteroid.health * 0.3)})`
                                })}
                            />
                        }</NTAwait>
                        <BufferBasedButton
                            register={subscribers.add}
                            buffer={buffer.get}
                            onActivation={() => onPlayerFire(asteroid.charCode)}
                            name={asteroid.charCode}
                            styleOverwrite={css([
                                Styles.POSITION.TRANSFORM_CENTER_X,
                                {
                                    position: "absolute",
                                    bottom: 0,
                                    filter: "drop-shadow(0 0 0.5rem black)"
                                }
                            ])}
                            activationDelay={100}
                        />
                    </div>
                }</For>

                <For each={explosions.get}>{props => <BurstEmitter {...props} />}</For>
            </div>
        </div>
    );
}

export const initAsteroidsDisplayComponent: MinigameComponentInitFunc = async (
    context: ApplicationContext,
    difficultyID: uint32,
): Promise<ResErr<JSX.Element>> => {
    const settings = await loadComputedSettings(context.backend, KnownMinigames.ASTEROIDS, difficultyID);
    if (settings.err !== null) {
        return { res: null, err: 'Error initializing minigame component: ' + settings.err };
    }
    const asteroidSettings = settings.res as AsteroidsSettingsDTO;

    return { res: <AsteroidsDisplayComponent context={context} settings={asteroidSettings} />, err: null };
};

const healthStyle = css`
    position: absolute;
    left: 1vh;
    color: #004f00;
    text-shadow: 0 0 0.5rem rgba(0, 255, 0, 1);
    font-size: 5rem;
`;

const timeLeftStyle = css`
    ${Styles.SUB_TITLE}
    position: absolute;
    left: 1vh;
    top: 10vh;
`

const generateAnimatedSVGLine = (line: Line) => {
    return (
        <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="white" stroke-width="6">
            <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="red" stroke-width="2" />
        </line>)
}

const getAsteroidStyles = (asteroid: ExtendedAsteroidDTO, dim: Vec2) => css`
    ${Styles.POSITION.transformToCSSVariables(asteroid.startPosition)}
    ${Styles.POSITION.TRANSFORM_APPLICATOR}
    ${computeAsteroidAnimation(asteroid, dim)}
    z-index: 100000;
`

const computeAsteroidAnimation = (asteroid: ExtendedAsteroidDTO, dim: Vec2) => {
    let endPositionY = dim.y - asteroid.startPosition.yOffset
    endPositionY = lerp(endPositionY, dim.y * .6, dim.y * .95);

    return css`
        animation: asteroid-${asteroid.id} ${asteroid.timeUntilImpact / 1000}s forwards linear;
        @keyframes asteroid-${asteroid.id} {
            0% { 
                top: ${asteroid.startPosition.yOffset}px;
                left: ${asteroid.startPosition.xOffset}px;
            }
            100% { 
                top: ${endPositionY}px;
                left: ${dim.x * -0.05}px;
            }
        }`
}