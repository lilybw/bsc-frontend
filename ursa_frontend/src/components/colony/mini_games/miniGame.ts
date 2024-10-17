import { Component } from "solid-js";
import { ApplicationContext, ResErr } from "../../../meta/types";
import { DifficultyConfirmedForMinigameMessageDTO } from "../../../integrations/multiplayer_backend/EventSpecifications";
import { BackendIntegration } from "../../../integrations/main_backend/mainBackend";

// Define the props interface for minigame components
export interface MinigameProps<T extends object> {
    context: ApplicationContext;
    settings: T;
    returnToColony: () => void;
}

// Define the main Minigame interface
export interface Minigame<T extends object> {
    // The mock server game loop function
    // It takes settings and returns a function to stop the game loop
    mockServerGameloop: (settings: T) => (() => void);

    // The top-level component for the minigame
    // It returns a Solid.js component that accepts MinigameProps
    topLevelComponent: () => Component<MinigameProps<T>>;
}

export enum KnownMinigames {
    ASTEROIDS = 1
}