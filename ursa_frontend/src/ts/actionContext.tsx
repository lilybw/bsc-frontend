import { Component } from "solid-js";
import { IStyleOverwritable } from "./types";

export enum ActionContextTypes {
    NAVIGATION = "NAVIGATION",
    INTERACTION = "INTERACTION",
    ASTEROIDS = "ASTEROIDS",
    TEMPORARILY_DISABLED = "TEMPORARILY_DISABLED",
}

export const ActionContext: { [K in ActionContextTypes]: TypeIconTuple } = {
    NAVIGATION: {
        type: ActionContextTypes.NAVIGATION,
        icon: (props) => <div class={props.styleOverwrite}>NAV</div>
    },
    INTERACTION: {
        type: ActionContextTypes.INTERACTION,
        icon: (props) => <div class={props.styleOverwrite}>INT</div>
    },
    ASTEROIDS: {
        type: ActionContextTypes.ASTEROIDS,
        icon: (props) => <div class={props.styleOverwrite}>AST</div>
    },
    TEMPORARILY_DISABLED: {
        type: ActionContextTypes.TEMPORARILY_DISABLED,
        icon: (props) => <div class={props.styleOverwrite}>DIS</div>
    }
}

export type TypeIconTuple = {
    type: ActionContextTypes;
    icon: Component<IStyleOverwritable>;
}

export interface ActionTriggerResult {
    consumed: boolean;
}

export type BufferSubscriber<T> = (value: T) => ActionTriggerResult;