import '../styles/CanSplash.css'

// Number of droplets and splash spikes.
const TOTAL_DROPS = 18;
const TOTAL_SPIKES = 7;

// Stable IDs for rendering animation elements.
const DROP_IDS = [...Array(TOTAL_DROPS).keys()];
const SPIKE_IDS = [...Array(TOTAL_SPIKES).keys()];

/**
 * Renders the droplets that appear in front of the can.
 */
function FrontSplash() {
  return (
    <div className="can-splash can-splash--front" aria-hidden="true">
      <div className="can-splash__ground">
        {DROP_IDS.map((id) => (
          <i key={id} className="can-splash__drop">
            <b />
          </i>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the glow, puddle, rings, and spikes
 * that appear behind the can.
 */
function BackSplash() {
  return (
    <div className="can-splash can-splash--back" aria-hidden="true">
      <div className="can-splash__ground">
        <span className="can-splash__glow" />
        <span className="can-splash__puddle" />

        <span className="can-splash__ring" />
        <span className="can-splash__ring" />

        {SPIKE_IDS.map((id) => (
          <span key={id} className="can-splash__spike" />
        ))}
      </div>
    </div>
  );
}

/**
 * Displays the appropriate splash layer.
 */
export function CanSplash({ layer = 'back' }) {
  if (layer === 'front') {
    return <FrontSplash />;
  }

  return <BackSplash />;
}
