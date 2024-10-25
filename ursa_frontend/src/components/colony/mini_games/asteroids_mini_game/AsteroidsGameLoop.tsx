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
  AsteroidsPlayerShootAtCodeMessageDTO,
  ASTEROIDS_PLAYER_PENALTY_EVENT,
  PlayerPenaltyType
} from "../../../../integrations/multiplayer_backend/EventSpecifications";
import { CharCodeGenerator, SYMBOL_SET } from "./charCodeGenerator";
import { uint32, PlayerID } from "../../../../integrations/main_backend/mainBackendDTOs";
import { Minigame } from "../miniGame";
import { AsteroidsSettingsDTO } from "./AsteroidsMiniGame";
import { ApplicationContext } from "../../../../meta/types";
import { MOCK_SERVER_ID } from "../../../../ts/mockServer";
import { Logger } from "../../../../logging/filteredLogger";

class AsteroidsGameLoop {
  public static readonly LOOP_FREQUENCY_MS = 1000 / 10; //10 updates per second
  private readonly charPool: CharCodeGenerator;
  private readonly asteroids: Map<uint32, AsteroidsAsteroidSpawnMessageDTO & { spawnTimestampMS: number }> = new Map();
  private readonly events: IExpandedAccessMultiplexer;
  private readonly subIds: number[];
  private readonly localPlayerCode: string;
  private readonly log: Logger;

  private remainingHP: number;
  constructor(
    private readonly context: ApplicationContext,
    private readonly settings: AsteroidsSettingsDTO,
  ) {
    this.charPool = new CharCodeGenerator(SYMBOL_SET, settings.charCodeLength);
    this.remainingHP = settings.colonyHealth;
    this.events = context.events as IExpandedAccessMultiplexer;
    this.log = context.logger.copyFor("ast game loop");

    this.localPlayerCode = this.charPool.generateCode();
    //Assign player data to local player
    this.events.emitRAW({
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT.id,
      id: this.context.backend.player.local.id,
      x: 0.5,
      y: 0.9,
      type: 0,
      code: this.localPlayerCode
    });
    this.log.trace("settings: " + JSON.stringify(settings));

    const playerShotSubID = this.events.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, this.onPlayerShot);
    this.subIds = [playerShotSubID];
  }

  private gameTimeMS: number = 0;
  private nextAsteroidID: uint32 = 0;
  private asteroidSpawnCount: uint32 = 0;
  private loopInterval: NodeJS.Timeout | null = null;
  private selfHitCounts = 1;

  private spawnAsteroid = () => {
    const startX = Math.random() * .9 + .1; // Start somewhere on the right side
    const startY = Math.random() * .9 + .1; // Start somewhere random vertically
    const id = this.nextAsteroidID++;
    const charCode = this.charPool.generateCode();
    const timeTillImpact = (Math.random() * ((this.settings.maxTimeTillImpactS * 1000) - (this.settings.minTimeTillImpactS * 1000)) + this.settings.minTimeTillImpactS * 1000);
    const health = Math.round(this.settings.asteroidMaxHealth * Math.random());

    const data = {
      id,
      x: startX,
      y: startY,
      endX: 0.0,    // Impact at left edge
      endY: 0.5,    // Impact at vertical center
      health,
      timeUntilImpact: timeTillImpact,
      type: 0,
      charCode,
      senderID: MOCK_SERVER_ID,
      eventID: ASTEROIDS_ASTEROID_SPAWN_EVENT.id,
    };

    this.asteroids.set(id, { ...data, spawnTimestampMS: this.gameTimeMS });
    this.events.emitRAW(data);
    this.asteroidSpawnCount++;
    this.log.trace(`Spawned asteroid ${id} at ${startX}, ${startY} with code ${charCode}`);
  }

  private onPlayerShot = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {
    this.log.trace(`Player ${data.id} shot at ${data.code}`);
    let somethingWasHit = false;
    for (const [id, asteroid] of this.asteroids) {
      if (asteroid.charCode === data.code) {
        this.asteroids.delete(id);
        somethingWasHit = true;
      }
    }

    if (data.code === this.localPlayerCode) {
      somethingWasHit = true;
      //Emit ASTEROIDS_PLAYER_PENALTY_EVENT
      this.events.emitRAW({
        senderID: MOCK_SERVER_ID,
        eventID: ASTEROIDS_PLAYER_PENALTY_EVENT.id,
        playerID: this.context.backend.player.local.id,
        timeoutDurationS: this.settings.friendlyFirePenaltyS * (this.selfHitCounts++ * this.settings.friendlyFirePenaltyMultiplier),
        type: PlayerPenaltyType.FriendlyFire,
      })
    }

    if (!somethingWasHit) {
      //Emit ASTEROIDS_PLAYER_PENALTY_EVENT
      this.events.emitRAW({
        senderID: MOCK_SERVER_ID,
        eventID: ASTEROIDS_PLAYER_PENALTY_EVENT.id,
        playerID: this.context.backend.player.local.id,
        timeoutDurationS: 1,
        type: PlayerPenaltyType.Miss,
      })
    }
  }

  public start = () => {
    this.log.trace("Starting asteroids game loop interval");
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
        this.log.trace(`Asteroid ${id} impacted`);
        //Remove from map
        this.asteroids.delete(id);
        //Subtract health
        this.remainingHP -= asteroid.health;
        //Send asteroid impact event
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