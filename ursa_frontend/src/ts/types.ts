import { Accessor, Component, JSX } from 'solid-js';
import { ApplicationContext } from '../meta/types';
import { BackendIntegration } from '../integrations/main_backend/mainBackend';
import { InternationalizationService } from '../integrations/main_backend/internationalization/internationalization';
import { AddRetainRemoveFunc } from './arrayStore';
import { BufferSubscriber } from './actionContext';
import { IEventMultiplexer } from '../integrations/multiplayer_backend/eventMultiplexer';

export interface ApplicationProps {
    context: ApplicationContext;
}
export interface IStyleOverwritable {
    styleOverwrite?: string;
}
export interface IBackendBased {
    backend: BackendIntegration;
}
/**
 * Reacts to all changes in some buffer
 */
export interface IBufferBased {
    buffer: Accessor<string>;
}
/**
 * Has children
 */
export interface IParenting {
    children?: JSX.Element;
}
/**
 * Has children, but is an img tag, so tries its best
 */
export interface IParentingImages {
    children?: Component<IStyleOverwritable>[];
}
/**
 * Any component that needs access to the InternationalizationService
 */
export interface IInternationalized {
    text: InternationalizationService;
}
/**
 * Registers to a buffer of some type as to provide a callback for what to do when that buffer is "executed"
 */
export interface IRegistering<T> {
    register: AddRetainRemoveFunc<BufferSubscriber<T>>;
}
export interface IEmitter {
    emit: IEventMultiplexer["emit"];
}
