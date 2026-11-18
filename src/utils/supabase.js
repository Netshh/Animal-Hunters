// Supabase client + sign-in helpers. Keys come from Vite env vars (Vercel / .env.local).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY (check Vercel env vars / .env.local).');
}

export const supabase = createClient(url, key);

// Returns to the site root; the pending ?d=...&claim=... is restored by main.js after login.
export const signIn = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
export const signOut = () => supabase.auth.signOut();
export const getSession = async () => (await supabase.auth.getSession()).data.session;
export const onAuthChange = (fn) => supabase.auth.onAuthStateChange((event, session) => fn(event, session));
export const displayName = (u) =>
  u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split('@')[0] || 'Pemburu';
