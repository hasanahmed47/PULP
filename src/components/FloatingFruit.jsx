import '../styles/FloatingFruit.css';
import { media } from '../data/media';

export function FloatingFruit({ flavour, className = '', eager = false }) {
  return (
    <span className={`fruit ${className}`} data-fruit aria-hidden="true">
      <img
        className="fruit__image"
        src={media.fruit[flavour]}
        alt=""
        width="500"
        height="500"
        draggable="false"
        loading={eager ? 'eager' : 'lazy'}
      />
    </span>
  );
}
