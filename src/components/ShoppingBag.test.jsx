import { useReducer } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { maximumQuantity, updateShoppingBag } from '../lib/shoppingBag';
import { ShoppingBag } from './ShoppingBag';

const flavours = [
  { id: 'blood-orange', name: 'Blood Orange', description: 'Bold.', image: 'a.png' },
  { id: 'blueberry', name: 'Blueberry', description: 'Juicy.', image: 'b.png' },
  { id: 'lime-basil', name: 'Lime Basil', description: 'Zesty.', image: 'c.png' },
];
const flavourIds = new Set(flavours.map((flavour) => flavour.id));

/** Wires the component to the real reducer, so these tests cover UI and rules together. */
function Harness({ initial, onStatus }) {
  const [state, dispatch] = useReducer(
    (current, action) => updateShoppingBag(current, action, flavourIds),
    initial,
  );
  const bag = {
    ...state,
    totalQuantity: Object.values(state.items).reduce((sum, quantity) => sum + quantity, 0),
    updateQuantity: (id, quantity) => dispatch({ type: 'set-quantity', id, quantity }),
    toggleFavourite: (id) => dispatch({ type: 'toggle-favourite', id }),
    moveToBag: (id) => dispatch({ type: 'move-to-bag', id }),
  };

  return <ShoppingBag bag={bag} flavours={flavours} onStatus={onStatus} onReview={() => {}} />;
}

function setup(initial = { items: {}, wishlist: [] }) {
  const onStatus = vi.fn();
  const user = userEvent.setup();
  render(<Harness initial={initial} onStatus={onStatus} />);
  return { user, onStatus };
}

const tab = (name) => screen.getByRole('tab', { name });

describe('ShoppingBag', () => {
  // Not automatic unless Vitest runs with `globals: true`.
  afterEach(cleanup);

  it('shows the empty message for the active tab', async () => {
    const { user } = setup();

    expect(screen.getByText(/waiting for something fruity/i)).toBeTruthy();

    await user.click(tab(/wishlist/i));
    expect(screen.getByText(/save your favourite flavours/i)).toBeTruthy();
  });

  it('moves between tabs with the keyboard and wraps around', async () => {
    const { user } = setup();

    tab(/your bag/i).focus();
    await user.keyboard('{ArrowRight}');
    expect(tab(/wishlist/i).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tab(/wishlist/i));

    await user.keyboard('{ArrowRight}'); // wraps to the first tab
    expect(document.activeElement).toBe(tab(/your bag/i));

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(tab(/wishlist/i));

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(tab(/your bag/i));
  });

  it('keeps focus in the list after removing an item', async () => {
    const { user, onStatus } = setup({
      items: { 'blood-orange': 1, blueberry: 2, 'lime-basil': 1 },
      wishlist: [],
    });

    await user.click(screen.getByRole('button', { name: /remove blood orange from bag/i }));

    expect(onStatus).toHaveBeenCalledWith('Blood Orange removed from your bag.');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /remove blueberry from bag/i }),
    );
  });

  it('returns focus to the tab when the last item is removed', async () => {
    const { user } = setup({ items: { blueberry: 1 }, wishlist: [] });

    await user.click(screen.getByRole('button', { name: /remove blueberry from bag/i }));

    expect(screen.getByText(/waiting for something fruity/i)).toBeTruthy();
    expect(document.activeElement).toBe(tab(/your bag/i));
  });

  it('moves a wishlist item to the bag and switches tab', async () => {
    const { user, onStatus } = setup({ items: {}, wishlist: ['blueberry'] });

    await user.click(tab(/wishlist/i));
    await user.click(screen.getByRole('button', { name: /move to bag/i }));

    expect(onStatus).toHaveBeenCalledWith('Blueberry moved to your bag.');
    expect(tab(/your bag/i).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('button', { name: /remove blueberry from bag/i })).toBeTruthy();
  });

  it('refuses to exceed the maximum quantity and explains why', async () => {
    const { user, onStatus } = setup({
      items: { 'blood-orange': maximumQuantity },
      wishlist: ['blood-orange'],
    });

    await user.click(tab(/wishlist/i));
    await user.click(screen.getByRole('button', { name: /move to bag/i }));

    expect(onStatus).toHaveBeenCalledWith(
      `Your bag already has the maximum of ${maximumQuantity} cans of Blood Orange.`,
    );
    expect(tab(/wishlist/i).getAttribute('aria-selected')).toBe('true');
  });
});