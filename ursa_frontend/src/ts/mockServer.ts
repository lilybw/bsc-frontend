import { IExpandedAccessMultiplexer } from '../integrations/multiplayer_backend/eventMultiplexer';
import {
    DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
    PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT,
    PLAYER_READY_FOR_MINIGAME_EVENT,
    PLAYER_ABORTING_MINIGAME_EVENT,
    PLAYER_JOIN_ACTIVITY_EVENT,
    DifficultyConfirmedForMinigameMessageDTO,
    IMessage,
    PLAYER_LOAD_COMPLETE_EVENT,
    PLAYER_LOAD_FAILURE_EVENT,
    GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT,
    GenericMinigameUntimelyAbortMessageDTO,
    PlayerLoadFailureMessageDTO,
    GenericMinigameSequenceResetMessageDTO,
    GENERIC_MINIGAME_SEQUENCE_RESET_EVENT,
    LOAD_MINIGAME_EVENT,
    LoadMinigameMessageDTO,
    MINIGAME_WON_EVENT,
    MINIGAME_LOST_EVENT,
} from '../integrations/multiplayer_backend/EventSpecifications';
import { ApplicationContext } from '../meta/types';
import { loadMinigameSingleplayerLoop, SingleplayerGameLoopInitFunc } from '../components/colony/mini_games/miniGame';
import { Logger } from '../logging/filteredLogger';

/**
 * Interface defining the basic operations of the MockServer.
 */
export interface IMockServer {
    start: () => void;
    shutdown: () => void;
}

/**
 * Enum representing different phases of the lobby.
 */
export enum LobbyPhase {
    RoamingColony = 0,
    AwaitingParticipants = 1,
    DeclareIntent = 2,
    PlayersLoading = 3,
    InMinigame = 4,
}

/**
 * Constant to represent the server's ID.
 */
export const MOCK_SERVER_ID: number = Number.MAX_SAFE_INTEGER;

/**
 * MockServer class that simulates the behavior of a game server for minigames.
 * It manages the lobby phases, handles game events, and interacts with the backend.
 */
export class MockServer implements IMockServer {
    private difficultyConfirmed: DifficultyConfirmedForMinigameMessageDTO | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private readonly subscriptionIDs: number[] = [];
    private readonly messageQueue: IMessage[] = [];
    private lobbyPhase: LobbyPhase = LobbyPhase.RoamingColony;
    private readonly events: IExpandedAccessMultiplexer;
    private readonly log: Logger;
    private minigameLoopInitFunc: SingleplayerGameLoopInitFunc | null = null;

    /**
     * Constructs a new MockServer instance.
     * @param context The application context containing necessary dependencies.
     */
    constructor(
        private context: ApplicationContext,
        log: Logger,
    ) {
        this.events = context.events as IExpandedAccessMultiplexer;
        this.log = log.copyFor('mock server');
    }

    /**
     * Starts the MockServer, initializing subscriptions and starting the update loop.
     */
    public start = () => {
        this.log.info('starting');
        this.reset();
        this.setupSubscriptions();
        this.intervalId = setInterval(this.update, 100);
    };

