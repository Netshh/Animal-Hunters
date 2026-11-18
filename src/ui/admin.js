// Developer-only mode: click the map to drop an animal, get a unique secret QR code to print.
// The buttons are hidden for normal users, but the REAL protection is on the server:
// create_drop / get_drop_token / delete_drop in Supabase all refuse anyone who is not in the admins table.
import maplibregl from 'maplibre-gl';
import '../styles/admin.css';
import { SERIES, RARITIES } from '../data/drops.js';
import { createDrop, getDropToken, deleteDrop, esc } from '../utils/store.js';

const nameOf = (key) => SERIES.find((s) => s.key === key)?.name || key;
const round = (n) => Math.round(n * 1e6) / 1e6;

// The QR must point at your live site, even when you create drops while testing on localhost.
const LS = 'th_site';
const DEFAULT_SITE = /^(localhost|127\.|192\.168\.)/.test(location.hostname) ? 'https://pemburu-hewan.vercel.app' : location.origin;
const readSite = () => { try { return localStorage.getItem(LS) || DEFAULT_SITE; } catch { return DEFAULT_SITE; } };
const saveSite = (v) => { try { localStorage.setItem(LS, v); } catch { /* storage blocked */ } };

// "-6.2088, 106.8456" (Google Maps order: latitude, longitude)
export function parseCoords(s) {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(s || '');
  if (!m) return null;
  const lat = +m[1], lng = +m[2];
  return Math.abs(lat) <= 85 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
const errText = (e) => /not admin/i.test(e?.message || '') ? 'Akun ini bukan admin.' : (e?.message || 'Terjadi kesalahan.');
async function makeQr(url) {
  const QR = (await import('qrcode')).default;
  return QR.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: 'M' });
}

