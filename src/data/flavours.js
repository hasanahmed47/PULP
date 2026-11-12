import { media } from './media';

export const flavours = [
  {
    id: 'blood-orange',
    name: 'Blood Orange',
    lines: ['Blood', 'Orange'],
    description: 'Bold, bittersweet citrus.',
    colour: '#ED252A',
    printBrightness: 0.3,
  },
  {
    id: 'passionfruit-yuzu',
    name: 'Passionfruit Yuzu',
    lines: ['Passionfruit', 'Yuzu'],
    description: 'Tropical fruit. Tangy yuzu.',
    colour: '#FFD52A',
    printBrightness: 0.3,
  },
  {
    id: 'blueberry',
    name: 'Blueberry',
    lines: ['Blueberry'],
    description: 'Bright, juicy blueberry.',
    colour: '#2257F5',
    printBrightness: 0.3,
  },
  {
    id: 'lime-basil',
    name: 'Lime Basil',
    lines: ['Lime', 'Basil'],
    description: 'Zesty lime. Fresh basil.',
    colour: '#23B447',
    printBrightness: 0.3,
  },
].map((flavour) => ({
  ...flavour,
  image: media.can[flavour.id],
  texture: media.wrap[flavour.id],
  fruit: media.fruit[flavour.id],
  interior: media.cutaways[flavour.id],
}));
