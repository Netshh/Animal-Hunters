import { ago, esc } from '../utils/store.js';
const el = document.getElementById('panel');

export function showPanel(d, claimed, { canClaim = false, signedIn = false, onClaim } = {}) {
  const c = claimed[d.id];
  const status = c
    ? `Ditangkap oleh <b>${esc(c.by)}</b> pada ${new Date(c.at).toLocaleDateString('id-ID')}`
    : canClaim ? (signedIn ? 'Kamu menemukannya! Klaim sekarang sebelum orang lain.' : 'Kamu menemukannya! Masuk dengan Google dulu agar hewan ini tersimpan di akunmu.') : 'Masih tersembunyi. Pindai kode QR-nya untuk mengklaim.';
  el.innerHTML = `
    <button class="x" aria-label="Tutup">×</button>
    <img src="/assets/animals/${d.series}.png" alt="${d.name}">
    <div><h2>${d.name}</h2><p class="ed">#${d.edition}</p>
    <p class="meta">Disebar ${ago(d.daysAgo)}</p><p class="meta">${status}</p>
    ${canClaim && !c ? `<button class="btn claim">${signedIn ? 'Klaim sekarang' : 'Masuk dengan Google & klaim'}</button>` : ''}</div>`;
  el.classList.remove('hidden');
  el.querySelector('.x').onclick = hidePanel;
  el.querySelector('.claim')?.addEventListener('click', onClaim);
}
export const hidePanel = () => el.classList.add('hidden');
