import { createStore, SetStoreFunction } from 'solid-js/store';

/**
 * Any function that adds some element to some structure, but also returns a function that removes it again.
 */
export type AddRetainRemoveFunc<T> = (value: T) => () => void;

/**
 * Wrapper for solid-js/store specifically for storing arrays of elements
 * and providing array manipulation functionality while remaining reactive.
 * @since 0.0.1
 * @author GustavBW
 */
export interface ArrayStore<T> {
    get: () => T[];
    set: SetStoreFunction<T[]>;
    /**
     * @param value to add to the store
     * @returns a function that removes the value from the store
     */
    add: AddRetainRemoveFunc<T>;
}

/**
 * Create a new array store with the given initial value. If no initial value is provided, an empty array is used.
 * @since 0.0.1
 * @author GustavBW
 */
export function createArrayStore<T extends object>(initValue?: T[]): ArrayStore<T> {
    const storeTuple = createStore<T[]>(initValue ?? []);
    return {
        get: () => storeTuple[0],
        set: storeTuple[1],
        add: (value: T) => {
            storeTuple[1]([...storeTuple[0], value]);
            return () => {
                storeTuple[1](storeTuple[0].filter((v) => v !== value));
            };
        },
    };
}
