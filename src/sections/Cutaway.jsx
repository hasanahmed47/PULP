import { useRef, useState } from 'react';
import { AnchorLink } from '../components/AnchorLink';
import { PeekCan } from '../components/PeekCan';
import { SplitText } from '../components/react-bits/SplitText';
import { flavours } from '../data/flavours';
import { useVisibleOnce } from '../hooks/useVisibleOnce';
import '../styles/Cutaway.css';

export function Cutaway({ onPickFlavour }) {
  const sectionRef = useRef(null);
  const visible = useVisibleOnce(sectionRef);
  const [selectedFlavour, setSelectedFlavour] = useState(flavours[0]);

  function pickSelectedFlavour() {
    onPickFlavour(selectedFlavour.id);
  }

  return (
    <section
      id="good-stuff"
      ref={sectionRef}
      className="inside-section"
      data-visible={visible}
      tabIndex="-1"
      aria-labelledby="inside-title"
    >
      <SplitText id="inside-title" className="inside-title" text={"IT'S WHAT'S\nINSIDE."} />
      <p className="inside-instruction">Move over a can to peek inside. Click or tap to choose it.</p>

      <div className="inside-gallery" role="group" aria-label="Explore the four flavours">
        {flavours.map((flavour) => (
          <PeekCan
            key={flavour.id}
            flavour={flavour}
            selected={selectedFlavour.id === flavour.id}
            onSelect={setSelectedFlavour}
          />
        ))}
      </div>

      <div id="inside-detail" className="inside-detail" data-flavour={selectedFlavour.id}>
        <div className="inside-detail-copy" aria-live="polite" aria-atomic="true">
          <p className="inside-detail-eyebrow">THE FRUITY BIT</p>
          <h3>{selectedFlavour.name}</h3>
          <p className="inside-detail-description">{selectedFlavour.description}</p>
        </div>
        <AnchorLink
          className="inside-pick"
          href="#pick-your-pulp"
          onNavigate={pickSelectedFlavour}
        >
          Pick this flavour
          <span aria-hidden="true">↗</span>
        </AnchorLink>
      </div>
    </section>
  );
}
