import BufferBasedButton from "@/components/base/BufferBasedButton";
import GraphicalAsset from "@/components/base/GraphicalAsset";
import StarryBackground from "@/components/base/StarryBackground";
import Countdown from "@/components/util/Countdown";
import NTAwait from "@/components/util/NoThrowAwait";
import { uint32 } from "@/integrations/main_backend/mainBackendDTOs";
import { ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, AsteroidsPlayerShootAtCodeMessageDTO, ASTEROIDS_ASTEROID_SPAWN_EVENT, AsteroidsAsteroidSpawnMessageDTO, ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, AsteroidsAsteroidImpactOnColonyMessageDTO, ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, AsteroidsAssignPlayerDataMessageDTO, PLAYER_READY_FOR_MINIGAME_EVENT } from "@/integrations/multiplayer_backend/EventSpecifications";
import { ApplicationContext, ResErr } from "@/meta/types";
import { BufferSubscriber, TypeIconTuple, ActionContext } from "@/ts/actionContext";
import { createArrayStore } from "@/ts/arrayStore";
import { createWrappedSignal } from "@/ts/wrappedSignal";
import { css } from "@emotion/css";
import { Component, createSignal, createMemo, onMount, onCleanup, For } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import ActionInput from "../../MainActionInput";
import { MinigameComponentInitFunc, loadComputedSettings, KnownMinigames } from "../miniGame";
import PlayerStunEffect from "./components/PlayerStunEffect";
import Asteroid from "./entities/Asteroid";
import { Position } from "./entities/BaseEntity";
import LazerBeam from "./entities/LazerBeam";
import Player from "./entities/Player";
import { statusStyle, timeLeftStyle, asteroidStyle, asteroidImageContainerStyle, rotatingStyle, asteroidButtonStyle, lazerBeamStyle, impactCircleStyle, buttonStyleOverwrite, playerContainerStyle, playerNamePlateStyle } from "./styles/gameStyles";
import { AsteroidsSettingsDTO, EntityRef } from "./types/gameTypes"
import StunParticleManager from "./entities/particles/stunparticles/StunParticleManager";
import { ExplosionData } from "./entities/particles/explosionParticles/ExplosionParticleManager";
import ExplosionEffect from "./components/ExplosionEffect";
import { generateImpactPosition, getEntityRefKey, getRandomRotationSpeed, getTargetCenterPosition, handleAsteroidDestruction, translateSpawnPosition } from "./utils/gameUtils";
import Wall from "./components/Wall";
import Surface from "@/components/base/Surface";

type PlayerState = {
    isStunned: boolean;
    isDisabled: boolean;
};

interface AsteroidsProps {
    context: ApplicationContext;
    settings: AsteroidsSettingsDTO;
}

/**
 * Main Asteroids minigame component
 */
