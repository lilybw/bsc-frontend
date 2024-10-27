import { Component, createSignal, onMount, onCleanup, For } from "solid-js";
import { createArrayStore } from "../../../../ts/arrayStore";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../../../ts/actionContext";
import { createWrappedSignal } from "../../../../ts/wrappedSignal";
import { MinigameProps } from "../miniGame";
import { Asteroid } from "./entities/Asteroid";
import { Player } from "./entities/Player";
import { LazerBeam } from "./entities/LazerBeam";
import { EntityRef } from "./types/EntityTypes";
import {
  handleAsteroidDestruction,
  generateImpactPosition,
  generateSpawnPosition,
  calculatePlayerPositions,
  getRandomRotationSpeed,
  getTargetCenterPosition,
} from "./utils/GameUtils";
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
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { AsteroidsSettingsDTO } from "./types/GameTypes";
import { Position } from "./entities/BaseEntity";
import ActionInput from "../../MainActionInput";
import NTAwait from "../../../util/NoThrowAwait";
import GraphicalAsset from "../../../GraphicalAsset";
import { asteroidButtonStyle, asteroidImageContainerStyle, asteroidStyle, buttonContainerStyle, disabledStyle, impactCircleStyle, lazerBeamStyle, playerCharacterStyle, playerStyle, rotatingStyle, statusStyle, stunnedStyle, wallStyle } from "./styles/GameStyles";
import BufferBasedButton from "../../../BufferBasedButton";
import Countdown from "../../../util/Countdown";
import StarryBackground from "../../../StarryBackground";

/**
 * Main Asteroids minigame component
 */
