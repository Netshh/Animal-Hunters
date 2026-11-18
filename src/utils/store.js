// Game data now lives in Supabase (claims + profiles). Replaces the old localStorage store.
import { supabase } from './supabase.js';

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
