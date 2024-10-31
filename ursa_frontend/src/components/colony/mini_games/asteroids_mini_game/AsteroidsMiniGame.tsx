import { Component, createSignal, onMount, onCleanup, For, createMemo, createEffect, JSX } from 'solid-js';
import { createArrayStore } from '../../../../ts/arrayStore';
import { ActionContext, BufferSubscriber, TypeIconTuple } from '../../../../ts/actionContext';
import { createWrappedSignal } from '../../../../ts/wrappedSignal';
import { KnownMinigames, loadComputedSettings, MinigameComponentInitFunc } from '../miniGame';
import { Asteroid } from './entities/Asteroid';
import { Player } from './entities/Player';
import { LazerBeam } from './entities/LazerBeam';
import { EntityRef } from './types/EntityTypes';
import {
    handleAsteroidDestruction,
    generateImpactPosition,
    generateSpawnPosition,
    calculatePlayerPositions,
    getRandomRotationSpeed,
    getTargetCenterPosition,
    getEntityRefKey,
} from './utils/GameUtils';
import {
    ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT,
    ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
    ASTEROIDS_ASTEROID_SPAWN_EVENT,
    ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
    PLAYER_READY_FOR_MINIGAME_EVENT,
    AsteroidsAssignPlayerDataMessageDTO,
    AsteroidsAsteroidImpactOnColonyMessageDTO,
    AsteroidsAsteroidSpawnMessageDTO,
    AsteroidsPlayerShootAtCodeMessageDTO,
} from '../../../../integrations/multiplayer_backend/EventSpecifications';
import { AsteroidsSettingsDTO } from './types/GameTypes';
import { Position } from './entities/BaseEntity';
import ActionInput from '../../MainActionInput';
import NTAwait from '../../../util/NoThrowAwait';
import {
    asteroidButtonStyle,
    asteroidImageContainerStyle,
    asteroidStyle,
    buttonContainerStyle,
    impactCircleStyle,
    lazerBeamStyle,
    playerCharacterStyle,
    playerStyle,
    rotatingStyle,
    statusStyle,
    stunEffectStyle,
    stunnedStyle,
    stunParticleStyle,
    wallStyle,
} from './styles/GameStyles';
import Countdown from '../../../util/Countdown';
import BufferBasedButton from '../../../base/BufferBasedButton';
import GraphicalAsset from '../../../base/GraphicalAsset';
import StarryBackground from '../../../base/StarryBackground';
import { BaseParticle, ParticleManager, StunParticle } from './entities/particles';
import { particleContainerStyle } from './styles/ParticleStyles';
import PlayerStunEffect from './components/PlayerStunEffect';
import { ApplicationContext, ResErr } from '../../../../meta/types';
import { uint32 } from '../../../../integrations/main_backend/mainBackendDTOs';

type PlayerState = {
    isStunned: boolean;
    isDisabled: boolean;
};

