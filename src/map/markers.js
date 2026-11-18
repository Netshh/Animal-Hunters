import maplibregl from 'maplibre-gl';

// Each drop is an upright 2D sprite (billboard) with a baked shadow, like the reference site.
export function addMarkers(map, drops, onPick) {
  const els = new Map();
  drops.forEach((d, i) => {
    const el = document.createElement('button');
    el.className = 'marker';
    el.title = `${d.name} #${d.edition}`;
    el.innerHTML = `<img src="/assets/animals/${d.series}.png" alt="" draggable="false">${i === 0 ? '<span class="badge">Terbaru</span>' : ''}`;
    el.addEventListener('click', (e) => { e.stopPropagation(); onPick(d); });
    new maplibregl.Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' })
      .setLngLat([d.lng, d.lat]).addTo(map);
    els.set(d.id, el);
  });
  const scale = () => document.documentElement.style.setProperty(
    '--ms', Math.min(2.4, Math.max(0.3, (map.getZoom() - 9.5) / 3.2)).toFixed(2));
  map.on('zoom', scale); scale();
  return els;
}
