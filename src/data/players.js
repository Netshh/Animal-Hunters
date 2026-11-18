// Mock players for testing the leaderboard. Replace with real data from the backend later.
import { DROPS } from './drops.js';

const NAMES = ['Budi Pemburu', 'Sari Kucing', 'Agus Jakarta', 'Dewi Hewan', 'Rizky Hunter', 'Putri Jelajah',
  'Bayu88', 'Citra Rimba', 'Fajar Kilat', 'Nadia Safari', 'Eko Petualang'];
const COUNTS = [7, 6, 5, 4, 4, 3, 2, 2, 1, 1, 1];

let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pool = [...DROPS];
for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }

export const PLAYERS = NAMES.map((name, i) => ({
  id: `p${i}`, name,
  claims: pool.splice(0, COUNTS[i]).map((d) => ({ dropId: d.id, daysAgo: Math.floor(rnd() * Math.min(d.daysAgo, 90)) })),
}));
