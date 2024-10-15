import { IExpandedAccessMultiplexer } from '../integrations/multiplayer_backend/eventMultiplexer';
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
    DifficultySelectForMinigameMessageDTO,
    EventSpecification,
    IMessage,
} from '../integrations/multiplayer_backend/EventSpecifications';
import { LobbyStateResponseDTO, ClientDTO } from '../integrations/multiplayer_backend/multiplayerDTO';
import { ApplicationContext } from '../meta/types';
import { MultiplayerMode, ResCodeErr } from '../meta/types';

const TIMEOUT_MS = 30000; // 30 seconds timeout for waiting operations
const ASTEROIDS_MINIGAME_ID = 1; // Assuming this is the correct ID for the Asteroids mini-game

export interface IMockServer {
    start: () => void;
    shutdown: () => void;
}

export enum LobbyPhase {
    RoamingColony = 0,
    AwaitingParticipants = 1,
    DeclareIntent = 2,
    InMinigame = 3,
}

export const SERVER_ID: number = Number.MAX_SAFE_INTEGER

export class MockServer implements IMockServer {
    private difficultyConfirmed: DifficultyConfirmedForMinigameMessageDTO | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private readonly subscriptionIDs: number[] = [];
    private readonly messageQueue: IMessage[] = [];
    private lobbyPhase: LobbyPhase = LobbyPhase.RoamingColony;
    private readonly events: IExpandedAccessMultiplexer;
    

    constructor(
        private context: ApplicationContext,
        private getLobbyState: () => Promise<ResCodeErr<LobbyStateResponseDTO>>,
        private onGameStart: () => void,
        private onGameAbort: () => void,
    ) {
        this.events = context.events as IExpandedAccessMultiplexer
    }

    public start = () => {
        this.reset()
        this.setupSubscriptions()
        this.intervalId = setInterval(this.update, 100);
    };
    public shutdown = () => {
        if (this.intervalId || this.intervalId !== null) {
            clearInterval(this.intervalId);
        }

        this.context.events.unsubscribe(...this.subscriptionIDs)
    };

    private reset = () => {
        this.difficultyConfirmed = null;
        this.messageQueue.length = 0;
        this.lobbyPhase = LobbyPhase.RoamingColony;
    }

    private update = () => {
        if (this.messageQueue.length === 0) return
        let message: IMessage | undefined;
        while ((message = this.messageQueue.pop()) !== undefined) {
            switch(this.lobbyPhase) {
                case LobbyPhase.RoamingColony: {
                    if (message.eventID === DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT.id) {
                        this.difficultyConfirmed = message as DifficultyConfirmedForMinigameMessageDTO;
                        // Hand placement check

                        this.lobbyPhase = LobbyPhase.AwaitingParticipants;
                    }


                }
                case LobbyPhase.AwaitingParticipants: {
                    // Comes from handplacement check
                    if (message.eventID === PLAYER_JOIN_ACTIVITY_EVENT.id) {

                        this.events.emitRAW({senderID: SERVER_ID, eventID: PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT.id})

                        this.lobbyPhase = LobbyPhase.DeclareIntent;
                    }

                    if (message.eventID === PLAYER_ABORTING_MINIGAME_EVENT.id) {
                        this.reset()
                    }
                    
                }
                case LobbyPhase.DeclareIntent: {
                    if (message.eventID === PLAYER_READY_FOR_MINIGAME_EVENT.id) {

                        
                        // Fetch settings in minigame
                        // Start gameloop

                        this.lobbyPhase = LobbyPhase.InMinigame;
                    }
                }
                case LobbyPhase.InMinigame: {
                    
                }
            }
        }
    }

    private setupSubscriptions() {
        const pushToQueue = (e: IMessage) => {
            this.messageQueue.push(e);
        } 

        this.subscriptionIDs.push(this.context.events.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYER_READY_FOR_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYER_ABORTING_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYER_JOIN_ACTIVITY_EVENT, pushToQueue));
    }

    public getDifficultyConfirmed(): DifficultyConfirmedForMinigameMessageDTO | null {
        return this.difficultyConfirmed;
    }
}
