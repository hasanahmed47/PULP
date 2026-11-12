import { Fragment, useState } from 'react';
import { CanCarousel } from '../components/CanCarousel';
import { flavours } from '../data/flavours';
import { flavourDetails } from '../data/flavourDetails';
import './GoodInsides.css';

const NUTRITION_ROWS = [
  ['calories', 'Calories'],
  ['sugar', 'Sugar'],
  ['fat', 'Fat'],
  ['serving', 'Serving size'],
  ['abv', 'ABV'],
];

function renderStars(rating) {
  const filled = Math.round(rating);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function Icon({ children }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

const PERKS = [
  {
    label: 'Real fruit juice',
    icon: <Icon><path d="M6 26C6 14 13 6 26 6c0 12-8 20-20 20Z" /><path d="M6 26 18 14" /></Icon>,
  },
  {
    label: 'No artificial colours',
    icon: <Icon><path d="M16 4c5 6 8 10 8 14a8 8 0 0 1-16 0c0-4 3-8 8-14Z" /><path d="M12 19a4 4 0 0 0 4 4" /></Icon>,
  },
  {
    label: 'Gluten free',
    icon: (
      <Icon>
        <circle cx="16" cy="16" r="12" />
        <path d="M16 23V10m0 4c-2.5 0-4-1.5-4-3.5 2.5 0 4 1.5 4 3.5Zm0 0c2.5 0 4-1.5 4-3.5-2.5 0-4 1.5-4 3.5Zm0 5c-2.5 0-4-1.5-4-3.5 2.5 0 4 1.5 4 3.5Zm0 0c2.5 0 4-1.5 4-3.5-2.5 0-4 1.5-4 3.5ZM7 25 25 7" />
      </Icon>
    ),
  },
];

// Every flavour's copy sits in the same grid cell and only the active one is visible,
// so switching can cross-fade without the layout jumping.
function FlavourStack({ activeId, className = '', render }) {
  return (
    <div className={`spot-stack ${className}`}>
      {flavours.map((flavour) => {
        const active = flavour.id === activeId;

        return (
          <div key={flavour.id} className="spot-stack__layer" data-active={active} aria-hidden={!active} inert={!active}>
            {render(flavour, flavourDetails[flavour.id])}
          </div>
        );
      })}
    </div>
  );
}

export function GoodInsides() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [serveStep, setServeStep] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);

  const flavour = flavours[activeIndex];
  const { serves } = flavourDetails[flavour.id];
  const serve = serves[serveStep];

  function chooseFlavour(index) {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setServeStep(0);
  }

  function shakeForServe() {
    setServeStep((step) => (step + 1) % serves.length);
    setShakeCount((count) => count + 1);
  }

  return (
    <section
      id="good-insides"
      tabIndex="-1"
      className="spot page-padding"
      data-flavour={flavour.id}
      aria-label="Flavour details"
    >
      <div className="spot__card">
        <div className="spot__info">
          <div className="spot__cell spot__name">
            <p className="spot__kicker">Meet your flavour</p>
            <FlavourStack
              activeId={flavour.id}
              render={(item, details) => (
                <>
                  <h2 className="spot__title" style={{ '--longest': Math.max(...item.lines.map((line) => line.length)) }}>
                    {item.lines.map((line) => (
                      <Fragment key={line}><span>{line}</span>{' '}</Fragment>
                    ))}
                  </h2>
                  <p className="spot__description">{item.description}</p>
                  <p className="spot__rating">
                    <span role="img" aria-label={`${details.rating} out of 5 stars`}>{renderStars(details.rating)}</span>
                    <span>{details.reviews} Reviews</span>
                  </p>
                </>
              )}
            />
          </div>

          <div className="spot__cell spot__facts">
            <h3 className="spot__heading">Nutrition &amp; details</h3>
            <FlavourStack
              activeId={flavour.id}
              render={(item, details) => (
                <dl className="spot__nutrition">
                  {NUTRITION_ROWS.map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}:</dt>
                      <dd>{details.nutrition[key]}</dd>
                    </div>
                  ))}
                </dl>
              )}
            />
          </div>

          <div className="spot__bottom">
            <div className="spot__cell spot__ingredients">
              <h3 className="spot__heading">Ingredients</h3>
              <FlavourStack
                activeId={flavour.id}
                render={(item, details) => <p>{details.ingredients}</p>}
              />
            </div>
            <ul className="spot__cell spot__perks">
              {PERKS.map(({ label, icon }) => (
                <li key={label}>
                  {icon}
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <CanCarousel
          className="spot__cell spot__stage"
          flavours={flavours}
          activeIndex={activeIndex}
          onSelect={chooseFlavour}
          shakeCount={shakeCount}
        />

        <div className="spot__side">
          <div className="spot__cell spot__picker">
            <p className="spot__eyebrow">
              Choose your flavour:<br /><span>PULP Cocktails</span>
            </p>
            <div className="spot__picks" role="group" aria-label="Flavour">
              {flavours.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="spot-pick"
                  data-flavour={item.id}
                  aria-pressed={index === activeIndex}
                  onClick={() => chooseFlavour(index)}
                >
                  <span className="spot-pick__disc">
                    <img src={item.image} alt="" width="600" height="1000" loading="lazy" decoding="async" draggable="false" />
                  </span>
                  <span className="spot-pick__name">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="spot__cell spot__serve">
            <div className="spot__serve-copy">
              <p className="spot__eyebrow">The perfect serve</p>
              <div aria-live="polite">
                <div key={`${flavour.id}-${serveStep}`} className="spot__serve-body">
                  <h3>{serve.name}</h3>
                  <p>{serve.tip}</p>
                  <p className="spot__garnish"><span>Garnish</span> {serve.garnish}</p>
                </div>
              </div>
            </div>
            <button type="button" className="spot__shake" onClick={shakeForServe}>
              <span>Shake for a serve</span>
              <span aria-hidden="true">{serveStep + 1}/{serves.length}</span>
              <span className="sr-only">Serve {serveStep + 1} of {serves.length}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
