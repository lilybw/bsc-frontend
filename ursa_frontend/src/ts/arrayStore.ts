import { batch } from 'solid-js';
import { createStore, produce, SetStoreFunction } from 'solid-js/store';

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
    get: T[];
    set: (val: T[]) => void;
    /**
     * @param value to add to the store
     * @returns a function that removes the value from the store
     */
    add: AddRetainRemoveFunc<T>;
    /**
     * @param predicate cannot rely on object eqauivalence, unless also used with unwrap
     * @returns the first element that satisfies the predicate, or undefined if none do
     */
    findFirst: (predicate: (element: T) => boolean) => T | undefined;
    /**
     * @param predicate cannot rely on object eqauivalence, unless also used with unwrap
     * @returns the first element that satisfies the predicate, or undefined if none do
     */
    findAll: (predicate: (element: T) => boolean) => T[];
    /**
     * Change the value of some element in the store reactively.
     *
     * Element object reference is never preserved.
     * @returns true if the element was found and mutated, false if the index was out of bounds
     */
    mutateElement: (index: number, mutator: (element: T) => T) => boolean;
    /**
     * Mutate all elements that satisfy the predicate with the given mutator function.
     *
     * Element object reference is never preserved.
     * @param predicate cannot rely on object eqauivalence, unless also used with unwrap.
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
    sort: Array<T>['sort'];
}

/**
 * Create a new array store with the given initial value. If no initial value is provided, an empty array is used.
 * @since 0.0.1
 * @author GustavBW
 */
export function createArrayStore<T extends object>(initValue?: T[]): ArrayStore<T> {
    const [proxy, setStore] = createStore<T[]>(initValue ?? []);
    return {
        get: proxy,
        set: (val) => setStore(val),
        add: (value: T) => {
            setStore((prev) => [...prev, value]);
            return () => {
                setStore((prev) => prev.filter((v) => v !== value));
            };
        },
        mutateElement: (index: number, mutator: (element: T) => T): boolean => {
            if (index < 0 || index >= proxy.length) {
                return false;
            }
            setStore(index, (prev) => mutator(prev));
            return true;
        },
        findFirst: (predicate: (element: T) => boolean) => proxy.find(predicate),
        findAll: (predicate: (element: T) => boolean) => proxy.filter(predicate),
        mutateByPredicate: (predicate: (element: T) => boolean, mutator: (element: T) => T) => {
            let mutationCount = 0;
            batch(() => {
                for (let i = 0; i < proxy.length; i++) {
                    if (predicate(proxy[i])) {
                        mutationCount++;
                        setStore(i, (e) => mutator(e));
                    }
                }
            });
            return mutationCount;
        },
        slice: (start: number, end?: number) => {
            return createArrayStore(proxy.slice(start, end));
        },
        sliceByPredicate: (predicate: (element: T) => boolean) => {
            return createArrayStore(proxy.filter(predicate));
        },
        sort: (func) => {
            setStore(produce((s) => s.sort(func)));
            return proxy;
        },
    };
}
