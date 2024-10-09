import { describe, it, expect, vi } from 'vitest';
import { createRoot, createEffect, createSignal } from 'solid-js';
import { createArrayStore, ArrayStore } from './arrayStore';
import { render, testEffect } from "@solidjs/testing-library"
import userEvent from "@testing-library/user-event"
import { createStore } from 'solid-js/store';

describe('ArrayStore', () => {
  it('should initialize with an empty array if no initial value is provided', () => {
    const store = createArrayStore<{ id: number }>();
    expect(store.get()).toEqual([]);
  });

  it('should initialize with the provided initial value', () => {
    const initialValue = [{ id: 1 }, { id: 2 }];
    const store = createArrayStore(initialValue);
    expect(store.get()).toEqual(initialValue);
  });

  it('should add an element and return a remove function', () => {
    const store = createArrayStore<{ id: number }>();
    const remove = store.add({ id: 1 });
    expect(store.get()).toEqual([{ id: 1 }]);
    remove();
    expect(store.get()).toEqual([]);
  });

  it('should mutate an element', () => {
    const store = createArrayStore<{ id: number; value: string }>();
    const element = { id: 1, value: 'old' };
    store.add(element);
    store.mutateElement(element, (el) => ({ ...el, value: 'new' }));
    expect(store.get()).toEqual([{ id: 1, value: 'new' }]);
  });

  it('should find an element', () => {
    const store = createArrayStore<{ id: number }>();
    store.add({ id: 1 });
    store.add({ id: 2 });
    const found = store.find((el) => el.id === 2);
    expect(found).toEqual({ id: 2 });
  });

  it('should mutate elements by predicate', () => {
    const store = createArrayStore<{ id: number; value: string }>();
    store.add({ id: 1, value: 'old' });
    store.add({ id: 2, value: 'old' });
    store.add({ id: 3, value: 'keep' });
    const count = store.mutateByPredicate(
      (el) => el.value === 'old',
      (el) => ({ ...el, value: 'new' })
    );
    expect(count).toBe(2);
    expect(store.get()).toEqual([
      { id: 1, value: 'new' },
      { id: 2, value: 'new' },
      { id: 3, value: 'keep' },
    ]);
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
  })

  it('add should be reactive', () => {
    return testEffect((dispose) => {
      const store = createArrayStore<{ id: number }>();
      let effectCount = 0; //runs once on "mount"
      createEffect(() => { 
        store.get();
        effectCount++;
      });

      const element = { id: 1 };
      store.add(element);
      expect(effectCount).toBe(1); 

      dispose();
    });
  });

  it('in-place mutateElement should be reactive', () => {
    return testEffect((dispose) => {
      const element = { id: 1 };
      const store = createArrayStore<{ id: number }>([element]);
      let effectCount = 0; //runs once on "mount"

      createEffect(() => {
        store.get();
        effectCount++;
      });

      store.mutateElement(element, (el) => {el.id++; return el;});
      expect(effectCount).toBe(1);
      expect(element.id).toBe(2);

      dispose();
    });
  })

  it('object replace mutateElement should be reactive', () => {
    return testEffect((done) => {
      const element = { id: 1 };
      const store = createArrayStore<{ id: number }>([element]);
      let effectCount = 0;

      createEffect(() => {
        store.get();
        effectCount++;
      });

      store.mutateElement(element, () => ({ id: 2 }));
      expect(effectCount).toBe(1);
      expect(element.id).toBe(1);
      expect(store.get()[0].id).toBe(2);

      store.mutateElement(element, () => ({ id: 3 }));
      expect(effectCount).toBe(2);
      expect(element.id).toBe(1);
      expect(store.get()[0].id).toBe(3);

      done();
    });
  })

  it('should work correctly in a component', async () => {
    const store = createArrayStore<{ id: number }>();

    const TestComponent = () => {
      const items = store.get();
      return <div>{items.map((item) => <span data-testid="span-item">{item.id}</span>)}</div>;
    };

    const { container, getAllByTestId } = render(() => <TestComponent />);
    expect(container.innerHTML).toBe('<div></div>');

    const removeFirst = store.add({ id: 1 });
    expect(getAllByTestId('span-item').length).toBe(1);
    expect(container.innerHTML).toBe('<div><span data-testid="span-item">1</span></div>');

    const removeSecond = store.add({ id: 2 });
    expect(getAllByTestId('span-item').length).toBe(2);
    expect(container.innerHTML).toBe('<div><span data-testid="span-item">1</span><span data-testid="span-item">2</span></div>');

    removeFirst();
    expect(getAllByTestId('span-item').length).toBe(1);
    expect(container.innerHTML).toBe('<div><span data-testid="span-item">2</span></div>');

    removeSecond();
    expect(container.innerHTML).toBe('<div></div>');

  });
});

describe('baseline store behaviour', () => {
  it('is reactive', { timeout: 10_000}, async () => {
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
        setStore((prev) => {return { id: prev.id + 1 };});
      });
    })
  });
})