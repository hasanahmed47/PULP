import { useEffect, useReducer } from 'react';
import { flavours } from '../data/flavours';
import { parseShoppingBag, updateShoppingBag } from '../lib/shoppingBag';

const storageKey = 'pulp-shopping';
const flavourIds = new Set(flavours.map((flavour) => flavour.id));

function readShoppingBag() {
  try {
    return parseShoppingBag(localStorage.getItem(storageKey), flavourIds);
  } catch {
    return parseShoppingBag(null, flavourIds);
  }
}

function reduceShoppingBag(bag, action) {
  return updateShoppingBag(bag, action, flavourIds);
}

export function useShoppingBag() {
  const [bag, dispatch] = useReducer(reduceShoppingBag, undefined, readShoppingBag);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bag));
    } catch {
      return;
    }
  }, [bag]);

  function addItem(id, quantity = 1) {
    dispatch({ type: 'add', id, quantity });
  }

  function updateQuantity(id, quantity) {
    dispatch({ type: 'set-quantity', id, quantity });
  }

  function toggleFavourite(id) {
    dispatch({ type: 'toggle-favourite', id });
  }

  function moveToBag(id) {
    dispatch({ type: 'move-to-bag', id });
  }

  const totalQuantity = Object.values(bag.items).reduce((total, quantity) => total + quantity, 0);

  return { ...bag, totalQuantity, addItem, updateQuantity, toggleFavourite, moveToBag };
}
