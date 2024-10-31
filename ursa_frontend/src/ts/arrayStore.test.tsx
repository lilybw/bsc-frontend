import { describe, it, expect } from 'vitest';
import { createArrayStore } from './arrayStore';
import { render } from '@solidjs/testing-library';

describe('compound tests', () => {
    it('should work correctly in a component', async () => {
        const store = createArrayStore<{ id: number }>();

        const TestComponent = () => {
            const items = store.get;
            return (
                <div>
                    {items.map((item) => (
                        <span data-testid="span-item">{item.id}</span>
                    ))}
                </div>
            );
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
