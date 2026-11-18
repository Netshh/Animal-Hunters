import { DROPS, SERIES, POINTS } from '../data/drops.js';
import { ago, esc } from '../utils/store.js';

const el = document.getElementById('board');
const links = [...document.querySelectorAll('.nav nav a[data-view]')];
const seriesOf = Object.fromEntries(SERIES.map((s) => [s.key, s]));
const dropOf = Object.fromEntries(DROPS.map((d) => [d.id, d]));
const PERIODS = [{ days: 7, label: '7 hari' }, { days: 30, label: '30 hari' }, { days: Infinity, label: 'Semua' }];
const RARITY = { umum: 'Umum', langka: 'Langka', legendaris: 'Legendaris' };
let period = 2, view = null; // view = id of the player being inspected

const avatar = (n, big = '') =>
  `<span class="av ${big}" style="background:hsl(${[...n].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360} 55% 42%)">${esc((n.trim()[0] || '?').toUpperCase())}</span>`;
const seriesOfClaim = (c) => seriesOf[dropOf[c.dropId].series];
const points = (claims) => claims.reduce((a, c) => a + POINTS[seriesOfClaim(c).rarity], 0);

// Real players from Supabase (set by main.js via setBoardData).
let data = { players: [], meId: null };
export const setBoardData = (d) => { data = d; };
function everyone() {
  return data.players.map((p) => ({ ...p, claims: [...p.claims], me: p.id === data.meId }));
}

function ranked() {
  const max = PERIODS[period].days;
  return everyone()
    .map((p) => { const cl = p.claims.filter((c) => c.daysAgo <= max); return { ...p, count: cl.length, pts: points(cl) }; })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.pts - a.pts || b.count - a.count || a.name.localeCompare(b.name))
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

function renderList() {
  const rows = ranked(), mine = rows.find((p) => p.me), me = data.meId;
  const medal = (r) => ['🥇', '🥈', '🥉'][r - 1] || r;
  el.innerHTML = `
    <div class="lb-head"><h2>Papan Peringkat</h2><button class="icon-btn" data-act="close" aria-label="Tutup">×</button></div>
    <p class="lb-sub">Siapa paling banyak menemukan hewan? Ketuk sebuah nama untuk melihat koleksinya.</p>
    <div class="tabs" role="tablist">${PERIODS.map((p, i) =>
      `<button role="tab" class="${i === period ? 'on' : ''}" data-act="period" data-v="${i}">${p.label}</button>`).join('')}</div>
    ${rows.length ? `<ol class="lb-list">${rows.map((p) => `<li><button class="lb-row ${p.me ? 'me' : ''}" data-act="player" data-id="${p.id}">
        <span class="rank">${medal(p.rank)}</span>${avatar(p.name)}
        <span class="who"><strong>${esc(p.name)}${p.me ? '<span class="you">Kamu</span>' : ''}</strong><small>${p.count} hewan</small></span>
        <span class="pts">${p.pts}<small>poin</small></span><span class="chev">›</span></button></li>`).join('')}</ol>`
      : '<p class="empty">Belum ada yang menemukan hewan di periode ini.</p>'}
    <div class="lb-me">${mine ? `Posisimu: <b>#${mine.rank}</b> dengan ${mine.count} hewan (${mine.pts} poin).`
      : me ? 'Kamu belum menemukan hewan di periode ini. Pindai kode QR untuk masuk papan peringkat!'
      : 'Tekan <b>Masuk</b> lalu pindai kode QR hewan untuk muncul di papan peringkat.'}</div>
    <p class="lb-note">Poin: Umum ${POINTS.umum} · Langka ${POINTS.langka} · Legendaris ${POINTS.legendaris}</p>`;
}

function renderDetail() {
  const p = everyone().find((x) => x.id === view);
  if (!p) { view = null; return renderList(); }
  const row = ranked().find((x) => x.id === view);
  const inv = {};
  p.claims.forEach((c) => { const k = seriesOfClaim(c).key; inv[k] = (inv[k] || 0) + 1; });
  const recent = [...p.claims].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 4);
  el.innerHTML = `
    <button class="back" data-act="back">‹ Kembali ke peringkat</button>
    <div class="pf">${avatar(p.name, 'big')}<div><h3>${esc(p.name)}${p.me ? '<span class="you">Kamu</span>' : ''}</h3>
      <small class="muted">${row ? `Peringkat #${row.rank} · ${PERIODS[period].label.toLowerCase()}` : 'Belum masuk peringkat periode ini'}</small></div></div>
    <div class="stats"><div><b>${p.claims.length}</b><span>Hewan</span></div><div><b>${points(p.claims)}</b><span>Poin</span></div>
      <div><b>${Object.keys(inv).length}/${SERIES.length}</b><span>Jenis</span></div></div>
    <h4 class="lb-sec">Koleksi hewan</h4>
    <div class="pets">${SERIES.map((s) => inv[s.key]
      ? `<div class="pet ${s.rarity}" title="${s.name}"><img src="/assets/animals/${s.key}.png" alt="${s.name}"><b>×${inv[s.key]}</b><span>${s.name}</span><i>${RARITY[s.rarity]}</i></div>`
      : `<div class="pet locked" title="Belum ditemukan"><img src="/assets/animals/${s.key}.png" alt=""><span>???</span></div>`).join('')}</div>
    <h4 class="lb-sec">Tangkapan terbaru</h4>
    <ul class="recent">${recent.map((c) => `<li>${seriesOfClaim(c).name} #${dropOf[c.dropId].edition}<small>${ago(c.daysAgo)}</small></li>`).join('') || '<li>Belum ada tangkapan.</li>'}</ul>`;
}

function render() { (view ? renderDetail : renderList)(); el.scrollTop = 0; }

function show(v) {
  const open = v === 'board';
  links.forEach((a) => a.classList.toggle('on', a.dataset.view === v));
  el.classList.toggle('hidden', !open);
  document.body.classList.toggle('board-open', open);
  if (open) { view = null; render(); }
}

export const refreshBoard = () => { if (!el.classList.contains('hidden')) { const t = el.scrollTop; (view ? renderDetail : renderList)(); el.scrollTop = t; } };

export function initBoard() {
  links.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); show(a.dataset.view); }));
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const a = t.dataset.act;
    if (a === 'close') show('map');
    else if (a === 'back') { view = null; render(); }
    else if (a === 'period') { period = +t.dataset.v; render(); }
    else if (a === 'player') { view = t.dataset.id; render(); }
  });
}
