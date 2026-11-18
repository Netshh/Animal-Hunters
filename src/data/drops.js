// Drop positions and names (public). The secret QR tokens are NOT here; they live in Supabase (drop_tokens).
export const CENTER = [106.8456, -6.2088]; // Jakarta [lng, lat]
// Rarity tiers, lowest to highest. Points per animal are defined here and nowhere else.
export const RARITIES = {
  umum: { label: 'Umum', points: 10 }, jarang: { label: 'Jarang', points: 15 }, langka: { label: 'Langka', points: 25 },
  epik: { label: 'Epik', points: 40 }, legendaris: { label: 'Legendaris', points: 50 }, mitos: { label: 'Mitos', points: 100 },
};
export const POINTS = Object.fromEntries(Object.entries(RARITIES).map(([k, v]) => [k, v.points]));
// key = lowercase letters only (2-20), also the sprite filename. n = filler drops on the map (default 6).
export const SERIES = [
  { key: 'fox', name: 'Rubah Usil', rarity: 'umum', desc: 'Licik tapi menggemaskan.' },
  { key: 'frog', name: 'Katak Cincin', rarity: 'umum', desc: 'Suka bersembunyi dekat selokan.' },
  { key: 'owl', name: 'Hantu Malam', rarity: 'langka', desc: 'Mengintai saat malam tiba.' },
  { key: 'penguin', name: 'Pinguin Saku', rarity: 'legendaris', desc: 'Tersesat jauh dari kutub.' },
  { key: 'panda', name: 'Panda Mungil', rarity: 'legendaris', desc: 'Sangat jarang terlihat di kota.' },
  { key: 'rabbit', name: 'Kelinci Lincah', rarity: 'umum', desc: 'Melompat lebih cepat dari ojek.' },
  { key: 'hedgehog', name: 'Landak Duri', rarity: 'langka', desc: 'Berduri, tapi baik hati.' },
  { key: 'turtle', name: 'Kura-kura Santai', rarity: 'umum', desc: 'Pelan, tapi pasti sampai.' },
  { key: 'sleepycat', name: 'Kucing Ngantuk', rarity: 'jarang', desc: 'Mengantuk, bahkan saat macet.', n: 3 },
  { key: 'lovepig', name: 'Babi Cinta', rarity: 'jarang', desc: 'Membawa cinta ke seluruh kota.', n: 3 },
  { key: 'partybear', name: 'Beruang Pesta', rarity: 'jarang', desc: 'Selalu datang paling awal ke pesta.', n: 3 },
  { key: 'ghostcat', name: 'Kucing Hantu', rarity: 'langka', desc: 'Muncul dan hilang sesuka hati.', n: 3 },
  { key: 'icewolf', name: 'Serigala Es', rarity: 'langka', desc: 'Dingin, bahkan di siang Jakarta.', n: 3 },
  { key: 'firehorse', name: 'Kuda Api', rarity: 'epik', desc: 'Melaju bersama api di tengah malam.', n: 3 },
  { key: 'thunderbull', name: 'Banteng Petir', rarity: 'epik', desc: 'Tiap langkahnya memercikkan petir.', n: 3 },
  { key: 'magicbunny', name: 'Kelinci Sihir', rarity: 'epik', desc: 'Mengeluarkan bintang dari topinya.', n: 3 },
  { key: 'goldlion', name: 'Singa Emas', rarity: 'legendaris', desc: 'Raja yang jarang menampakkan diri.', n: 3 },
  { key: 'firedragon', name: 'Naga Api', rarity: 'legendaris', desc: 'Napasnya bisa menggoreng pisang.', n: 3 },
  { key: 'rainbowunicorn', name: 'Unicorn Pelangi', rarity: 'mitos', desc: 'Katanya hanya muncul sehabis hujan.', n: 3 },
  { key: 'galaxywhale', name: 'Paus Galaksi', rarity: 'mitos', desc: 'Berenang di antara bintang.', n: 3 },
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
  for (let n = 1; n <= (s.n ?? 6); n++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.06;
    r(); // old token draw, kept so positions stay identical. Tokens now live only in the database.
    DROPS.push({
      id: `${s.key}-${n}`, series: s.key, name: s.name, edition: n,
      lng: CENTER[0] + Math.cos(a) * d, lat: CENTER[1] + Math.sin(a) * d,
      daysAgo: 1 + Math.floor(r() * 400),
    });
  }
}
DROPS.sort((a, b) => a.daysAgo - b.daysAgo);
