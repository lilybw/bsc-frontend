import { Component, JSXElement } from "solid-js"
import { ApplicationContext } from "../../../meta/types"

export interface MinigameProps<T extends object> {
    context: ApplicationContext;
    settings: T;
}

export interface Minigame<T extends object> {
    mockServerGameloop: (settings: T) => (() => void);
    topLevelComponent: () => Component<MinigameProps<T>>;

    // Switchstatement for minigame, for now only asteroids.

    

};
