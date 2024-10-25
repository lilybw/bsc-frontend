import { Component, JSX } from "solid-js";
import { ApplicationContext, Error, ResErr } from "../../../meta/types";
import { DifficultyConfirmedForMinigameMessageDTO } from "../../../integrations/multiplayer_backend/EventSpecifications";
import { BackendIntegration } from "../../../integrations/main_backend/mainBackend";
import AsteroidsMiniGame, { AsteroidsSettingsDTO } from "./asteroids_mini_game/AsteroidsMiniGame";
import { createAsteroidsGameLoop } from "./asteroids_mini_game/AsteroidsGameLoop";

// Define the props interface for minigame components
export interface MinigameProps<T extends object> {
    context: ApplicationContext;
    settings: T;
    returnToColony: () => void;
}

export interface Minigame<T extends object> {
    /** The mock server game loop function
    *   It takes settings and returns a function to run to start the game loop
    */
    mockServerGameloop: (settings: T, context: ApplicationContext) => (() => void);

    /** The top-level component for the minigame
    *   It returns a Solid.js component that accepts MinigameProps
    */
    topLevelComponent: () => Component<MinigameProps<T>>;
}

export enum KnownMinigames {
    ASTEROIDS = 1
}

/**
 * Load and mount a minigame.
 */
export const loadMiniGame = async (context: ApplicationContext, returnToColony: () => void, setPageContent: ((e: JSX.Element) => void), minigameID: number, difficultyID: number): Promise<ResErr<() => void>> => {
    if (minigameID === null || difficultyID === null) return {res: null, err: "Could not load minigame difficualty information is null."};

    const response = await context.backend.minigame.getMinimizedInfo(minigameID, difficultyID);

    if (response.err !== null) return {res: null, err: response.err};

    const computedSettings = {...response.res.settings, ...response.res.overwritingSettings}
    console.table(computedSettings);

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
        return {res: null, err: "Could not load minigame, no component or minigame found."};
    }

    setPageContent(component);
    const startLoop = gameLoop(computedSettings, context);

    return {res: startLoop, err: null};
}