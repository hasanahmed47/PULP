import { maximumQuantity } from '../lib/shoppingBag';
import './QuantityControl.css';

export function QuantityControl({ quantity, onChange, label = 'Quantity' }) {
  function decreaseQuantity() {
    onChange(quantity - 1);
  }

  function increaseQuantity() {
    onChange(quantity + 1);
  }

  return (
    <div className="quantity-control" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={quantity <= 1}
        onClick={decreaseQuantity}
      >
        −
      </button>
      <output aria-label={`${label}: ${quantity}`}>{quantity}</output>
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={quantity >= maximumQuantity}
        onClick={increaseQuantity}
      >
        +
      </button>
    </div>
  );
}
