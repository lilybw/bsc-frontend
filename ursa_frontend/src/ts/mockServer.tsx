import { Component, JSX } from "solid-js";
import { IExpandedAccessMultiplexer } from '../integrations/multiplayer_backend/eventMultiplexer';
import {
    DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT,
    PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT,
    PLAYER_READY_FOR_MINIGAME_EVENT,
    PLAYER_ABORTING_MINIGAME_EVENT,
    PLAYER_JOIN_ACTIVITY_EVENT,
    ASTEROIDS_GAME_WON_EVENT,
    ASTEROIDS_GAME_LOST_EVENT,
    DifficultyConfirmedForMinigameMessageDTO,
    IMessage,
    ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT,
} from '../integrations/multiplayer_backend/EventSpecifications';
import { ApplicationContext, Error, ResErr } from '../meta/types';
import { KnownMinigames, Minigame } from "../components/colony/mini_games/miniGame";
import { Logger } from "../logging/filteredLogger";
import { uint32 } from "../integrations/main_backend/mainBackendDTOs";
import AsteroidsMiniGame, { AsteroidsSettingsDTO } from "../components/colony/mini_games/asteroids_mini_game/AsteroidsMiniGame";
import { BackendIntegration } from "../integrations/main_backend/mainBackend";
import { createAsteroidsGameLoop } from "../components/colony/mini_games/asteroids_mini_game/AsteroidsGameLoop";

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
    InMinigame = 3,
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

    /**
     * Constructs a new MockServer instance.
     * @param context The application context containing necessary dependencies.
     */
    constructor(
        private context: ApplicationContext,
        private readonly setPageContent: ((content: JSX.Element) => void),
        private readonly returnToColony: (() => void),
        log: Logger
    ) {
        this.events = context.events as IExpandedAccessMultiplexer;
        this.log = log.copyFor("mock server")
    }

    /**
     * Starts the MockServer, initializing subscriptions and starting the update loop.
     */
    public start = () => {
        this.log.log("starting");
        this.reset();
        this.setupSubscriptions();
        this.intervalId = setInterval(this.update, 100);
    };

    /**
     * Shuts down the MockServer, cleaning up subscriptions and stopping the minigame.
     */
    public shutdown = () => {
        this.log.log("shutdown");
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
        }
        this.context.events.unsubscribe(...this.subscriptionIDs);
    };

    /**
     * Resets the MockServer to its initial state.
     */
    private reset = () => {
        this.log.log("resetting");
        this.difficultyConfirmed = null;
        this.messageQueue.length = 0;
        this.lobbyPhase = LobbyPhase.RoamingColony;
    }

    /**
     * Main update loop of the MockServer. Processes queued messages and manages lobby phases.
     */
    private update = () => {
        if (this.messageQueue.length === 0) return;
        let message: IMessage | undefined;
        while ((message = this.messageQueue.pop()) !== undefined) {
            switch(this.lobbyPhase) {
                case LobbyPhase.RoamingColony: {
                    // Handle difficulty confirmation
                    if (message.eventID === DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT.id) {
                        this.difficultyConfirmed = message as DifficultyConfirmedForMinigameMessageDTO;
                        this.lobbyPhase = LobbyPhase.AwaitingParticipants;
                        this.log.trace("Phase changed to AwaitingParticipants");
                    }
                    break;
                }
                case LobbyPhase.AwaitingParticipants: {
                    // Handle player joining activity
                    if (message.eventID === PLAYER_JOIN_ACTIVITY_EVENT.id) {
                        this.events.emitRAW({senderID: MOCK_SERVER_ID, eventID: PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT.id});
                        this.lobbyPhase = LobbyPhase.DeclareIntent;
                        this.log.trace("Phase changed to DeclareIntent");
                    }
                    // Handle player aborting minigame
                    if (message.eventID === PLAYER_ABORTING_MINIGAME_EVENT.id) {
                        this.reset();
                    }
                    break;
                }
                case LobbyPhase.DeclareIntent: {
                    // Handle player ready for minigame
                    if (message.eventID === PLAYER_READY_FOR_MINIGAME_EVENT.id) {
                        this.lobbyPhase = LobbyPhase.InMinigame;
                        this.loadMiniGame(this.context, this.returnToColony, this.setPageContent, this.difficultyConfirmed?.minigameID!, this.difficultyConfirmed?.difficultyID!);
                        this.log.trace("Phase changed to InMinigame");
                    }
                    break;
                }
                case LobbyPhase.InMinigame: {

                }
            }
        }
    }

    private gameFinished() {
        this.log.trace("Game finished, reverting to colony");
        this.returnToColony()
        this.reset();
    }

    /**
     * Sets up event subscriptions for the MockServer.
     */
    private setupSubscriptions() {
        this.log.trace("setting up subscriptions");
        const pushToQueue = (e: IMessage) => {
            this.messageQueue.push(e);
        } 

        // Subscribe to various events
        this.subscriptionIDs.push(this.context.events.subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYER_READY_FOR_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYER_ABORTING_MINIGAME_EVENT, pushToQueue));
        this.subscriptionIDs.push(this.context.events.subscribe(PLAYER_JOIN_ACTIVITY_EVENT, pushToQueue));
        
        this.subscriptionIDs.push(this.context.events.subscribe(ASTEROIDS_GAME_WON_EVENT, this.gameFinished));
        this.subscriptionIDs.push(this.context.events.subscribe(ASTEROIDS_GAME_LOST_EVENT, this.gameFinished));
        this.subscriptionIDs.push(this.context.events.subscribe(ASTEROIDS_UNTIMELY_ABORT_GAME_EVENT, this.gameFinished));
    }


    /**
     * Load and mount a minigame.
     */
    private async loadMiniGame(context: ApplicationContext, returnToColony: () => void, setPageContent: ((e: JSX.Element) => void), minigameID: number, difficultyID: number): Promise<Error | undefined> {
        this.log.trace("loading minigame id: " + minigameID);
        if (this.difficultyConfirmed === null) return "Could not load minigame difficualty information is null.";

        const response = await context.backend.getMinimizedMinigameInfo(minigameID, difficultyID);

        if (response.err !== null) return response.err;

        const computedSettings = {...response.res.settings, ...response.res.overwritingSettings}

        let component: JSX.Element | null = null;
        let gameLoop: ((settings: AsteroidsSettingsDTO, context: ApplicationContext) => (() => void)) | null = null;

        switch (minigameID) {
            case KnownMinigames.ASTEROIDS: {
                component = <AsteroidsMiniGame settings={computedSettings} context={context} returnToColony={returnToColony} />
                gameLoop = createAsteroidsGameLoop;
                break;
            }
        }

        if (component === null || gameLoop === null) {
            return "Could not load minigame, no component or minigame found.";
        }

        setPageContent(component);
        gameLoop(computedSettings, context)();
    }
}