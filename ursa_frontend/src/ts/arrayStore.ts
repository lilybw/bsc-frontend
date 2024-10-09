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
    /**
     * Change the value of some element in the store reactively.
     * 
     * Element object reference does not have to be preserved. (I.e. replacing the element with a new one is fine)
     * @returns true if any element was mutated, false otherwise
     */
    mutateElement: (element: T, mutator: (element: T) => T) => boolean;
    find: (predicate: (element: T) => boolean) => T | undefined;
    /**
     * Mutate all elements that satisfy the predicate with the given mutator function.
     * 
     * Element object reference does not have to be preserved. (I.e. replacing the element with a new one is fine)
     * @returns the number of elements mutated
     */
    mutateByPredicate: (predicate: (element: T) => boolean, mutator: (element: T) => T) => number;
    /**
     * Create a new store with all values from this store that are in the given index range. (End inclusive)
     */
    slice: (start: number, end?: number) => ArrayStore<T>;
    /**
     * Create a new store with all values from this store that satisfy the predicate.
     */
    sliceByPredicate: (predicate: (element: T) => boolean) => ArrayStore<T>;
}

/**
 * Create a new array store with the given initial value. If no initial value is provided, an empty array is used.
 * @since 0.0.1
 * @author GustavBW
 */
export function createArrayStore<T extends object>(initValue?: T[]): ArrayStore<T> {
    const [currentValue, setStore] = createStore<T[]>(initValue ?? []);
    return {
        get: () => currentValue,
        set: setStore,
        add: (value: T) => {
            setStore(prev => [...prev, value]);
            return () => {
                setStore(prev => prev.filter((v) => v !== value));
            };
        },
        mutateElement: (element: T, mutator: (element: T) => T) => {
            let mutated = false;
            setStore(prev => prev.map((v) => {
                if (v === element) {
                    mutated = true;
                    return mutator(v);
                } 
                return v
            }));
            return mutated;
        },
        find: (predicate: (element: T) => boolean) => currentValue.find(predicate),
        mutateByPredicate: (predicate: (element: T) => boolean, mutator: (element: T) => T) => {
            let mutationCount = 0;
            setStore(prev => prev.map((v) => {
                    if (predicate(v)) {
                        mutationCount++;
                        return mutator(v);
                    }
                    return v;
                }
            ));
            return mutationCount;
        },
        slice: (start: number, end?: number) => {
            return createArrayStore(currentValue.slice(start, end));
        },
        sliceByPredicate: (predicate: (element: T) => boolean) => {
            return createArrayStore(currentValue.filter(predicate));
        }
    };
}
