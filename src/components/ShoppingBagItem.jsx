import { QuantityControl } from './QuantityControl';
import { ShopIcon } from './ShopIcon';
import '../styles/ShoppingBagItem.css';

export function ShoppingBagItem({ flavour, quantity, tab, onQuantityChange, onMove, onRemove }) {
  const collectionName = tab === 'bag' ? 'bag' : 'wishlist';

  function changeQuantity(nextQuantity) {
    onQuantityChange(flavour.id, nextQuantity);
  }

  function moveToBag() {
    onMove(flavour);
  }

  function removeItem() {
    onRemove(flavour);
  }

  return (
    <div className="shopping-bag-item">
      <img src={flavour.image} alt="" width="48" height="80" loading="lazy" />
      <div className="shopping-bag-item__copy">
        <h4>{flavour.name}</h4>
        <p>{flavour.description}</p>
      </div>
      <div className="shopping-bag-item__actions">
        {tab === 'bag' ? (
          <QuantityControl
            quantity={quantity}
            onChange={changeQuantity}
            label={`${flavour.name} quantity`}
          />
        ) : (
          <button type="button" className="shopping-bag-item__move" onClick={moveToBag}>
            Move to bag <ShopIcon name="arrow-up-right" />
          </button>
        )}
        <button
          type="button"
          className="shopping-bag-item__remove"
          aria-label={`Remove ${flavour.name} from ${collectionName}`}
          onClick={removeItem}
        >
          <ShopIcon name="close" />
        </button>
      </div>
    </div>
  );
}
