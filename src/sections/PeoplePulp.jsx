import { useRef, useState } from 'react';
import { flavours } from '../data/flavours';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useVisibility } from '../hooks/useVisibility';
import './PeoplePulp.css';

export function PeoplePulp() {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const visible = useVisibility(sectionRef);
  const [paused, setPaused] = useState(false);
  const playing = !reducedMotion && visible && !paused;
  const playbackAction = paused ? 'Play' : 'Pause';

  function togglePlayback() {
    setPaused((current) => !current);
  }

  return (
    <section
      id="people-pulp"
      ref={sectionRef}
      className="people-section page-padding"
      aria-labelledby="people-title"
      data-playing={playing}
    >
      <div className="people-heading">
        <h2 id="people-title" className="headline">
          PEOPLE <span>PULP.</span>
        </h2>
        {!reducedMotion && (
          <button
            type="button"
            className="people-control"
            aria-label={`${playbackAction} People Pulp preview`}
            aria-pressed={!paused}
            onClick={togglePlayback}
          >
            <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>
            {playbackAction} preview
          </button>
        )}
      </div>
      <div className="people-frame">
        <div className="people-frame-copy">
          <p className="people-eyebrow">THE GOOD COMPANY CLUB</p>
          <p className="people-statement">
            GOOD TIMES.<br />GREAT TASTE.
          </p>
        </div>
        <div className="people-lineup" role="group" aria-label="Four PULP flavours, made for sharing">
          {flavours.map((flavour) => (
            <div className="people-can" data-flavour={flavour.id} key={flavour.id}>
              <img
                src={flavour.image}
                alt={`${flavour.name} PULP`}
                width="600"
                height="1000"
                loading="lazy"
                draggable="false"
              />
            </div>
          ))}
        </div>
        <div className="people-frame-footer">
          <span>FOUR FLAVOURS. ONE GOOD TIME.</span>
          <span>THE PEOPLE FILM · COMING SOON</span>
        </div>
      </div>
      <p className="people-caption">A little fruit. A few friends. A very good place to be.</p>
    </section>
  );
}
