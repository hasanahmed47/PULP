const asset = (filename) => `${import.meta.env.BASE_URL}media/${filename}`;

export const media = {
  canDetails: {
    top: asset('can-top.webp'),
    bottom: asset('can-bottom.webp'),
  },

  can: {
    'blood-orange': asset('blood-orange-can.webp'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-can.webp'),
    blueberry: asset('blueberry-can.webp'),
    'lime-basil': asset('lime-basil-can.webp'),
  },

  wrap: {
    'blood-orange': asset('blood-orange-wrap.webp'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-wrap.webp'),
    'blueberry': asset('blueberry-wrap.webp'),
    'lime-basil': asset('lime-basil-wrap.webp'),
  },

  fruit: {
    'blood-orange': asset('blood-orange-fruit.webp'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-fruit.webp'),
    blueberry: asset('blueberry-fruit.webp'),
    'lime-basil': asset('lime-basil-fruit.webp'),
  },

  cutaways: {
    'blood-orange': asset('blood-orange-cutaway.webp'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-cutaway.webp'),
    blueberry: asset('blueberry-cutaway.webp'),
    'lime-basil': asset('lime-basil-cutaway.webp'),
  },

  poster: asset('pour-poster.webp'),

  film: asset('pulp-film.mp4'),
  firstTileDesktopFilm: asset('1st tile laptop.mp4'),
  firstTileDesktopPoster: asset('first-tile-laptop-poster.webp'),
  firstTileMobileFilm: asset('1st tile mobile.mp4'),
  firstTileMobilePoster: asset('first-tile-mobile-poster.webp'),
  lifestyleFilm: asset('footer-video.mp4'),
  lifestylePoster: asset('footer-poster.webp'),
};