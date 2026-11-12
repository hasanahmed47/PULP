import { RotateCcw } from 'lucide-react';
import '../styles/ReplayDropButton.css';

export function ReplayDropButton({ className = '', round = false, onClick }) {
  return (
    <button
      type="button"
      className={`replay-drop ${round ? 'replay-drop--round' : ''} ${className}`.trim()}
      aria-label="Replay can drop"
      onClick={onClick}
    >
      <RotateCcw className="replay-drop__icon" aria-hidden="true" focusable="false" />
      <span className="replay-drop__label">Replay drop</span>
    </button>
  );
}
