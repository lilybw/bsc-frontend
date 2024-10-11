import { Component, createEffect, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { IEventMultiplexer } from "../../../../integrations/multiplayer_backend/eventMultiplexer";
import {
  ASTEROIDS_ASTEROID_SPAWN_EVENT,
  ASTEROIDS_GAME_WON_EVENT,
  ASTEROIDS_GAME_LOST_EVENT,
  ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT,
  ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT
} from "../../../../integrations/multiplayer_backend/EventSpecifications";

interface AsteroidsGameLoopProps {
  plexer: IEventMultiplexer;
  difficulty: number;
  onGameEnd: (won: boolean) => void;
}

const GAME_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const BASE_SPAWN_RATE = 1000; // 1 asteroid per second
const ASTEROID_TRAVEL_TIME = 15; // seconds

const AsteroidsGameLoop: Component<AsteroidsGameLoopProps> = (props) => {
  const [state, setState] = createStore({
    gameTime: 0,
    asteroids: new Map<number, { id: number, timeUntilImpact: number }>(),
    nextAsteroidId: 1,
    colonyHealth: 3,
  });

  const generateCharCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const spawnAsteroid = () => {
    const id = state.nextAsteroidId;
    
    props.plexer.emit(ASTEROIDS_ASTEROID_SPAWN_EVENT, {
      id,
      x: Math.random(),
      y: Math.random(),
      health: 1,
      timeUntilImpact: ASTEROID_TRAVEL_TIME,
      type: 0,
      charCode: generateCharCode(), // Add this line
    });

    setState(prev => ({
      asteroids: new Map(prev.asteroids).set(id, { id, timeUntilImpact: ASTEROID_TRAVEL_TIME }),
      nextAsteroidId: prev.nextAsteroidId + 1,
    }));
  };

  const gameLoop = () => {
    setState('gameTime', t => t + 16); // Assume 60 FPS

    // Spawn asteroids
    if (Math.random() < (props.difficulty / (BASE_SPAWN_RATE / 16))) {
      spawnAsteroid();
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
      props.plexer.emit(ASTEROIDS_GAME_WON_EVENT, {});
      props.onGameEnd(true);
    } else if (state.colonyHealth <= 0) {
      props.plexer.emit(ASTEROIDS_GAME_LOST_EVENT, {});
      props.onGameEnd(false);
    }
  };

  let gameLoopInterval: NodeJS.Timeout; // Change this line

  createEffect(() => {
    gameLoopInterval = setInterval(gameLoop, 16); // ~60 FPS

    onCleanup(() => {
      clearInterval(gameLoopInterval);
      props.plexer.emit(ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT, {});
    });
  });

  return null; // This component doesn't render anything
};

export default AsteroidsGameLoop;