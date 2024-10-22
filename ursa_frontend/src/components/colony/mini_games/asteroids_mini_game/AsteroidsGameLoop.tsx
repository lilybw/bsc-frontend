// AsteroidsGameLoop.tsx

import { createStore, SetStoreFunction } from "solid-js/store";
import { IEventMultiplexer, IExpandedAccessMultiplexer } from "../../../../integrations/multiplayer_backend/eventMultiplexer";
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
  DifficultyConfirmedForMinigameMessageDTO,
  AsteroidsAsteroidSpawnMessageDTO
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { CharCodeGenerator, SYMBOL_SET } from "./charCodeGenerator";
import { uint32, PlayerID } from "../../../../integrations/main_backend/mainBackendDTOs";
import { Minigame } from "../miniGame";
import { AsteroidsSettingsDTO } from "./AsteroidsMiniGame";
import { ApplicationContext } from "../../../../meta/types";
import { MOCK_SERVER_ID } from "../../../../ts/mockServer";

class AsteroidsGameLoop {
  private readonly charPool: CharCodeGenerator;
  private readonly asteroids: Map<uint32, AsteroidsAsteroidSpawnMessageDTO> = new Map();
  private readonly events: IExpandedAccessMultiplexer;

  private remainingHP: number;
  constructor(
    private readonly context: ApplicationContext,
    private readonly settings: AsteroidsSettingsDTO,
  ){
    this.charPool = new CharCodeGenerator(SYMBOL_SET, settings.charCodeLength);
    this.remainingHP = settings.colonyHealth;
    this.events = context.events as IExpandedAccessMultiplexer; 
  }

  private deltaT: number = 0;
  private nextAsteroidID: uint32 = 0;
  private loopInterval: NodeJS.Timeout | null = null;

  private spawnAsteroid = () => {
    const x = Math.random() * .9 + .1;
    const y = Math.random() * .5;
    const id = this.nextAsteroidID++;
    const charCode = this.charPool.generateCode();
    const timeTillImpact = Math.random() * (this.settings.maxTimeTillImpactS - this.settings.minTimeTillImpactS) + this.settings.minTimeTillImpactS;
    const 
    const data = { id, x, y,
      health: 1,
      timeUntilImpact: timeTillImpact,
      type: 0,
      charCode,
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_ASTEROID_SPAWN_EVENT.id,
    };
    this.asteroids.set(id, data);
    this.events.emitRAW(data);
  }

}

export const createAsteroidsGameLoop: Minigame<AsteroidsSettingsDTO>["mockServerGameloop"] = (
  context: ApplicationContext, 
  settings: AsteroidsSettingsDTO,
) => {


  const spawnAsteroid = (id: uint32, x: number, y: number) => {
    const charCode = charCodeGenerator.generateCode();
    setState(prev => ({
      asteroids: new Map(prev.asteroids).set(id, { id, x, y, timeUntilImpact: ASTEROID_TRAVEL_TIME, charCode }),
      nextAsteroidId: (prev.nextAsteroidId + 1) as uint32,
    }));
    
    context.events.emit(ASTEROIDS_ASTEROID_SPAWN_EVENT, {
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
            context.events.emit(ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT, {
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
    context.events.emit(ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT, {});
  };

  const updateScore = (points: number) => {
    setState('score', score => score + points);
  };

  const setupEventListeners = () => {
    const subscriptions = [
      context.events.subscribe(PLAYER_LEFT_EVENT, () => {
        console.log("Player left event received");
      }),
      context.events.subscribe(LOBBY_CLOSING_EVENT, stopGame),
      context.events.subscribe(MINIGAME_BEGINS_EVENT, startGame),
      context.events.subscribe(ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT, (data) => {
        setState('playerCode', data.code);
      }),
      context.events.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, (data) => {
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

    return () => context.events.unsubscribe(...subscriptions);
  };

  return {
    state,
    startGame,
    stopGame,
    setupEventListeners,
    updateScore,
  };
}