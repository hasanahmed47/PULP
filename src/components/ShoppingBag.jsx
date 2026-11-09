import { useEffect, useId, useRef, useState } from 'react';
import { flavours as allFlavours } from '../data/flavours';
import { maximumQuantity } from '../lib/shoppingBag';
import { ShoppingBagItem } from './ShoppingBagItem';
import { ShopIcon } from './ShopIcon';
import '../styles/ShoppingBag.css'


const TABS = [
  {
    id: 'bag',
    label: 'Your bag',
    icon: 'bag',
    emptyMessage: 'Your bag is waiting for something fruity.',
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: 'heart',
    emptyMessage: 'A little love goes a long way. Save your favourite flavours here.',
  },
];

const noop = () => {};

/** WAI-ARIA tabs keyboard model: returns the index to move to, or null if the key is not ours. */
function getNextTabIndex(key, currentIndex) {
  switch (key) {
    case 'ArrowRight':
      return (currentIndex + 1) % TABS.length;
    case 'ArrowLeft':
      return (currentIndex - 1 + TABS.length) % TABS.length;
    case 'Home':
      return 0;
    case 'End':
      return TABS.length - 1;
    default:
      return null;
  }
}

/**
 * @typedef {object} Bag
 * @property {Record<string, number>} items      flavour id -> quantity
 * @property {string[]} wishlist                 saved flavour ids
 * @property {number} totalQuantity
 * @property {(id: string, quantity: number) => void} updateQuantity
 * @property {(id: string) => void} toggleFavourite
 * @property {(id: string) => void} moveToBag
 *
 * @param {object} props
 * @param {Bag} props.bag
 * @param {Array<{ id: string, name: string }>} [props.flavours]  defaults to the catalogue; pass your own in tests
 * @param {() => void} [props.onReview]
 * @param {(message: string) => void} [props.onStatus]           announced to screen readers by the parent
 */
export function ShoppingBag({ bag, flavours = allFlavours, onReview = noop, onStatus = noop }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [focusRequest, setFocusRequest] = useState(null);
  const baseId = useId();
  const tabRefs = useRef({});
  const panelRef = useRef(null);

  const panelId = `${baseId}-panel`;
  const getTabId = (id) => `${baseId}-${id}-tab`;

  // Derived during render, never stored in state, so it cannot go out of sync with `bag`.
  const collections = {
    bag: flavours.filter((flavour) => bag.items[flavour.id]),
    wishlist: flavours.filter((flavour) => bag.wishlist.includes(flavour.id)),
  };
  const counts = { bag: bag.totalQuantity, wishlist: bag.wishlist.length };
  const activeConfig = TABS.find((tab) => tab.id === activeTab);
  const displayedFlavours = collections[activeTab];

  // Runs after the list has re-rendered, so the DOM already reflects the removal.
  useEffect(() => {
    if (!focusRequest) return;
    const removeButtons = panelRef.current?.querySelectorAll('.shopping-bag-item__remove') ?? [];
    const nextButton = removeButtons[Math.min(focusRequest.index, removeButtons.length - 1)];
    (nextButton ?? tabRefs.current[focusRequest.tab])?.focus();
  }, [focusRequest]);

  function selectTab(id, { focus = false } = {}) {
    setActiveTab(id);
    if (focus) tabRefs.current[id]?.focus();
  }

  function handleTabKeyDown(event) {
    // Alt+Arrow is the browser's back/forward; never hijack modified keys.
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const currentIndex = TABS.findIndex(({ id }) => tabRefs.current[id] === event.target);
    if (currentIndex === -1) return;

    const nextIndex = getNextTabIndex(event.key, currentIndex);
    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(TABS[nextIndex].id, { focus: true });
  }

  function removeFlavour(flavour) {
    const index = displayedFlavours.findIndex((item) => item.id === flavour.id);

    if (activeTab === 'bag') {
      bag.updateQuantity(flavour.id, 0);
      onStatus(`${flavour.name} removed from your bag.`);
    } else {
      bag.toggleFavourite(flavour.id);
      onStatus(`${flavour.name} removed from your wishlist.`);
    }

    // Keep the keyboard user's place in the list: focus the item that slides into this
    // position, or the tab itself when the list is now empty.
    setFocusRequest({ index, tab: activeTab });
  }

  function moveFlavour(flavour) {
    // The reducer also refuses to exceed the limit; this check exists so we can tell the user why.
    if ((bag.items[flavour.id] ?? 0) >= maximumQuantity) {
      onStatus(`Your bag already has the maximum of ${maximumQuantity} cans of ${flavour.name}.`);
      return;
    }

    bag.moveToBag(flavour.id);
    onStatus(`${flavour.name} moved to your bag.`);
    selectTab('bag', { focus: true });
  }

  return (
    <div id="shopping-bag" className="shopping-bag" tabIndex={-1}>
      <div
        className="shopping-bag__tabs"
        role="tablist"
        aria-label="Your collection"
        onKeyDown={handleTabKeyDown}
      >
        {TABS.map(({ id, label, icon }) => {
          const isActive = id === activeTab;
          const count = counts[id];

          return (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[id] = node;
              }}
              id={getTabId(id)}
              type="button"
              role="tab"
              className="shopping-bag__tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(id)}
            >
              <ShopIcon name={icon} />
              {label}{' '}
              <span className="shopping-bag__count">
                {count}
                <span className="shopping-bag__count-label">
                  {count === 1 ? ' item' : ' items'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        ref={panelRef}
        id={panelId}
        className="shopping-bag__panel"
        role="tabpanel"
        aria-labelledby={getTabId(activeTab)}
        tabIndex={0}
      >
        {displayedFlavours.length === 0 ? (
          <p className="shopping-bag__empty">{activeConfig.emptyMessage}</p>
        ) : (
          displayedFlavours.map((flavour) => (
            <ShoppingBagItem
              key={flavour.id}
              flavour={flavour}
              quantity={bag.items[flavour.id] ?? 0}
              tab={activeTab}
              onQuantityChange={bag.updateQuantity}
              onMove={moveFlavour}
              onRemove={removeFlavour}
            />
          ))
        )}
      </div>

      <div className="shopping-bag__footer">
        <span>Build your fruity mix.</span>
        {bag.totalQuantity > 0 ? (
          <button type="button" className="shopping-bag__action" onClick={onReview}>
            Review your bag <ShopIcon name="arrow-up-right" />
          </button>
        ) : (
          <span className="shopping-bag__note">Online ordering is coming soon.</span>
        )}
      </div>
    </div>
  );
}