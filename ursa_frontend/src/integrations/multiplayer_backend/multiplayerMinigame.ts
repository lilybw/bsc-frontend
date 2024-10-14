import { IExpandedAccessMultiplexer } from '../../integrations/multiplayer_backend/eventMultiplexer';
import {
  DIFFICULTY_SELECT_FOR_MINIGAME_EVENT,
  DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
  PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT,
  PLAYER_READY_FOR_MINIGAME_EVENT,
  PLAYER_ABORTING_MINIGAME_EVENT,
  PLAYER_JOIN_ACTIVITY_EVENT,
  MINIGAME_BEGINS_EVENT,
  DifficultyConfirmedForMinigameMessageDTO,
  PlayerReadyForMinigameMessageDTO,
  PlayerAbortingMinigameMessageDTO,
  PlayerJoinActivityMessageDTO,
  PlayersDeclareIntentForMinigameMessageDTO,
  DifficultySelectForMinigameMessageDTO
} from '../../integrations/multiplayer_backend/EventSpecifications';
import { LobbyStateResponseDTO, ClientDTO } from '../../integrations/multiplayer_backend/multiplayerDTO';
import { ApplicationContext } from '../../meta/types';
import { MultiplayerMode, ResCodeErr } from '../../meta/types';

type PlayerIntent = 'ready' | 'abort' | 'unknown';
type GameState = 'idle' | 'selecting-difficulty' | 'waiting-for-intents' | 'waiting-for-joins' | 'ready-to-start' | 'in-game';

const TIMEOUT_MS = 30000; // 30 seconds timeout for waiting operations
const ASTEROIDS_MINIGAME_ID = 1; // Assuming this is the correct ID for the Asteroids mini-game

export class AsteroidsGameManager {
  private state: GameState = 'idle';
  private playerIntents: Map<number, PlayerIntent> = new Map();
  private playersJoined: Set<number> = new Set();
  private difficultyConfirmed: DifficultyConfirmedForMinigameMessageDTO | null = null;

