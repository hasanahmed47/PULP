import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/media');
await fs.mkdir(path.join(output, 'vectors'), { recursive: true });
const brandLettering = await fs.readFile(path.join(root, 'scripts/pulp-lettering.svg'), 'utf8');
const wordmark = (x, y, width, height, colour) => `<g fill="${colour}">${brandLettering.replace('<svg ', `<svg x="${x}" y="${y}" width="${width}" height="${height}" `)}</g>`;

const flavours = [
  ['blood-orange', 'BLOOD ORANGE', '#ED252A', '#FFF5D9'],
  ['passionfruit-yuzu', 'PASSIONFRUIT YUZU', '#FFD52A', '#171719'],
  ['blueberry', 'BLUEBERRY', '#2257F5', '#FFF5D9'],
  ['lime-basil', 'LIME BASIL', '#23B447', '#FFF5D9'],
];

const interiorColours = {
  'passionfruit-yuzu': { liquid: '#efbd4b', surface: '#ffe49a', pulp: '#fff2bf' },
  blueberry: { liquid: '#a993e2', surface: '#c6b5ed', pulp: '#eee4ff' },
  'lime-basil': { liquid: '#9cc85c', surface: '#c9e69c', pulp: '#eff6bb' },
};

const svg = (width, height, contents) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${contents}</svg>`;

function citrus(x, y, radius, lime = false, id = 'citrus') {
  const rind = lime ? '#4c9e20' : '#fa7e19';
  const flesh = lime ? '#c5da55' : '#cc3524';
  const highlight = lime ? '#e7efa3' : '#ff8750';
  let segments = '';
  for (let i = 0; i < 10; i++) {
    const start = i * Math.PI / 5 + 0.035;
    const end = (i + 1) * Math.PI / 5 - 0.035;
    const r = radius * 0.79;
    const a = [Math.cos(start) * r, Math.sin(start) * r];
    const b = [Math.cos(end) * r, Math.sin(end) * r];
    segments += `<path d="M0 0 L${a[0]} ${a[1]} A${r} ${r} 0 0 1 ${b[0]} ${b[1]}Z" fill="${i % 3 === 0 ? highlight : flesh}" stroke="#fff1bc" stroke-width="${radius * 0.016}"/>`;
    for (let j = 0; j < 9; j++) {
      const angle = start + (end - start) * (0.18 + ((j * 37) % 61) / 100);
      const length = r * (0.25 + j * 0.075);
      segments += `<ellipse cx="${Math.cos(angle) * length}" cy="${Math.sin(angle) * length}" rx="${radius * 0.012}" ry="${radius * 0.044}" transform="rotate(${angle * 180 / Math.PI - 90} ${Math.cos(angle) * length} ${Math.sin(angle) * length})" fill="${highlight}" opacity=".6"/>`;
    }
  }
  return `<g transform="translate(${x} ${y})"><defs><radialGradient id="${id}"><stop stop-color="white" stop-opacity="0"/><stop offset=".76" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="#401500" stop-opacity=".16"/></radialGradient></defs><circle r="${radius}" fill="${rind}"/><circle r="${radius * 0.91}" fill="#fff0c4"/><circle r="${radius * 0.82}" fill="${flesh}"/>${segments}<circle r="${radius * 0.06}" fill="#fff1bc"/><circle r="${radius}" fill="url(#${id})"/></g>`;
}

function berry(x, y, r, id) {
  return `<g transform="translate(${x} ${y})"><defs><radialGradient id="${id}" cx="30%" cy="24%"><stop stop-color="#94a2da"/><stop offset=".48" stop-color="#505ea2"/><stop offset="1" stop-color="#1c2357"/></radialGradient></defs><circle r="${r}" fill="url(#${id})"/><path d="M-13 -22 L-7 -32 3 -25 14 -29 13 -17 23 -11 11 -6 6 6 -3 -4 -16 -2 -12 -12 -22 -16Z" transform="translate(${r * 0.12} ${-r * 0.38}) scale(${r / 65})" fill="#252b58" opacity=".85"/><ellipse cx="${-r * 0.33}" cy="${-r * 0.35}" rx="${r * 0.18}" ry="${r * 0.12}" fill="white" opacity=".16"/></g>`;
}

function leaf(x, y, scale = 1, rotation = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})"><path d="M0 0 Q-95 -40 -47 -150 Q48 -111 0 0Z" fill="#358443"/><path d="M0 0 L-47 -150 M-12 -40 L-48 -57 M-23 -74 L-54 -93 M-12 -40 L12 -82" fill="none" stroke="#aad17a" stroke-width="3"/></g>`;
}

