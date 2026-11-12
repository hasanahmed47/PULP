import { flavours } from '../data/flavours';
import { FlavourCard } from '../components/FlavourCard';
import '../styles/FlavourCards.css';

export function FlavourCards({ onPickFlavour }) {
  return (
    <section
      id="flavours"
      tabIndex="-1"
      className="cards-section page-padding"
      aria-labelledby="flavours-heading"
    >
      <h2 id="flavours-heading" className="sr-only">Our flavours</h2>
      {flavours.map((flavour) => (
        <FlavourCard
          key={flavour.id}
          flavour={flavour}
          onPickFlavour={onPickFlavour}
        />
      ))}
    </section>
  );
}
