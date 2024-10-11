import { Component, createEffect, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
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
  ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { CharCodeGenerator, SYMBOL_SET } from "./charCodeGenerator";

interface AsteroidsGameLoopProps {
  plexer: IEventMultiplexer;
  difficulty: number;
  onGameEnd: (won: boolean, metrics: GameMetrics) => void;
}

interface GameMetrics {
  totalAsteroidsSpawned: number;
  totalAsteroidsDestroyed: number;
  averageReactionTime: number;
  gameTime: number;
}

const GAME_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const BASE_SPAWN_RATE = 1000; // 1 asteroid per second
const ASTEROID_TRAVEL_TIME = 15; // seconds
const BASE_CODE_LENGTH = 3;

/**
 * AsteroidsGameLoop Component
 * 
 * This component manages the game loop for the Asteroids minigame.
 * It handles asteroid spawning, game state updates, and event management.
 */
const AsteroidsGameLoop: Component<AsteroidsGameLoopProps> = (props) => {
  const codeLength = BASE_CODE_LENGTH + props.difficulty - 1;
  const charCodeGenerator = new CharCodeGenerator(SYMBOL_SET, codeLength);

  // Game state
  const [state, setState] = createStore({
    gameTime: 0,
    asteroids: new Map<number, { id: number, timeUntilImpact: number, charCode: string, spawnTime: number }>(),
    nextAsteroidId: 1,
    colonyHealth: 3,
    isGameRunning: false,
    metrics: {
      totalAsteroidsSpawned: 0,
      totalAsteroidsDestroyed: 0,
      totalReactionTime: 0,
    },
  });

  /**
   * Spawns a new asteroid and emits the spawn event.
   */
  const spawnAsteroid = (id: number, x: number, y: number) => {
    const charCode = charCodeGenerator.generateCode();
    const spawnTime = Date.now();
    setState(prev => ({
      asteroids: new Map(prev.asteroids).set(id, { id, timeUntilImpact: ASTEROID_TRAVEL_TIME, charCode, spawnTime }),
      nextAsteroidId: prev.nextAsteroidId + 1,
      metrics: {
        ...prev.metrics,
        totalAsteroidsSpawned: prev.metrics.totalAsteroidsSpawned + 1,
      },
    }));
    
    // Emit the spawn event
    props.plexer.emit(ASTEROIDS_ASTEROID_SPAWN_EVENT, {
      id,
      x,
      y,
      health: 1,
      timeUntilImpact: ASTEROID_TRAVEL_TIME,
      type: 0,
      charCode,
    });

    console.log(`Asteroid spawned: ID ${id}, Code ${charCode}`);
  };

  /**
   * Main game loop function.
   * Handles asteroid spawning, position updates, and game end conditions.
   */
  const gameLoop = () => {
    if (!state.isGameRunning) return;

    setState('gameTime', t => t + 16); // Assume 60 FPS

    // Spawn asteroids
    if (Math.random() < (props.difficulty / (BASE_SPAWN_RATE / 16))) {
      spawnAsteroid(state.nextAsteroidId, Math.random(), Math.random());
    }

    // Update asteroid positions
    setState('asteroids', asteroids => {
      const updatedAsteroids = new Map(asteroids);
      for (const [id, asteroid] of updatedAsteroids) {
        if (asteroid.timeUntilImpact <= 0) {
          updatedAsteroids.delete(id);
          setState('colonyHealth', health => {
            const newHealth = health - 1;
            props.plexer.emit(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, {
              id,
              colonyHPLeft: newHealth
            });
            console.log(`Colony hit! Health reduced to ${newHealth}`);
            return newHealth;
          });
        } else {
          asteroid.timeUntilImpact -= 16 / 1000; // Convert ms to seconds
        }
      }
      return updatedAsteroids;
    });

    // Check game end conditions
    if (state.gameTime >= GAME_DURATION) {
      endGame(true);
    } else if (state.colonyHealth <= 0) {
      endGame(false);
    }
  };

  /**
   * Ends the game and calculates final metrics.
   */
  const endGame = (won: boolean) => {
    setState('isGameRunning', false);
    const finalMetrics: GameMetrics = {
      totalAsteroidsSpawned: state.metrics.totalAsteroidsSpawned,
      totalAsteroidsDestroyed: state.metrics.totalAsteroidsDestroyed,
      averageReactionTime: state.metrics.totalAsteroidsDestroyed > 0 
        ? state.metrics.totalReactionTime / state.metrics.totalAsteroidsDestroyed 
        : 0,
      gameTime: state.gameTime,
    };
    props.onGameEnd(won, finalMetrics);
    console.log(`Game ended. Won: ${won}`, finalMetrics);

    // TODO: Implement backend call to store metrics in the database
    // Example: backendService.storeGameMetrics(finalMetrics);
  };

  let gameLoopInterval: NodeJS.Timeout;

  createEffect(() => {
    const subscriptions = [
      props.plexer.subscribe(PLAYER_LEFT_EVENT, () => {
        console.log("Player left event received");
        endGame(false);
      }),
      props.plexer.subscribe(LOBBY_CLOSING_EVENT, () => {
        console.log("Lobby closing event received");
        endGame(false);
      }),
      props.plexer.subscribe(MINIGAME_BEGINS_EVENT, () => {
        console.log("Minigame begins event received");
        setState('isGameRunning', true);
      }),
      props.plexer.subscribe(ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, (data) => {
        console.log("Player data assigned", data);
        // Handle player data assignment if needed
      }),
      props.plexer.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, (data) => {
        console.log("Player shot at code", data);
        setState(state => {
          const newAsteroids = new Map(state.asteroids);
          for (const [id, asteroid] of newAsteroids) {
            if (asteroid.charCode === data.code) {
              newAsteroids.delete(id);
              const reactionTime = Date.now() - asteroid.spawnTime;
              return {
                asteroids: newAsteroids,
                metrics: {
                  ...state.metrics,
                  totalAsteroidsDestroyed: state.metrics.totalAsteroidsDestroyed + 1,
                  totalReactionTime: state.metrics.totalReactionTime + reactionTime,
                },
              };
            }
          }
          return state;
        });
      }),
      props.plexer.subscribe(ASTEROIDS_GAME_WON_EVENT, () => {
        console.log("Game won event received");
        endGame(true);
      }),
      props.plexer.subscribe(ASTEROIDS_GAME_LOST_EVENT, () => {
        console.log("Game lost event received");
        endGame(false);
      }),
      props.plexer.subscribe(ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT, () => {
        console.log("Untimely abort event received");
        endGame(false);
      }),
    ];

    gameLoopInterval = setInterval(gameLoop, 16); // ~60 FPS

    onCleanup(() => {
      clearInterval(gameLoopInterval);
      subscriptions.forEach(sub => props.plexer.unsubscribe(sub));
      props.plexer.emit(ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT, {});
    });
  });

  return null;
};

export default AsteroidsGameLoop;