import { IExpandedAccessMultiplexer } from '../../../../integrations/multiplayer_backend/eventMultiplexer';
import {
    ASTEROIDS_ASTEROID_SPAWN_EVENT,
    ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT,
    ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT,
    ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT,
    AsteroidsAsteroidSpawnMessageDTO,
    AsteroidsPlayerShootAtCodeMessageDTO,
    ASTEROIDS_PLAYER_PENALTY_EVENT,
    PlayerPenaltyType,
    MinigameLostMessageDTO,
    MINIGAME_LOST_EVENT,
    MinigameWonMessageDTO,
    MINIGAME_WON_EVENT,
    DifficultyConfirmedForMinigameMessageDTO,
    AsteroidsPlayerPenaltyMessageDTO,
    AsteroidsAsteroidImpactOnColonyMessageDTO,
} from '../../../../integrations/multiplayer_backend/EventSpecifications';
import { CharCodeGenerator, SYMBOL_SET } from './charCodeGenerator';
import { uint32, PlayerID } from '../../../../integrations/main_backend/mainBackendDTOs';
import { GenericGameLoopStartFunction, KnownMinigames, loadComputedSettings, SingleplayerGameLoopInitFunc } from '../miniGame';
import { ApplicationContext, ResErr } from '../../../../meta/types';
import { MOCK_SERVER_ID } from '../../../../ts/mockServer';
import { Logger } from '../../../../logging/filteredLogger';
import { AsteroidsSettingsDTO } from './types/gameTypes';

class AsteroidsGameLoop {
    public static readonly LOOP_FREQUENCY_MS = 1000 / 10; //10 updates per second
    private readonly internalOrigin = "asteroidsGameLoop"
    private readonly charPool: CharCodeGenerator;
    private readonly asteroids: Map<uint32, AsteroidsAsteroidSpawnMessageDTO & { spawnTimestampMS: number }> = new Map();
    private readonly events: IExpandedAccessMultiplexer;
    private readonly subIds: number[];
    private localPlayerCode?: string;
    private readonly log: Logger;

    private remainingHP: number;
    constructor(
        private readonly context: ApplicationContext,
        private readonly settings: AsteroidsSettingsDTO,
        private readonly difficulty: DifficultyConfirmedForMinigameMessageDTO,
    ) {
        this.charPool = new CharCodeGenerator(SYMBOL_SET, settings.charCodeLength);
        this.remainingHP = settings.colonyHealth;
        this.events = context.events as IExpandedAccessMultiplexer;
        this.log = context.logger.copyFor('ast game loop');

        const playerShotSubID = this.events.subscribe(ASTEROIDS_PLAYER_SHOOT_AT_CODE_EVENT, this.onPlayerShot);
        this.subIds = [playerShotSubID];
    }

    private gameTimeMS: number = 0;
    private nextAsteroidID: uint32 = 0;
    private asteroidSpawnCount: uint32 = 0;
    private loopInterval: NodeJS.Timeout | null = null;
    private selfHitCounts = 1;

