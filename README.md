# Treasure Hunt (prototype)

A 3dfiti-style real-life treasure hunt map. Vite + vanilla JS + MapLibre GL.

## Run
1. Install Node.js LTS (https://nodejs.org).
2. In this folder: `npm install` then `npm run dev`
3. Open http://localhost:5173

## Map controls
Left-drag = pan, right-drag = rotate and tilt, scroll = zoom (also the +/compass control, bottom right).

## Test the QR claim flow
1. Find your PC's LAN IP (`ipconfig`, e.g. 192.168.1.20).
2. `npm run qr -- http://192.168.1.20:5173` creates `qr-codes/*.png` plus `links.txt`.
3. Print a few, hide them, scan with a phone on the same Wi-Fi: the item opens with a **Claim it** button.
(Quick desktop test: open a URL from `links.txt` directly.)

## Folder layout
- `src/main.js` app entry and glue
- `src/map/` map setup and markers
- `src/ui/` side panel and drop list
- `src/data/drops.js` mock drops (CENTER = map location, set to Jakarta)
- `src/utils/store.js` storage (localStorage for now)
- `public/assets/animals/` sprite PNGs
- `scripts/generate-qr.mjs` QR generator

## Known limits
Claims are saved in each browser's localStorage, so a claim on a phone won't appear on your PC. The next step is a backend (database + claim endpoint).

## Credits
Animal artwork: Twemoji (c) Twitter/jdecked, CC-BY 4.0, https://github.com/jdecked/twemoji. Map: MapLibre GL, (c) OpenStreetMap contributors, (c) CARTO.
