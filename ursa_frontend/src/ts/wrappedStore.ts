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
    mutateElement: (element: T, mutator: (element: T) => T) => void;
    find: (predicate: (element: T) => boolean) => T | undefined;
    /**
     * Mutate all elements with the given mutator function that satisfy the predicate.
     * @returns the number of elements mutated
     */
    mutateByPredicate: (predicate: (element: T) => boolean, mutator: (element: T) => T) => number;
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
        mutateElement: (element: T, mutator: (element: T) => T) => {
            storeTuple[1](storeTuple[0].map((v) => v === element ? mutator(v) : v));
        },
        find: (predicate: (element: T) => boolean) => storeTuple[0].find(predicate),
        mutateByPredicate: (predicate: (element: T) => boolean, mutator: (element: T) => T) => {
            let mutationCount = 0;
            storeTuple[1](storeTuple[0].map((v) => {
                    if (predicate(v)) {
                        mutationCount++;
                        return mutator(v); 
                    }
                    return v;
                }
            ));
            return mutationCount;
        },
    };
}
