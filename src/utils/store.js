// Game data now lives in Supabase (claims + profiles). Replaces the old localStorage store.
import { supabase } from './supabase.js';
import { SERIES } from '../data/drops.js';

const seriesOf = Object.fromEntries(SERIES.map((s) => [s.key, s]));

// Escape text before putting it into innerHTML (real user names are untrusted input).
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Loads every claim and every profile. Returns:
//   claims  = { [dropId]: { by, byId, at } }   (for markers + panel)
//   players = [{ id, name, claims: [{ dropId, daysAgo }] }]   (for the leaderboard)
export async function loadGame() {
  const [c, p] = await Promise.all([
    supabase.from('claims').select('drop_id,user_id,claimed_at'),
    supabase.from('profiles').select('id,display_name'),
  ]);
  if (c.error) throw c.error;
  if (p.error) throw p.error;

  const players = new Map(p.data.map((x) => [x.id, { id: x.id, name: x.display_name || 'Pemburu', claims: [] }]));
  const claims = {};
  for (const row of c.data) {
    const at = new Date(row.claimed_at).getTime();
    const who = players.get(row.user_id);
    claims[row.drop_id] = { by: who?.name || 'Pemburu', byId: row.user_id, at };
    who?.claims.push({ dropId: row.drop_id, daysAgo: Math.floor((Date.now() - at) / 864e5) });
  }
  return { claims, players: [...players.values()] };
}

// Server checks the secret token and the signed-in user, then records the claim.
export async function claimWithToken(token) {
  const { data, error } = await supabase.rpc('claim_drop', { p_token: token });
  if (error) throw error;
  return data; // the claimed drop id
}

export const ago = (days) =>
  days < 1 ? 'hari ini' : days < 30 ? `${days} hari lalu` : days < 365 ? `${Math.round(days / 30)} bulan lalu` : 'lebih dari setahun lalu';

// Every drop on the map (public info only: no tokens). Newest first.
export async function loadDrops() {
  const { data, error } = await supabase.from('drops')
    .select('id,series,edition,lng,lat,created_at,is_mock').order('created_at', { ascending: false });
  if (error) throw error;
  return data.filter((d) => seriesOf[d.series]).map((d) => ({
    id: d.id, series: d.series, name: seriesOf[d.series].name, edition: d.edition,
    lng: d.lng, lat: d.lat, mock: !!d.is_mock,
    daysAgo: Math.max(0, Math.floor((Date.now() - new Date(d.created_at).getTime()) / 864e5)),
  }));
}

// ---- Developer-only calls. The server re-checks admin rights on every one of these. ----
export async function fetchIsAdmin() {
  try { const { data, error } = await supabase.rpc('is_admin'); return !error && data === true; } catch { return false; }
}
export async function createDrop(series, lng, lat) {
  const { data, error } = await supabase.rpc('create_drop', { p_series: series, p_lng: lng, p_lat: lat });
  if (error) throw error;
  return data; // { id, series, edition, token }
}
export async function getDropToken(id) {
  const { data, error } = await supabase.rpc('get_drop_token', { p_drop_id: id });
  if (error) throw error;
  return data;
}
export async function deleteDrop(id) {
  const { error } = await supabase.rpc('delete_drop', { p_drop_id: id });
  if (error) throw error;
}