const AsteroidsMiniGame: Component<AsteroidsProps> = (props) => {
    const internalOrigin = 'ASTEROIDS_MINIGAME_INTERNAL_ORIGIN';
    // State Management
    const asteroids = createArrayStore<Asteroid>();
    const players = createArrayStore<Player>();
    const asteroidsRemoveFuncs = new Map<number, () => void>();
    const [health, setHealth] = createSignal(props.settings.colonyHealth);
    const [buttonsEnabled, setButtonsEnabled] = createSignal(true);
    const [playerStates, setPlayerStates] = createSignal<Map<number, PlayerState>>(new Map());
    const updatePlayerState = (playerId: number, state: PlayerState) => {
        setPlayerStates((prev) => {
            const newMap = new Map(prev);
            newMap.set(playerId, state);
            return newMap;
        });
    };
    const playerStatesMemo = createMemo(() => playerStates());
    const getPlayerState = (playerId: number) => playerStatesMemo().get(playerId);

    // Input and UI State
    const inputBuffer = createWrappedSignal<string>('');
    const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
    const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);

    // Entity Management
    const lazerBeams = createArrayStore<LazerBeam>();
    const lazerBeamRemoveFuncs = new Map<number, () => void>();
    let lazerBeamCounter = 0;
    const elementRefs = new Map<string, EntityRef>();
    const [windowSize, setWindowSize] = createSignal({ width: window.innerWidth, height: window.innerHeight });

    // Particle Management
    const playerParticleManagers = new Map<number, StunParticleManager>();
    const explosions = createArrayStore<ExplosionData>();
    let explosionCounter = 0;
    const [wallImpactPosition, setWallImpactPosition] = createSignal({ x: 0, y: 0 });

    /**
     * Handles local player shooting at a specific character code
     */
    const localPlayerShootAtCodeHandler = (charCode: string) => {
        if (charCode) {
            props.context.events.emit(
                ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
                {
                    id: props.context.backend.player.local.id,
                    code: charCode,
                },
                internalOrigin,
            );

            // Handle the shot locally since our subscription will filter it out
            handlePlayerShootAtCodeEvent({
                id: props.context.backend.player.local.id,
                code: charCode,
                senderID: props.context.backend.player.local.id,
                eventID: ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT.id,
            });
        }
    };

    /**
     * Processes a player's shot
     */
    const handlePlayerShootAtCodeEvent = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {

        const shooter = players.findFirst((p) => p.id === data.id);
        if (!shooter) {
            return;
        }

        const playerRefKey = getEntityRefKey.player(shooter.id);
        const shooterRef = elementRefs.get(playerRefKey);
        if (!shooterRef || shooterRef.type !== 'player') {
            return;
        }

        const shooterPos = getTargetCenterPosition(playerRefKey, elementRefs);
        if (!shooterPos) {
            return;
        }

        let hitSomething = false;

        // Handle asteroid hits
        const hitAsteroids = asteroids.findAll((a) => a.charCode === data.code);
        const hitPlayers = players.findAll((p) => p.charCode === data.code);

        if (hitAsteroids.length) {
            hitSomething = true;
            hitAsteroids.forEach((asteroid) => {
                const asteroidRefKey = getEntityRefKey.asteroid(asteroid.id);
                const targetPos = getTargetCenterPosition(asteroidRefKey, elementRefs);
                if (targetPos) {
                    createLazerBeam(shooterPos, targetPos);

                    // Create explosion effect
                    explosions.add({
                        id: explosionCounter++,
                        entityId: asteroid.id,
                        entityType: 'asteroid',
                        config: {
                            size: (asteroid.maxHealth + 1) - asteroid.health,
                            particleCount: (asteroid.maxHealth + 1) - asteroid.health,
                            duration: 1000 * ((asteroid.maxHealth + 1) - asteroid.health)
                        }
                    });

                    handleAsteroidDestruction(asteroid.id, elementRefs, asteroidsRemoveFuncs);
                }
            });
        }

        if (hitPlayers.length) {
            hitSomething = true;
            hitPlayers.forEach((player) => {
                const targetRefKey = getEntityRefKey.player(player.id);
                const targetPos = getTargetCenterPosition(targetRefKey, elementRefs);

                if (targetPos) {
                    createLazerBeam(shooterPos, targetPos);

                    // Create explosion effect
                    explosions.add({
                        id: explosionCounter++,
                        entityId: player.id,
                        entityType: 'player'
                    });

                    player.stun();
                    shooter.disable();
                }
            });
        }

        // Handle misses
        if (!hitSomething) {
            const missAngle = Math.random() * Math.PI * 2;
            const missDistance = 0.5;
            const missPos = {
                x: shooterPos.x + Math.cos(missAngle) * missDistance,
                y: shooterPos.y + Math.sin(missAngle) * missDistance,
            };
            createLazerBeam(shooterPos, missPos);
        }
    };

    /**
     * Creates a new laser beam
     */
    const createLazerBeam = (start: Position, end: Position) => {

        const id = lazerBeamCounter++;
        const beam = new LazerBeam({
            id,
            startPosition: start,
            endPosition: end,
            duration: 1000, // Fades out over 1000 ms
            fadeSpeed: 0.1,
            onComplete: () => {
                const remove = lazerBeamRemoveFuncs.get(id);
                if (remove) {
                    remove();
                    lazerBeamRemoveFuncs.delete(id);
                }
            },
        });

        // Add the beam to the ArrayStore
        const removeFunc = lazerBeams.add(beam);
        lazerBeamRemoveFuncs.set(id, removeFunc);
    };

    // Component Lifecycle and Event Subscriptions
    onMount(async () => {
        // Window resize handler
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);

        // Event Subscriptions
        const spawnSubID = props.context.events.subscribe(
            ASTEROIDS_ASTEROID_SPAWN_EVENT,
            Object.assign(
                (data: AsteroidsAsteroidSpawnMessageDTO) => {
                    const spawnPos = translateSpawnPosition({ width: windowSize().width, height: windowSize().height });
                    const impactPos = generateImpactPosition();

                    const asteroid = new Asteroid({
                        ...data,
                        x: spawnPos.x,
                        y: spawnPos.y,
                        endX: impactPos.x,
                        endY: impactPos.y,
                        timeUntilImpact: data.timeUntilImpact,
                        speed: data.timeUntilImpact,
                        element: null,
                        destroy: () => handleAsteroidDestruction(data.id, elementRefs, asteroidsRemoveFuncs),
                    });

                    const removeFunc = asteroids.add(asteroid);
                    asteroidsRemoveFuncs.set(data.id, removeFunc);
                },
                { internalOrigin },
            ),
        );

        const asteroidImpactSubID = props.context.events.subscribe(
            ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
            Object.assign(
                (data: AsteroidsAsteroidImpactOnColonyMessageDTO) => {
                    const asteroid = asteroids.findFirst(a => a.id === data.id);

                    if (asteroid) {
                        setWallImpactPosition({
                            x: asteroid.endX * windowSize().width,
                            y: asteroid.endY * windowSize().height
                        });
                    }

                    // Original impact handling
                    setHealth(data.colonyHPLeft);
                    handleAsteroidDestruction(data.id, elementRefs, asteroidsRemoveFuncs);
                },
                { internalOrigin },
            ),
        );

        const loadPlayerDataSubID = props.context.events.subscribe(
            ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT,
            Object.assign(
                (data: AsteroidsAssignPlayerDataMessageDTO) => {
                    const player = new Player({
                        ...data,
                        x: data.x * windowSize().width,
                        y: data.y * windowSize().height,
                        element: null,
                        stunDuration: props.settings.stunDurationS,
                        friendlyFirePenalty: props.settings.friendlyFirePenaltyS,
                        penaltyMultiplier: props.settings.friendlyFirePenaltyMultiplier,
                        isLocal: data.id === props.context.backend.player.local.id,
                        onStateChange: (stunned, disabled) => {
                            updatePlayerState(data.id, { isStunned: stunned, isDisabled: disabled });
                        },
                    });

                    if (data.id === props.context.backend.player.local.id) {
                        // Pass the setter to the player
                        player.setButtonStateUpdater((disabled) => setButtonsEnabled(!disabled));
                    }

                    players.add(player);
                    updatePlayerState(player.id, { isStunned: false, isDisabled: false });
                },
                { internalOrigin },
            ),
        );

        const playerShootSubID = props.context.events.subscribe(
            ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
            Object.assign(handlePlayerShootAtCodeEvent, { internalOrigin }),
        );

        // Ready event
        props.context.events.emit(
            PLAYER_READY_FOR_MINIGAME_EVENT,
            {
                id: props.context.backend.player.local.id,
                ign: props.context.backend.player.local.firstName,
            },
            internalOrigin,
        );

        // Cleanup
        onCleanup(() => {
            props.context.events.unsubscribe(spawnSubID, asteroidImpactSubID, loadPlayerDataSubID, playerShootSubID);
            lazerBeamRemoveFuncs.forEach((removeFunc) => removeFunc());
            lazerBeamRemoveFuncs.clear();
            elementRefs.clear();
            // Add particle manager cleanup here
            playerParticleManagers.forEach((manager) => manager.clear());
            playerParticleManagers.clear();
            window.removeEventListener('resize', handleResize);
        });
    });

    // Component Render
    return (
        <div>
            <StarryBackground />
            <Surface context={props.context} />
            <Wall
                context={props.context}
                health={health}
                position={wallImpactPosition}
            />
            <div class={statusStyle}>{'❤'.repeat(health())}</div>
            <Countdown duration={props.settings.survivalTimeS} styleOverwrite={timeLeftStyle} />
            <div>
                {/* Asteroid Rendering */}
                <For each={asteroids.get}>
                    {(asteroid) => (
                        <div
                            id={`asteroid-${asteroid.id}`}
                            class={asteroidStyle}
                            ref={(el) => {
                                if (el) {
                                    elementRefs.set(getEntityRefKey.asteroid(asteroid.id), {
                                        type: 'asteroid',
                                        element: el,
                                    });

                                    el.style.transition = 'none';
                                    el.style.left = `${asteroid.x * 100}%`;
                                    el.style.top = `${asteroid.y * 100}%`;
                                    el.style.transform = 'translate(-50%, -50%)';

                                    void el.offsetHeight;

                                    requestAnimationFrame(() => {
                                        el.style.transition = `all ${asteroid.timeUntilImpact / 1000}s linear`;
                                        // Use the calculated impact position
                                        el.style.left = `${asteroid.endX * 100}%`;
                                        el.style.top = `${asteroid.endY * 100}%`;
                                    });
                                }
                            }}
                        >
                            {/* Asteroid Image Container */}
                            <div class={asteroidImageContainerStyle}>
                                <div class={rotatingStyle(getRandomRotationSpeed())}>
                                    <NTAwait func={() => props.context.backend.assets.getMetadata(7001)}>
                                        {(asset) => <GraphicalAsset metadata={asset} backend={props.context.backend} />}
                                    </NTAwait>
                                </div>
                            </div>

                            {/* Asteroid Button Container */}
                            <div class={asteroidButtonStyle}>
                                <BufferBasedButton
                                    enable={() => buttonsEnabled()}
                                    name={asteroid.charCode}
                                    buffer={inputBuffer.get}
                                    onActivation={() => localPlayerShootAtCodeHandler(asteroid.charCode)}
                                    register={bufferSubscribers.add}
                                />
                            </div>
                        </div>
                    )}
                </For>

                {/* Laser Beams Rendering */}
                <For each={lazerBeams.get}>
                    {(beam) => (
                        <>
                            <div
                                class={`lazerBeam ${lazerBeamStyle}`}
                                style={{
                                    ...beam.getStartCSSPosition(),
                                    width: beam.getBeamWidth(),
                                    transform: `rotate(${beam.getBeamRotation()})`,
                                    opacity: beam.opacity,
                                }}
                            />
                            <div
                                class={`impactCircle ${impactCircleStyle}`}
                                style={{
                                    ...beam.getEndCSSPosition(),
                                    opacity: beam.opacity,
                                }}
                            />
                        </>
                    )}
                </For>

                {/* Player Rendering */}
                <For each={players.get}>
                    {(player) => (
                        <div
                            id={`player-${player.id}`}
                            class={playerContainerStyle(player.x, player.y)}
                            ref={(el) => {
                                elementRefs.set(getEntityRefKey.player(player.id), {
                                    type: 'player',
                                    element: el,
                                });
                            }}
                        >
                            <NTAwait func={() => props.context.backend.assets.getMetadata(7002)}>
                                {(asset) =>
                                    <GraphicalAsset
                                        metadata={asset}
                                        backend={props.context.backend}
                                        styleOverwrite={css`
                                            position: absolute; 
                                            top: 0; 
                                            left: 0; 
                                            width: 100%; 
                                            height: 100%;
                                        `}
                                    />
                                }
                            </NTAwait>
                            <PlayerStunEffect
                                playerId={player.id}
                                playerState={() => getPlayerState(player.id)}
                                stunDuration={props.settings.stunDurationS}
                                elementRefs={elementRefs}
                            />

                            <BufferBasedButton
                                enable={buttonsEnabled}
                                name={player.code}
                                buffer={inputBuffer.get}
                                onActivation={() => localPlayerShootAtCodeHandler(player.code)}
                                register={bufferSubscribers.add}
                                styleOverwrite={buttonStyleOverwrite}
                            />
                            <div class={playerNamePlateStyle}>{player.firstName}</div>
                        </div>
                    )}
                </For>

                <For each={explosions.get}>
                    {(explosion) => (
                        <ExplosionEffect
                            entityId={explosion.entityId}
                            entityType={explosion.entityType}
                            elementRefs={elementRefs}
                            config={explosion.config}
                        />
                    )}
                </For>

                {/* Action Input */}
                <ActionInput
                    subscribers={bufferSubscribers}
                    text={props.context.text}
                    backend={props.context.backend}
                    actionContext={actionContext.get}
                    setInputBuffer={inputBuffer.set}
                    inputBuffer={inputBuffer.get}
                />
            </div>
        </div>
    );
};

export const initAsteroidsComponent: MinigameComponentInitFunc = async (
    context: ApplicationContext,
    difficultyID: uint32,
): Promise<ResErr<JSX.Element>> => {
    const settings = await loadComputedSettings(context.backend, KnownMinigames.ASTEROIDS, difficultyID);
    if (settings.err !== null) {
        return { res: null, err: 'Error initializing minigame component: ' + settings.err };
    }
    const asteroidSettings = settings.res as AsteroidsSettingsDTO;

    return { res: <AsteroidsMiniGame context={context} settings={asteroidSettings} />, err: null };
};
