// AsteroidsGameLoop.tsx

import { createStore, SetStoreFunction } from "solid-js/store";
import { IEventMultiplexer } from "../../../../integrations/multiplayer_backend/eventMultiplexer";
import {
  ASTEROIDS_ASTEROID_SPAWN_EVENT,
  ASTEROIDS_GAME_WON_EVENT,
  ASTEROIDS_GAME_LOST_EVENT,
  ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT,
  ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
  PLAYER_LEFT_EVENT,
  LOBBY_CLOSING_EVENT,
  MINIGAME_BEGINS_EVENT,
  ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT,
  ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
  DifficultyConfirmedForMinigameMessageDTO
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { CharCodeGenerator, SYMBOL_SET } from "./charCodeGenerator";
import { uint32, PlayerID } from "../../../../integrations/main_backend/mainBackendDTOs";

const GAME_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const BASE_SPAWN_RATE = 1000; // 1 asteroid per second
const ASTEROID_TRAVEL_TIME = 15; // seconds
const BASE_CODE_LENGTH = 3;

interface AsteroidState {
  id: uint32;
  x: number;
  y: number;
  timeUntilImpact: number;
  charCode: string;
}

interface GameState {
  gameTime: number;
  asteroids: Map<uint32, AsteroidState>;
  nextAsteroidId: uint32;
  colonyHealth: number;
  isGameRunning: boolean;
  playerCode: string;
  score: number;
}

export function createAsteroidsGameLoop(
  plexer: IEventMultiplexer,
  difficulty: DifficultyConfirmedForMinigameMessageDTO,
  onGameEnd: (won: boolean) => void,
  playerID: PlayerID
) {
  const codeLength = BASE_CODE_LENGTH + difficulty.difficultyID - 1;
  const charCodeGenerator = new CharCodeGenerator(SYMBOL_SET, codeLength);

  const [state, setState] = createStore<GameState>({
    gameTime: 0,
    asteroids: new Map(),
    nextAsteroidId: 1 as uint32,
    colonyHealth: 3,
    isGameRunning: false,
    playerCode: "",
    score: 0,
  });

  let gameLoopInterval: NodeJS.Timeout | null = null;

  const spawnAsteroid = (id: uint32, x: number, y: number) => {
    const charCode = charCodeGenerator.generateCode();
    setState(prev => ({
      asteroids: new Map(prev.asteroids).set(id, { id, x, y, timeUntilImpact: ASTEROID_TRAVEL_TIME, charCode }),
      nextAsteroidId: (prev.nextAsteroidId + 1) as uint32,
    }));
    
    plexer.emit(ASTEROIDS_ASTEROID_SPAWN_EVENT, {
      id,
      x,
      y,
      health: 1,
      timeUntilImpact: ASTEROID_TRAVEL_TIME,
      type: 0,
      charCode,
    });
  };

  const gameLoop = () => {
    if (!state.isGameRunning) return;

    setState('gameTime', t => t + 16); // Assume 60 FPS

    if (Math.random() < (difficulty.difficultyID / (BASE_SPAWN_RATE / 16))) {
      spawnAsteroid(state.nextAsteroidId, Math.random(), Math.random());
    }

    setState('asteroids', asteroids => {
      const updatedAsteroids = new Map(asteroids);
      for (const [id, asteroid] of updatedAsteroids) {
        if (asteroid.timeUntilImpact <= 0) {
          updatedAsteroids.delete(id);
          setState('colonyHealth', health => {
            const newHealth = health - 1;
            plexer.emit(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, {
              id,
              colonyHPLeft: newHealth
            });
            return newHealth;
          });
        } else {
          asteroid.timeUntilImpact -= 16 / 1000;
        }
      }
      return updatedAsteroids;
    });

    if (state.gameTime >= GAME_DURATION) {
      endGame(true);
    } else if (state.colonyHealth <= 0) {
      endGame(false);
    }
  };

  const endGame = (won: boolean) => {
    setState('isGameRunning', false);
    onGameEnd(won);
    stopGame();
  };

  const startGame = () => {
    setState('isGameRunning', true);
    gameLoopInterval = setInterval(gameLoop, 16); // ~60 FPS
  };

  const stopGame = () => {
    setState('isGameRunning', false);
    if (gameLoopInterval) {
      clearInterval(gameLoopInterval);
      gameLoopInterval = null;
    }
    plexer.emit(ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT, {});
  };

  const updateScore = (points: number) => {
    setState('score', score => score + points);
  };

  const setupEventListeners = () => {
    const subscriptions = [
      plexer.subscribe(PLAYER_LEFT_EVENT, () => {
        console.log("Player left event received");
      }),
      plexer.subscribe(LOBBY_CLOSING_EVENT, stopGame),
      plexer.subscribe(MINIGAME_BEGINS_EVENT, startGame),
      plexer.subscribe(ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, (data) => {
        setState('playerCode', data.code);
      }),
      plexer.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, (data) => {
        if (data.code === state.playerCode) {
          endGame(false);
        } else {
          setState('asteroids', asteroids => {
            const newAsteroids = new Map(asteroids);
            for (const [id, asteroid] of newAsteroids) {
              if (asteroid.charCode === data.code) {
                newAsteroids.delete(id);
                updateScore(1);
                break;
              }
            }
            return newAsteroids;
          });
        }
      }),
    ];

    return () => subscriptions.forEach(sub => plexer.unsubscribe(sub));
  };

  return {
    state,
    startGame,
    stopGame,
    setupEventListeners,
    updateScore,
  };
}