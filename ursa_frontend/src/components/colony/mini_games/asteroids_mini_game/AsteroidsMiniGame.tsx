import { Component, createSignal, onMount, onCleanup, For } from "solid-js";
import { css } from "@emotion/css";
import {
  ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT,
  ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
  ASTEROIDS_ASTEROID_SPAWN_EVENT,
  ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
  AsteroidsAssignPlayerDataMessageDTO,
  AsteroidsAsteroidSpawnMessageDTO,
  AsteroidsPlayerShootAtCodeMessageDTO,
  PLAYER_READY_FOR_MINIGAME_EVENT,
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { createArrayStore } from "../../../../ts/arrayStore";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../../../ts/actionContext";
import { createWrappedSignal } from "../../../../ts/wrappedSignal";
import ActionInput from "../../MainActionInput";
import BufferBasedButton from "../../../BufferBasedButton";
import { MinigameProps } from "../miniGame";
import { uint32 } from "../../../../integrations/main_backend/mainBackendDTOs";
import Countdown from "../../../util/Countdown";
import StarryBackground from "../../../StarryBackground";
import NTAwait from "../../../util/NoThrowAwait";
import GraphicalAsset from "../../../GraphicalAsset";

/**
 * Settings DTO for the Asteroids minigame.
 * All time values are in seconds unless specified otherwise.
 */
export type AsteroidsSettingsDTO = {
  minTimeTillImpactS: number,      // Minimum time for asteroid to reach impact point
  maxTimeTillImpactS: number,      // Maximum time for asteroid to reach impact point
  charCodeLength: uint32,          // Length of character codes for shooting
  asteroidsPerSecondAtStart: number, // Initial spawn rate
  asteroidsPerSecondAt80Percent: number, // Spawn rate at 80% game completion
  colonyHealth: uint32,            // Starting health of the colony
  asteroidMaxHealth: uint32,       // Maximum possible health of asteroids
  stunDurationS: number,           // How long players remain stunned
  friendlyFirePenaltyS: number,    // Base friendly fire penalty duration
  friendlyFirePenaltyMultiplier: number, // Multiplier for consecutive friendly fire
  timeBetweenShotsS: number,       // Cooldown between shots
  survivalTimeS: number,           // Total game duration
  spawnRateCoopModifier: number    // Modifier for spawn rate in cooperative mode
}

/**
 * Extended asteroid data including visual and gameplay properties
 */
interface Asteroid extends AsteroidsAsteroidSpawnMessageDTO {
  speed: number,          // Movement speed (milliseconds)
  destroy: () => void,    // Function to handle asteroid destruction
  endX: number,          // Final X position (0.0 for wall)
  endY: number,           // Final Y position (0.5 for center)
  element: HTMLDivElement | null, // Element in the DOM
}

/**
 * Extended player data including status effects and their handlers
 */
interface Player extends AsteroidsAssignPlayerDataMessageDTO {
  isStunned: boolean,    // Whether player is currently stunned
  isDisabled: boolean,   // Whether player is currently disabled
  stun: () => void,      // Function to apply stun effect
  disable: () => void,   // Function to apply disable effect
  element: HTMLDivElement | null, // Element in the DOM
}

/**
 * Data structure for laser beam visual effects
 */
interface LazerBeam {
  id: number,          // Beam id
  startX: number,      // Beam start X coordinate
  startY: number,      // Beam start Y coordinate
  endX: number,        // Beam end X coordinate
  endY: number,        // Beam end Y coordinate
  opacity: number,     // Current opacity for fade effect
}

/**
 * Main Asteroids minigame component
 */
const AsteroidsMiniGame: Component<MinigameProps<AsteroidsSettingsDTO>> = (props) => {
  // State Management
  const asteroids = createArrayStore<Asteroid>();
  const players = createArrayStore<Player>();
  const asteroidsRemoveFuncs = new Map<uint32, () => void>();
  const [health, setHealth] = createSignal(props.settings.colonyHealth);

  // Input and UI State
  const inputBuffer = createWrappedSignal<string>('');
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);

  // Player Status States
  const [isStunned, setIsStunned] = createSignal<boolean>(false);
  const [isDisabled, setIsDisabled] = createSignal<boolean>(false);
  const [buttonsEnabled, setButtonsEnabled] = createSignal<boolean>(true); // Changed from disableButtons

  const lazerBeams = createArrayStore<LazerBeam>();
  const lazerBeamRemoveFuncs = new Map<number, () => void>();  // To track removal functions
  let lazerBeamCounter = 0;  // To generate unique IDs
  type EntityType = 'asteroid' | 'player';
  interface EntityRef {
    type: EntityType;
    element: HTMLDivElement;
  }
  const elementRefs = new Map<number, EntityRef>();

  // Timers for status effects
  let stunTimer: NodeJS.Timeout;
  let penaltyTimer: NodeJS.Timeout;
  let buttonDisableTimer: NodeJS.Timeout;

  /**
   * Handles the destruction of an asteroid by its ID
   * Cleans up the asteroid and its removal function
   */
  const handleAsteroidDestruction = (asteroidID: number) => {
    console.log('Destroying asteroid:', asteroidID);
    // Clean up the element reference
    elementRefs.delete(asteroidID);

    const removeFunc = asteroidsRemoveFuncs.get(asteroidID);
    if (removeFunc) {
      removeFunc();
      asteroidsRemoveFuncs.delete(asteroidID);
    }
  };

  const getRandomRotationSpeed = () => {
    // Random speed between 2 and 5 seconds per rotation
    return 2 + Math.random() * 3;
  };

  /**
   * Gets the current position of an element considering any ongoing animations
   * @param elementId The ID of the element to check
   * @returns {x: number, y: number} Position as percentages of viewport, or null if element not found
   */
  const getAnimatedPosition = (entityId: number) => {
    const entityRef = elementRefs.get(entityId);
    if (!entityRef) {
      console.log('Entity not found for ID:', entityId);
      return null;
    }

    const element = entityRef.element;
    const computedStyle = window.getComputedStyle(element);
    const matrix = new DOMMatrix(computedStyle.transform);
    const rect = element.getBoundingClientRect();

    // Get the dimensions of the actual content (including the asset)
    const contentWidth = rect.width;
    const contentHeight = rect.height;

    // Calculate the center position
    const centerX = rect.left + (contentWidth / 2);
    const centerY = rect.top + (contentHeight / 2);

    // Apply any transform translations from animations
    const transformedX = centerX + matrix.m41;
    const transformedY = centerY + matrix.m42;

    // Convert to viewport percentages
    const x = transformedX / window.innerWidth;
    const y = transformedY / window.innerHeight;

    console.log('Entity', entityId, 'center position calculation:', {
      type: entityRef.type,
      dimensions: { width: contentWidth, height: contentHeight },
      center: { x: centerX, y: centerY },
      transformed: { x: transformedX, y: transformedY },
      final: { x, y }
    });

    return { x, y };
  };

  /**
   * Handles local player shooting at a specific character code
   * Emits event and processes the shot locally
   */
  const localPlayerShootAtCodeHandler = (charCode: string) => {
    if (charCode) {
      props.context.events.emit(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, {
        id: props.context.backend.player.local.id,
        code: charCode
      });

      handlePlayerShootAtCodeEvent({
        id: props.context.backend.player.local.id,
        code: charCode,
        senderID: props.context.backend.player.local.id,
        eventID: ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT.id,
      });
    }
  };

  /**
   * Processes a player's shot, handling hits on players or asteroids
   */
  const handlePlayerShootAtCodeEvent = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {
    const shooter = players.findFirst((p) => p.id === data.id);

    if (shooter) {
      let hitSomething = false;

      // Handle asteroid hits with precise image targeting
      const hitAsteroids = asteroids.findAll((a) => a.charCode === data.code);
      if (hitAsteroids.length) {
        hitSomething = true;
        hitAsteroids.forEach((a) => {
          const targetPos = getTargetCenterPosition(a.id);

          if (targetPos) {
            console.log('Hit asteroid image center:', {
              id: a.id,
              position: targetPos
            });

            spawnLazerBeam(
              shooter.x,
              shooter.y,
              targetPos.x,
              targetPos.y
            );
          }

          setTimeout(() => handleAsteroidDestruction(a.id), 100);
        });
      }

      // Handle player hits with precise image targeting
      const hitPlayers = players.findAll((p) => p.code === data.code && p.id !== data.id);
      if (hitPlayers.length) {
        hitSomething = true;
        hitPlayers.forEach((targetPlayer) => {
          const targetPos = getTargetCenterPosition(targetPlayer.id);

          if (targetPos) {
            console.log('Hit player image center:', {
              id: targetPlayer.id,
              position: targetPos
            });

            spawnLazerBeam(
              shooter.x,
              shooter.y,
              targetPos.x,
              targetPos.y
            );

            if (targetPlayer.disable) {
              targetPlayer.disable();
            }
            if (shooter.stun) {
              shooter.stun();
            }
          }
        });
      }

      // Handle misses (keep existing miss logic)
      if (!hitSomething) {
        const missAngle = Math.random() * Math.PI * 2;
        const missDistance = 0.5;
        const missX = shooter.x + Math.cos(missAngle) * missDistance;
        const missY = shooter.y + Math.sin(missAngle) * missDistance;
        spawnLazerBeam(shooter.x, shooter.y, missX, missY);
      }
    }
  };

  /**
   * Handles disabling buttons for a player for a specified duration
   * Only affects the local player
   */
  const disableButtonsHandler = (data: AsteroidsAssignPlayerDataMessageDTO, time: number) => {
    if (data.id === props.context.backend.player.local.id) {
      clearTimeout(buttonDisableTimer);
      setButtonsEnabled(false); // Changed from setDisableButtons(true)

      buttonDisableTimer = setTimeout(() => {
        setButtonsEnabled(true); // Changed from setDisableButtons(false)
        clearTimeout(buttonDisableTimer);
      }, time);
    }
  };

  /**
 * Converts a percentage position to pixel coordinates
 */
  const getPixelPosition = (x: number, y: number) => {
    return {
      x: x * window.innerWidth,
      y: y * window.innerHeight
    };
  };

  /**
   * Gets the current position of an entity's center point
   */
  const getTargetCenterPosition = (entityId: number) => {
    const entityRef = elementRefs.get(entityId);
    if (!entityRef) {
      console.log('Entity not found for ID:', entityId);
      return null;
    }

    const element = entityRef.element;

    // Find the actual image element within the container
    // For asteroids, it's inside the rotating container
    const imageElement = element.querySelector('img');
    if (!imageElement) {
      console.log('Image element not found for entity:', entityId);
      return null;
    }

    const imageRect = imageElement.getBoundingClientRect();

    // Calculate center point of the image in pixels
    const centerX = imageRect.left + (imageRect.width / 2);
    const centerY = imageRect.top + (imageRect.height / 2);

    // Convert to viewport percentages
    const x = centerX / window.innerWidth;
    const y = centerY / window.innerHeight;

    console.log('Target image center calculation:', {
      id: entityId,
      type: entityRef.type,
      imageRect: {
        left: imageRect.left,
        top: imageRect.top,
        width: imageRect.width,
        height: imageRect.height
      },
      center: { x, y }
    });

    return { x, y };
  };

  /**
   * Creates a new laser beam visual effect
   */
  const spawnLazerBeam = (fromX: number, fromY: number, toX: number, toY: number) => {
    const id = lazerBeamCounter++;

    // Convert percentage positions to pixels for absolute positioning
    const start = getPixelPosition(fromX, fromY);
    const end = getPixelPosition(toX, toY);

    console.log('Spawning laser:', {
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
      startPx: start,
      endPx: end
    });

    const newBeam: LazerBeam = {
      id,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      opacity: 1,
    };

    const removeFunc = lazerBeams.add(newBeam);
    lazerBeamRemoveFuncs.set(id, removeFunc);

    setTimeout(() => {
      const remove = lazerBeamRemoveFuncs.get(id);
      if (remove) {
        remove();
        lazerBeamRemoveFuncs.delete(id);
      }
    }, 1000);
  };

  // Component Lifecycle and Event Subscriptions
  onMount(() => {
    // Update laser beam fade effects
    const updateLazerBeams = setInterval(() => {
      lazerBeams.mutateByPredicate(
        (beam) => beam.opacity > 0,
        (beam) => ({ ...beam, opacity: beam.opacity - 0.1 })
      );
    }, 50);

    // Event Subscriptions
    const spawnSubID = props.context.events.subscribe(ASTEROIDS_ASTEROID_SPAWN_EVENT, (data) => {
      console.log('Spawning asteroid with ID:', data.id);
      let elementRef: HTMLDivElement | null = null;
      const removeFunc = asteroids.add({
        ...data,
        speed: data.timeUntilImpact,
        endX: 0.0,
        endY: 0.5,
        element: elementRef,  // Initialize as null
        destroy: () => handleAsteroidDestruction(data.id)
      });
      asteroidsRemoveFuncs.set(data.id, removeFunc);
    });

    const asteroidImpactSubID = props.context.events.subscribe(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, (data) => {
      setHealth(data.colonyHPLeft);
      handleAsteroidDestruction(data.id);
    });

    /**
    * Handles cleanup of entity references
    */
    const cleanupEntityRef = (entityId: number) => {
      elementRefs.delete(entityId);
    };

    const loadPlayerDataSubID = props.context.events.subscribe(ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, (data) => {
      players.add({
        ...data,
        isStunned: false,
        isDisabled: false,
        stun: () => {
          clearTimeout(stunTimer);
          players.mutateByPredicate(
            (p) => p.id === data.id,
            (p) => ({ ...p, isStunned: true })
          );
          disableButtonsHandler(data, props.settings.stunDurationS);
          stunTimer = setTimeout(() => {
            players.mutateByPredicate(
              (p) => p.id === data.id,
              (p) => ({ ...p, isStunned: false })
            );
            clearTimeout(stunTimer);
          }, props.settings.stunDurationS);
        },
        disable: () => {
          clearTimeout(penaltyTimer);
          players.mutateByPredicate(
            (p) => p.id === data.id,
            (p) => ({ ...p, isDisabled: true })
          );
          disableButtonsHandler(
            data,
            props.settings.friendlyFirePenaltyS * props.settings.friendlyFirePenaltyMultiplier
          );
          penaltyTimer = setTimeout(() => {
            players.mutateByPredicate(
              (p) => p.id === data.id,
              (p) => ({ ...p, isDisabled: false })
            );
            clearTimeout(penaltyTimer);
          }, props.settings.friendlyFirePenaltyS * props.settings.friendlyFirePenaltyMultiplier);
        },
        element: null,
      });
    });

    const playerShootSubID = props.context.events.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, handlePlayerShootAtCodeEvent);

    props.context.events.emit(PLAYER_READY_FOR_MINIGAME_EVENT, {
      id: props.context.backend.player.local.id,
      ign: props.context.backend.player.local.firstName,
    });

    onCleanup(() => {
      props.context.events.unsubscribe(spawnSubID, asteroidImpactSubID, loadPlayerDataSubID, playerShootSubID);
      clearInterval(updateLazerBeams);

      // Clean up lazers
      lazerBeamRemoveFuncs.forEach(removeFunc => removeFunc());
      lazerBeamRemoveFuncs.clear();

      elementRefs.clear();
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

                  void el.offsetHeight;

                  requestAnimationFrame(() => {
                    el.style.transition = `all ${asteroid.timeUntilImpact / 1000}s linear`;
                    el.style.left = '0%';
                    el.style.top = '50%';
                  });
                }
              }}
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Asset wrapped for rotation */}
              <div class={rotatingStyle(getRandomRotationSpeed())}>
                <NTAwait func={() => props.context.backend.assets.getMetadata(7001)}>
                  {(asset) => (
                    <GraphicalAsset metadata={asset} backend={props.context.backend} />
                  )}
                </NTAwait>
              </div>
              <BufferBasedButton
                enable={buttonsEnabled}
                name={asteroid.charCode}
                buffer={inputBuffer.get}
                onActivation={() => localPlayerShootAtCodeHandler(asteroid.charCode)}
                register={bufferSubscribers.add}
              />
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
                top: `${player.y * 100}%`,
                transform: `translate(-50%, -50%)`,
              }}
            >
              <NTAwait func={() => props.context.backend.assets.getMetadata(7002)}>
                {(asset) => (
                  <GraphicalAsset metadata={asset} backend={props.context.backend} />
                )}
              </NTAwait>
              <BufferBasedButton
                enable={buttonsEnabled}
                name={player.code}
                buffer={inputBuffer.get}
                onActivation={() => localPlayerShootAtCodeHandler(player.code)}
                register={bufferSubscribers.add}
              />
              {player.isStunned && <div class={stunnedStyle} />}
              {player.isDisabled && <div class={disabledStyle} />}
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

