import './ColourRibbon.css';

const paths = {
  hero: 'M390 -90 C470 140 1020 180 810 570 S460 810 530 1130',
  mascot: 'M-100 -90 C190 80 45 420 115 670 S480 940 880 1100',
  footer: 'M-120 650 Q720 -170 1560 650',
};

export function ColourRibbon({ variant = 'hero' }) {
  const isFooter = variant === 'footer';
  const viewBox = isFooter ? '0 0 1440 650' : '0 0 1000 1100';

  function renderStripe(index) {
    const offsetX = isFooter ? 0 : index * -18;
    const offsetY = isFooter ? index * 23 : 0;

    return (
      <path
        key={index}
        d={paths[variant]}
        transform={`translate(${offsetX} ${offsetY})`}
      />
    );
  }

  return (
    <svg
      className={`colour-ribbon colour-ribbon--${variant}`}
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      {[0, 1, 2, 3].map(renderStripe)}
    </svg>
  );
}
