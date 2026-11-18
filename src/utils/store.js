// Prototype storage: browser localStorage. A real backend replaces this later.
const K = { claims: 'th_claims', user: 'th_user' };
const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
export const getClaims = () => read(K.claims, {});
export const getUser = () => read(K.user, '');
export const setUser = (n) => localStorage.setItem(K.user, JSON.stringify(n));
export function claim(id, by) {
  const c = getClaims();
  if (!c[id]) { c[id] = { by, at: Date.now() }; localStorage.setItem(K.claims, JSON.stringify(c)); }
  return c;
}
export const ago = (days) =>
  days < 30 ? `${days} day${days > 1 ? 's' : ''} ago` : days < 365 ? `${Math.round(days / 30)} months ago` : 'over a year ago';
