const express = require('express');
const path = require('path');
const Chance = require('chance');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Helper to return localized Chance instance based on region
function getChanceInstance(region, seed) {
  const chance = new Chance(seed);

  // Customizing data generation for each region
  switch (region.toLowerCase()) {
    case 'french':
      chance.mixin({
        localizedName: () => {
          const firstName = chance.first({ nationality: 'fr' });
          const lastName = chance.last({ nationality: 'fr' });
          return `${firstName} ${lastName}`;
        },
        localizedPublisher: () => `${chance.company()} Éditions`,
        localizedTitle: () => {
          const adjectives = ['Épique', 'Mystérieux', 'Inoubliable', 'Sombre', 'Magique'];
          const nouns = ['Voyage', 'Amour', 'Histoire', 'Secret', 'Aventure'];
          const structures = [
            () => `${chance.pickone(adjectives)} ${chance.pickone(nouns)}`,
            () => `Le ${chance.pickone(adjectives)} ${chance.pickone(nouns)}`,
            () => `Les ${chance.pickone(adjectives)} ${chance.pickone(nouns)}`,
            () => `${chance.pickone(adjectives)} ${chance.pickone(nouns)} de ${chance.pickone(nouns)}`,
          ];
          return chance.pickone(structures)();
        },
      });
      break;

    default:
      chance.mixin({
        localizedName: () => `${chance.first()} ${chance.last()}`,
        localizedPublisher: () => chance.company(),
        localizedTitle: () => {
          const adjectives = ['Epic', 'Mysterious', 'Unforgettable', 'Dark', 'Magical'];
          const nouns = ['Journey', 'Love', 'Story', 'Secret', 'Adventure'];
          const structures = [
            () => `${chance.pickone(adjectives)} ${chance.pickone(nouns)}`,
            () => `${chance.pickone(adjectives)} ${chance.pickone(nouns)} of ${chance.pickone(nouns)}`,
            () => `${chance.pickone(adjectives)} ${chance.pickone(nouns)} in the ${chance.pickone(nouns)}`,
            () => `${chance.pickone(adjectives)} ${chance.pickone(nouns)} by the ${chance.pickone(nouns)}`,
          ];
          return chance.pickone(structures)();
        },
      });
      break;
  }

  return chance;
}

// Generate reviews
function generateReviews(chance) {
  return Array.from({ length: 5 }).map(() => ({
    reviewer: `${chance.first()} ${chance.last()}`,
    review: chance.sentence({ words: chance.integer({ min: 5, max: 15 }) }),
  }));
}

// Generate book data
function generateBooks(region, limit, seed) {
  const chance = getChanceInstance(region, seed);

  return Array.from({ length: limit }).map(() => ({
    isbn: `978-${chance.integer({ min: 1, max: 9 })}-${chance.integer({ min: 100, max: 999 })}-${chance.integer({ min: 100, max: 999 })}-${chance.integer({ min: 1, max: 9 })}`,
    title: chance.localizedTitle(),
    authors: `${chance.localizedName()} & ${chance.localizedName()}`,
    publisher: chance.localizedPublisher(),
    year: chance.year({ min: 1900, max: 2023 }),
    cover: `https://picsum.photos/100/150?random=${chance.integer({ min: 1, max: 1000 })}`,
    likes: chance.floating({ min: 1, max: 5, fixed: 1 }),
    reviews: Array.from({ length: 5 }).map(() => ({
      reviewer: `${chance.first()} ${chance.last()}`,
      review: chance.sentence({ words: chance.integer({ min: 5, max: 15 }) }),
    })),
  }));
}


// API route to fetch books for a given region
app.get('/api/books', (req, res) => {
  const region = req.query.region || 'english';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const seed = req.query.seed || 'default';

  const books = generateBooks(region, page * limit, seed);
  res.json(books.slice((page - 1) * limit, page * limit));
});

// Fallback to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