export function initAdmin({ map, getDrops, getClaims, onChange }) {
  const btn = document.createElement('button');
  btn.className = 'dev hidden'; btn.textContent = 'Dev';
  document.querySelector('.nav').insertBefore(btn, document.getElementById('login'));
  const panel = document.createElement('aside'); panel.id = 'admin'; panel.className = 'card hidden';
  const sheet = document.createElement('div'); sheet.id = 'print-sheet';
  document.body.append(panel, sheet);

  let isAdmin = false, open = false, busy = false, showMock = false;
  let pin = null, pos = null, series = SERIES[0].key, site = readSite();
  let result = null, msg = '', msgErr = false;

  const say = (m, err = false) => { msg = m; msgErr = err; };

  function setPos(lng, lat, fly = false) {
    pos = { lng: round(lng), lat: round(lat) };
    if (!pin) {
      pin = new maplibregl.Marker({ color: '#e53935', draggable: true }).setLngLat([pos.lng, pos.lat]).addTo(map);
      pin.on('dragend', () => { const l = pin.getLngLat().wrap(); pos = { lng: round(l.lng), lat: round(l.lat) }; render(); });
    } else pin.setLngLat([pos.lng, pos.lat]);
    if (fly) map.flyTo({ center: [pos.lng, pos.lat], zoom: Math.max(map.getZoom(), 15), speed: 0.9 });
    render();
  }
  function clearPin() { pin?.remove(); pin = null; pos = null; }

  async function showResult(r) {
    const url = `${site}/?d=${encodeURIComponent(r.id)}&claim=${r.token}`;
    result = { ...r, url, dataUrl: await makeQr(url) };
  }

  async function run(fn) {
    busy = true; say(''); render();
    try { await fn(); } catch (e) { console.error(e); say(errText(e), true); }
    busy = false; render();
  }

  const actions = {
    close: () => setOpen(false),
    toggleMock: () => { showMock = !showMock; render(); },
    create: () => pos && run(async () => {
      const r = await createDrop(series, pos.lng, pos.lat);
      clearPin();
      await showResult({ id: r.id, label: `${nameOf(r.series)} #${r.edition}`, token: r.token });
      await onChange();
      say('Drop dibuat dan sudah muncul di peta. Cetak QR-nya lalu tempel di mainan.');
    }),
    qr: (id) => run(async () => {
      const d = getDrops().find((x) => x.id === id);
      const token = await getDropToken(id);
      if (!token) throw new Error('Token tidak ditemukan.');
      await showResult({ id, label: `${d?.name || id} #${d?.edition ?? ''}`.trim(), token });
      say('QR dimuat ulang. Jaga kerahasiaannya sampai ditempel.');
    }),
    del: (id) => {
      const d = getDrops().find((x) => x.id === id);
      const claimed = getClaims()[id];
      const warn = claimed ? `\n\nHewan ini sudah ditangkap ${claimed.by}. Koleksinya akan hilang dari akun itu.` : '';
      if (!confirm(`Hapus ${d?.name || id} #${d?.edition ?? ''}? QR yang sudah dicetak jadi tidak berlaku.${warn}`)) return;
      return run(async () => {
        await deleteDrop(id);
        if (result?.id === id) result = null;
        await onChange();
        say('Drop dihapus.');
      });
    },
    goto: (id) => {
      const d = getDrops().find((x) => x.id === id);
      if (d) map.flyTo({ center: [d.lng, d.lat], zoom: Math.max(map.getZoom(), 15.5), speed: 0.9 });
    },
    print: async () => {
      if (!result) return;
      sheet.innerHTML = `<div class="ps"><img src="${result.dataUrl}" alt="QR"><b>${esc(result.label)}</b><small>${esc(result.id)}</small></div>`;
      document.body.classList.add('printing');
      await new Promise((r) => setTimeout(r, 150));
      window.print();
    },
  };
  window.addEventListener('afterprint', () => document.body.classList.remove('printing'));

  panel.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (t && !t.disabled) actions[t.dataset.act]?.(t.dataset.id);
  });
  panel.addEventListener('change', async (e) => {
    const f = e.target.dataset.f;
    if (f === 'series') { series = e.target.value; }
    else if (f === 'coords') {
      const c = parseCoords(e.target.value);
      if (c) { say(''); setPos(c.lng, c.lat, true); } else { say('Koordinat tidak dikenali. Contoh: -6.2088, 106.8456', true); render(); }
    } else if (f === 'site') {
      const v = e.target.value.trim().replace(/\/+$/, '');
      if (!/^https?:\/\/\S+$/.test(v)) { say('Alamat situs harus diawali http:// atau https://', true); render(); return; }
      site = v; saveSite(v);
      if (result) await run(() => showResult(result));
      else render();
    }
  });

  map.on('click', (e) => { if (open && isAdmin) setPos(e.lngLat.wrap().lng, e.lngLat.wrap().lat); });

  function setOpen(v) {
    open = v && isAdmin;
    panel.classList.toggle('hidden', !open);
    btn.classList.toggle('on', open);
    document.body.classList.toggle('admin-open', open);
    map.getCanvas().style.cursor = open ? 'crosshair' : '';
    if (!open) clearPin();
    render();
  }
  btn.onclick = () => setOpen(!open);

  function row(d, claims) {
    const c = claims[d.id];
    return `<li><img src="/assets/animals/${d.series}.png" alt="">
      <button class="nm" data-act="goto" data-id="${esc(d.id)}">${esc(d.name)} #${d.edition}${d.mock ? '<em class="tag">contoh</em>' : ''}
        <small>${c ? 'Ditangkap ' + esc(c.by) : 'Belum ditangkap'}</small></button>
      <button class="sm" data-act="qr" data-id="${esc(d.id)}" ${busy ? 'disabled' : ''}>QR</button>
      <button class="sm del" data-act="del" data-id="${esc(d.id)}" ${busy ? 'disabled' : ''}>Hapus</button></li>`;
  }

  function render() {
    if (!open) return;
    const top = panel.scrollTop;
    const drops = getDrops(), claims = getClaims();
    const real = drops.filter((d) => !d.mock), mock = drops.filter((d) => d.mock);
    panel.innerHTML = `
      <div class="lb-head"><h2>Mode Developer</h2><button class="icon-btn" data-act="close" aria-label="Tutup">×</button></div>
      <p class="lb-sub">Klik peta untuk menaruh pin (pin bisa digeser). Pilih hewan, lalu buat QR unik untuk mainan itu.</p>
      <label class="adm-l">Hewan
        <select data-f="series">${SERIES.map((s) => `<option value="${s.key}" ${s.key === series ? 'selected' : ''}>${esc(s.name)} (${RARITIES[s.rarity].label})</option>`).join('')}</select></label>
      <label class="adm-l">Lokasi (lintang, bujur), bisa ditempel dari Google Maps
        <input data-f="coords" placeholder="-6.2088, 106.8456" value="${pos ? `${pos.lat}, ${pos.lng}` : ''}"></label>
      <p class="adm-s">${pos ? 'Pin siap. Geser pin untuk menyesuaikan.' : 'Belum ada pin. Klik peta.'}</p>
      <button class="btn adm-go" data-act="create" ${!pos || busy ? 'disabled' : ''}>${busy ? 'Memproses…' : 'Taruh di sini dan buat QR'}</button>
      ${msg ? `<div class="adm-msg ${msgErr ? 'err' : ''}">${esc(msg)}</div>` : ''}
      ${result ? `
        <div class="adm-qr"><img src="${result.dataUrl}" alt="Kode QR ${esc(result.label)}">
          <div><strong>${esc(result.label)}</strong><small>${esc(result.id)}</small>
            <a class="btn" href="${result.dataUrl}" download="${esc(result.id)}.png">Unduh PNG</a><button class="btn" data-act="print">Cetak</button></div></div>
        <label class="adm-l">Alamat situs di dalam QR<input data-f="site" value="${esc(site)}"></label>
        <p class="adm-s">Siapa pun yang memegang kode ini bisa mengklaim hewannya. Simpan rahasia sampai ditempel di mainan.</p>` : ''}
      <h4 class="lb-sec">Drop buatanmu (${real.length})</h4>
      ${real.length ? `<ul class="adm-list">${real.map((d) => row(d, claims)).join('')}</ul>` : '<p class="adm-s">Belum ada. Drop pertamamu akan muncul di sini.</p>'}
      ${mock.length ? `<button class="adm-toggle" data-act="toggleMock">${showMock ? 'Sembunyikan' : 'Tampilkan'} drop contoh (${mock.length})</button>
        ${showMock ? `<ul class="adm-list">${mock.map((d) => row(d, claims)).join('')}</ul>` : ''}` : ''}`;
    panel.scrollTop = top;
  }

  return {
    setAdmin(v) { isAdmin = !!v; btn.classList.toggle('hidden', !isAdmin); if (!isAdmin && open) setOpen(false); },
    update() { render(); },
  };
}
