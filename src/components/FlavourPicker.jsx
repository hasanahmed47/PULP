import { flavours } from '../data/flavours';
import { ShopIcon } from './ShopIcon';
import './FlavourPicker.css';

export function FlavourPicker({ selectedId, onSelect }) {
  function selectFlavour(event) {
    onSelect(event.target.value);
  }

  return (
    <fieldset className="flavour-picker">
      <legend>Choose your flavour</legend>
      <div className="flavour-picker__options">
        {flavours.map((flavour) => (
          <label
            key={flavour.id}
            className="flavour-picker__option"
            data-flavour={flavour.id}
          >
            <input
              type="radio"
              name="shop-flavour"
              value={flavour.id}
              checked={selectedId === flavour.id}
              onChange={selectFlavour}
            />
            <span className="flavour-picker__swatch">
              {selectedId === flavour.id && <ShopIcon name="check" />}
            </span>
            <span>{flavour.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
