import { flavours } from '../data/flavours';
import '../styles/HeroFlavourPicker.css';

export function HeroFlavourPicker({ selectedIndex, onSelect, ref }) {
  return (
    <>
      <div ref={ref} className="hero-flavour-picker" role="group" aria-label="Choose a flavour">
        {flavours.map((flavour, index) => (
          <button
            key={flavour.id}
            className="hero-flavour-picker__chip"
            type="button"
            data-flavour={flavour.id}
            aria-pressed={selectedIndex === index}
            onClick={() => onSelect(index)}
          >
            <span className="hero-flavour-picker__dot" aria-hidden="true" />
            {flavour.name}
          </button>
        ))}
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {flavours[selectedIndex].name} selected
      </span>
    </>
  );
}
