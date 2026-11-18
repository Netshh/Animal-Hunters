import './styles/main.css';
import './styles/rarity.css';
import { CENTER } from './data/drops.js';
import { DEMO_PLAYERS, SHOW_DEMO_PLAYERS } from './data/players.js';
import { getSession, signIn, signOut, onAuthChange, displayName } from './utils/supabase.js';
import { loadGame, loadDrops, claimWithToken, fetchIsAdmin } from './utils/store.js';
import { createMap } from './map/map.js';
import { createMarkers } from './map/markers.js';
import { showPanel } from './ui/panel.js';
import { renderList } from './ui/dropList.js';
import { initBoard, refreshBoard, setBoardData } from './ui/leaderboard.js';
import { initAdmin } from './ui/admin.js';
import { initCodex, setCodexData } from './ui/codex.js';

const PENDING = 'th_pending'; // keeps ?d=...&claim=... alive across the Google redirect
const AUTO = 'th_autoclaim';  // "the user pressed claim before signing in": finish the claim after login
const keep = (v) => { try { sessionStorage.setItem(PENDING, v); } catch { /* storage blocked */ } };
function restorePending() {
  try {
    const v = sessionStorage.getItem(PENDING);
    if (v) { sessionStorage.removeItem(PENDING); if (!location.search) history.replaceState(null, '', location.pathname + v); }
  } catch { /* storage blocked */ }
}
function takeAuto() {
  try { const v = sessionStorage.getItem(AUTO); sessionStorage.removeItem(AUTO); return v === '1'; } catch { return false; }
}
function claimError(e) {
  if (e?.code === '23505') return 'Hewan ini sudah ditangkap orang lain.';
  if (/invalid token/i.test(e?.message || '')) return 'Kode QR ini tidak valid.';
  if (/not signed in/i.test(e?.message || '')) return 'Masuk dulu untuk mengklaim.';
  return 'Gagal mengklaim. Coba lagi.';
}
// Red bar at the bottom so a database problem is visible instead of silently showing an empty map.
function problem(msg) {
  let b = document.getElementById('problem');
  if (!b) { b = document.createElement('div'); b.id = 'problem'; document.body.append(b); }
  b.textContent = msg || ''; b.hidden = !msg;
}

async function start() {
  const session = await getSession(); // also finishes the Google login if we just came back from it
  let user = session?.user ?? null;
  restorePending();

  const map = createMap(CENTER);
  const ready = new Promise((res) => map.once('load', res));
  const params = new URLSearchParams(location.search);
  const scannedId = params.get('d');
  let token = params.get('claim'); // secret from the QR code
  const loginBtn = document.getElementById('login');
  let claims = {}, players = [], drops = [], dropsFailed = false;

  const markers = createMarkers(map, (d) => open(d));
  const admin = initAdmin({ map, getDrops: () => drops, getClaims: () => claims, onChange: () => refresh() });

  function open(d, fly = true) {
    if (fly) map.flyTo({ center: [d.lng, d.lat], zoom: Math.max(map.getZoom(), 15.5), speed: 0.9 });
    showPanel(d, claims, { canClaim: !!token && scannedId === d.id, signedIn: !!user, onClaim: () => doClaim(d) });
  }

  async function doClaim(d) {
    if (!user) { // an account is required: sign in with Google first, then the claim finishes automatically
      keep(location.search);
      try { sessionStorage.setItem(AUTO, '1'); } catch { /* storage blocked */ }
      await signIn(); return;
    }
    try {
      await claimWithToken(token);
      token = null; history.replaceState(null, '', location.pathname); // the QR is spent
      alert(`Berhasil! ${d.name} #${d.edition} masuk ke koleksimu.`);
    } catch (e) { console.error(e); alert(claimError(e)); }
    await refresh(); open(drops.find((x) => x.id === d.id) || d, false);
  }

  // Drops and player data load independently: a problem with one can no longer empty the other.
  async function refresh() {
    const [g, ds] = await Promise.allSettled([loadGame(), loadDrops()]);
    const issues = [];
    dropsFailed = ds.status !== 'fulfilled';
    if (!dropsFailed) drops = ds.value; else issues.push(`peta: ${ds.reason?.message || ds.reason}`);
    if (g.status === 'fulfilled') ({ claims, players } = g.value); else issues.push(`skor: ${g.reason?.message || g.reason}`);
    issues.forEach((i) => console.error('Gagal memuat', i));
    problem(issues.length ? `Gagal memuat data (${issues.join('; ')}). Buka konsol (F12) untuk detail.` : '');
    markers.sync(drops);
    markers.setClaimed(claims);
    renderList(drops, claims, open);
    loginBtn.textContent = user ? displayName(user) : 'Masuk';
    setBoardData({ players: [...players, ...(SHOW_DEMO_PLAYERS ? DEMO_PLAYERS : [])], meId: user?.id ?? null, drops });
    refreshBoard();
    setCodexData({ drops, claims, meId: user?.id ?? null });
    admin.update();
  }
  const syncAdmin = async () => admin.setAdmin(user ? await fetchIsAdmin() : false);

  initBoard();
  initCodex();
  loginBtn.onclick = async () => {
    if (!user) return signIn();
    if (confirm(`Keluar dari akun ${displayName(user)}?`)) await signOut();
  };
  onAuthChange((event, s) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      user = s?.user ?? null;
      setTimeout(async () => { await refresh(); syncAdmin(); }, 0); // not inside the auth callback itself
    }
  });

  await refresh();
  syncAdmin();
  const scanned = drops.find((d) => d.id === scannedId);
  if (scanned && token) {
    ready.then(() => { open(scanned); if (user && takeAuto()) doClaim(scanned); });
  } else if ((params.get('claim') || scannedId) && !dropsFailed) {
    alert('Kode QR ini tidak dikenali.');
  }
}

start();
