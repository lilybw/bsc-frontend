import { Accessor, createSignal, Setter, SignalOptions } from 'solid-js';

export interface WrappedSignal<T> {
    get: Accessor<T>;
    set: Setter<T>;
}
/** Standard createSignal, but wrapped in one object with a getter and setter */
export const createWrappedSignal = <T>(value: T, options?: SignalOptions<T>): WrappedSignal<T> => {
    const signal = createSignal(value, options);
    return {
        get: signal[0],
        set: signal[1],
    };
};

export interface DelayedSignalOptions<T> extends SignalOptions<T> {
    /** In milliseconds */
    delay: number;
}
export interface DelayedSignal<T> {
    get: Accessor<T>;
    set: (newValue: T) => void;
}
/** 
 * Standard signal, however any mutation (set), is delayed, and any previously queued mutations
 * are ignored on any new mutation within the delay (default: 500 ms).
 * The update will go through when the delay has passed without any new mutations.
 * 
 * @author GustavBW
 */
export const createDelayedSignal = <T>(value: T, options?: DelayedSignalOptions<T>): DelayedSignal<T> => {
    const wrapped = createWrappedSignal(value, options);
    let timeout: NodeJS.Timeout | undefined;
    return {
        ...wrapped,
        set: (newValue: T) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => wrapped.set(() => newValue), options?.delay ?? 500);
        },
    };
}