function passion(x, y, r) {
  let seeds = '';
  for (let i = 0; i < 42; i++) {
    const theta = i * 2.399;
    const distance = Math.sqrt(i / 42) * r * 0.69;
    const px = Math.cos(theta) * distance;
    const py = Math.sin(theta) * distance;
    seeds += `<ellipse cx="${px}" cy="${py}" rx="${r * 0.11}" ry="${r * 0.085}" fill="#f9bf29" stroke="#ffd95e" stroke-width="3"/><ellipse cx="${px}" cy="${py}" rx="${r * 0.055}" ry="${r * 0.037}" fill="#382827" transform="rotate(${i * 29} ${px} ${py})"/>`;
  }
  return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#763e61"/><circle r="${r * 0.91}" fill="#fff0ca"/><circle r="${r * 0.78}" fill="#f2ab1b"/>${seeds}</g>`;
}

function fruitGroup(slug) {
  if (slug === 'blood-orange') return `<g transform="rotate(-18 250 250)">${citrus(240, 245, 186, false, 'orange')}${leaf(395, 130, .65, 65)}</g>`;
  if (slug === 'lime-basil') return `${leaf(310, 270, 1.1, 40)}${leaf(275, 240, .95, -35)}${citrus(255, 300, 163, true, 'lime')}`;
  if (slug === 'blueberry') return `${leaf(250, 180, .7, 100)}${berry(300, 172, 88, 'b1')}${berry(178, 245, 94, 'b2')}${berry(312, 316, 105, 'b3')}${berry(135, 354, 63, 'b4')}`;
  return `<circle cx="335" cy="179" r="111" fill="#f5cf26"/>${leaf(360, 99, .55, 76)}${passion(214, 300, 145, 'passion')}${citrus(374, 354, 98, true, 'yuzu')}`;
}

const bodyPath = 'M157 78 Q151 100 140 136 L140 864 Q141 893 163 916 L437 916 Q459 893 460 864 L460 136 Q449 100 443 78Z';
const metalDefs = `<linearGradient id="metal"><stop stop-color="#777e83"/><stop offset=".2" stop-color="#f7fafb"/><stop offset=".42" stop-color="#c5cccf"/><stop offset=".68" stop-color="#fff"/><stop offset=".86" stop-color="#9ca3a8"/><stop offset="1" stop-color="#d4dadd"/></linearGradient><linearGradient id="shine"><stop stop-color="#000" stop-opacity=".28"/><stop offset=".12" stop-color="#fff" stop-opacity=".14"/><stop offset=".32" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".83" stop-color="#000" stop-opacity=".09"/><stop offset="1" stop-color="#000" stop-opacity=".33"/></linearGradient>`;
const rims = `<path d="M157 78 Q300 108 443 78 L441 65 Q300 42 159 65Z" fill="url(#metal)"/><ellipse cx="300" cy="66" rx="142" ry="25" fill="url(#metal)" stroke="#b2b9bd" stroke-width="3"/><ellipse cx="300" cy="66" rx="126" ry="18" fill="#d7dcdf" stroke="#858e95" stroke-width="2"/><ellipse cx="323" cy="69" rx="27" ry="10" fill="#717d84"/><rect x="272" y="48" width="60" height="19" rx="9" fill="url(#metal)" stroke="#8c969c" stroke-width="3"/><ellipse cx="291" cy="57" rx="11" ry="4" fill="#acb4b8"/><path d="M163 905 Q300 932 437 905 L436 921 Q300 949 164 921Z" fill="url(#metal)" stroke="#a7adb1" stroke-width="2"/>`;

function canContents(slug, name, colour, ink, interior = false) {
  let body;
  if (interior) {
    const palette = interiorColours[slug];
    body = `<rect x="140" y="75" width="320" height="850" fill="#edf6f6"/><rect x="140" y="458" width="320" height="470" fill="${palette.liquid}"/><path d="M140 455 Q220 420 300 454 T460 452V490H140Z" fill="${palette.surface}"/>`;
    for (let i = 0; i < 7; i++) {
      const x = 170 + (i % 3) * 77;
      const y = 210 + Math.floor(i / 3) * 122;
      body += `<rect x="${x}" y="${y}" width="106" height="105" rx="17" transform="rotate(${i % 2 ? 17 : -14} ${x + 53} ${y + 53})" fill="#fff" fill-opacity=".6" stroke="#bed5d6" stroke-width="4"/><path d="M${x + 15} ${y + 24}L${x + 77} ${y + 14}" stroke="white" stroke-width="8" opacity=".8"/>`;
    }
    body += `<g transform="translate(100 480) scale(.78)">${fruitGroup(slug)}</g>`;
    for (let i = 0; i < 45; i++) body += `<ellipse cx="${155 + (i * 97) % 286}" cy="${490 + (i * 71) % 398}" rx="3" ry="8" fill="${palette.pulp}" opacity=".8" transform="rotate(${i * 19} ${155 + (i * 97) % 286} ${490 + (i * 71) % 398})"/>`;
  } else {
    body = `<rect x="135" y="75" width="330" height="850" fill="${colour}"/>${wordmark(158, 246, 284, 123, ink)}<text x="300" y="412" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="700" font-size="${name.length > 13 ? 21 : 27}" fill="${ink}">${name}</text><g transform="translate(96 432) scale(.82)">${fruitGroup(slug)}</g>`;
  }
  let drops = '';
  for (let i = 0; i < 32; i++) {
    const x = 162 + (i * 113) % 273;
    const y = 147 + (i * 167) % 705;
    const r = 2 + i % 4;
    drops += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.4}" fill="white" fill-opacity=".18" stroke="white" stroke-opacity=".26" stroke-width=".7"/><circle cx="${x - r * .3}" cy="${y - r * .4}" r="${r * .3}" fill="white" opacity=".6"/>`;
  }
  return `<defs>${metalDefs}<clipPath id="body"><path d="${bodyPath}"/></clipPath></defs><g clip-path="url(#body)">${body}<path d="${bodyPath}" fill="url(#shine)"/>${drops}</g>${rims}`;
}

