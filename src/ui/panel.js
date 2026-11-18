import { ago } from '../utils/store.js';
const el = document.getElementById('panel');

export function showPanel(d, claimed, { canClaim = false, onClaim } = {}) {
  const c = claimed[d.id];
  const status = c
    ? `Claimed by <b>${c.by}</b> on ${new Date(c.at).toLocaleDateString()}`
    : canClaim ? 'You found it! It\'s yours if you claim it now.' : 'Still hidden. Scan its QR code to claim it.';
  el.innerHTML = `
    <button class="x" aria-label="Close">×</button>
    <img src="/assets/animals/${d.series}.png" alt="${d.name}">
    <div><h2>${d.name}</h2><p class="ed">#${d.edition}</p>
    <p class="meta">Dropped ${ago(d.daysAgo)}</p><p class="meta">${status}</p>
    ${canClaim && !c ? '<button class="btn claim">Claim it</button>' : ''}</div>`;
  el.classList.remove('hidden');
  el.querySelector('.x').onclick = hidePanel;
  el.querySelector('.claim')?.addEventListener('click', onClaim);
}
export const hidePanel = () => el.classList.add('hidden');
