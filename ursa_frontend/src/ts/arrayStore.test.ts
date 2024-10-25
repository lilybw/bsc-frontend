import { describe, it, expect, vi } from 'vitest';
import { createRoot, createEffect, createSignal } from 'solid-js';
import { createArrayStore, ArrayStore } from './arrayStore';
import { render, testEffect } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createStore } from 'solid-js/store';
import exp from 'constants';

describe('ArrayStore', () => {
    describe('initialization', () => {
        it('should initialize with an empty array if no initial value is provided', () => {
            const store = createArrayStore<{ id: number }>();
            expect(store.get).toEqual([]);
        });

        it('should initialize with the provided initial value', () => {
            const initialValue = [{ id: 1 }, { id: 2 }];
            const store = createArrayStore(initialValue);
            expect(store.get).toEqual(initialValue);
        });
    });

    describe('add', () => {
        it('should add an element and return a remove function', () => {
            const store = createArrayStore<{ id: number }>();
            const removeFunc = store.add({ id: 1 });
            expect(store.get).toEqual([{ id: 1 }]);
            removeFunc();
            expect(store.get).toEqual([]);
        });

        it('the remove func should only remove that one specific element', () => {
            const initState = [{ id: 10 }, { id: 20 }];
            const store = createArrayStore<{ id: number }>(initState);
            const elem1 = { id: 1 };
            const removeFunc1 = store.add(elem1);
            const elem2 = { id: 2 };
            const removeFunc2 = store.add(elem2);
            const storeState = store.get;
            expect(storeState[0]).toEqual(initState[0]);
            expect(storeState[1]).toEqual(initState[1]);
            expect(storeState[2]).toEqual(elem1);
            expect(storeState[3]).toEqual(elem2);
            removeFunc1();
            const storeState2 = store.get;
            expect(storeState2[0]).toEqual(initState[0]);
            expect(storeState2[1]).toEqual(initState[1]);
            expect(storeState2[2]).toEqual(elem2);
            removeFunc2();
            expect(store.get).toEqual(initState);
        });

        it('add should be reactive', () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number }>();
                const [triggerCount, setTriggerCount] = createSignal(0);

                createEffect(() => {
                    const items = store.get;
                    const len = items.length;
                    if (len === 10) {
                        expect(triggerCount()).toBe(10);
                        dispose();
                    }
                    store.add({ id: len });
                    setTriggerCount((prev) => prev + 1);
                });
            });
        });

        it('remove function should be reactive', () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number }>();
                const removeFunc = store.add({ id: 1 });
                let triggerCount = 0;

                createEffect(() => {
                    const items = store.get;
                    const len = items.length;
                    triggerCount++;
                    if (len === 0) {
                        expect(triggerCount).toBe(2);
                        expect(items).toEqual([]);
                        dispose();
                    }
                    removeFunc();
                });
            });
        });
    });

    describe('findFirst', () => {
        it('should find an element', () => {
            const store = createArrayStore<{ id: number }>();
            store.add({ id: 1 });
            store.add({ id: 2 });
            const found = store.findFirst((el) => el.id === 2);
            expect(found).toEqual({ id: 2 });
        });
        it('should find the first element amount duplicates', () => {
            const store = createArrayStore<{ id: Number; value: number }>([
                { id: 1, value: 1 },
                { id: 2, value: 2 },
                { id: 3, value: 2 },
            ]);
            const found = store.findFirst((el) => el.value === 2)!;
            expect(found.id).toEqual(2);
        });
        it('should return undefined if the array is empty', () => {
            const store = createArrayStore<{ id: Number; value: number }>([]);
            const found = store.findFirst((el) => el.value === 2);
            expect(found).toBeUndefined();
        });
        it('should return undefined if the array does not contain any matches', () => {
            const store = createArrayStore<{ id: Number; value: number }>([
                { id: 1, value: 1 },
                { id: 2, value: 2 },
                { id: 3, value: 2 },
            ]);
            const found = store.findFirst((el) => el.value === 6);
            expect(found).toBeUndefined();
        });
        it('should work with add', () => {
            const store = createArrayStore<{ id: Number; value: number }>([{ id: 1, value: 1 }]);
            const found = store.findFirst((el) => el.value === 2);
            expect(found).toBeUndefined();
            store.add({ id: 12, value: 2 });
            const found2 = store.findFirst((el) => el.value === 2);
            expect(found2).not.toBeUndefined();
            expect(found2!.id).toEqual(12);
        });
        it('should work with mutations', () => {
            const store = createArrayStore<{ id: Number; value: number }>([{ id: 1, value: 1 }]);
            const found = store.findFirst((el) => el.value === 2);
            expect(found).toBeUndefined();
            store.mutateElement(0, (e) => {
                e.value = 2;
                return e;
            });
            const found2 = store.findFirst((el) => el.value === 2);
            expect(found2).not.toBeUndefined();
            expect(found2!.id).toEqual(1);
        });
    });

    describe('findAll', () => {
        it('should find all elements', () => {
            const store = createArrayStore<{ id: number }>();
            store.add({ id: 1 });
            store.add({ id: 2 });
            store.add({ id: 2 });
            const found = store.findAll((el) => el.id === 2);
            expect(found).toEqual([{ id: 2 }, { id: 2 }]);
        });
        it('should return an empty array if the array is empty', () => {
            const store = createArrayStore<{ id: number }>([]);
            const found = store.findAll((el) => el.id === 2);
            expect(found).toEqual([]);
        });
        it('should return an empty array if the array does not contain any matches', () => {
            const store = createArrayStore<{ id: number }>([{ id: 1 }, { id: 2 }, { id: 2 }]);
            const found = store.findAll((el) => el.id === 6);
            expect(found).toEqual([]);
        });
        it('should work with add', () => {
            const store = createArrayStore<{ id: number }>([{ id: 1 }]);
            const found = store.findAll((el) => el.id === 2);
            expect(found).toEqual([]);
            store.add({ id: 2 });
            store.add({ id: 2 });
            const found2 = store.findAll((el) => el.id === 2);
            expect(found2).toEqual([{ id: 2 }, { id: 2 }]);
        });
        it('should work with mutations', () => {
            const store = createArrayStore<{ id: number }>([{ id: 1 }]);
            const query = (el: { id: number }) => el.id === 2;
            const found = store.findAll(query);
            expect(found).toEqual([]);

            store.mutateElement(0, (e) => {
                e.id = 2;
                return e;
            });

            const found2 = store.findAll(query);
            expect(found2).toEqual([{ id: 2 }]);
        });
    });

    describe('mutateElement', () => {
        it('succeeds, no mutation', () => {
            const store = createArrayStore<{ id: number }>();
            const element = { id: 1 };
            store.add(element);
            const mutated = store.mutateElement(0, (el) => el); //no mutation
            expect(mutated).not.toBeUndefined();
            expect(mutated).not.toBeNull();
            expect(mutated).toEqual(true);
        });

        it('succeeds, in place mutation', () => {
            const element2 = { id: 2 };
            const store2 = createArrayStore<{ id: number }>([element2]);
            const mutated2 = store2.mutateElement(0, (el) => {
                el.id = 3;
                return el;
            }); // in place mutation
            expect(mutated2).not.toBeUndefined();
            expect(mutated2).not.toBeNull();
            expect(mutated2).toEqual(true);
        });

        it('succeeds, object replacement', () => {
            const element = { id: 1, value: 'old' };
            const store = createArrayStore<{ id: number; value: string }>([element]);
            const otherElement = { id: 2, value: 'new' };
            const mutated = store.mutateElement(0, (el) => otherElement);
            expect(mutated).toEqual(true);
        });

        it('fails when out of bounds', () => {
            const store = createArrayStore<{ id: number }>();
            const mutated = store.mutateElement(0, (el) => el);
            expect(mutated).toEqual(false);
        });

        it('fails, when index < 0', () => {
            const store = createArrayStore<{ id: number }>();
            const mutated = store.mutateElement(-1, (el) => el);
            expect(mutated).toEqual(false);
        });

        it('should mutate an element (object replace)', () => {
            const store = createArrayStore<{ id: number; value: string }>();
            const element = { id: 1, value: 'old' };
            store.add(element);
            store.mutateElement(0, (el) => ({ ...el, value: 'new' }));
            expect(store.get).toEqual([{ id: 1, value: 'new' }]);
        });

        it('should mutate an element ("in place")', () => {
            const store = createArrayStore<{ id: number; value: string }>();
            const element = { id: 1, value: 'old' };
            store.add(element);
            store.mutateElement(0, (el) => {
                el.value = 'new';
                return el;
            });
            expect(store.get).toEqual([{ id: 1, value: 'new' }]);
        });

        it('in-place mutateElement should be reactive', { timeout: 500 }, () => {
            return testEffect((dispose) => {
                const element = { id: 1 };
                const store = createArrayStore<{ id: number }>([element]);
                let triggerCount = 0;

                createEffect(() => {
                    const items = store.get;
                    const currentId = items[0].id;

                    if (currentId === 10) {
                        expect(triggerCount).toBe(10);
                        dispose();
                    }
                    const mutated = store.mutateElement(0, (el) => {
                        el.id += 1;
                        return el;
                    });
                    expect(mutated).toBe(true);

                    triggerCount++;
                });
            });
        });

        it('object replace mutateElement should be reactive', () => {
            return testEffect((done) => {
                const element = { id: 0 };
                const store = createArrayStore<{ id: number }>([element]);
                let triggerCount = 0;

                createEffect(() => {
                    const items = store.get;
                    const currentID = items[0].id;
                    if (currentID === 10) {
                        expect(triggerCount).toBe(10);
                        done();
                    }
                    const mutated = store.mutateElement(0, (prev) => ({ id: prev.id + 1 }));
                    expect(mutated).toBe(true);
                    triggerCount++;
                });
            });
        });
    });

    describe('mutateByPredicate', () => {
        it('should mutate elements by predicate (object replace)', () => {
            const store = createArrayStore<{ id: number; value: string }>();
            store.add({ id: 1, value: 'old' });
            store.add({ id: 2, value: 'old' });
            store.add({ id: 3, value: 'keep' });
            const count = store.mutateByPredicate(
                (el) => el.value === 'old',
                (el) => ({ ...el, value: 'new' }),
            );
            expect(count).toBe(2);
            expect(store.get).toEqual([
                { id: 1, value: 'new' },
                { id: 2, value: 'new' },
                { id: 3, value: 'keep' },
            ]);
        });

        it('should report the correct amount of elements mutated (object replace)', () => {
            const store = createArrayStore<{ id: number; value: string }>();
            store.add({ id: 1, value: 'old' });
            store.add({ id: 2, value: 'old' });
            store.add({ id: 3, value: 'keep' });
            const count = store.mutateByPredicate(
                (el) => el.value === 'old',
                (el) => ({ ...el, value: 'new' }),
            );
            expect(count).toBe(2);

            const emptyObject = { someValueToQueryFor: 0 };
            const otherEmptyObject = { someValueToQueryFor: 0 };
            const store2 = createArrayStore([emptyObject, emptyObject, emptyObject]);
            const count2 = store2.mutateByPredicate(
                (el) => el.someValueToQueryFor === 0,
                (el) => otherEmptyObject,
            );
            expect(count2).toBe(3);
        });

        it('should mutate elements by predicate ("in place")', () => {
            const store = createArrayStore<{ id: number; value: string }>();
            store.add({ id: 1, value: 'old' });
            store.add({ id: 2, value: 'old' });
            store.add({ id: 3, value: 'keep' });
            const count = store.mutateByPredicate(
                (el) => el.value === 'old',
                (el) => {
                    el.value = 'new';
                    return el;
                },
            );
            expect(count).toBe(2);
            expect(store.get).toEqual([
                { id: 1, value: 'new' },
                { id: 2, value: 'new' },
                { id: 3, value: 'keep' },
            ]);
        });

        it('should report the correct amount of elements mutated ("in place")', () => {
            const store = createArrayStore<{ id: number; value: string }>();
            store.add({ id: 1, value: 'old' });
            store.add({ id: 2, value: 'old' });
            store.add({ id: 3, value: 'keep' });
            const count = store.mutateByPredicate(
                (el) => el.value === 'old',
                (el) => {
                    el.value = 'new';
                    return el;
                },
            );
            expect(count).toBe(2);

            const emptyObject = { someValueToQueryFor: 0 };
            const otherEmptyObject = { someValueToQueryFor: 0 };
            const store2 = createArrayStore([emptyObject, emptyObject, emptyObject]);
            const count2 = store2.mutateByPredicate(
                (el) => el.someValueToQueryFor === 0,
                (el) => otherEmptyObject,
            );
            expect(count2).toBe(3);
        });

        it('mutateByPredicate should be reactive (object replace)', { timeout: 500 }, () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number }>([{ id: 0 }, { id: 1 }]);
                let triggerCount = 0;

                createEffect(() => {
                    const items = store.get;
                    const currentID = items[0].id;
                    if (currentID === 10) {
                        expect(triggerCount).toBe(10);
                        dispose();
                    }
                    const mutationCount = store.mutateByPredicate(
                        (el) => el.id === currentID,
                        (el) => ({ ...el, id: el.id + 1 }),
                    );

                    triggerCount++;
                });
            });
        });

        it('mutateByPredicate should be reactive ("in place")', { timeout: 500 }, () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number }>([{ id: 0 }, { id: 1 }]);
                let triggerCount = 0;

                createEffect(() => {
                    const items = store.get;
                    const currentId = items[0].id;
                    if (currentId === 10) {
                        expect(triggerCount).toBe(10);
                        dispose();
                    }
                    const mutationCount = store.mutateByPredicate(
                        (el) => el.id === currentId,
                        (el) => {
                            el.id += 1;
                            return el;
                        },
                    );
                    triggerCount++;
                });
            });
        });
    });

    it('does testEffect run once on "mount" always - yes', () => {
        return testEffect((dispose) => {
            const [value, setValue] = createSignal(0);
            createEffect(() => {
                setValue(1);
                expect(value()).toBe(1);
                dispose();
            });
        });
    });

    describe('cullByPredicate', () => {
        it('should remove all matching elements', () => {
            const store = createArrayStore<{ id: number; status: string }>();
            store.add({ id: 1, status: 'active' });
            store.add({ id: 2, status: 'inactive' });
            store.add({ id: 3, status: 'inactive' });
            store.add({ id: 4, status: 'active' });
            
            const removedCount = store.cullByPredicate(el => el.status === 'inactive');
            
            expect(removedCount).toBe(2);
            expect(store.get).toEqual([
                { id: 1, status: 'active' },
                { id: 4, status: 'active' }
            ]);
        });
    
        it('should return 0 if no elements match', () => {
            const store = createArrayStore<{ id: number; status: string }>();
            store.add({ id: 1, status: 'active' });
            store.add({ id: 2, status: 'active' });
            
            const removedCount = store.cullByPredicate(el => el.status === 'inactive');
            
            expect(removedCount).toBe(0);
            expect(store.get).toEqual([
                { id: 1, status: 'active' },
                { id: 2, status: 'active' }
            ]);
        });
    
        it('should return 0 if array is empty', () => {
            const store = createArrayStore<{ id: number; status: string }>();
            const removedCount = store.cullByPredicate(el => el.status === 'inactive');
            expect(removedCount).toBe(0);
            expect(store.get).toEqual([]);
        });
    
        it('should be reactive', () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number; count: number }>();
                store.add({ id: 1, count: 0 });
                store.add({ id: 2, count: 0 });
                let triggerCount = 0;
    
                createEffect(() => {
                    const items = store.get;
                    if (items.length === 0) {
                        expect(triggerCount).toBe(1);
                        dispose();
                        return;
                    }
                    
                    store.cullByPredicate(el => el.count === 0);
                    triggerCount++;
                });
            });
        });
    });

    describe('removeAtIndex', () => {
        it('should remove element at valid index', () => {
            const store = createArrayStore<{ id: number }>();
            store.add({ id: 1 });
            store.add({ id: 2 });
            store.add({ id: 3 });
            
            const success = store.removeAtIndex(1);
            
            expect(success).toBe(true);
            expect(store.get).toEqual([
                { id: 1 },
                { id: 3 }
            ]);
        });
    
        it('should return false for negative index', () => {
            const store = createArrayStore<{ id: number }>();
            store.add({ id: 1 });
            
            const success = store.removeAtIndex(-1);
            
            expect(success).toBe(false);
            expect(store.get).toEqual([{ id: 1 }]);
        });
    
        it('should return false for out of bounds index', () => {
            const store = createArrayStore<{ id: number }>();
            store.add({ id: 1 });
            
            const success = store.removeAtIndex(1);
            
            expect(success).toBe(false);
            expect(store.get).toEqual([{ id: 1 }]);
        });
    
        it('should be reactive', () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number }>();
                store.add({ id: 1 });
                store.add({ id: 2 });
                let triggerCount = 0;
    
                createEffect(() => {
                    const items = store.get;
                    if (items.length === 0) {
                        expect(triggerCount).toBe(2);
                        dispose();
                        return;
                    }
                    
                    store.removeAtIndex(0);
                    triggerCount++;
                });
            });
        });
    });

    describe('removeFirst', () => {
        it('should remove first matching element', () => {
            const store = createArrayStore<{ id: number; status: string }>();
            store.add({ id: 1, status: 'active' });
            store.add({ id: 2, status: 'inactive' });
            store.add({ id: 3, status: 'inactive' });
            
            const success = store.removeFirst(el => el.status === 'inactive');
            
            expect(success).toBe(true);
            expect(store.get).toEqual([
                { id: 1, status: 'active' },
                { id: 3, status: 'inactive' }
            ]);
        });
    
        it('should return false if no element matches', () => {
            const store = createArrayStore<{ id: number; status: string }>();
            store.add({ id: 1, status: 'active' });
            
            const success = store.removeFirst(el => el.status === 'inactive');
            
            expect(success).toBe(false);
            expect(store.get).toEqual([{ id: 1, status: 'active' }]);
        });
    
        it('should return false if array is empty', () => {
            const store = createArrayStore<{ id: number; status: string }>();
            const success = store.removeFirst(el => el.status === 'inactive');
            expect(success).toBe(false);
            expect(store.get).toEqual([]);
        });
    
        it('should be reactive', () => {
            return testEffect((dispose) => {
                const store = createArrayStore<{ id: number; count: number }>();
                store.add({ id: 1, count: 0 });
                store.add({ id: 2, count: 0 });
                let triggerCount = 0;
    
                createEffect(() => {
                    const items = store.get;
                    if (items.length === 0) {
                        expect(triggerCount).toBe(2);
                        dispose();
                        return;
                    }
                    
                    store.removeFirst(el => el.count === 0);
                    triggerCount++;
                });
            });
        });
    });
});

