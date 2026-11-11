import { Fragment, useState } from 'react';
import { Leaf, DropletOff, WheatOff } from 'lucide-react';

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

const PERKS = [
  {
    label: 'Real fruit juice',
    icon: Leaf,
  },
  {
    label: 'No artificial colours',
    icon: DropletOff,
  },
  {
    label: 'Gluten free',
    icon: WheatOff,
  },
];

function renderStars(rating) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));

  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

function FlavourStack({ activeId, className = '', render }) {
  return (
    <div className={`spot-stack ${className}`}>
      {flavours.map((flavour) => {
        const active = flavour.id === activeId;

        return (
          <div
            key={flavour.id}
            className="spot-stack__layer"
            data-active={active}
            aria-hidden={!active}
            inert={!active}
          >
            {render({
              flavour,
              details: flavourDetails[flavour.id],
            })}
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
      tabIndex={-1}
      className="spot page-padding"
      data-flavour={flavour.id}
      aria-label="Flavour details"
    >
      <div className="spot__card">

        {/* Flavour information */}
        <div className="spot__info">

          <div className="spot__cell spot__name">
            <FlavourStack
              activeId={flavour.id}
              render={({ flavour: item, details }) => (
                <>
                  <h2
                    className="spot__title"
                    data-longest={Math.max(
                      ...item.lines.map((line) => line.length)
                    )}
                  >
                    {item.lines.map((line) => (
                      <Fragment key={line}>
                        <span>{line}</span>{' '}
                      </Fragment>
                    ))}
                  </h2>

                  <p className="spot__rating">
                    <span
                      role="img"
                      aria-label={`${details.rating} out of 5 stars`}
                    >
                      {renderStars(details.rating)}
                    </span>
                    <span>{details.reviews} Reviews</span>
                  </p>
                </>
              )}
            />
          </div>

          {/* Nutrition */}
          <div className="spot__cell spot__facts">
            <h3 className="spot__heading">
              Nutrition &amp; details
            </h3>

            <FlavourStack
              activeId={flavour.id}
              render={({ details }) => (
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

          {/* Ingredients and benefits */}
          <div className="spot__bottom">

            <div className="spot__cell spot__ingredients">
              <h3 className="spot__heading">Ingredients</h3>

              <FlavourStack
                activeId={flavour.id}
                render={({ details }) => (
                  <p>{details.ingredients}</p>
                )}
              />
            </div>

            <ul className="spot__cell spot__perks">
              {PERKS.map(({ label, icon: PerkIcon }) => (
                <li key={label}>
                  <PerkIcon aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

          </div>
        </div>

        {/* Interactive can carousel */}
        <CanCarousel
          className="spot__cell spot__stage"
          flavours={flavours}
          activeIndex={activeIndex}
          onSelect={chooseFlavour}
          shakeCount={shakeCount}
        />

        {/* Flavour selection and serving suggestions */}
        <div className="spot__side">

          <div className="spot__cell spot__picker">
            <p className="spot__eyebrow">
              Choose your flavour:
              <span>PULP Cocktails</span>
            </p>

            <div
              className="spot__picks"
              role="group"
              aria-label="Flavour"
            >
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
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />
                  </span>

                  <span className="spot-pick__name">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Perfect serve */}
          <div className="spot__cell spot__serve">

            <div className="spot__serve-copy">
              <p className="spot__eyebrow">
                The perfect serve
              </p>

              <div aria-live="polite">
                <div
                  key={`${flavour.id}-${serveStep}`}
                  className="spot__serve-body"
                >
                  <h3>{serve.name}</h3>
                  <p>{serve.tip}</p>

                  <p className="spot__garnish">
                    <span>Garnish</span> {serve.garnish}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="spot__shake"
              onClick={shakeForServe}
            >
              <span>Shake for a serve</span>

              <span aria-hidden="true">
                {serveStep + 1}/{serves.length}
              </span>

              <span className="sr-only">
                Serve {serveStep + 1} of {serves.length}
              </span>
            </button>

          </div>
        </div>

      </div>
    </section>
  );
}
