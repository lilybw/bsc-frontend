import { Component } from "solid-js";

export enum ActionTypes {
    NAVIGATION = "NAVIGATION",
    INTERACTION = "INTERACTION",
    ASTEROIDS = "ASTEROIDS",
    TEMPORARILY_DISABLED = "TEMPORARILY_DISABLED",
}

export const ActionContext: { [K in ActionTypes]: TypeIconTuple } = {
    NAVIGATION: {
        type: ActionTypes.NAVIGATION,
        icon: (props) => <div class={props.styleOverwrite}>NAV</div>
    },
    INTERACTION: {
        type: ActionTypes.INTERACTION,
        icon: (props) => <div class={props.styleOverwrite}>INT</div>
    },
    ASTEROIDS: {
        type: ActionTypes.ASTEROIDS,
        icon: (props) => <div class={props.styleOverwrite}>AST</div>
    },
    TEMPORARILY_DISABLED: {
        type: ActionTypes.TEMPORARILY_DISABLED,
        icon: (props) => <div class={props.styleOverwrite}>DIS</div>
    }
}

export interface IStyleOverwritable {
    styleOverwrite?: string;
}

export type TypeIconTuple = {
    type: ActionTypes;
    icon: Component<IStyleOverwritable>;
}