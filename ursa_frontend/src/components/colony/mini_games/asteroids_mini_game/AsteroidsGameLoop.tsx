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
  AsteroidsAsteroidSpawnMessageDTO,
  AsteroidsPlayerShootAtCodeMessageDTO
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { CharCodeGenerator, SYMBOL_SET } from "./charCodeGenerator";
import { uint32, PlayerID } from "../../../../integrations/main_backend/mainBackendDTOs";
import { Minigame } from "../miniGame";
import { AsteroidsSettingsDTO } from "./AsteroidsMiniGame";
import { ApplicationContext } from "../../../../meta/types";
import { MOCK_SERVER_ID } from "../../../../ts/mockServer";

class AsteroidsGameLoop {
  public static readonly LOOP_FREQUENCY_MS = 1000 / 10; //10 updates per second
  private readonly charPool: CharCodeGenerator;
  private readonly asteroids: Map<uint32, AsteroidsAsteroidSpawnMessageDTO & { spawnTimestampMS: number }> = new Map();
  private readonly events: IExpandedAccessMultiplexer;
  private readonly subIds: number[];
  private readonly localPlayerCode: string;

  private remainingHP: number;
  constructor(
    private readonly context: ApplicationContext,
    private readonly settings: AsteroidsSettingsDTO,
  ){
    this.charPool = new CharCodeGenerator(SYMBOL_SET, settings.charCodeLength);
    this.remainingHP = settings.colonyHealth;
    this.events = context.events as IExpandedAccessMultiplexer;

    this.localPlayerCode = this.charPool.generateCode();
    this.events.emitRAW({
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT.id,
      id: this.context.backend.localPlayer.id,
      x: 0.5,
      y: 0.9,
      type: 0,
      code: this.localPlayerCode,
    });

    const playerShotSubID = this.events.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, this.onPlayerShot);
    this.subIds = [playerShotSubID];
  }

  private gameTimeMS: number = 0;
  private nextAsteroidID: uint32 = 0;
  private asteroidSpawnCount: uint32 = 0;
  private loopInterval: NodeJS.Timeout | null = null;

  private spawnAsteroid = () => {
    const x = Math.random() * .9 + .1;
    const y = Math.random() * .5;
    const id = this.nextAsteroidID++;
    const charCode = this.charPool.generateCode();
    const timeTillImpact = Math.random() * (this.settings.maxTimeTillImpactS - this.settings.minTimeTillImpactS) + this.settings.minTimeTillImpactS;
    const health = Math.round(this.settings.asteroidMaxHealth * Math.random());
    const data = { id, x, y, health,
      timeUntilImpact: timeTillImpact,
      type: 0,
      charCode,
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_ASTEROID_SPAWN_EVENT.id,
    };
    this.asteroids.set(id, {...data, spawnTimestampMS: this.gameTimeMS});
    this.events.emitRAW(data);
    this.asteroidSpawnCount++;
  }

  private onPlayerShot = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {
    for (const [id, asteroid] of this.asteroids) {
      if (asteroid.charCode === data.code) {
        this.asteroids.delete(id);
      }
    }

  }

  public start = () => {
    this.loopInterval = setInterval(this.update, AsteroidsGameLoop.LOOP_FREQUENCY_MS);
  }

  private update = () => {
    if (this.remainingHP <= 0) {
      this.onGameLost();
      return;
    }

    if (this.gameTimeMS >= this.settings.survivalTimeS * 1000) {
      this.onGameWon();
      return;
    }

    this.gameTimeMS += AsteroidsGameLoop.LOOP_FREQUENCY_MS;
    const gameAdvancementPercent = this.gameTimeMS / (this.settings.survivalTimeS * 1000);
    const asteroidsPerSecondRightNow = (this.settings.asteroidsPerSecondAt80Percent - this.settings.asteroidsPerSecondAtStart) * gameAdvancementPercent + this.settings.asteroidsPerSecondAtStart;
    // This math is wrong, it does take into accound that asteroidsPerSecond rising slowly during the game
    const expectedSpawnCountRightNow = this.gameTimeMS / 1000 * asteroidsPerSecondRightNow;
    // If the expected count is greater than the current count, spawn an asteroid
    if (expectedSpawnCountRightNow > this.asteroidSpawnCount) {
      this.spawnAsteroid();
    }

    this.evaluateAsteroids();
  }

  /**
   * Run through all asteroid, and check if they've impacted yet
   */
  private evaluateAsteroids = () => {
    for (const [id, asteroid] of this.asteroids) {
      if (this.gameTimeMS >= asteroid.timeUntilImpact + asteroid.spawnTimestampMS) {
        //Remove from map
        this.asteroids.delete(id);
        //Subtract health
        this.remainingHP -= asteroid.health;
        //Send asteroid impact event
        ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT
        this.events.emitRAW({
          senderID: MOCK_SERVER_ID, eventID: ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT.id,
          id, //asteroid id
          colonyHPLeft: this.remainingHP,
        });
      }
    }
  }

  private onGameLost = () => {
    this.events.emitRAW({
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_GAME_LOST_EVENT.id,
    });
    this.cleanup();
  }

  private onGameWon = () => {
    this.events.emitRAW({
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_GAME_WON_EVENT.id,
    });
    this.cleanup();
  }

  private cleanup = () => {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.events.unsubscribe(...this.subIds);
  }
}

export const createAsteroidsGameLoop: Minigame<AsteroidsSettingsDTO>["mockServerGameloop"] = (
  settings: AsteroidsSettingsDTO,
  context: ApplicationContext, 
) => {
  const loop = new AsteroidsGameLoop(context, settings);
  return loop.start;
}