const AsteroidsMiniGame: Component<MinigameProps<AsteroidsSettingsDTO>> = (props) => {
  // State Management
  const asteroids = createArrayStore<Asteroid>();
  const players = createArrayStore<Player>();
  const asteroidsRemoveFuncs = new Map<number, () => void>();
  const [health, setHealth] = createSignal(props.settings.colonyHealth);
  const [buttonsEnabled, setButtonsEnabled] = createSignal(true);

  // Input and UI State
  const inputBuffer = createWrappedSignal<string>('');
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);

  // Entity Management
  const lazerBeams = createArrayStore<LazerBeam>();
  const lazerBeamRemoveFuncs = new Map<number, () => void>();
  let lazerBeamCounter = 0;
  const elementRefs = new Map<number, EntityRef>();
  const [windowSize, setWindowSize] = createSignal({ width: window.innerWidth, height: window.innerHeight });

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
        "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN"
      );
    }
  };

  /**
   * Processes a player's shot
   */
  const handlePlayerShootAtCodeEvent = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {
    const shooter = players.findFirst((p) => p.id === data.id);
    if (!shooter) return;

    let hitSomething = false;

    // Handle asteroid hits
    const hitAsteroids = asteroids.findAll((a) => a.charCode === data.code);
    if (hitAsteroids.length) {
      hitSomething = true;
      hitAsteroids.forEach((asteroid) => {
        const targetPos = getTargetCenterPosition(asteroid.id, elementRefs);
        if (targetPos) {
          createLazerBeam(shooter.getPosition(), targetPos);
          setTimeout(() => handleAsteroidDestruction(asteroid.id, elementRefs, asteroidsRemoveFuncs), 100);
        }
      });
    }

    // Handle player hits
    const hitPlayers = players.findAll((p) => p.code === data.code && p.id !== data.id);
    if (hitPlayers.length) {
      hitSomething = true;
      hitPlayers.forEach((targetPlayer) => {
        const targetPos = getTargetCenterPosition(targetPlayer.id, elementRefs);
        if (targetPos) {
          createLazerBeam(shooter.getPosition(), targetPos);
          targetPlayer.disable();
          shooter.stun();
        }
      });
    }

    // Handle misses
    if (!hitSomething) {
      const missAngle = Math.random() * Math.PI * 2;
      const missDistance = 0.5;
      const shooterPos = shooter.getPosition();
      const missPos = {
        x: shooterPos.x + Math.cos(missAngle) * missDistance,
        y: shooterPos.y + Math.sin(missAngle) * missDistance
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
      startPosition: { x: start.x, y: start.y },
      endPosition: { x: end.x, y: end.y },
      duration: 1000,
      fadeSpeed: 0.1
    });

    const removeFunc = lazerBeams.add(beam);
    lazerBeamRemoveFuncs.set(id, removeFunc);

    setTimeout(() => {
      const remove = lazerBeamRemoveFuncs.get(id);
      if (remove) {
        remove();
        lazerBeamRemoveFuncs.delete(id);
      }
    }, beam.duration);
  };

  // Component Lifecycle and Event Subscriptions
  onMount(() => {
    // Window resize handler
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    // Update laser beam effects
    const updateLazerBeams = setInterval(() => {
      lazerBeams.mutateByPredicate(
        (beam) => beam.isActive(),
        (beam) => {
          beam.fade();
          return beam;
        }
      );
    }, 50);

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
            health: props.settings.asteroidMaxHealth,
            timeUntilImpact: data.timeUntilImpact,
            speed: data.timeUntilImpact, // Added required property
            element: null,  // Added required property
            destroy: () => handleAsteroidDestruction(data.id, elementRefs, asteroidsRemoveFuncs) // Added required property
          });

          const removeFunc = asteroids.add(asteroid);
          asteroidsRemoveFuncs.set(data.id, removeFunc);
        },
        { internalOrigin: "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN" }
      )
    );

    const asteroidImpactSubID = props.context.events.subscribe(
      ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
      Object.assign(
        (data: AsteroidsAsteroidImpactOnColonyMessageDTO) => {
          setHealth(data.colonyHPLeft);
          handleAsteroidDestruction(data.id, elementRefs, asteroidsRemoveFuncs);
        },
        { internalOrigin: "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN" }
      )
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
            penaltyMultiplier: props.settings.friendlyFirePenaltyMultiplier
          });

          players.add(player);
          const newPositions = calculatePlayerPositions(players.get);

          players.mutateByPredicate(
            (_) => true,
            (player) => {
              const pos = newPositions.get(player.id);
              if (pos) {
                player.setPosition(pos.x, pos.y);
              }
              return player;
            }
          );
        },
        { internalOrigin: "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN" }
      )
    );

    const playerShootSubID = props.context.events.subscribe(
      ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
      Object.assign(handlePlayerShootAtCodeEvent, { internalOrigin: "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN" })
    );

    // Ready event
    props.context.events.emit(
      PLAYER_READY_FOR_MINIGAME_EVENT,
      {
        id: props.context.backend.player.local.id,
        ign: props.context.backend.player.local.firstName,
      },
      "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN"
    );

    // Cleanup
    onCleanup(() => {
      props.context.events.unsubscribe(spawnSubID, asteroidImpactSubID, loadPlayerDataSubID, playerShootSubID);
      clearInterval(updateLazerBeams);
      lazerBeamRemoveFuncs.forEach(removeFunc => removeFunc());
      lazerBeamRemoveFuncs.clear();
      elementRefs.clear();
      window.removeEventListener('resize', handleResize);
    });
  });

  // Component Render
  return (
    <div>
      <StarryBackground />
      <div class={wallStyle} id="Outer-Wall" />
      <div class={statusStyle}>
        Health: {'❤'.repeat(health())}
      </div>
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
                  elementRefs.set(asteroid.id, {
                    type: 'asteroid',
                    element: el
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
                    {(asset) => (
                      <GraphicalAsset metadata={asset} backend={props.context.backend} />
                    )}
                  </NTAwait>
                </div>
              </div>

              {/* Asteroid Button Container */}
              <div class={asteroidButtonStyle}>
                <BufferBasedButton
                  enable={buttonsEnabled}
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
                class={lazerBeamStyle}
                style={{
                  left: `${beam.startX}px`,
                  top: `${beam.startY}px`,
                  width: `${Math.hypot(beam.endX - beam.startX, beam.endY - beam.startY)}px`,
                  transform: `rotate(${Math.atan2(beam.endY - beam.startY, beam.endX - beam.startX)}rad)`,
                  opacity: beam.opacity,
                }}
              />
              <div
                class={impactCircleStyle}
                style={{
                  left: `${beam.endX}px`,
                  top: `${beam.endY}px`,
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
              class={playerStyle}
              ref={(el) => {
                if (el) {
                  console.log('Setting element ref for player:', player.id);
                  elementRefs.set(player.id, {
                    type: 'player',
                    element: el
                  });
                }
              }}
              style={{
                left: `${player.x * 100}%`,
                bottom: '0',
                transform: 'translateX(-50%)',
                position: 'absolute'
              }}
            >
              {/* Button Container */}
              <div class={buttonContainerStyle}>
                <BufferBasedButton
                  enable={buttonsEnabled}
                  name={player.code}
                  buffer={inputBuffer.get}
                  onActivation={() => localPlayerShootAtCodeHandler(player.code)}
                  register={bufferSubscribers.add}
                />
              </div>

              {/* Player Character Container */}
              <div class={playerCharacterStyle}>
                <NTAwait func={() => props.context.backend.assets.getMetadata(7002)}>
                  {(asset) => (
                    <GraphicalAsset metadata={asset} backend={props.context.backend} />
                  )}
                </NTAwait>
                {player.isStunned && <div class={stunnedStyle} />}
                {player.isDisabled && <div class={disabledStyle} />}
              </div>
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



