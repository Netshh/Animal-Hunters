import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Defaults give the 3dfiti controls: left-drag pan, right-drag rotate/tilt, scroll zoom.
export function createMap(center) {
  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center, zoom: 13, pitch: 55, bearing: -15,
    minZoom: 2, // about the whole world on a wide screen
    maxPitch: 75,
    renderWorldCopies: false, // the world no longer repeats left/right
    attributionControl: { compact: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

  // Keep the camera inside the world. (maxBounds breaks the view when the map is tilted.)
  map.on('move', () => {
    const c = map.getCenter();
    const lng = Math.max(-180, Math.min(180, c.lng));
    const lat = Math.max(-80, Math.min(80, c.lat));
    if (lng !== c.lng || lat !== c.lat) map.setCenter([lng, lat]);
  });

  // Flatten the tilt when zoomed far out, where tilting makes no sense.
  map.on('zoom', () => {
    const z = map.getZoom();
    const limit = z < 4 ? 0 : z < 7 ? 40 : 75;
    map.setMaxPitch(limit);
    if (map.getPitch() > limit) map.setPitch(limit);
  });

  map.on('load', () => {
    try {
      map.addLayer({
        id: '3d-buildings', source: 'carto', 'source-layer': 'building', type: 'fill-extrusion', minzoom: 14,
        paint: {
          'fill-extrusion-color': '#e6dfd0',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.85,
        },
      });
    } catch (e) { console.warn('3D buildings unavailable', e); }
  });
  return map;
}