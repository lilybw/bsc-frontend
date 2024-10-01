import { Accessor, Component, JSX} from "solid-js";
import { ApplicationContext } from "../meta/types";
import { BackendIntegration } from "../integrations/main_backend/mainBackend";
import { InternationalizationService } from "../integrations/main_backend/internationalization/internationalization";
import { AddRetainRemoveFunc } from "./wrappedStore";
import { BufferSubscriber } from "./actionContext";

export interface ApplicationProps {
    context: ApplicationContext;
}
export interface IStyleOverwritable {
    styleOverwrite?: string;
}
export interface IBackendBased {
    backend: BackendIntegration;
}
export interface IBufferBased {
    buffer: Accessor<string>;
}
export interface IParenting {
    children?: JSX.Element
}
export interface IParentingImages {
    children?: Component<IStyleOverwritable>[]
}
export interface IInternationalized {
    text: InternationalizationService;
}
export interface IRegistering<T> {
    register: AddRetainRemoveFunc<BufferSubscriber<T>>;
}