  constructor(
    private context: ApplicationContext,
    private events: IExpandedAccessMultiplexer,
    private getLobbyState: () => Promise<ResCodeErr<LobbyStateResponseDTO>>,
    private onGameStart: () => void,
    private onGameAbort: () => void
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.events.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, this.onDifficultyConfirmed);
    this.events.subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, this.onPlayersDeclareIntent);
    this.events.subscribe(PLAYER_READY_FOR_MINIGAME_EVENT, this.onPlayerReady);
    this.events.subscribe(PLAYER_ABORTING_MINIGAME_EVENT, this.onPlayerAborting);
    this.events.subscribe(PLAYER_JOIN_ACTIVITY_EVENT, this.onPlayerJoinActivity);
    this.events.subscribe(MINIGAME_BEGINS_EVENT, this.onMinigameBegins);
  }

  public getDifficultyConfirmed(): DifficultyConfirmedForMinigameMessageDTO | null {
    return this.difficultyConfirmed;
  }

  public async initiateGameProcess() {
    try {
      this.state = 'selecting-difficulty';
      if (this.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) {
        // Prompt owner to select difficulty
        // This should be implemented in the UI
        console.log("Owner should select difficulty");
      } else {
        await this.waitForDifficultyConfirmation();
      }

      this.state = 'waiting-for-intents';
      if (this.context.multiplayer.getMode() === MultiplayerMode.AS_OWNER) {
        await this.events.emit(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, {});
      }
      await this.waitForAllPlayerIntents();

      this.state = 'waiting-for-joins';
      await this.waitForAllPlayersToJoin();

      this.state = 'ready-to-start';
      console.log("Waiting for server to start the game");
      // Wait for server to send MINIGAME_BEGINS event
    } catch (error) {
      console.error("Error during game initiation:", error);
      this.onGameAbort();
    }
  }

  public selectDifficulty(difficultyId: number, difficultyName: string) {
    if (this.context.multiplayer.getMode() !== MultiplayerMode.AS_OWNER) {
      throw new Error("Only the owner can select difficulty");
    }
    if (this.state !== 'selecting-difficulty') {
      throw new Error("Cannot select difficulty in current state");
    }
    const data: Omit<DifficultySelectForMinigameMessageDTO, 'senderID' | 'eventID'> = {
      minigameID: ASTEROIDS_MINIGAME_ID,
      difficultyID: difficultyId,
      difficultyName: difficultyName
    };
    this.events.emit(DIFFICULTY_SELECT_FOR_MINIGAME_EVENT, data);
  }

  private async waitForDifficultyConfirmation(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for difficulty confirmation"));
      }, TIMEOUT_MS);

      const unsubscribe = this.events.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, () => {
        clearTimeout(timeout);
        this.events.unsubscribe(unsubscribe);
        resolve();
      });
    });
  }

  private async waitForAllPlayerIntents(): Promise<void> {
    const lobbyStateResponse = await this.getLobbyState();
    if (lobbyStateResponse.err) {
      throw new Error(lobbyStateResponse.err);
    }
    const lobbyState = lobbyStateResponse.res;
    if (!lobbyState) {
      throw new Error("Failed to get lobby state");
    }
    const allPlayersCount = lobbyState.clients.length;

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for all player intents"));
      }, TIMEOUT_MS);

      const checkAllIntents = () => {
        if (this.playerIntents.size === allPlayersCount) {
          clearTimeout(timeout);
          resolve();
        }
      };

      const unsubscribeReady = this.events.subscribe(PLAYER_READY_FOR_MINIGAME_EVENT, () => checkAllIntents());
      const unsubscribeAbort = this.events.subscribe(PLAYER_ABORTING_MINIGAME_EVENT, () => checkAllIntents());

      // Initial check in case all intents are already received
      checkAllIntents();
    });
  }

  private async waitForAllPlayersToJoin(): Promise<void> {
    const readyPlayersCount = Array.from(this.playerIntents.values()).filter(intent => intent === 'ready').length;

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for all players to join"));
      }, TIMEOUT_MS);

      const checkAllJoined = () => {
        if (this.playersJoined.size === readyPlayersCount) {
          clearTimeout(timeout);
          resolve();
        }
      };

      const unsubscribe = this.events.subscribe(PLAYER_JOIN_ACTIVITY_EVENT, () => checkAllJoined());

      // Initial check in case all players have already joined
      checkAllJoined();
    });
  }

  private onDifficultyConfirmed = (data: DifficultyConfirmedForMinigameMessageDTO) => {
    this.difficultyConfirmed = data;
    console.log("Difficulty confirmed:", data.difficultyName);
  }

  private onPlayersDeclareIntent = (data: PlayersDeclareIntentForMinigameMessageDTO) => {
    // Reset player intents
    this.playerIntents.clear();
    console.log("Players declaring intents");
  }

  private onPlayerReady = (data: PlayerReadyForMinigameMessageDTO) => {
    this.playerIntents.set(data.id, 'ready');
    console.log("Player ready:", data.ign);
  }

  private onPlayerAborting = (data: PlayerAbortingMinigameMessageDTO) => {
    this.playerIntents.set(data.id, 'abort');
    console.log("Player aborting:", data.ign);
  }

  private onPlayerJoinActivity = (data: PlayerJoinActivityMessageDTO) => {
    this.playersJoined.add(data.id);
    console.log("Player joined activity:", data.ign);
  }

  private onMinigameBegins = () => {
    this.state = 'in-game';
    this.onGameStart();
    console.log("Minigame begins");
  }

  public declareReady() {
    if (this.state !== 'waiting-for-intents') {
      throw new Error("Cannot declare ready in current state");
    }
    const data: Omit<PlayerReadyForMinigameMessageDTO, 'senderID' | 'eventID'> = {
      id: this.context.backend.localPlayer.id,
      ign: `${this.context.backend.localPlayer.firstName} ${this.context.backend.localPlayer.lastName}`
    };
    this.events.emit(PLAYER_READY_FOR_MINIGAME_EVENT, data);
  }

  public declareAbort() {
    if (this.state !== 'waiting-for-intents' && this.state !== 'waiting-for-joins') {
      throw new Error("Cannot declare abort in current state");
    }
    const data: Omit<PlayerAbortingMinigameMessageDTO, 'senderID' | 'eventID'> = {
      id: this.context.backend.localPlayer.id,
      ign: `${this.context.backend.localPlayer.firstName} ${this.context.backend.localPlayer.lastName}`
    };
    this.events.emit(PLAYER_ABORTING_MINIGAME_EVENT, data);
  }

  public joinActivity() {
    if (this.state !== 'waiting-for-joins') {
      throw new Error("Cannot join activity in current state");
    }
    const data: Omit<PlayerJoinActivityMessageDTO, 'senderID' | 'eventID'> = {
      id: this.context.backend.localPlayer.id,
      ign: `${this.context.backend.localPlayer.firstName} ${this.context.backend.localPlayer.lastName}`
    };
    this.events.emit(PLAYER_JOIN_ACTIVITY_EVENT, data);
  }

  public reset() {
    this.state = 'idle';
    this.playerIntents.clear();
    this.playersJoined.clear();
    this.difficultyConfirmed = null;
    console.log("Game manager reset");
  }

  public getCurrentState(): GameState {
    return this.state;
  }
}