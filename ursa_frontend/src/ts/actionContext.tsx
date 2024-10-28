import { Component } from "solid-js";
import { IBackendBased, IStyleOverwritable } from "./types";
import NTAwait from "../components/util/NoThrowAwait";
import { css } from "@emotion/css";
import GraphicalAsset from "../components/base/GraphicalAsset";

export enum ActionContextTypes {
    NAVIGATION = "NAVIGATION",
    INTERACTION = "INTERACTION",
    ASTEROIDS = "ASTEROIDS",
    TEMPORARILY_DISABLED = "TEMPORARILY_DISABLED",
}
interface ActionContextIconProps extends IStyleOverwritable, IBackendBased {}
export const ActionContextIcon = (assetId: number): Component<ActionContextIconProps> => { return (props) => {
    return (
        <NTAwait func={() => props.backend.assets.getMetadata(assetId)}>{(asset) => 
            <GraphicalAsset styleOverwrite={imgStyleOverwrite} backend={props.backend} metadata={asset} />
        }</NTAwait>
    )
}}
const imgStyleOverwrite = css`
width: 70%;
height: 70%;
`
export const ActionContext: { [K in ActionContextTypes]: TypeIconTuple } = {
    NAVIGATION: {
        type: ActionContextTypes.NAVIGATION, //1024
        icon: ActionContextIcon(1024)
    },
    INTERACTION: {
        type: ActionContextTypes.INTERACTION, //1025
        icon: ActionContextIcon(1025)
    },
    ASTEROIDS: { //1026
        type: ActionContextTypes.ASTEROIDS,
        icon: ActionContextIcon(1026)
    },
    TEMPORARILY_DISABLED: {
        type: ActionContextTypes.TEMPORARILY_DISABLED,
        icon: ActionContextIcon(1027)
    }
}



export type TypeIconTuple = {
    type: ActionContextTypes;
    icon: Component<ActionContextIconProps>;
}

export interface ActionTriggerResult {
    consumed: boolean;
}

export type BufferSubscriber<T> = (value: T) => ActionTriggerResult;