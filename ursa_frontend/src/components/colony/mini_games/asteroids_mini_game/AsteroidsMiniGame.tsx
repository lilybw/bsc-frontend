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

export type AsteroidsSettingsDTO = {
    minTimeTillImpactS: number,
    maxTimeTillImpactS: number,
    charCodeLength: uint32,
    asteroidsPerSecondAtStart: number,
    asteroidsPerSecondAt80Percent: number,
    colonyHealth: uint32,
    asteroidMaxHealth: uint32,
    stunDurationS: number,
    friendlyFirePenaltyS: number,
    friendlyFirePenaltyMultiplier: number,
    timeBetweenShotsS: number,
    survivalTimeS: number,

    spawnRateCoopModifier: number
}

interface Asteroid extends AsteroidsAsteroidSpawnMessageDTO {
  speed: number,
  destroy: () => void,
}

interface Player extends AsteroidsAssignPlayerDataMessageDTO {
  id: number,
  x: number,
  y: number,
  type: number, // Tank type, asset id
  code: string, // Charcode
  isStunned: boolean,
  isDisabled: boolean,

  stun: () => void,
  disable: () => void,
}

interface LazerBeam {
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  opacity: number,
}

function getRandomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * AsteroidsMiniGame component responsible for rendering and managing the Asteroids minigame.
 */
