import { clamp, easeOutCubic, lerp } from './easing';

export const wordmarkHeight = 100;

const letterGap = 8;

const letters = [
  { glyph: 'P', width: 116 },
  { glyph: 'U', width: 116 },
  { glyph: 'L', width: 100 },
  { glyph: 'P', width: 116 },
];

const bowl = { stroke: 22, depth: 68, radius: 30 };
const cup = { stroke: 24, radius: 34, innerRadius: 12 };
const foot = { stroke: 24 };

const counterBloomStart = 0.15;

export function createPillPath(centreX, centreY, width, height) {
  const radius = Math.min(width, height) / 2;
  const left = centreX - width / 2;
  const right = centreX + width / 2;
  const top = centreY - height / 2;
  const bottom = centreY + height / 2;

  return [
    `M${left + radius} ${top}`,
    `H${right - radius}`,
    `A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    `H${left + radius}`,
    `A${radius} ${radius} 0 0 1 ${left + radius} ${top}`,
    'Z',
  ].join('');
}

function createPPath(carve, width) {
  const corner = lerp(0, bowl.radius, carve);
  const bowlBottom = lerp(wordmarkHeight, bowl.depth, carve);
  const stemEdge = lerp(width, bowl.stroke, carve);

  const outline = [
    'M0 0',
    `H${width - corner}`,
    `A${corner} ${corner} 0 0 1 ${width} ${corner}`,
    `V${bowlBottom - corner}`,
    `A${corner} ${corner} 0 0 1 ${width - corner} ${bowlBottom}`,
    `H${stemEdge}`,
    `V${wordmarkHeight}`,
    'H0Z',
  ].join('');

  const bloom = easeOutCubic(clamp((carve - counterBloomStart) / (1 - counterBloomStart)));
  if (bloom === 0) return outline;

  const counter = getPCounter(width);
  return outline + createPillPath(counter.x, counter.y, counter.width * bloom, counter.height * bloom);
}

function createUPath(carve, width) {
  const left = lerp(width / 2, cup.stroke, carve);
  const right = lerp(width / 2, width - cup.stroke, carve);
  const floor = lerp(0, wordmarkHeight - cup.stroke, carve);
  const inner = lerp(0, cup.innerRadius, carve);
  const outer = lerp(0, cup.radius, carve);

  return [
    `M0 0H${left}`,
    `V${floor - inner}`,
    `A${inner} ${inner} 0 0 0 ${left + inner} ${floor}`,
    `H${right - inner}`,
    `A${inner} ${inner} 0 0 0 ${right} ${floor - inner}`,
    `V0H${width}`,
    `V${wordmarkHeight - outer}`,
    `A${outer} ${outer} 0 0 1 ${width - outer} ${wordmarkHeight}`,
    `H${outer}`,
    `A${outer} ${outer} 0 0 1 0 ${wordmarkHeight - outer}`,
    'Z',
  ].join('');
}

function createLPath(carve, width) {
  const stemEdge = lerp(width, foot.stroke, carve);
  const floor = lerp(0, wordmarkHeight - foot.stroke, carve);

  return `M0 0H${stemEdge}V${floor}H${width}V${wordmarkHeight}H0Z`;
}

const glyphPaths = {
  P: createPPath,
  U: createUPath,
  L: createLPath,
};

function getPCounter(width) {
  return {
    x: width / 2,
    y: bowl.depth / 2,
    width: width - bowl.stroke * 2,
    height: bowl.depth - bowl.stroke * 2,
  };
}

export function createGlyphPath(glyph, carve, width) {
  return glyphPaths[glyph](carve, width);
}

export function createWordmarkLayout() {
  const totalWidth = letters.reduce((sum, letter) => sum + letter.width, 0)
    + letterGap * (letters.length - 1);

  let cursor = -totalWidth / 2;
  const placedLetters = letters.map((letter) => {
    const centre = cursor + letter.width / 2;
    cursor += letter.width + letterGap;
    return { ...letter, centre };
  });

  const counter = getPCounter(letters[0].width);

  return {
    totalWidth,
    letters: placedLetters,
    counter: {
      x: 0,
      y: counter.y - wordmarkHeight / 2,
      width: counter.width,
      height: counter.height,
    },
  };
}
