export const maximumQuantity = 99;

export function parseShoppingBag(serialized, flavourIds) {
  const emptyBag = { items: {}, wishlist: [] };

  try {
    const saved = JSON.parse(serialized);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return emptyBag;

    const items = {};
    for (const id of flavourIds) {
      const quantity = saved.items?.[id];
      if (Number.isInteger(quantity) && quantity > 0) {
        items[id] = Math.min(quantity, maximumQuantity);
      }
    }

    const wishlist = Array.isArray(saved.wishlist)
      ? [...new Set(saved.wishlist.filter((id) => flavourIds.has(id)))]
      : [];

    return { items, wishlist };
  } catch {
    return emptyBag;
  }
}

function setItemQuantity(bag, id, quantity) {
  const currentQuantity = bag.items[id] || 0;
  if (quantity === currentQuantity) return bag;

  const items = { ...bag.items };
  if (quantity === 0) delete items[id];
  else items[id] = quantity;
  return { ...bag, items };
}

export function updateShoppingBag(bag, action, flavourIds) {
  if (!flavourIds.has(action.id)) return bag;
  const currentQuantity = bag.items[action.id] || 0;

  switch (action.type) {
    case 'add': {
      if (!Number.isInteger(action.quantity) || action.quantity < 1) return bag;
      const quantity = Math.min(currentQuantity + action.quantity, maximumQuantity);
      return setItemQuantity(bag, action.id, quantity);
    }
    case 'set-quantity': {
      if (!Number.isInteger(action.quantity) || !currentQuantity) return bag;
      const quantity = Math.max(0, Math.min(action.quantity, maximumQuantity));
      return setItemQuantity(bag, action.id, quantity);
    }
    case 'toggle-favourite': {
      const wishlist = bag.wishlist.includes(action.id)
        ? bag.wishlist.filter((id) => id !== action.id)
        : [...bag.wishlist, action.id];
      return { ...bag, wishlist };
    }
    case 'move-to-bag': {
      if (!bag.wishlist.includes(action.id) || currentQuantity >= maximumQuantity) return bag;
      return {
        items: { ...bag.items, [action.id]: currentQuantity + 1 },
        wishlist: bag.wishlist.filter((id) => id !== action.id),
      };
    }
    default:
      throw new Error(`Unknown shopping action: ${action.type}`);
  }
}
