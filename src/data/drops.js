// Mock data. Replace with an API call once the backend exists.
export const CENTER = [106.8456, -6.2088]; // Jakarta [lng, lat]
export const SERIES = [
  { key: 'fox', name: 'Foxy Throwie' }, { key: 'frog', name: 'Frog Ring' },
  { key: 'owl', name: 'Night Owl' }, { key: 'penguin', name: 'Pocket Penguin' },
  { key: 'panda', name: 'Panda Patch' }, { key: 'rabbit', name: 'Rabbit Toggle' },
  { key: 'hedgehog', name: 'Spiky Pin' }, { key: 'turtle', name: 'Slow Turtle' },
];

// Seeded RNG so ids, tokens and positions are identical on every load.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(42);
export const DROPS = [];
for (const s of SERIES) {
  for (let n = 1; n <= 6; n++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.06;
    DROPS.push({
      id: `${s.key}-${n}`, series: s.key, name: s.name, edition: n,
      token: Math.floor(r() * 36 ** 6).toString(36).padStart(6, '0'),
      lng: CENTER[0] + Math.cos(a) * d, lat: CENTER[1] + Math.sin(a) * d,
      daysAgo: 1 + Math.floor(r() * 400),
    });
  }
}
DROPS.sort((a, b) => a.daysAgo - b.daysAgo);
