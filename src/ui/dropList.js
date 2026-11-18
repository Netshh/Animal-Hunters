import { ago } from '../utils/store.js';
const el = document.getElementById('list');

export function renderList(drops, claimed, onPick) {
  el.innerHTML = drops.slice(0, 5).map((d, i) => `
    <button class="row" data-id="${d.id}">
      <img src="/assets/animals/${d.series}.png" alt="">
      <span>${i === 0 ? '<em>Last drop</em> ' : ''}<small>${claimed[d.id] ? 'Claimed' : 'Dropped ' + ago(d.daysAgo)}</small>
      <strong>${d.name} #${d.edition}</strong></span>
    </button>`).join('');
  el.querySelectorAll('.row').forEach((b) => (b.onclick = () => onPick(drops.find((d) => d.id === b.dataset.id))));
}
