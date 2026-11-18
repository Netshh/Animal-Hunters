// Usage: npm run qr -- http://192.168.1.20:5173   (use your PC's LAN IP so phones can reach it)
import QRCode from 'qrcode';
import { mkdirSync, writeFileSync } from 'node:fs';
import { DROPS } from '../src/data/drops.js';

const base = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
mkdirSync('qr-codes', { recursive: true });
let links = '';
for (const d of DROPS) {
  const url = `${base}/?claim=${d.token}`;
  await QRCode.toFile(`qr-codes/${d.id}.png`, url, { width: 480, margin: 2 });
  links += `${d.id}\t${url}\n`;
}
writeFileSync('qr-codes/links.txt', links);
console.log(`Wrote ${DROPS.length} QR codes to qr-codes/`);
