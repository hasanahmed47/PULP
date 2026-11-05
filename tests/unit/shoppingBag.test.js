import assert from 'node:assert/strict';
import test from 'node:test';
import { maximumQuantity, parseShoppingBag, updateShoppingBag } from '../../src/lib/shoppingBag.js';

const flavourIds = new Set(['blood-orange', 'blueberry', 'lime-basil', 'passionfruit-yuzu']);

test('unreadable or invalid saved data recovers to an empty bag', () => {
  for (const saved of [null, '', '{broken', 'null', 'false', '42', '[]']) {
    assert.deepEqual(parseShoppingBag(saved, flavourIds), { items: {}, wishlist: [] });
  }
});

test('restored data drops unknown products, invalid quantities and duplicate favourites', () => {
  const saved = JSON.stringify({
    items: { 'blood-orange': 120, blueberry: '3', 'lime-basil': -1, 'passionfruit-yuzu': 2.5, unknown: 5 },
    wishlist: ['blueberry', 'unknown', 'blueberry', null, 'lime-basil'],
  });
  assert.deepEqual(parseShoppingBag(saved, flavourIds), {
    items: { 'blood-orange': maximumQuantity },
    wishlist: ['blueberry', 'lime-basil'],
  });
});

test('adding respects the cap without mutating previous state', () => {
  const bag = Object.freeze({ items: Object.freeze({ blueberry: 98 }), wishlist: Object.freeze([]) });
  const next = updateShoppingBag(bag, { type: 'add', id: 'blueberry', quantity: 4 }, flavourIds);
  assert.equal(next.items.blueberry, maximumQuantity);
  assert.equal(bag.items.blueberry, 98);
  assert.equal(updateShoppingBag(next, { type: 'add', id: 'blueberry', quantity: 1 }, flavourIds), next);
});

test('invalid mutation inputs leave the bag unchanged', () => {
  const bag = { items: { blueberry: 2 }, wishlist: [] };
  for (const quantity of [0, -1, 1.5, NaN, Infinity, '3']) {
    assert.equal(updateShoppingBag(bag, { type: 'add', id: 'blueberry', quantity }, flavourIds), bag);
  }
  assert.equal(updateShoppingBag(bag, { type: 'add', id: '__proto__', quantity: 1 }, flavourIds), bag);
  assert.equal(updateShoppingBag(bag, { type: 'set-quantity', id: 'lime-basil', quantity: 2 }, flavourIds), bag);
});

test('quantity changes can remove an item and preserve its favourite', () => {
  const bag = { items: { blueberry: 2, 'lime-basil': 1 }, wishlist: ['blueberry'] };
  const next = updateShoppingBag(bag, { type: 'set-quantity', id: 'blueberry', quantity: 0 }, flavourIds);
  assert.deepEqual(next, { items: { 'lime-basil': 1 }, wishlist: ['blueberry'] });
  assert.equal(bag.items.blueberry, 2);
});

test('a full bag retains the saved flavour when move-to-bag is rejected', () => {
  const bag = { items: { blueberry: maximumQuantity }, wishlist: ['blueberry'] };
  assert.equal(updateShoppingBag(bag, { type: 'move-to-bag', id: 'blueberry' }, flavourIds), bag);
});

test('moving a favourite adds one can and removes only that favourite', () => {
  const bag = { items: { blueberry: 2 }, wishlist: ['blueberry', 'lime-basil'] };
  const next = updateShoppingBag(bag, { type: 'move-to-bag', id: 'blueberry' }, flavourIds);
  assert.deepEqual(next, { items: { blueberry: 3 }, wishlist: ['lime-basil'] });
  assert.equal(updateShoppingBag(next, { type: 'move-to-bag', id: 'blueberry' }, flavourIds), next);
});

test('favourites toggle without duplicating entries or changing quantities', () => {
  const bag = { items: { blueberry: 2 }, wishlist: [] };
  const saved = updateShoppingBag(bag, { type: 'toggle-favourite', id: 'blueberry' }, flavourIds);
  const removed = updateShoppingBag(saved, { type: 'toggle-favourite', id: 'blueberry' }, flavourIds);
  assert.deepEqual(saved.wishlist, ['blueberry']);
  assert.deepEqual(removed, bag);
});

test('unknown action names fail explicitly instead of hiding wiring mistakes', () => {
  assert.throws(() => updateShoppingBag({ items: {}, wishlist: [] }, { type: 'misspelled', id: 'blueberry' }, flavourIds), /Unknown shopping action/);
});
