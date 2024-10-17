import { Component, createSignal, onMount, onCleanup, For } from "solid-js";
import { css } from "@emotion/css";
import {
  ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
  ASTEROIDS_ASTEROID_SPAWN_EVENT,
  ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
  AsteroidsAssignPlayerDataMessageDTO,
  AsteroidsAsteroidSpawnMessageDTO,
  DifficultyConfirmedForMinigameMessageDTO
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { ApplicationContext } from "../../../../meta/types";
import { createArrayStore } from "../../../../ts/arrayStore";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../../../ts/actionContext";
import { createWrappedSignal } from "../../../../ts/wrappedSignal";
import ActionInput from "../../MainActionInput";
import MNTAwait from "../../../util/MultiNoThrowAwait";
import BufferBasedButton from "../../../BufferBasedButton";
import { createAsteroidsGameLoop } from "./AsteroidsGameLoop";
import { MinigameProps } from "../miniGame";
import { uint32 } from "../../../../integrations/main_backend/mainBackendDTOs";
import BufferHighlightedName from "../../../BufferHighlightedName";
import Countdown from "../../../util/Countdown";

const ASTEROID_TRAVEL_TIME = 15; // seconds
const EXPECTED_WIDTH = 1920;
const EXPECTED_HEIGHT = 1080;

type AsteroidsSettings = {
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
  destroy: () => void,
  
}

interface Player extends AsteroidsAssignPlayerDataMessageDTO {

}

/**
 * AsteroidsMiniGame component responsible for rendering and managing the Asteroids minigame.
 */
const AsteroidsMiniGame: Component<MinigameProps<AsteroidsSettings>> = (props) => {
  const asteroids = createArrayStore<Asteroid>()
  const players = createArrayStore<Player>()
  const asteroidsRemoveFuncs = new Map<uint32, () => void>()
  const [health, setHealth] = createSignal(props.settings.colonyHealth)

  const inputBuffer = createWrappedSignal<string>('');
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);

  const handleAsteroidDestruction = (asteroidID: number) => {
    const removeFunc = asteroidsRemoveFuncs.get(asteroidID)

    if (removeFunc) {
      removeFunc()
      asteroidsRemoveFuncs.delete(asteroidID)
    }

    // Add some particles on location
  };

  const localPlayerShootAtCodeHandler = (charCode: string) => {
    props.context.events.emit(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, {id: props.context.backend.localPlayer.id, code: charCode})

    asteroids.findAll((a) => a.charCode === charCode)
    .forEach((a) => a.destroy())
  }

  onMount(() => {
    const spawnSubID = props.context.events.subscribe(ASTEROIDS_ASTEROID_SPAWN_EVENT, (data) => {
      const removeFunc = asteroids.add({...data, destroy: () => {
        handleAsteroidDestruction(data.id)
      }})
      asteroidsRemoveFuncs.set(data.id, removeFunc)
    })

    const asteroidImpactSubID = props.context.events.subscribe(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, (data) => {
      setHealth(data.colonyHPLeft)
      handleAsteroidDestruction(data.id)
    })

    onCleanup(() => {
      props.context.events.unsubscribe(spawnSubID, asteroidImpactSubID)
    });
  });

  return (
    <div>
      <div class={statusStyle}>
        Health: {'❤'.repeat(health())}
      </div>
      <Countdown duration={props.settings.survivalTimeS}/>
      <MNTAwait
        funcs={[
          () => props.context.backend.getAssetMetadata(1011), // Assuming this is the asset ID for the game background
        ]}
      >
        {(backgroundAsset) => (
          <div class={gameContainerStyle}>
            <div class={colonyStyle}>Colony</div>
            <For each={asteroids.get}>
              {(asteroid) => (
                <div
                  class={asteroidStyle}
                  style={{
                    left: `${asteroid.x * 100}%`,
                    top: `${asteroid.y * 100}%`,
                    transform: `translate(-50%, -50%)`,
                    transition: `left ${ASTEROID_TRAVEL_TIME}s linear, top ${ASTEROID_TRAVEL_TIME}s linear`,
                  }}
                >
                  <BufferBasedButton
                    name={asteroid.charCode}
                    buffer={inputBuffer.get}
                    onActivation={() => localPlayerShootAtCodeHandler(asteroid.charCode)}
                    register={bufferSubscribers.add}
                    styleOverwrite={asteroidButtonStyle}
                  />
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
              styleOverwrite={actionInputStyleOverwrite}
            />
          </div>
        )}
      </MNTAwait>
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

const colonyStyle = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background-color: blue;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
`;

const asteroidStyle = css`
  position: absolute;
  width: 60px;
  height: 60px;
  background-color: gray;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const asteroidButtonStyle = css`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const actionInputStyleOverwrite = css`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
`;

const statusStyle = css`
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  font-size: 18px;
`;