describe('baseline store behaviour', () => {
    it('is reactive', { timeout: 10_000 }, async () => {
        return testEffect((dispose) => {
            const [store, setStore] = createStore<{ id: number }>({ id: 0 });
            const [effectCount, setEffectCount] = createSignal(0);

            createEffect(() => {
                if (store.id < 10) {
                    setEffectCount((prev) => prev + 1);
                } else {
                    expect(effectCount()).toBe(10);
                    dispose();
                }
                setStore((prev) => {
                    return { id: prev.id + 1 };
                });
            });
        });
    });

    it('does not preserves object equivalence', () => {
        const object = { id: 0 };
        const [store, setStore] = createStore<{ id: number }>(object);
        expect(store === object).toBe(false);
    });

    it('does preserve sub-object equivalence, primitive type', () => {
        const object = { id: 0 };
        const [store, setStore] = createStore<{ id: number }>(object);
        expect(store.id === object.id).toBe(true);
    });

    it('does not preserve sub-object equivalence, object type', () => {
        const object = { id: { id: 0 } };
        const [store, setStore] = createStore<{ id: { id: number } }>(object);
        expect(store.id === object.id).toBe(false);
    });

    it('preserves object equality in array, primitive type', () => {
        const value = 1;
        const [store, setStore] = createStore<number[]>([value]);
        expect(store[0] === value).toBe(true);
    });

    it('does not preserve object equality in array, object type', () => {
        const object = { id: 0 };
        const [store, setStore] = createStore<{ id: number }[]>([object]);
        expect(store[0] === object).toBe(false);
    });

    it('what happens when you array index out of bounds, in a store array', () => {
        const [store, setStore] = createStore<number[]>([0]);
        expect(store[1]).toBeUndefined();

        setStore(2, 1);
        expect(store[1]).toBeUndefined();
        expect(store[2]).toBe(1);
    });
});
