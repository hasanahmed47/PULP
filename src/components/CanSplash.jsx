import '../styles/CanSplash.css';

const TOTAL_DROPS = 18;
const TOTAL_SPIKES = 7;

const DROP_IDS = [...Array(TOTAL_DROPS).keys()];
const SPIKE_IDS = [...Array(TOTAL_SPIKES).keys()];

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

export function CanSplash({ layer = 'back' }) {
  if (layer === 'front') {
    return <FrontSplash />;
  }

  return <BackSplash />;
}
