import './styles/main.css';
import { CENTER, DROPS } from './data/drops.js';
import { claim, getClaims, getUser, setUser } from './utils/store.js';
import { createMap } from './map/map.js';
import { addMarkers } from './map/markers.js';
import { showPanel } from './ui/panel.js';
import { renderList } from './ui/dropList.js';

const map = createMap(CENTER);
const token = new URLSearchParams(location.search).get('claim'); // set when a QR code is scanned
let scanned = DROPS.find((d) => d.token === token) || null;
let markers;

function open(d, fly = true) {
  if (fly) map.flyTo({ center: [d.lng, d.lat], zoom: Math.max(map.getZoom(), 15.5), speed: 0.9 });
  showPanel(d, getClaims(), {
    canClaim: scanned?.id === d.id,
    onClaim: () => {
      let user = getUser() || prompt('Pick a name for the leaderboard:');
      if (!user) return;
      setUser(user); claim(d.id, user); refresh(); open(d, false);
    },
  });
}

function refresh() {
  const claimed = getClaims();
  markers.forEach((el, id) => el.classList.toggle('claimed', !!claimed[id]));
  renderList(DROPS, claimed, open);
  document.getElementById('login').textContent = getUser() || 'Log in';
}

markers = addMarkers(map, DROPS, open);
document.getElementById('login').onclick = () => { const n = prompt('Your name:', getUser()); if (n) { setUser(n); refresh(); } };
refresh();
if (scanned) map.once('load', () => open(scanned));
else if (token) alert('This QR code is not recognised.');
