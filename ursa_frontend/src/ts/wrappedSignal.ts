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
export interface SimpleWrappedSignal<T> {
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
export const createDelayedSignal = <T>(value: T, options?: DelayedSignalOptions<T>): SimpleWrappedSignal<T> => {
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
export interface CooldownSignalOptions<T> extends SignalOptions<T> {
    /** In milliseconds */
    cooldown: number;
}
/**
 * Standard wrapped signal, however, upon any mutation, a cooldown period is initiated, during which
 * no new mutations will be accepted. The cooldown period is reset upon each mutation.
 * 
 * Default cooldown is 500ms
 * 
 * @author GustavBW
 */
export const createCooldownSignal = <T>(value: T, options?: CooldownSignalOptions<T>): SimpleWrappedSignal<T> => {
    const wrapped = createWrappedSignal(value);
    let timeout: NodeJS.Timeout | undefined;
    let isAvailable = true;
    return {
        ...wrapped,
        set: (newValue: T) => {
            if (!isAvailable) return;
            wrapped.set(() => newValue);
            isAvailable = false;
            timeout = setTimeout(() => {
                isAvailable = true;
            }, options?.cooldown ?? 500);
        },
    };

}
export interface TimedTriggerOptions<T> extends SignalOptions<T> {}
export interface TimedSwitch<T> {
    get: Accessor<T>;
    flip: (val: T, ms: number) => void;
}
/** An abstract signal which can be flipped to some other value temporarily.
 * After the time given when flipped has passed, it will revert to its original state.
 * Any additional flips will reset the timer.
 * Any additional flips with the same new value, will extend the timer.
 * 
 * @author GustavBW
 */
export function createTimedSwitch<T>(
    initialValue: T, 
    options?: TimedTriggerOptions<T>
): TimedSwitch<T> {
    const [get, set] = createSignal(initialValue, options);
    
    // State tracking
    let originalValue = initialValue;
    let currentTimeout: NodeJS.Timeout | undefined;
    let lastFlipTime = 0;
    let lastFlipDuration = 0;
    let tempValue: T | undefined;

    const scheduleReset = (ms: number) => {
        // Clear any existing timeout
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }

        // Schedule the reset
        currentTimeout = setTimeout(() => {
            set(() => originalValue);
            currentTimeout = undefined;
            tempValue = undefined;
            lastFlipDuration = 0;
        }, ms);
    };

    const flip = (newValue: T, duration: number) => {
        if (duration <= 0) {
            console.warn('Duration must be positive');
            return;
        }

        const now = Date.now();
        let effectiveDuration = duration;

        if (newValue === tempValue && currentTimeout) {
            // Extending existing flip
            const remainingTime = (lastFlipTime + lastFlipDuration) - now;
            if (remainingTime > 0) {
                effectiveDuration = duration + remainingTime;
            }
        } else {
            // New flip value
            set(() => newValue);
        }

        scheduleReset(effectiveDuration);
        
        // Update state
        tempValue = newValue;
        lastFlipTime = now;
        lastFlipDuration = effectiveDuration;
    };

    return {
        get,
        flip
    };
}