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
    LocationUpgradeMessageDTO,
    LOCATION_UPGRADE_EVENT,
} from '../../../../integrations/multiplayer_backend/EventSpecifications';
import { CharCodeGenerator, SYMBOL_SET } from '../utils/charCodeGenerator';
import { uint32 } from '../../../../integrations/main_backend/mainBackendDTOs';
import { GenericGameLoopStartFunction, KnownMinigames, loadComputedSettings, SingleplayerGameLoopInitFunc } from '../miniGame';
import { ApplicationContext, ResErr } from '../../../../meta/types';
import { Logger } from '../../../../logging/filteredLogger';
import { GlobalRandom, lerp } from '@/ts/ursaMath';
import { MOCK_SERVER_ID } from '@/integrations/multiplayer_backend/mockServer';

/**
 * Settings DTO for the Asteroids minigame
 * All time values are in seconds unless specified otherwise
 */
export interface AsteroidsSettingsDTO {
    minTimeTillImpactS: number; // Minimum time for asteroid to reach impact point
    maxTimeTillImpactS: number; // Maximum time for asteroid to reach impact point
    charCodeLength: uint32; // Length of character codes for shooting
    asteroidsPerSecondAtStart: number; // Initial spawn rate
    asteroidsPerSecondAt80Percent: number; // Spawn rate at 80% game completion
    colonyHealth: uint32; // Starting health of the colony
    asteroidMaxHealth: uint32; // Maximum possible health of asteroids
    stunDurationS: number; // How long players remain stunned
    friendlyFirePenaltyS: number; // Base friendly fire penalty duration
    friendlyFirePenaltyMultiplier: number; // Multiplier for consecutive friendly fire
    timeBetweenShotsS: number; // Cooldown between shots
    survivalTimeS: number; // Total game duration
    spawnRateCoopModifier: number; // Modifier for spawn rate in cooperative mode
}

export const NULL_ASTEROIDS_SETTINGS: Readonly<AsteroidsSettingsDTO> = {
    minTimeTillImpactS: 0,
    maxTimeTillImpactS: 0,
    charCodeLength: 0,
    asteroidsPerSecondAtStart: 0,
    asteroidsPerSecondAt80Percent: 0,
    colonyHealth: 0,
    asteroidMaxHealth: 0,
    stunDurationS: 0,
    friendlyFirePenaltyS: 0,
    friendlyFirePenaltyMultiplier: 0,
    timeBetweenShotsS: 0,
    survivalTimeS: 0,
    spawnRateCoopModifier: 0,
};

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
        private readonly colonyID: uint32,
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
        const startY = GlobalRandom.next() * 0.5 + 0.05; // Start somewhere random vertically
        const id = this.nextAsteroidID++;
        const charCode = this.charPool.generateCode();
        const timeTillImpactMS = lerp(GlobalRandom.next(), this.settings.minTimeTillImpactS, this.settings.maxTimeTillImpactS) * 1000;
        const health = Math.ceil(this.settings.asteroidMaxHealth * GlobalRandom.next());

        const data: AsteroidsAsteroidSpawnMessageDTO = {
            id,
            x: 1,
            y: startY,
            health,
            timeUntilImpact: timeTillImpactMS,
            type: 0,
            charCode,
            senderID: MOCK_SERVER_ID,
            eventID: ASTEROIDS_ASTEROID_SPAWN_EVENT.id,
        };

        this.asteroids.set(id, { ...data, spawnTimestampMS: this.gameTimeMS });
        this.events.emitRAW<AsteroidsAsteroidSpawnMessageDTO>(data, this.internalOrigin);
        this.asteroidSpawnCount++;
        this.log.subtrace(`Spawned asteroid ${id} at ${1}, ${startY} with code ${charCode}. HP: ${health}`);
    };

    private onPlayerShot = (data: AsteroidsPlayerShootAtCodeMessageDTO) => {
        this.log.trace(`Player ${data.id} shot at ${data.code}`);
        let somethingWasHit = false;
        for (const [id, asteroid] of this.asteroids) {
            if (asteroid.charCode === data.code) {
                asteroid.health--;
                if (asteroid.health <= 0) {
                    this.asteroids.delete(id);
                }
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
            y: 0.8,
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
            colonyLocationID: this.difficulty.colonyLocationID,
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
            colonyLocationID: this.difficulty.colonyLocationID,
            minigameID: KnownMinigames.ASTEROIDS,
            difficultyID: this.difficulty.difficultyID,
            difficultyName: this.difficulty.difficultyName,
        }, this.internalOrigin);
        
        this.context.backend.locations.upgrade(this.colonyID, this.difficulty.colonyLocationID).then((res) => {
            if (res.err != null) {
                this.log.error('Failed to upgrade location: ' + res.err);
            } else {
                this.events.emitRAW<LocationUpgradeMessageDTO>({
                    senderID: MOCK_SERVER_ID,
                    eventID: LOCATION_UPGRADE_EVENT.id,
                    colonyLocationID: this.difficulty.colonyLocationID,
                    level: res.res.level
                }, this.internalOrigin);
            }
        })
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
    colonyID: uint32,
): Promise<ResErr<GenericGameLoopStartFunction>> => {
    const settings = await loadComputedSettings<AsteroidsSettingsDTO>(context.backend, KnownMinigames.ASTEROIDS, difficulty.difficultyID);
    if (settings.err !== null) {
        return { res: null, err: 'Error initializing gameloop: ' + settings.err };
    }
    const loop = new AsteroidsGameLoop(context, settings.res, difficulty, colonyID);

    return { res: loop.start, err: null };
};
