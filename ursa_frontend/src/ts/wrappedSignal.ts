import { Accessor, createSignal, Setter, SignalOptions } from "solid-js"

export interface WrappedSignal<T> {
    get: Accessor<T>;
    set: Setter<T>;
} 

export const createWrappedSignal = <T>(value: T, options?: SignalOptions<T>): WrappedSignal<T> => {
    const signal = createSignal(value, options);
    return {
        get: signal[0],
        set: signal[1],
    }
}