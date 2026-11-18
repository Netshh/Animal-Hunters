import './styles/main.css';
import { CENTER, DROPS } from './data/drops.js';
import { getSession, signIn, signOut, onAuthChange, displayName } from './utils/supabase.js';
import { loadGame, claimWithToken } from './utils/store.js';
import { createMap } from './map/map.js';
import { addMarkers } from './map/markers.js';
import { showPanel } from './ui/panel.js';
import { renderList } from './ui/dropList.js';
import { initBoard, refreshBoard, setBoardData } from './ui/leaderboard.js';

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
  const params = new URLSearchParams(location.search);
  let token = params.get('claim'); // secret from the QR code
  const scanned = DROPS.find((d) => d.id === params.get('d')) || null;
  const loginBtn = document.getElementById('login');
  let claims = {}, players = [], markers;

  function open(d, fly = true) {
    if (fly) map.flyTo({ center: [d.lng, d.lat], zoom: Math.max(map.getZoom(), 15.5), speed: 0.9 });
    showPanel(d, claims, { canClaim: !!token && scanned?.id === d.id, onClaim: () => doClaim(d) });
  }

  async function doClaim(d) {
    if (!user) { keep(location.search); await signIn(); return; } // comes back here after Google login
    try {
      await claimWithToken(token);
      token = null; history.replaceState(null, '', location.pathname); // the QR is spent
    } catch (e) { console.error(e); alert(claimError(e)); }
    await refresh(); open(d, false);
  }

  async function refresh() {
    try { ({ claims, players } = await loadGame()); } catch (e) { console.error('Gagal memuat data', e); }
    markers.forEach((el, id) => el.classList.toggle('claimed', !!claims[id]));
    renderList(DROPS, claims, open);
    loginBtn.textContent = user ? displayName(user) : 'Masuk';
    setBoardData({ players, meId: user?.id ?? null });
    refreshBoard();
  }

  markers = addMarkers(map, DROPS, open);
  initBoard();
  loginBtn.onclick = async () => {
    if (!user) return signIn();
    if (confirm(`Keluar dari akun ${displayName(user)}?`)) await signOut();
  };
  onAuthChange((event, s) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') { user = s?.user ?? null; refresh(); }
  });

  await refresh();
  if (scanned && token) map.once('load', () => open(scanned));
  else if (params.get('claim') || params.get('d')) alert('Kode QR ini tidak dikenali.');
}

start();
