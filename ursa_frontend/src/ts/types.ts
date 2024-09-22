import { Accessor } from "solid-js";
import { ApplicationContext } from "../meta/types";

export interface ApplicationProps {
    context: ApplicationContext;
}
export interface IStyleOverwritable {
    styleOverwrite?: string;
}
export interface IBufferBased {
    buffer: Accessor<string>;
}