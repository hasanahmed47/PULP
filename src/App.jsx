import { useState } from 'react';
import { SceneStartProvider } from './context/SceneStartContext';
import { ScrollProvider } from './context/ScrollContext';
import { AnchorLink } from './components/AnchorLink';
import { Header } from './components/Header';
import { Hero } from './sections/Hero';
import { GoodInsides } from './sections/GoodInsides';
import HighlightsCarousel from './components/DeferredHighlights';
import { Cutaway } from './sections/Cutaway';
import { FlavourRotation } from './sections/FlavourRotation';
import { FlavourCards } from './sections/FlavourCards';
import { PickYourPulp } from './sections/PickYourPulp';
import { Footer } from './sections/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { useSiteLoading } from './hooks/useSiteLoading';
import { flavours } from './data/flavours';
import './styles/App.css';

export default function App() {
  const loading = useSiteLoading();
  const [selectedFlavourId, setSelectedFlavourId] = useState(flavours[0].id);

  return (
    <ScrollProvider suspended={!loading.revealed}>
      <SceneStartProvider allowed={loading.introEnded}>
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
            <GoodInsides />
            <HighlightsCarousel />
            <Cutaway onPickFlavour={setSelectedFlavourId} />
            <FlavourRotation />
            <FlavourCards onPickFlavour={setSelectedFlavourId} />
            <PickYourPulp
              selectedId={selectedFlavourId}
              onSelectFlavour={setSelectedFlavourId}
            />
          </main>
          <Footer />
        </div>
        {!loading.finished && (
          <LoadingScreen
            ready={loading.ready}
            onIntroEnd={loading.endIntro}
            onReveal={loading.revealSite}
            onComplete={loading.finishLoading}
          />
        )}
      </SceneStartProvider>
    </ScrollProvider>
  );
}