    private spawnAsteroid = () => {
        const startX = Math.random() * 0.9 + 0.1; // Start somewhere on the right side
        const startY = Math.random() * 0.9 + 0.1; // Start somewhere random vertically
        const id = this.nextAsteroidID++;
        const charCode = this.charPool.generateCode();
        const timeTillImpact =
            Math.random() * (this.settings.maxTimeTillImpactS * 1000 - this.settings.minTimeTillImpactS * 1000) +
            this.settings.minTimeTillImpactS * 1000;
        const health = Math.ceil(this.settings.asteroidMaxHealth * Math.random());

        const data = {
            id,
            x: startX,
            y: startY,
            endX: Math.random() * 0.5, // Impact at left edge
            endY: Math.random() * 0.5, // Impact at vertical center
            health,
            timeUntilImpact: timeTillImpact,
            type: 0,
            charCode,
            senderID: MOCK_SERVER_ID,
            eventID: ASTEROIDS_ASTEROID_SPAWN_EVENT.id,
        };

        this.asteroids.set(id, { ...data, spawnTimestampMS: this.gameTimeMS });
        this.events.emitRAW<AsteroidsAsteroidSpawnMessageDTO>(data, this.internalOrigin);
        this.asteroidSpawnCount++;
        this.log.subtrace(`Spawned asteroid ${id} at ${startX}, ${startY} with code ${charCode}. HP: ${health}`);
    };

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
            this.events.emitRAW<AsteroidsPlayerPenaltyMessageDTO>({
                senderID: MOCK_SERVER_ID,
                eventID: ASTEROIDS_PLAYER_PENALTY_EVENT.id,
                playerID: this.context.backend.player.local.id,
                timeoutDurationS: this.settings.friendlyFirePenaltyS * (this.selfHitCounts++ * this.settings.friendlyFirePenaltyMultiplier),
                type: PlayerPenaltyType.FriendlyFire,
            }, this.internalOrigin);
        }

        if (!somethingWasHit) {
            //Emit ASTEROIDS_PLAYER_PENALTY_EVENT
            this.events.emitRAW<AsteroidsPlayerPenaltyMessageDTO>({
                senderID: MOCK_SERVER_ID,
                eventID: ASTEROIDS_PLAYER_PENALTY_EVENT.id,
                playerID: this.context.backend.player.local.id,
                timeoutDurationS: 1,
                type: PlayerPenaltyType.Miss,
            }, this.internalOrigin);
        }
    };

    public start = () => {
        this.log.trace('Starting asteroids game loop interval');
        this.localPlayerCode = this.charPool.generateCode();
        //Assign player data to local player
        this.events.emitRAW({
            senderID: MOCK_SERVER_ID,
            eventID: ASTEROIDS_ASSIGN_PLAYER_DATA_EVENT.id,
            id: this.context.backend.player.local.id,
            x: 0.5,
            y: 0.9,
            type: 0,
            code: this.localPlayerCode,
        });
        setTimeout(() => {
            this.loopInterval = setInterval(this.update, AsteroidsGameLoop.LOOP_FREQUENCY_MS);
        }, 1000)
    };

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
        const asteroidsPerSecondRightNow =
            (this.settings.asteroidsPerSecondAt80Percent - this.settings.asteroidsPerSecondAtStart) * gameAdvancementPercent +
            this.settings.asteroidsPerSecondAtStart;
        // This math is wrong, it does take into accound that asteroidsPerSecond rising slowly during the game
        const expectedSpawnCountRightNow = (this.gameTimeMS / 10000) * asteroidsPerSecondRightNow;
        // If the expected count is greater than the current count, spawn an asteroid
        if (expectedSpawnCountRightNow > this.asteroidSpawnCount) {
            this.spawnAsteroid();
        }

        this.evaluateAsteroids();
    };

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
                this.events.emitRAW<AsteroidsAsteroidImpactOnColonyMessageDTO>({
                    senderID: MOCK_SERVER_ID,
                    eventID: ASTEROIDS_ASTEROID_IMPACT_ON_COLONY_EVENT.id,
                    id, //asteroid id
                    colonyHPLeft: this.remainingHP,
                }, this.internalOrigin);
            }
        }
    };

    private onGameLost = () => {
        this.events.emitRAW<MinigameLostMessageDTO>({
            senderID: MOCK_SERVER_ID,
            eventID: MINIGAME_LOST_EVENT.id,
            minigameID: KnownMinigames.ASTEROIDS,
            difficultyID: this.difficulty.difficultyID,
            difficultyName: this.difficulty.difficultyName,
        }, this.internalOrigin);
        this.cleanup();
    };

    private onGameWon = () => {
        this.events.emitRAW<MinigameWonMessageDTO>({
            senderID: MOCK_SERVER_ID,
            eventID: MINIGAME_WON_EVENT.id,
            minigameID: KnownMinigames.ASTEROIDS,
            difficultyID: this.difficulty.difficultyID,
            difficultyName: this.difficulty.difficultyName,
        }, this.internalOrigin);
        this.cleanup();
    };

    private cleanup = () => {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.events.unsubscribe(...this.subIds);
    };
}

export const createAsteroidsGameLoop: SingleplayerGameLoopInitFunc = async (
    context: ApplicationContext,
    difficulty: DifficultyConfirmedForMinigameMessageDTO,
): Promise<ResErr<GenericGameLoopStartFunction>> => {
    const settings = await loadComputedSettings<AsteroidsSettingsDTO>(context.backend, KnownMinigames.ASTEROIDS, difficulty.difficultyID);
    if (settings.err !== null) {
        return { res: null, err: 'Error initializing gameloop: ' + settings.err };
    }
    const loop = new AsteroidsGameLoop(context, settings.res, difficulty);

    return { res: loop.start, err: null };
};