const AsteroidsMiniGame: Component<MinigameProps<AsteroidsSettingsDTO>> = (props) => {
  const asteroids = createArrayStore<Asteroid>();
  const players = createArrayStore<Player>();
  const asteroidsRemoveFuncs = new Map<uint32, () => void>();
  const [health, setHealth] = createSignal(props.settings.colonyHealth);

  const inputBuffer = createWrappedSignal<string>('');
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);
  const [isStunned, setIsStunned] = createSignal<boolean>(false) // Used to disable buttons and display stun
  const [isDisabled, setIsSDisabled] = createSignal<boolean>(false) // Used to disable buttons and display disable
  const [disableButtons, setDisableButtons] = createSignal<boolean>(false) // Used to disable buttons and display disable
  const lazerBeams = createArrayStore<LazerBeam>()

  let stunTimer: NodeJS.Timeout;
  let penaltyTimer: NodeJS.Timeout;
  let buttonDisableTimer: NodeJS.Timeout;

  const handleAsteroidDestruction = (asteroidID: number) => {
    const removeFunc = asteroidsRemoveFuncs.get(asteroidID);

    if (removeFunc) {
      removeFunc()
      asteroidsRemoveFuncs.delete(asteroidID);
    }

    // Add some particles on location
  };

  const localPlayerShootAtCodeHandler = (charCode: string) => {
    if (charCode) {
      // Player emits event, will not be replicated locally, so handle as if from server.
      props.context.events.emit(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, {id: props.context.backend.localPlayer.id, code: charCode});

      handlePlayerShootAtCodeEvent({
        id: props.context.backend.localPlayer.id,
        code: charCode,
        senderID: props.context.backend.localPlayer.id,
        eventID: ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT.id,
      }); // Handle local player shooting as any other event, but locally.
    }
  }

  const handlePlayerShootAtCodeEvent = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {
    const shooter = players.findFirst((p) => p.id === data.id)

    if (shooter) {

      // Char code mathces player
      const hitPlayers = players.findAll((p) => p.code === data.code);
      if (!hitPlayers.length) {
        hitPlayers.forEach((p) => {
          spawnLazerBeam(shooter.x, shooter.y, p.x, p.y)
          p.stun()
        }); // Penalty increase handled on server
        
        shooter.disable() // Disable the player that has shot at another player.
      }

      // Char code mathces asteroid
      const hitAsteroids = asteroids.findAll((a) => a.charCode === data.code)
      if (!hitAsteroids.length) {
        hitAsteroids.forEach((a) => {
          spawnLazerBeam(shooter.x, shooter.y, a.x, a.y)
          a.destroy()
        })
      }

      // If nothing is hit
      if (!hitPlayers.length && !hitAsteroids.length) {
        spawnLazerBeam(shooter.x, shooter.y, (Math.random() + 1) * window.innerWidth, (Math.random() + 1) * window.innerHeight)
      }
    }
  }

  const disableButtonsHandler = (data: AsteroidsAssignPlayerDataMessageDTO, time: number) => {
    if (data.id === props.context.backend.localPlayer.id) { 
      clearTimeout(buttonDisableTimer) // Clear existing button disable timeouts to avoid issues with overlaps
      setDisableButtons(true) // For button disable

      buttonDisableTimer = setTimeout(() => {
        setDisableButtons(false) // For button disable 
        clearTimeout(buttonDisableTimer)
      }, time);
    }
  }

  const spawnLazerBeam = (shooterX: number, shootery: number, targetX: number, targetY: number) => {
    const newBeam: LazerBeam = {
      startX: shooterX,
      startY: shootery,
      endX: targetX,
      endY: targetY,
      opacity: 1, // Duration in milliseconds
    };

    lazerBeams.add(newBeam)
  };

  onMount(() => {
    const updateLazerBeams = setInterval(() => {
      lazerBeams.mutateByPredicate(
        (beam) => beam.opacity > 0,
        (beam) => ({ ...beam, opacity: beam.opacity - 0.1 })
      );
    
      const beamsToRemove = lazerBeams.findAll((beam) => beam.opacity <= 0);
      beamsToRemove.forEach((beam) => {
        const removeBeam = lazerBeams.add(beam);
        removeBeam();
      });
    }, 100);

    const spawnSubID = props.context.events.subscribe(ASTEROIDS_ASTEROID_SPAWN_EVENT, (data) => {
      const removeFunc = asteroids.add({...data,
        speed:(getRandomInRange(props.settings.minTimeTillImpactS, props.settings.maxTimeTillImpactS)),
        destroy: () => {
        handleAsteroidDestruction(data.id)
      }})
      asteroidsRemoveFuncs.set(data.id, removeFunc)
    })

    const asteroidImpactSubID = props.context.events.subscribe(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, (data) => {
      setHealth(data.colonyHPLeft)
      handleAsteroidDestruction(data.id)
    })

    const loadPlayerDataSubID = props.context.events.subscribe(ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, (data) => {
      players.add({
        ...data,
        isStunned: false,
        isDisabled: false,
        stun: () => {
          clearTimeout(stunTimer) // Clear existing stun timeouts to avoid issues with overlaps 
    
          players.mutateByPredicate(
            (p) => p.id === data.id,
            (p) => ({ ...p, isStunned: true })
          );
    
          disableButtonsHandler(data, props.settings.stunDurationS) // If local player, disable buttons (emits should be ignored on server).
    
          stunTimer = setTimeout(() => {
            players.mutateByPredicate(
              (p) => p.id === data.id,
              (p) => ({ ...p, isStunned: false })
            );
            clearTimeout(stunTimer)
          }, props.settings.stunDurationS);
        },
        disable: () => {
          clearTimeout(penaltyTimer) // Clear existing disable timeouts to avoid issues with overlaps 
    
          players.mutateByPredicate(
            (p) => p.id === data.id,
            (p) => ({ ...p, isDisabled: true })
          );
    
          disableButtonsHandler(data, props.settings.friendlyFirePenaltyS * props.settings.friendlyFirePenaltyMultiplier) // If local player, disable buttons (emits should be ignored on server).
    
          penaltyTimer = setTimeout(() => {
            players.mutateByPredicate(
              (p) => p.id === data.id,
              (p) => ({ ...p, isDisabled: false })
            );
            clearTimeout(penaltyTimer)
          }, props.settings.friendlyFirePenaltyS * props.settings.friendlyFirePenaltyMultiplier); // QUESTION: Based on player, managed serverside?
        }
      }) // QUESTION: (ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT) Determined serverside? Called once per player?
    });

    const playerShootSubID = props.context.events.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, (data) => handlePlayerShootAtCodeEvent(data));

    onCleanup(() => {
      props.context.events.unsubscribe(spawnSubID, asteroidImpactSubID, loadPlayerDataSubID, playerShootSubID)

      clearInterval(updateLazerBeams)
    });
  });

  return (
    <div>
      <StarryBackground />
      <div class={wallStyle} id="Outer-Wall"/>

      <div class={statusStyle}>
        Health: {'❤'.repeat(health())}
      </div>
      
      <Countdown duration={props.settings.survivalTimeS}/>
      <div class={gameContainerStyle}>
        <For each={asteroids.get}>
          {(asteroid) => (
            <div
              class={asteroidStyle}
              style={{
                left: `${asteroid.x * 100}%`,
                top: `${asteroid.y * 100}%`,
                transform: `translate(-50%, -50%)`,
                transition: `left ${asteroid.speed}s linear, bottom ${asteroid.speed}s linear`,
              }}
            >
              <NTAwait func={() => props.context.backend.getAssetMetadata(7001 /* Asset for asteroid | QUESTION: Load once per asteroid and use reference? */)}>
                    {(asset) => (
                        <GraphicalAsset metadata={asset} backend={props.context.backend}/>
                    )}
              </NTAwait>
              <BufferBasedButton
                enable={disableButtons} // Disable buttons when player is stunned or disbaled
                name={asteroid.charCode}
                buffer={inputBuffer.get}
                onActivation={() => localPlayerShootAtCodeHandler(asteroid.charCode)}
                register={bufferSubscribers.add}
              />
            </div>
          )}
        </For>

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

        <For each={players.get}>
          {(player) => (
            <div
              class={playerStyle}
              style={{
                left: `${player.x * 100}%`,
                top: `${player.y * 100}%`,
                transform: `translate(-50%, -50%)`,
              }}
            >
              <NTAwait func={() => props.context.backend.getAssetMetadata(7002 /* Asset for player/cannon | QUESTION: Load once per player and use reference? */)}>
                    {(asset) => (
                        <GraphicalAsset metadata={asset} backend={props.context.backend} />
                    )}
              </NTAwait>
              <BufferBasedButton
                enable={disableButtons} // Disable buttons when player is stunned or disabled
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
const gameContainerStyle = css`
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: black;
  overflow: hidden;
`;

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
  height: 2px;
  transform-origin: left center;
  background: linear-gradient(
    to right,
    rgba(255, 0, 0, 0.5),
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 0, 0, 0.5)
  );
`;

const impactCircleStyle = css`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 0, 0, 1) 50%,
    rgba(255, 0, 0, 0) 100%
  );
`;

const playerStyle = css`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
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