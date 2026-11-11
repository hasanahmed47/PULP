import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/barlow-condensed/latin-900.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import 'lenis/dist/lenis.css';
import './styles.css';
import App from './App';
import { loadCanSceneModule } from './three/loadCanScene';

loadCanSceneModule();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);