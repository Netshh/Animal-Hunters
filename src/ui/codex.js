// "Hewan" tab: an index book of every animal type, its rarity and how many points it is worth.
import { SERIES, RARITIES } from '../data/drops.js';
import { esc } from '../utils/store.js';

const ORDER = Object.keys(RARITIES).reverse(); // rarest first
const el = document.createElement('aside');
el.id = 'codex'; el.className = 'card hidden'; el.setAttribute('aria-live', 'polite');
document.body.append(el);

let data = { drops: [], claims: {}, meId: null }, filter = 'all';
export function setCodexData(d) { data = d; if (!el.classList.contains('hidden')) render(); }

function render() {
  const total = {}, caught = {}, mine = {};
  for (const d of data.drops) {
    total[d.series] = (total[d.series] || 0) + 1;
    const c = data.claims[d.id];
    if (c) { caught[d.series] = (caught[d.series] || 0) + 1; if (data.meId && c.byId === data.meId) mine[d.series] = (mine[d.series] || 0) + 1; }
  }
  const owned = SERIES.filter((s) => mine[s.key]).length, pct = Math.round((owned / SERIES.length) * 100);
  const card = (s) => `<article class="cx${data.meId && !mine[s.key] ? ' nope' : ''}" data-r="${s.rarity}">
      ${mine[s.key] ? `<span class="cx-own">✓ ×${mine[s.key]}</span>` : ''}
      <img src="/assets/animals/${s.key}.png" alt="${esc(s.name)}"><h4>${esc(s.name)}</h4>
      <span class="rar" data-r="${s.rarity}">${RARITIES[s.rarity].label}</span>
      <b class="cx-pts">+${RARITIES[s.rarity].points} poin</b>
      <small>${esc(s.desc || '')}</small>
      <small class="cx-st">Tersebar ${total[s.key] || 0} · Ditangkap ${caught[s.key] || 0}</small></article>`;
  const groups = ORDER.filter((r) => filter === 'all' || filter === r).map((r) => {
    const list = SERIES.filter((s) => s.rarity === r);
    return list.length ? `<h4 class="cx-h"><span class="rar" data-r="${r}">${RARITIES[r].label}</span><span>${RARITIES[r].points} poin per hewan</span></h4>
      <div class="cx-grid">${list.map(card).join('')}</div>` : '';
  }).join('');
  el.innerHTML = `
    <div class="lb-head"><h2>Buku Hewan</h2><button class="icon-btn" data-act="close" aria-label="Tutup">×</button></div>
    <p class="lb-sub">Semua jenis hewan yang bisa kamu temukan. Makin langka, makin tinggi poinnya.</p>
    ${data.meId ? `<div class="cx-prog"><span>Koleksimu: <b>${owned}/${SERIES.length}</b> jenis</span><div class="bar"><i style="width:${pct}%"></i></div></div>`
      : '<div class="lb-me">Masuk dengan Google untuk melacak koleksimu di buku ini.</div>'}
    <div class="chips" role="tablist"><button class="chip ${filter === 'all' ? 'on' : ''}" data-act="filter" data-v="all">Semua</button>
      ${ORDER.map((r) => `<button class="chip ${filter === r ? 'on' : ''}" data-act="filter" data-v="${r}">${RARITIES[r].label} · ${RARITIES[r].points}</button>`).join('')}</div>
    ${groups}`;
}

export function initCodex() {
  const links = [...document.querySelectorAll('.nav nav a[data-view]')];
  links.forEach((a) => a.addEventListener('click', () => {
    const on = a.dataset.view === 'index';
    el.classList.toggle('hidden', !on);
    if (on) { document.body.classList.add('board-open'); filter = 'all'; render(); el.scrollTop = 0; }
  }));
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    if (t.dataset.act === 'close') links.find((a) => a.dataset.view === 'map')?.click();
    else if (t.dataset.act === 'filter') { filter = t.dataset.v; const top = el.scrollTop; render(); el.scrollTop = top; }
  });
}