interface AsteroidsProps {
    context: ApplicationContext;
    settings: AsteroidsSettingsDTO;
}

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
    const playerParticleManagers = new Map<number, ParticleManager>();

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
        console.log('Shot event received:', data);

        const shooter = players.findFirst((p) => p.id === data.id);
        if (!shooter) {
            console.error('No shooter found for ID:', data.id);
            return;
        }

        const playerRefKey = getEntityRefKey.player(shooter.id);
        const shooterRef = elementRefs.get(playerRefKey);
        if (!shooterRef || shooterRef.type !== 'player') {
            console.error('Invalid shooter reference:', shooterRef);
            return;
        }

        const shooterPos = getTargetCenterPosition(playerRefKey, elementRefs);
        if (!shooterPos) {
            console.error('Could not get shooter position for ID:', shooter.id);
            return;
        }
        console.log('Shooter position:', shooterPos);

        let hitSomething = false;

        // Handle asteroid hits
        const hitAsteroids = asteroids.findAll((a) => a.charCode === data.code);
        const hitPlayers = players.findAll((p) => p.charCode === data.code);
        console.log('Checking asteroids with code:', data.code, 'Found:', hitAsteroids.length);
        console.log('Checking players with code:', data.code, 'Found:', hitPlayers.length);

        if (hitAsteroids.length) {
            hitSomething = true;
            hitAsteroids.forEach((asteroid) => {
                console.log('Processing hit on asteroid:', asteroid.id);
                const asteroidRefKey = getEntityRefKey.asteroid(asteroid.id);
                const targetPos = getTargetCenterPosition(asteroidRefKey, elementRefs);
                console.log('Target position for asteroid:', targetPos);

                if (targetPos) {
                    console.log('Creating beam for asteroid hit:', {
                        from: shooterPos,
                        to: targetPos,
                        asteroidId: asteroid.id,
                    });

                    createLazerBeam(shooterPos, targetPos);

                    console.log('Destroying asteroid:', asteroid.id);
                    handleAsteroidDestruction(asteroid.id, elementRefs, asteroidsRemoveFuncs);
                } else {
                    console.error('No target position found for asteroid:', asteroid.id);
                }
            });
        }

        if (hitPlayers.length) {
            hitSomething = true;
            hitPlayers.forEach((player) => {
                console.log('Processing hit on player:', player.id);
                const targetRefKey = getEntityRefKey.player(player.id);
                const targetPos = getTargetCenterPosition(targetRefKey, elementRefs);
                console.log('Target position for player:', targetPos);

                if (targetPos) {
                    console.log('Creating beam for player hit:', {
                        from: shooterPos,
                        to: targetPos,
                        playerId: player.id,
                    });

                    createLazerBeam(shooterPos, targetPos);

                    player.stun();
                    shooter.disable();
                } else {
                    console.error('No target position found for player:', player.id);
                }
            });
        }

        // Handle misses
        if (!hitSomething) {
            console.log('Shot missed, creating miss effect');
            const missAngle = Math.random() * Math.PI * 2;
            const missDistance = 0.5;
            const missPos = {
                x: shooterPos.x + Math.cos(missAngle) * missDistance,
                y: shooterPos.y + Math.sin(missAngle) * missDistance,
            };
            console.log('Miss beam coordinates:', {
                from: shooterPos,
                to: missPos,
            });
            createLazerBeam(shooterPos, missPos);
        }
    };

    /**
     * Creates a new laser beam
     */
    const createLazerBeam = (start: Position, end: Position) => {
        console.log('Creating lazer beam:', { id: lazerBeamCounter, start, end });

        const id = lazerBeamCounter++;
        const beam = new LazerBeam({
            id,
            startPosition: start,
            endPosition: end,
            duration: 1000, // Fades out over 1000 ms
            fadeSpeed: 0.1,
            onComplete: () => {
                console.log('Lazer beam complete:', id);
                const remove = lazerBeamRemoveFuncs.get(id);
                if (remove) {
                    console.log('Removing lazer beam:', id);
                    remove();
                    lazerBeamRemoveFuncs.delete(id);
                }
            },
        });

        // Add the beam to the ArrayStore
        const removeFunc = lazerBeams.add(beam);
        lazerBeamRemoveFuncs.set(id, removeFunc);
        console.log('Beam creation complete:', id);
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
                    const spawnPos = generateSpawnPosition({ width: windowSize().width, height: windowSize().height });
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
                        x: 0,
                        y: 0.9,
                        element: null,
                        stunDuration: props.settings.stunDurationS,
                        friendlyFirePenalty: props.settings.friendlyFirePenaltyS,
                        penaltyMultiplier: props.settings.friendlyFirePenaltyMultiplier,
                        isLocal: data.id === props.context.backend.player.local.id,
                        onStateChange: (stunned, disabled) => {
                            console.log(`Player ${data.id} state change:`, { stunned, disabled });
                            updatePlayerState(data.id, { isStunned: stunned, isDisabled: disabled });
                        },
                    });

                    if (data.id === props.context.backend.player.local.id) {
                        // Pass the setter to the player
                        player.setButtonStateUpdater((disabled) => setButtonsEnabled(!disabled));
                    }

                    players.add(player);
                    updatePlayerState(player.id, { isStunned: false, isDisabled: false });
                    const newPositions = calculatePlayerPositions(players.get);

                    players.mutateByPredicate(
                        (_) => true,
                        (player) => {
                            const pos = newPositions.get(player.id);
                            if (pos) {
                                player.setPosition(pos.x, pos.y);
                            }
                            return player;
                        },
                    );
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
            <div class={wallStyle} id="Outer-Wall" />
            <div class={statusStyle}>{'❤'.repeat(health())}</div>
            <Countdown duration={props.settings.survivalTimeS} />
            <div>
                {/* Asteroid Rendering */}
                <For each={asteroids.get}>
                    {(asteroid) => (
                        <div
                            id={`asteroid-${asteroid.id}`}
                            class={asteroidStyle}
                            ref={(el) => {
                                if (el) {
                                    console.log('Setting element ref for asteroid:', asteroid.id);
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
                            class={playerStyle}
                            ref={(el) => {
                                if (el) {
                                    console.log('Setting element ref for player:', player.id);
                                    elementRefs.set(getEntityRefKey.player(player.id), {
                                        type: 'player',
                                        element: el,
                                    });
                                }
                            }}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 0,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            {/* Button Container */}
                            <div class={buttonContainerStyle}>
                                <BufferBasedButton
                                    enable={() => buttonsEnabled()}
                                    name={player.code}
                                    buffer={inputBuffer.get}
                                    onActivation={() => localPlayerShootAtCodeHandler(player.code)}
                                    register={bufferSubscribers.add}
                                />
                            </div>

                            {/* Player Rendering */}
                            <For each={players.get}>
                                {(player) => (
                                    <div
                                        id={`player-${player.id}`}
                                        class={playerStyle}
                                        ref={(el) => {
                                            if (el) {
                                                console.log('Setting element ref for player:', player.id);
                                                elementRefs.set(getEntityRefKey.player(player.id), {
                                                    type: 'player',
                                                    element: el,
                                                });
                                            }
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: '50%',
                                            bottom: 0,
                                            transform: 'translateX(-50%)',
                                        }}
                                    >
                                        {/* Button Container */}
                                        <div class={buttonContainerStyle}>
                                            <BufferBasedButton
                                                enable={() => buttonsEnabled()}
                                                name={player.code}
                                                buffer={inputBuffer.get}
                                                onActivation={() => localPlayerShootAtCodeHandler(player.code)}
                                                register={bufferSubscribers.add}
                                            />
                                        </div>

                                        {/* Player Character Container */}
                                        <div class={playerCharacterStyle}>
                                            <div style={{ position: 'relative' }}>
                                                <NTAwait func={() => props.context.backend.assets.getMetadata(7002)}>
                                                    {(asset) => (
                                                        <>
                                                            <GraphicalAsset metadata={asset} backend={props.context.backend} />
                                                            <PlayerStunEffect
                                                                playerId={player.id}
                                                                playerState={() => getPlayerState(player.id)}
                                                                stunDuration={props.settings.stunDurationS}
                                                                elementRefs={elementRefs}
                                                            />
                                                        </>
                                                    )}
                                                </NTAwait>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
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

export default AsteroidsMiniGame;
