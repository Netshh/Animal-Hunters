// Usage: npm run qr -- https://pemburu-hewan.vercel.app
// Creates a random SECRET token per drop, then writes (all inside qr-codes/, which is git-ignored):
//   seed.sql   -> paste into Supabase SQL Editor and Run (stores drops + tokens)
//   *.png      -> one QR code per drop, linking to <site>/?d=<drop id>&claim=<token>
//   links.txt  -> the same links as text, for desktop testing
// Re-running makes NEW tokens, which would break QR codes you already printed, so it refuses unless you pass --force.
import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { DROPS } from '../src/data/drops.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const base = (args.find((a) => !a.startsWith('--')) || 'http://localhost:5173').replace(/\/$/, '');

if (existsSync('qr-codes/seed.sql') && !force) {
  console.error('qr-codes/seed.sql already exists. Re-running creates NEW tokens and invalidates printed QR codes.\nUse --force only if you really want that.');
  process.exit(1);
}

mkdirSync('qr-codes', { recursive: true });
const token = () => randomBytes(10).toString('hex'); // 80 bits, unguessable
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const rows = DROPS.map((d) => ({ ...d, secret: token() }));

const sql = [
  'insert into drops (id, series, edition, lng, lat) values',
  rows.map((d) => `  (${q(d.id)}, ${q(d.series)}, ${d.edition}, ${d.lng}, ${d.lat})`).join(',\n'),
  'on conflict (id) do nothing;',
  '',
  'insert into drop_tokens (drop_id, token) values',
  rows.map((d) => `  (${q(d.id)}, ${q(d.secret)})`).join(',\n'),
  'on conflict (drop_id) do update set token = excluded.token;',
  '',
].join('\n');
writeFileSync('qr-codes/seed.sql', sql);

let links = '';
for (const d of rows) {
  const url = `${base}/?d=${encodeURIComponent(d.id)}&claim=${d.secret}`;
  await QRCode.toFile(`qr-codes/${d.id}.png`, url, { width: 480, margin: 2 });
  links += `${d.id}\t${url}\n`;
}
writeFileSync('qr-codes/links.txt', links);
console.log(`Wrote ${rows.length} QR codes + seed.sql to qr-codes/\nNext: paste qr-codes/seed.sql into the Supabase SQL Editor and Run it. Never commit qr-codes/.`);
