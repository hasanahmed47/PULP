import '../styles/ReplayDropButton.css'

export function ReplayDropButton({ className = '', round = false, onClick }) {
  return (
    <button
      type="button"
      className={`replay-drop ${round ? 'replay-drop--round' : ''} ${className}`.trim()}
      aria-label="Replay can drop"
      onClick={onClick}
    >
      <svg className="replay-drop__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
      </svg>
      <span className="replay-drop__label">Replay drop</span>
    </button>
  );
}
