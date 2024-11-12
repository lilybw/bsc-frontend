import { batch } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

/**
 * Any function that adds some element to some structure, but also returns a function that removes it again.
 */
export type AddRetainRemoveFunc<T> = (value: T) => VoidRemoveFunc;
export type VoidRemoveFunc = () => void;
interface IndexedMutator<T> { (e: T, i: number): T }
export type Mutator<T> = IndexedMutator<T>;
export interface Predicate<T> { 
    (element: T): boolean 
};

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
    addAll: (values: T[]) => VoidRemoveFunc;
    /**
     * @param predicate cannot rely on object eqauivalence, unless also used with unwrap
     * @returns the first element that satisfies the predicate, or undefined if none do
     */
    findFirst: (predicate: Predicate<T>) => T | undefined;
    /**
     * @param predicate cannot rely on object eqauivalence, unless also used with unwrap
     * @returns the first element that satisfies the predicate, or undefined if none do
     */
    findAll: (predicate: Predicate<T>) => T[];
    /** 
     * NB: NOT REACTIVE
     * 
     * Same as Array.forEach 
     */
    forEach: Array<T>['forEach'];
    /** 
     * NB: NOT REACTIVE
     * 
     * Same as Array.forEach, but only for elements where the predicate passes 
     */
    forAny: (predicate: Predicate<T>, func: (element: T) => void) => void;
    /**
     * Change the value of some element in the store reactively.
     *
     * Element object reference is never preserved.
     * @returns true if the element was found and mutated, false if the index was out of bounds
     */
    mutateElement: (index: number, mutator: Mutator<T>) => boolean;
    /**
     * Mutate all elements that satisfy the predicate with the given mutator function.
     *
     * Element object reference is never preserved.
     * @param predicate cannot rely on object eqauivalence, unless also used with unwrap.
     * @returns the number of elements mutated
     */
    mutateByPredicate: (predicate: Predicate<T>, mutator: Mutator<T> ) => number;
    /**
     * Create a new store with all values from this store that are in the given index range. (End inclusive)
     */
    slice: (start: number, end?: number) => ArrayStore<T>;
    /**
     * Create a new store with all values from this store that satisfy the predicate.
     */
    sliceByPredicate: (predicate: Predicate<T>) => ArrayStore<T>;
    sort: Array<T>['sort'];
    /**
     * Removes all elements that satisfy the predicate.
     * @param predicate Function that returns true for elements to remove
     * @returns The number of elements removed
     */
    cullByPredicate: (predicate: Predicate<T>) => number;

    /**
     * Removes the element at the specified index.
     * @param index The index of the element to remove
     * @returns true if an element was removed, false if the index was out of bounds
     */
    removeAtIndex: (index: number) => boolean;

    /**
     * Removes the first element that satisfies the predicate.
     * @param predicate Function that returns true for the element to remove
     * @returns true if an element was removed, false if no element matched
     */
    removeFirst: (predicate: Predicate<T>) => boolean;
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
        add: (value) => {
            setStore((prev) => [...prev, value]);
            return () => {
                setStore((prev) => prev.filter((v) => v !== value));
            };
        },
        addAll: (values) => {
            setStore((prev) => [...prev, ...values]);
            return () => {
                setStore((prev) => prev.filter((v) => !values.includes(v)));
            };
        },
        mutateElement: (index, mutator): boolean => {
            if (index < 0 || index >= proxy.length) {
                return false;
            }
            setStore(index, (prev) => mutator(prev, index));
            return true;
        },
        findFirst: (predicate) => proxy.find(predicate),
        findAll: (predicate) => proxy.filter(predicate),
        forEach: proxy.forEach,
        forAny: (predicate, func) => {
            for (let i = 0; i < proxy.length; i++) {
                if (predicate(proxy[i])) {
                    func(proxy[i]);
                }
            }
        },
        mutateByPredicate: (predicate, mutator) => {
            let mutationCount = 0;
            batch(() => {
                for (let i = 0; i < proxy.length; i++) {
                    if (predicate(proxy[i])) {
                        mutationCount++;
                        setStore(i, (e) => mutator(e, i));
                    }
                }
            });
            return mutationCount;
        },
        slice: (start, end) => {
            return createArrayStore(proxy.slice(start, end));
        },
        sliceByPredicate: (predicate) => {
            return createArrayStore(proxy.filter(predicate));
        },
        sort: (func) => {
            setStore(produce((s) => s.sort(func)));
            return proxy;
        },
        cullByPredicate: (predicate) => {
            let originalLength = proxy.length;
            const newArray = proxy.filter(element => !predicate(element));
            setStore(newArray);
            return originalLength - proxy.length;
        },
        removeAtIndex: (index) => {
            if (index < 0 || index >= proxy.length) {
                return false;
            }
            setStore(
                produce((s) => {
                    s.splice(index, 1);
                    return s;
                }),
            );
            return true;
        },
        removeFirst: (predicate) => {
            const index = proxy.findIndex(predicate);
            if (index === -1) {
                return false;
            }
            setStore(
                produce((s) => {
                    s.splice(index, 1);
                    return s;
                }),
            );
            return true;
        },
    };
}
