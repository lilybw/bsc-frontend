import { describe, it, expect, vi } from 'vitest';
import { createRoot, createEffect } from 'solid-js';
import { createArrayStore, ArrayStore } from './arrayStore';
import { render } from "@solidjs/testing-library"
import userEvent from "@testing-library/user-event"

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

  it('should be reactive', () => {
    createRoot((dispose) => {
      const store = createArrayStore<{ id: number }>();
      let effectCount = 0;
      createEffect(() => {
        store.get();
        effectCount++;
      });

      store.add({ id: 1 });
      expect(effectCount).toBe(1); // Initial effect + one for the add

      store.mutateElement({ id: 1 }, (el) => ({ ...el, id: 2 }));
      expect(effectCount).toBe(2);

      dispose();
    });
  });

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