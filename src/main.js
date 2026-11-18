import './styles/main.css';
import { CENTER } from './data/drops.js';
import { getSession, signIn, signOut, onAuthChange, displayName } from './utils/supabase.js';
import { loadGame, loadDrops, claimWithToken, fetchIsAdmin } from './utils/store.js';
import { createMap } from './map/map.js';
import { createMarkers } from './map/markers.js';
import { showPanel } from './ui/panel.js';
import { renderList } from './ui/dropList.js';
import { initBoard, refreshBoard, setBoardData } from './ui/leaderboard.js';
import { initAdmin } from './ui/admin.js';

const PENDING = 'th_pending'; // keeps ?d=...&claim=... alive across the Google redirect
const keep = (v) => { try { sessionStorage.setItem(PENDING, v); } catch { /* storage blocked */ } };
function restorePending() {
  try {
    const v = sessionStorage.getItem(PENDING);
    if (v) { sessionStorage.removeItem(PENDING); if (!location.search) history.replaceState(null, '', location.pathname + v); }
  } catch { /* storage blocked */ }
}
function claimError(e) {
  if (e?.code === '23505') return 'Hewan ini sudah ditangkap orang lain.';
  if (/invalid token/i.test(e?.message || '')) return 'Kode QR ini tidak valid.';
  if (/not signed in/i.test(e?.message || '')) return 'Masuk dulu untuk mengklaim.';
  return 'Gagal mengklaim. Coba lagi.';
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
  let claims = {}, players = [], drops = [];

  const markers = createMarkers(map, (d) => open(d));
  const admin = initAdmin({ map, getDrops: () => drops, getClaims: () => claims, onChange: () => refresh() });

  function open(d, fly = true) {
    if (fly) map.flyTo({ center: [d.lng, d.lat], zoom: Math.max(map.getZoom(), 15.5), speed: 0.9 });
    showPanel(d, claims, { canClaim: !!token && scannedId === d.id, onClaim: () => doClaim(d) });
  }

  async function doClaim(d) {
    if (!user) { keep(location.search); await signIn(); return; } // comes back here after Google login
    try {
      await claimWithToken(token);
      token = null; history.replaceState(null, '', location.pathname); // the QR is spent
    } catch (e) { console.error(e); alert(claimError(e)); }
    await refresh(); open(drops.find((x) => x.id === d.id) || d, false);
  }

  async function refresh() {
    try {
      const [g, ds] = await Promise.all([loadGame(), loadDrops()]);
      ({ claims, players } = g); drops = ds;
    } catch (e) { console.error('Gagal memuat data', e); }
    markers.sync(drops);
    markers.setClaimed(claims);
    renderList(drops, claims, open);
    loginBtn.textContent = user ? displayName(user) : 'Masuk';
    setBoardData({ players, meId: user?.id ?? null, drops });
    refreshBoard();
    admin.update();
  }
  const syncAdmin = async () => admin.setAdmin(user ? await fetchIsAdmin() : false);

  initBoard();
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
  if (scanned && token) ready.then(() => open(scanned));
  else if (params.get('claim') || scannedId) alert('Kode QR ini tidak dikenali.');
}

start();
