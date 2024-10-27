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
  const internalOrigin = "ASTEROIDS_MINIGAME_INTERNAL_ORIGIN"

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
        internalOrigin
      );

      // Handle the shot locally since our subscription will filter it out
      handlePlayerShootAtCodeEvent({
        id: props.context.backend.player.local.id,
        code: charCode,
        senderID: props.context.backend.player.local.id,
        eventID: ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT.id
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

    let hitSomething = false;
    const shooterPos = shooter.getPosition();
    console.log('Shooter position:', shooterPos);

    // Handle asteroid hits
    const hitAsteroids = asteroids.findAll((a) => a.charCode === data.code);
    const hitPlayers = players.findAll((p) => p.charCode === data.code);
    console.log('Checking asteroids with code:', data.code, 'Found:', hitAsteroids.length);
    console.log('Checking players with code:', data.code, 'Found:', hitPlayers.length);

    if (hitAsteroids.length) {
      hitSomething = true;
      hitAsteroids.forEach((asteroid) => {
        console.log('Processing hit on asteroid:', asteroid.id);
        const targetPos = getTargetCenterPosition(asteroid.id, elementRefs);
        console.log('Target position for asteroid:', targetPos);

        if (targetPos) {
          console.log('Creating beam for asteroid hit:', {
            from: shooterPos,
            to: targetPos,
            asteroidId: asteroid.id
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
        const targetPos = getTargetCenterPosition(player.id, elementRefs);
        console.log('Target position for player:', targetPos);

        if (targetPos) {
          console.log('Creating beam for player hit:', {
            from: shooterPos,
            to: targetPos,
            asteroidId: player.id
          });

          createLazerBeam(shooterPos, targetPos);

          player.stun()
          shooter.disable()
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
        y: shooterPos.y + Math.sin(missAngle) * missDistance
      };
      console.log('Miss beam coordinates:', {
        from: shooterPos,
        to: missPos
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
      }
    });

    // Directly add the beam to the ArrayStore, no need to initialize
    const removeFunc = lazerBeams.add(beam);
    lazerBeamRemoveFuncs.set(id, removeFunc);
    console.log('Beam creation complete:', id);
  };


  // Component Lifecycle and Event Subscriptions
  onMount(() => {
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
            health: props.settings.asteroidMaxHealth,
            timeUntilImpact: data.timeUntilImpact,
            speed: data.timeUntilImpact, // Added required property
            element: null,  // Added required property
            destroy: () => handleAsteroidDestruction(data.id, elementRefs, asteroidsRemoveFuncs) // Added required property
          });

          const removeFunc = asteroids.add(asteroid);
          asteroidsRemoveFuncs.set(data.id, removeFunc);
        },
        { internalOrigin }
      )
    );

    const asteroidImpactSubID = props.context.events.subscribe(
      ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
      Object.assign(
        (data: AsteroidsAsteroidImpactOnColonyMessageDTO) => {
          setHealth(data.colonyHPLeft);
          handleAsteroidDestruction(data.id, elementRefs, asteroidsRemoveFuncs);
        },
        { internalOrigin }
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
            penaltyMultiplier: props.settings.friendlyFirePenaltyMultiplier,
            isLocal: data.id === props.context.backend.player.local.id
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
        { internalOrigin }
      )
    );

    const playerShootSubID = props.context.events.subscribe(
      ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
      Object.assign(handlePlayerShootAtCodeEvent, { internalOrigin })
    );

    // Ready event
    props.context.events.emit(
      PLAYER_READY_FOR_MINIGAME_EVENT,
      {
        id: props.context.backend.player.local.id,
        ign: props.context.backend.player.local.firstName,
      },
      internalOrigin
    );

    // Cleanup
    onCleanup(() => {
      props.context.events.unsubscribe(spawnSubID, asteroidImpactSubID, loadPlayerDataSubID, playerShootSubID);
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
                position: 'absolute',
                left: '50%',  // Start at center
                bottom: 0,    // Stick to bottom
                transform: 'translateX(-50%)'  // Center horizontally
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



