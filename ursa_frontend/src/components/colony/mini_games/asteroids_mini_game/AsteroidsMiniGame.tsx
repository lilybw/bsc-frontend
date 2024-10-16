import { Component, createSignal, onMount, onCleanup, For } from "solid-js";
import { css } from "@emotion/css";
import {
  ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
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
import { MinigameProps } from "../minigameLoader";

/**
 * Props for the AsteroidsMiniGame component
 */
export interface AsteroidsGameProps {
  context: ApplicationContext;
  difficulty: DifficultyConfirmedForMinigameMessageDTO;
  returnToColony: () => void;
}

const ASTEROID_TRAVEL_TIME = 15; // seconds
const EXPECTED_WIDTH = 1920;
const EXPECTED_HEIGHT = 1080;

/**
 * AsteroidsMiniGame component responsible for rendering and managing the Asteroids minigame.
 */
const AsteroidsMiniGame: Component<AsteroidsGameProps> = (props) => {
  const [DNS, setDNS] = createSignal({ x: 1, y: 1 });
  const [GAS, setGAS] = createSignal(1);
  const [viewportDimensions, setViewportDimensions] = createSignal({width: window.innerWidth, height: window.innerHeight});

  const inputBuffer = createWrappedSignal<string>('');
  const bufferSubscribers = createArrayStore<BufferSubscriber<string>>();
  const actionContext = createWrappedSignal<TypeIconTuple>(ActionContext.ASTEROIDS);

  const handleGameEnd = (won: boolean) => {
    const finalScore = gameLoop.state.score * props.difficulty.difficultyID;
    console.log(`Game ended. Won: ${won}, Final Score: ${finalScore}`);
    props.returnToColony();
  };

  const gameLoop = createAsteroidsGameLoop(
    props.context.events,
    props.difficulty,
    handleGameEnd,
  );

  const handleAsteroidDestruction = (id: number, charCode: string) => {
    props.context.events.emit(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, {
      id: props.context.backend.localPlayer.id,
      code: charCode,
    });
    gameLoop.updateScore(1);
  };

  const calculateScalars = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    setViewportDimensions({ width: newWidth, height: newHeight });
    setDNS({ 
      x: newWidth / EXPECTED_WIDTH,
      y: newHeight / EXPECTED_HEIGHT 
    });
    setGAS(Math.sqrt(Math.min(newWidth / EXPECTED_WIDTH, newHeight / EXPECTED_HEIGHT)));
  };

  onMount(() => {
    const unsubscribe = gameLoop.setupEventListeners();
    gameLoop.startGame();
    calculateScalars();
    window.addEventListener('resize', calculateScalars);

    onCleanup(() => {
      unsubscribe();
      gameLoop.stopGame();
      window.removeEventListener('resize', calculateScalars);
    });
  });

  return (
    <MNTAwait
      funcs={[
        () => props.context.backend.getAssetMetadata(1011), // Assuming this is the asset ID for the game background
      ]}
    >
      {(backgroundAsset) => (
        <div class={gameContainerStyle}>
          <div class={colonyStyle}>Colony</div>
          <For each={Array.from(gameLoop.state.asteroids.values())}>
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
                  onActivation={() => handleAsteroidDestruction(asteroid.id, asteroid.charCode)}
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
            Health: {'❤'.repeat(gameLoop.state.colonyHealth)} | Score: {gameLoop.state.score}
          </div>
        </div>
      )}
    </MNTAwait>
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