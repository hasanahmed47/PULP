const asset = (filename) => `${import.meta.env.BASE_URL}media/${filename}`;

export const media = {
  canDetails: {
    top: asset('can-top.webp'),
    bottom: asset('can-bottom.webp'),
  },
  can: {
    'blood-orange': asset('blood-orange-can.png'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-can.png'),
    blueberry: asset('blueberry-can.png'),
    'lime-basil': asset('lime-basil-can.png'),
  },
  wrap: {
    'blood-orange': asset('blood-orange-wrap.png'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-wrap.png'),
    'blueberry': asset('blueberry-wrap.png'),
    'lime-basil': asset('lime-basil-wrap.png'),
  },
  fruit: {
    'blood-orange': asset('blood-orange-fruit.png'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-fruit.png'),
    blueberry: asset('blueberry-fruit.png'),
    'lime-basil': asset('lime-basil-fruit.png'),
  },
  cutaways: {
    'blood-orange': asset('blood-orange-cutaway.png'),
    'passionfruit-yuzu': asset('passionfruit-yuzu-cutaway.png'),
    blueberry: asset('blueberry-cutaway.png'),
    'lime-basil': asset('lime-basil-cutaway.png'),
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