    /**
     * Shuts down the MockServer, cleaning up subscriptions and stopping the minigame.
     */
    public shutdown = () => {
        this.log.info('shutdown');
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
        }
        this.context.events.unsubscribe(...this.subscriptionIDs);
    };

    /**
     * Resets the MockServer to its initial state.
     */
    private reset = () => {
        this.log.info('resetting');
        this.difficultyConfirmed = null;
        this.messageQueue.length = 0;
        this.lobbyPhase = LobbyPhase.RoamingColony;
        this.minigameLoopInitFunc = null;
        this.events.emitRAW<GenericMinigameSequenceResetMessageDTO>({
            senderID: MOCK_SERVER_ID,
            eventID: GENERIC_MINIGAME_SEQUENCE_RESET_EVENT.id,
        });
    };
    /**
     * Main update loop of the MockServer. Processes queued messages and manages lobby phases.
     */
    private update = async () => {
        if (this.messageQueue.length === 0) return;
        let message: IMessage | undefined;
        while ((message = this.messageQueue.pop()) !== undefined) {
            switch (this.lobbyPhase) {
                case LobbyPhase.RoamingColony: {
                    // Handle difficulty confirmation
                    if (message.eventID === DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT.id) {
                        this.difficultyConfirmed = message as DifficultyConfirmedForMinigameMessageDTO;
                        this.lobbyPhase = LobbyPhase.AwaitingParticipants;
                        this.log.trace('Phase changed to AwaitingParticipants');
                    }
                    break;
                }
                case LobbyPhase.AwaitingParticipants: {
                    // Handle player joining activity
                    if (message.eventID === PLAYER_JOIN_ACTIVITY_EVENT.id) {
                        this.events.emitRAW({ senderID: MOCK_SERVER_ID, eventID: PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT.id });
                        this.lobbyPhase = LobbyPhase.DeclareIntent;
                        this.log.trace('Phase changed to DeclareIntent');
                    }
                    // Handle player aborting minigame
                    if (message.eventID === PLAYER_ABORTING_MINIGAME_EVENT.id) {
                        this.reset();
                    }
                    break;
                }
                case LobbyPhase.DeclareIntent: {
                    if (this.minigameLoopInitFunc === null) {
                        const loadAttempt = loadMinigameSingleplayerLoop(this.difficultyConfirmed?.minigameID!);
                        if (loadAttempt.err !== null) {
                            this.log.error(`Error loading minigame: ${loadAttempt.err}`);
                            this.reset();
                            return;
                        }
                        this.minigameLoopInitFunc = loadAttempt.res;
                    }

                    if (message.eventID === PLAYER_READY_FOR_MINIGAME_EVENT.id) {
                        if (this.minigameLoopInitFunc === null) {
                            this.log.error(`Loaded minigame is null, but a player ready was recieved`);
                            this.reset();
                            return;
                        }
                        this.lobbyPhase = LobbyPhase.PlayersLoading;
                        this.log.trace('Phase changed to PlayerLoading');
                        this.events.emitRAW<LoadMinigameMessageDTO>({ senderID: MOCK_SERVER_ID, eventID: LOAD_MINIGAME_EVENT.id });
                    }
                    break;
                }
                case LobbyPhase.PlayersLoading: {
                    if (message.eventID === PLAYER_LOAD_COMPLETE_EVENT.id) {
                        if (this.minigameLoopInitFunc === null) {
                            this.sequenceErrorGenericAbort(MOCK_SERVER_ID, 'Minigame loop init function is null');
                            return;
                        }
                        this.lobbyPhase = LobbyPhase.InMinigame;
                        this.log.info('Starting minigame game loop');
                        const startFuncAttempt = await this.minigameLoopInitFunc(this.context, this.difficultyConfirmed!);
                        if (startFuncAttempt.err !== null) {
                            this.sequenceErrorGenericAbort(MOCK_SERVER_ID, "Error starting game loop: " + startFuncAttempt.err);
                            return;
                        }
                        startFuncAttempt.res();
                        this.log.trace('Phase changed to InMinigame');
                    }
                    if (message.eventID === PLAYER_LOAD_FAILURE_EVENT.id) {
                        const cast = message as PlayerLoadFailureMessageDTO;
                        this.sequenceErrorGenericAbort(cast.senderID, cast.reason);
                        this.reset();
                    }
                    break;
                }
                case LobbyPhase.InMinigame: {
                }
            }
        }
    };

    private sequenceErrorGenericAbort = (sourceID: number, reason?: string) => {
        this.events.emitRAW<GenericMinigameUntimelyAbortMessageDTO>({
            senderID: MOCK_SERVER_ID,
            eventID: GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT.id,
            reason: reason || 'Unknown reason',
            id: sourceID,
        });
    };

    private gameFinished = () => {
        this.log.trace('Game finished');
        this.reset();
    }

    /**
     * Sets up event subscriptions for the MockServer.
     */
    private setupSubscriptions = () => {
        this.log.trace('setting up subscriptions');
        const pushToQueue = (e: IMessage) => {
            this.messageQueue.push(e);
        };
        
        [
            DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, 
            PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, 
            PLAYER_READY_FOR_MINIGAME_EVENT, 
            PLAYER_ABORTING_MINIGAME_EVENT, 
            PLAYER_JOIN_ACTIVITY_EVENT,
            PLAYER_LOAD_COMPLETE_EVENT,
            PLAYER_LOAD_FAILURE_EVENT,
        ].forEach(event => {
            this.subscriptionIDs.push(this.context.events.subscribe(event, pushToQueue));
        })

        this.subscriptionIDs.push(this.context.events.subscribe(MINIGAME_WON_EVENT, this.gameFinished));
        this.subscriptionIDs.push(this.context.events.subscribe(MINIGAME_LOST_EVENT, this.gameFinished));
        this.subscriptionIDs.push(this.context.events.subscribe(GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT, this.gameFinished));
    }
}
