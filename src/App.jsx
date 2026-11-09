import { useState } from 'react';
import { ScrollProvider } from './context/ScrollContext';
import { AnchorLink } from './components/AnchorLink';
import { Header } from './components/Header';
import { Hero } from './sections/Hero';
import { Mascot } from './sections/Mascot';
import HighlightsCarousel from './sections/HighlightsCarousel';
import { Cutaway } from './sections/Cutaway';
import { FlavourRotation } from './sections/FlavourRotation';
import { FlavourCards } from './sections/FlavourCards';
import { PickYourPulp } from './sections/PickYourPulp';
import { Footer } from './sections/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { useSiteLoading } from './hooks/useSiteLoading';
import { flavours } from './data/flavours';
import './App.css';

export default function App() {
  const loading = useSiteLoading();
  const [selectedFlavourId, setSelectedFlavourId] = useState(flavours[0].id);

  return (
    <ScrollProvider suspended={!loading.revealed}>
      <div
        className="site-content"
        inert={!loading.revealed}
        aria-hidden={!loading.revealed}
      >
        <AnchorLink className="skip-link" href="#flavours">
          Skip to flavours
        </AnchorLink>
        <Header />
        <main>
          <Hero onReady={loading.markCanReady} revealed={loading.revealed} />
          <Mascot />
          <HighlightsCarousel />
          <Cutaway onPickFlavour={setSelectedFlavourId} />
          <FlavourRotation onReady={loading.markRotationReady} />
          <FlavourCards onPickFlavour={setSelectedFlavourId} />
          <PickYourPulp
            selectedId={selectedFlavourId}
            onSelectFlavour={setSelectedFlavourId}
          />
        </main>
        <Footer />
      </div>
      {!loading.revealed && (
        <LoadingScreen
          progress={loading.progress}
          ready={loading.ready}
          onComplete={loading.revealSite}
        />
      )}
    </ScrollProvider>
  );
}
