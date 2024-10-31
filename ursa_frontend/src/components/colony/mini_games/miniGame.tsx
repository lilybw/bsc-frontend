import { Component, JSX } from 'solid-js';
import { ApplicationContext, ResErr } from '../../../meta/types';
import AsteroidsMiniGame, { initAsteroidsComponent } from './asteroids_mini_game/AsteroidsMiniGame';
import { createAsteroidsGameLoop } from './asteroids_mini_game/AsteroidsGameLoop';
import { AsteroidsSettingsDTO } from './asteroids_mini_game/types/GameTypes';
import { uint32 } from '../../../integrations/main_backend/mainBackendDTOs';
import { BackendIntegration } from '../../../integrations/main_backend/mainBackend';


/**
 * Any function, that based on the provided ApplicationContext alone, can initialize all data needed
 * for establishing the minigame component. The resulting JSX element should be the root of the minigame,
 * and will be given the entire viewport.
 */
export type MinigameComponentInitFunc = (context: ApplicationContext, difficultyID: uint32) => Promise<ResErr<JSX.Element>>;
/**
 * Any function, that however it sees fit, starts the single player game loop.
 * Used by the mock server.
 */
export type GenericGameLoopStartFunction = () => void;
/** 
 * Any function, that based on the provided ApplicationContext alone, can initialize all data needed
 * or return an error if something goes wrong during initialization.
 */
export type SingleplayerGameLoopInitFunc = (context: ApplicationContext, difficultyID: uint32) => Promise<ResErr<GenericGameLoopStartFunction>>;

export enum KnownMinigames {
    ASTEROIDS = 1,
    UNKNOWN = 99999
}

export const getMinigameName = (minigameID: uint32): string => {
    for (const [key, value] of Object.entries(KnownMinigames)) {
        if (value === minigameID) return key;
    }
    return KnownMinigames.UNKNOWN.toString();
}

/**
 * Load and mount a minigame.
 */
export const loadMinigameSingleplayerLoop = (minigameID: number): ResErr<SingleplayerGameLoopInitFunc> => {
    let gameLoopInitFunc: SingleplayerGameLoopInitFunc | null = null;

    switch (minigameID) {
        case KnownMinigames.ASTEROIDS: {;
            gameLoopInitFunc = createAsteroidsGameLoop;
            break;
        }
    }

    if (gameLoopInitFunc === null) {
        return { res: null, err: 'Could not load minigame gameloop, no loop found for minigame id: ' + minigameID};
    }

    return { res: gameLoopInitFunc, err: null };
};

export const getMinigameComponentInitFunction = (minigameID: number): ResErr<MinigameComponentInitFunc> => {
    let initFunc: MinigameComponentInitFunc | null = null;

    switch (minigameID) {
        case KnownMinigames.ASTEROIDS: {
            initFunc = initAsteroidsComponent;
            break;
        }
    }

    if (!initFunc || initFunc === null) {
        return {res: null, err: 'Could not find minigame component init function for minigame id: ' + minigameID};
    }

    return {res: initFunc, err: null};
}

export const loadComputedSettings = async <T extends Object>(backend: BackendIntegration, minigameID: number, difficultyID: number): Promise<ResErr<T>> => {
    if (minigameID === null || difficultyID === null) return { res: null, err: 'Could not load minigame difficualty information is null.' };

    const response = await backend.minigame.getMinimizedInfo(minigameID, difficultyID);

    if (response.err !== null) return { res: null, err: response.err };

    const computedSettings = { ...response.res.settings, ...response.res.overwritingSettings };

    return { res: computedSettings, err: null };
}