// Styles

const wallStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 1vw;
  height: 100vh;
  background: linear-gradient(to right, #4a4a4a, #bebebe);
  overflow: hidden;
`;

const asteroidStyle = css`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 10rem;
  height: 10rem;
`;

// Function to generate rotation animation style with dynamic speed
const rotatingStyle = (speedSeconds: number) => css`
  display: flex;
  justify-content: center;
  align-items: center;
  animation: rotate ${speedSeconds}s linear infinite;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const statusStyle = css`
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  font-size: 18px;
`;

const lazerBeamStyle = css`
  position: absolute;
  height: 0.5rem; /* Thicker beam */
  transform-origin: left center;
  background: linear-gradient(
    to right,
    rgba(255, 0, 0, 0.8),    /* More opaque red */
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 0, 0, 0.8)
  );
  filter: blur(0.15rem);     /* Add slight blur for glow effect */
  box-shadow: 
    0 0 0.5rem rgba(255, 0, 0, 0.5),  /* Inner glow */
    0 0 1rem rgba(255, 0, 0, 0.3);    /* Outer glow */
`;

const impactCircleStyle = css`
  position: absolute;
  width: 3rem;           /* Larger impact circle */
  height: 3rem;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 0, 0, 1) 50%,
    rgba(255, 0, 0, 0) 100%
  );
  filter: blur(0.15rem);  /* Add slight blur for glow effect */
  box-shadow: 
    0 0 1rem rgba(255, 0, 0, 0.5),   /* Inner glow */
    0 0 2rem rgba(255, 0, 0, 0.3);   /* Outer glow */
`;

const playerStyle = css`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 3rem;  /* Keep players slightly larger than asteroids */
  height: 3rem;

  /* Scale the asset inside the container */
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const stunnedStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: radial-gradient(ellipse at center, rgba(173,216,230,0.5) 0%, rgba(173,216,230,0) 70%);
    border-radius: 50%;
    animation: smoke 3s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 0.9; }
    100% { transform: scale(0.95); opacity: 0.7; }
  }

  @keyframes smoke {
    0% { transform: translateY(0) scale(1); opacity: 0.3; }
    100% { transform: translateY(-20px) scale(1.5); opacity: 0; }
  }
`;

const disabledStyle = css`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: -15px;
    left: -15px;
    right: -15px;
    bottom: -15px;
    background: radial-gradient(ellipse at center, rgba(255,69,0,0.5) 0%, rgba(255,69,0,0) 70%);
    border-radius: 50%;
    animation: flicker 0.5s infinite alternate;
  }

  @keyframes flicker {
    0% { opacity: 0.5; transform: scale(0.98); }
    100% { opacity: 0.8; transform: scale(1.02); }
  }
`;