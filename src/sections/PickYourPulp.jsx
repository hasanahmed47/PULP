import { useEffect, useState } from 'react';
import { flavours } from '../data/flavours';
import { useShoppingBag } from '../hooks/useShoppingBag';
import { maximumQuantity } from '../lib/shoppingBag';
import { AnchorLink } from '../components/AnchorLink';
import { FlavourPicker } from '../components/FlavourPicker';
import { OrderReview } from '../components/OrderReview';
import { QuantityControl } from '../components/QuantityControl';
import { ShoppingBag } from '../components/ShoppingBag';
import { ShopIcon } from '../components/ShopIcon';
import '../styles/PickYourPulp.css';

export function PickYourPulp({ selectedId, onSelectFlavour }) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('');
  const [reviewItems, setReviewItems] = useState(null);
  const bag = useShoppingBag();
  const selected = flavours.find((flavour) => flavour.id === selectedId);
  const isFavourite = bag.wishlist.includes(selectedId);

  useEffect(() => {
    setQuantity(1);
    setStatus('');
  }, [selectedId]);

  function closeReview() {
    setReviewItems(null);
  }

  function addToBag() {
    const existingQuantity = bag.items[selectedId] || 0;
    const addedQuantity = Math.min(quantity, maximumQuantity - existingQuantity);
    if (addedQuantity === 0) {
      setStatus(`Your bag already has the maximum of ${maximumQuantity} ${selected.name} cans.`);
      return;
    }
    bag.addItem(selectedId, quantity);
    setStatus(`${addedQuantity} ${selected.name} ${addedQuantity === 1 ? 'can' : 'cans'} added to your bag.`);
  }

  function toggleFavourite() {
    bag.toggleFavourite(selectedId);
    setStatus(`${selected.name} ${isFavourite ? 'removed from' : 'saved to'} your wishlist.`);
  }

  function reviewBag() {
    const items = flavours.filter((flavour) => bag.items[flavour.id]);
    setReviewItems(items.map((flavour) => ({ flavour, quantity: bag.items[flavour.id] })));
  }

  function buyNow() {
    setReviewItems([{ flavour: selected, quantity }]);
  }

  return (
    <section
      id="pick-your-pulp"
      className="pulp-shop page-padding"
      tabIndex="-1"
      aria-labelledby="shop-title"
      data-flavour={selectedId}
    >
      <header className="pulp-shop__header">
        <h2 id="shop-title" className="headline">
          PICK YOUR<br />PULP<span className="pulp-shop__full-stop">.</span>
        </h2>
        <AnchorLink href="#shopping-bag" className="pulp-shop__bag-count">
          <ShopIcon name="bag" />
          <span>{bag.totalQuantity} {bag.totalQuantity === 1 ? 'can' : 'cans'} in your bag</span>
        </AnchorLink>
      </header>
      <div className="pulp-shop__layout">
        <div className="pulp-shop__art">
          <div className="pulp-shop__halo" />
          <div key={selectedId} className="pulp-shop__product">
            <img
              className="pulp-shop__can"
              src={selected.image}
              alt={`${selected.name} PULP can`}
              width="600"
              height="1000"
              loading="lazy"
              draggable="false"
            />
            <img
              className="pulp-shop__fruit"
              src={selected.fruit}
              alt=""
              width="500"
              height="500"
              loading="lazy"
              draggable="false"
            />
          </div>
          <span className="pulp-shop__art-caption">FRUIT-FORWARD. FULL-ON FLAVOUR.</span>
        </div>
        <div className="pulp-shop__details">
          <span className="pulp-shop__eyebrow">FIND YOUR NEW FAVOURITE</span>
          <h3>{selected.name}</h3>
          <p className="pulp-shop__description">{selected.description}</p>
          <FlavourPicker selectedId={selectedId} onSelect={onSelectFlavour} />
          <div className="pulp-shop__quantity-row">
            <span>Quantity</span>
            <QuantityControl quantity={quantity} onChange={setQuantity} />
          </div>
          <div className="pulp-shop__actions">
            <button type="button" className="pulp-shop__add" onClick={addToBag}>
              <ShopIcon name="bag" /> Add to bag <ShopIcon name="arrow-up-right" />
            </button>
            <button
              type="button"
              className="pulp-shop__favourite"
              aria-label={`${isFavourite ? 'Remove' : 'Save'} ${selected.name} ${isFavourite ? 'from' : 'to'} wishlist`}
              aria-pressed={isFavourite}
              onClick={toggleFavourite}
            >
              <ShopIcon name="heart" />
            </button>
            <button type="button" className="pulp-shop__buy" onClick={buyNow}>
              Buy now <ShopIcon name="arrow-up-right" />
            </button>
          </div>
          <p className="pulp-shop__status" role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
      <ShoppingBag bag={bag} onReview={reviewBag} onStatus={setStatus} />
      {reviewItems && <OrderReview items={reviewItems} onClose={closeReview} />}
    </section>
  );
}
