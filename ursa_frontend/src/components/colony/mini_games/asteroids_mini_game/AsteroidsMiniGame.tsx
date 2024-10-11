import { Component, createSignal, createEffect, For, createMemo, onMount, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { css } from "@emotion/css";
import { IEventMultiplexer } from "../../../../integrations/multiplayer_backend/eventMultiplexer";
import {
  ASTEROIDS_ASTEROID_SPAWN_EVENT,
  ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
  ASTEROIDS_GAME_WON_EVENT,
  ASTEROIDS_GAME_LOST_EVENT,
  ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
  DifficultyConfirmedForMinigameMessageDTO
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { IBackendBased, IInternationalized } from "../../../../ts/types";
import { ArrayStore, createArrayStore } from "../../../../ts/arrayStore";
import { ActionContext, BufferSubscriber, TypeIconTuple } from "../../../../ts/actionContext";
import { WrappedSignal, createWrappedSignal } from "../../../../ts/wrappedSignal";
import ActionInput from "../../MainActionInput";
import MNTAwait from "../../../util/MultiNoThrowAwait";
import AsteroidsGameLoop from "./AsteroidsGameLoop";
import BufferBasedButton from "../../../BufferBasedButton";
import { ApplicationContext } from "../../../../meta/types";

// Update IEventMultiplexer to include localPlayer
interface IEventMultiplexerWithLocalPlayer extends IEventMultiplexer {
  localPlayer: number;
}

interface AsteroidsGameProps {
  context: ApplicationContext
  difficulty: DifficultyConfirmedForMinigameMessageDTO;
  onGameEnd: (score: number) => void;
}

const BASE_KEYCODE_LENGTH = 3;
const ASTEROID_TRAVEL_TIME = 15; // seconds
const EXPECTED_WIDTH = 1920;
const EXPECTED_HEIGHT = 1080;

const AsteroidsMiniGame: Component<AsteroidsGameProps> = (props) => {
  const [gameState, setGameState] = createStore({
    asteroids: new Map<number, { id: number; x: number; y: number; charCode: string }>(),
    colonyHealth: 3,
    score: 0,
  });

  const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
  const [GAS, setGAS] = createSignal(1);
  const [viewportDimensions, setViewportDimensions] = createSignal({width: window.innerWidth, height: window.innerHeight});
  const inputBuffer = createWrappedSignal<string>('');
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();

  const keycodeLength = createMemo(() => BASE_KEYCODE_LENGTH + props.difficulty.difficultyID - 1);

  const generateUniqueKeycode = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let keycode: string;
    do {
      keycode = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (Array.from(gameState.asteroids.values()).some(asteroid => asteroid.charCode === keycode));
    return keycode;
  };

  createEffect(() => {
    const subscriptions = [
      props.context.events.subscribe(ASTEROIDS_ASTEROID_SPAWN_EVENT, (data) => {
        setGameState("asteroids", (asteroids) => {
          const newAsteroids = new Map(asteroids);
          newAsteroids.set(data.id, {
            id: data.id,
            x: data.x,
            y: data.y,
            charCode: generateUniqueKeycode(keycodeLength()),
          });
          return newAsteroids;
        });
      }),
      props.context.events.subscribe(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, (data) => {
        setGameState("colonyHealth", data.colonyHPLeft);
      }),
      props.context.events.subscribe(ASTEROIDS_GAME_WON_EVENT, () => {
        props.onGameEnd(gameState.score * props.difficulty.difficultyID);
      }),
      props.context.events.subscribe(ASTEROIDS_GAME_LOST_EVENT, () => {
        props.onGameEnd(gameState.score * props.difficulty.difficultyID);
      }),
    ];

    return () => subscriptions.forEach((sub) => props.context.events.unsubscribe(sub));
  });

  const handleAsteroidDestruction = (id: number) => {
    props.context.events.emit(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, {
      id: props.context.backend.localPlayer.id,
      code: gameState.asteroids.get(id)?.charCode || "",
    });

    setGameState("asteroids", (asteroids) => {
      const newAsteroids = new Map(asteroids);
      newAsteroids.delete(id);
      return newAsteroids;
    });

    setGameState("score", (score) => score + 1);
  };

  const calculateScalars = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    setViewportDimensions({ width: newWidth, height: newHeight });
    setDNS({ 
      x: newWidth / EXPECTED_WIDTH,
      y: newHeight / EXPECTED_HEIGHT 
    });
    setGAS(Math.sqrt(Math.min(newWidth / EXPECTED_WIDTH, newHeight / EXPECTED_HEIGHT)))
  };

  onMount(() => {
    calculateScalars();
    window.addEventListener('resize', calculateScalars);
  });

  onCleanup(() => {
    window.removeEventListener('resize', calculateScalars);
  });

  return (
    <MNTAwait
      funcs={[
        () => props.context.backend.getAssetMetadata(1011),
      ]}
    >
      {(backgroundAsset) => (
        <div class={gameContainerStyle}>
          <AsteroidsGameLoop
            plexer={props.context.events}
            difficulty={props.difficulty.difficultyID}
            onGameEnd={(won) => props.onGameEnd(gameState.score * props.difficulty.difficultyID)}
          />
          <div class={colonyStyle}>Colony</div>
          <For each={Array.from(gameState.asteroids.values())}>
            {(asteroid) => (
              <div
                class={asteroidStyle}
                style={{
                  left: `${asteroid.x * 100}%`,
                  top: `${asteroid.y * 100}%`,
                  transform: `translate(-50%, -50%) scale(${GAS()})`,
                  transition: `left ${ASTEROID_TRAVEL_TIME}s linear, top ${ASTEROID_TRAVEL_TIME}s linear`,
                }}
              >
                <BufferBasedButton
                  name={asteroid.charCode}
                  buffer={inputBuffer.get}
                  onActivation={() => handleAsteroidDestruction(asteroid.id)}
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
          <div class={statusStyle}>
            Health: {'❤'.repeat(gameState.colonyHealth)} | Score: {gameState.score}
          </div>
        </div>
      )}
    </MNTAwait>
  );
};

export default AsteroidsMiniGame;

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
  color: transparent;
  font-size: 18px;

  text-shadow: 0 0 5px cyan;
`;