async function save(name, artwork, width) {
  await fs.writeFile(path.join(output, 'vectors', `${name}.svg`), artwork);
  await sharp(Buffer.from(artwork)).resize({ width }).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(output, `${name}.webp`));
}

const cutawaysOnly = process.argv.includes('--cutaways-only');

for (const flavour of flavours) {
  if (flavour[0] === 'blood-orange') continue;
  await save(`${flavour[0]}-cutaway`, svg(600, 1000, canContents(...flavour, true)), 900);
}

if (cutawaysOnly) {
  console.log('Created the three additional cutaway illustrations; existing artwork was preserved.');
  process.exit(0);
}

for (const [slug, name, colour, ink] of flavours) {
  await save(`${slug}-fruit`, svg(500, 500, fruitGroup(slug)), 680);
  if (slug === 'blood-orange') continue;
  await save(`${slug}-can`, svg(600, 1000, canContents(slug, name, colour, ink)), 900);
  const wrap = svg(2048, 1424, `<rect width="2048" height="1424" fill="${colour}"/>${wordmark(584, 140, 880, 350, ink)}<text x="1024" y="570" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="700" font-size="${name.length > 13 ? 55 : 70}" fill="${ink}">${name}</text><g transform="translate(624 610) scale(1.6)">${fruitGroup(slug)}</g><g opacity=".85" transform="translate(-100 990) scale(.8)">${fruitGroup(slug)}</g><g opacity=".85" transform="translate(1730 100) scale(.8)">${fruitGroup(slug)}</g>`);
  await save(`${slug}-wrap`, wrap, 2048);
}

const mascot = svg(700, 700, `<defs><linearGradient id="flesh" x2=".6" y2="1"><stop stop-color="#ffab35"/><stop offset="1" stop-color="#f56e23"/></linearGradient></defs><g stroke="#773b24" stroke-width="15" stroke-linecap="round" fill="none"><path d="M154 350Q79 335 65 278M543 350Q613 337 628 276M267 536L253 605 220 615M432 536L448 605 479 615"/></g><path d="M109 181Q350 285 591 181Q575 552 350 572Q125 552 109 181Z" fill="#f27b1e" stroke="#d45e1f" stroke-width="8"/><path d="M130 203Q350 298 570 203Q546 530 350 548Q154 530 130 203Z" fill="#fff0c8"/><path d="M150 226Q350 308 550 226Q522 507 350 525Q178 507 150 226Z" fill="url(#flesh)"/><g stroke="#ffd791" stroke-width="6" opacity=".8"><path d="M350 300L350 513M340 297L212 470M326 291L169 350M360 297L488 470M374 291L531 350"/></g><g fill="#fff9df" stroke="#713c2c" stroke-width="5"><ellipse cx="276" cy="334" rx="39" ry="49"/><ellipse cx="423" cy="334" rx="39" ry="49"/></g><path d="M300 417Q350 466 400 417Q350 492 300 417Z" fill="#723b2c"/><path d="M326 450Q350 434 374 450" fill="#f68776"/><g fill="#e65226" opacity=".4"><ellipse cx="228" cy="402" rx="30" ry="14"/><ellipse cx="474" cy="402" rx="30" ry="14"/></g>`);
await save('orange-mascot', mascot, 900);

await fs.writeFile(path.join(root, 'public/favicon.svg'), svg(80, 80, '<rect width="80" height="80" rx="19" fill="#2257F5"/><text x="40" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-size="65" font-weight="900" fill="#fff5d9">P</text>'));
console.log('Created three illustrated cans, wraps and cutaways, four fruit cutouts and mascot; supplied Blood Orange artwork and film poster were preserved.');
