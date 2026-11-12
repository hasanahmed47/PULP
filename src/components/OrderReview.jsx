import { useEffect, useRef } from 'react';
import { ShopIcon } from './ShopIcon';
import '../styles/OrderReview.css';

export function OrderReview({ items, onClose }) {
  const dialogRef = useRef(null);
  const total = items.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function closeReview() {
    dialogRef.current.close();
    onClose();
  }

  function cancelReview(event) {
    event.preventDefault();
    closeReview();
  }

  return (
    <dialog
      ref={dialogRef}
      className="order-review"
      aria-labelledby="order-review-title"
      aria-describedby="order-review-note"
      onCancel={cancelReview}
      data-lenis-prevent
    >
      <div className="order-review__header">
        <span className="order-review__eyebrow">GOOD TASTE. GREAT CHOICE.</span>
        <button
          type="button"
          className="order-review__close"
          aria-label="Close order review"
          onClick={closeReview}
        >
          <ShopIcon name="close" />
        </button>
      </div>
      <h2 id="order-review-title">YOUR FRUITY MIX.</h2>
      <ul className="order-review__items">
        {items.map(({ flavour, quantity }) => (
          <li key={flavour.id}>
            <img src={flavour.image} alt="" width="42" height="70" />
            <span>{flavour.name}</span>
            <span className="order-review__quantity">x {quantity}</span>
          </li>
        ))}
      </ul>
      <p className="order-review__total">
        <span>Your selection</span>
        <strong>{total} {total === 1 ? 'can' : 'cans'}</strong>
      </p>
      <p id="order-review-note" className="order-review__note">
        Online ordering is coming soon. For now, build your bag and save the flavours you love.
      </p>
      <button type="button" className="order-review__continue" onClick={closeReview}>
        Back to your mix <ShopIcon name="arrow-up-right" />
      </button>
    </dialog>
  );
}
