import maplibregl from 'maplibre-gl';
import { SERIES } from '../data/drops.js';

// Each drop is an upright 2D sprite (billboard). Drops now come from the database,
// so markers can be added and removed at any time with sync().
export function createMarkers(map, onPick) {
  const items = new Map(); // drop id -> { marker, el, drop }

  const scale = () => document.documentElement.style.setProperty(
    '--ms', Math.min(2.4, Math.max(0.3, (map.getZoom() - 9.5) / 3.2)).toFixed(2));
  map.on('zoom', scale); scale();

  function sync(drops) {
    const ids = new Set(drops.map((d) => d.id));
    for (const [id, it] of items) if (!ids.has(id)) { it.marker.remove(); items.delete(id); }
    drops.forEach((d, i) => {
      let it = items.get(d.id);
      if (!it) {
        const el = document.createElement('button');
        el.className = 'marker';
        el.dataset.r = SERIES.find((s) => s.key === d.series)?.rarity || '';
        el.innerHTML = `<img src="/assets/animals/${d.series}.png" alt="" draggable="false">`;
        el.addEventListener('click', (e) => { e.stopPropagation(); onPick(items.get(d.id).drop); });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' })
          .setLngLat([d.lng, d.lat]).addTo(map);
        it = { marker, el, drop: d };
        items.set(d.id, it);
      }
      it.drop = d;
      it.el.title = `${d.name} #${d.edition}`;
      it.el.querySelector('.badge')?.remove();
      if (i === 0) it.el.insertAdjacentHTML('beforeend', '<span class="badge">Terbaru</span>'); // drops arrive newest first
    });
  }

  const setClaimed = (claims) => items.forEach((it, id) => it.el.classList.toggle('claimed', !!claims[id]));
  return { sync, setClaimed };
}
