import './ShopIcon.css';

/** SVG path data on a 24x24 grid. Add a new icon by adding one line here. */
const ICON_PATHS = Object.freeze({
  bag: 'M6 7h12l2 13H4L6 7Zm3 0V5a3 3 0 0 1 6 0v2M9 11a3 3 0 0 0 6 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  'arrow-up-right': 'M6 18 18 6M6 6h12v12',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
});

export const ICON_NAMES = Object.keys(ICON_PATHS);

export function ShopIcon({ name, className = '', ...props }) {
   // yeh  check krta hai keh name object ki apni key hai yeh nahi?
  if (!Object.hasOwn(ICON_PATHS, name)) {
    if (import.meta.env.DEV) {
      console.warn(`ShopIcon: unknown icon "${name}". Valid names: ${ICON_NAMES.join(', ')}`);
    }
    return null;
  }

  return (
    <svg
      className={`shop-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}