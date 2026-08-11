import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Session isolée de l'auth praticien (src/lib/supabase.js) via une storageKey
// dédiée : les deux peuvent coexister dans le même navigateur sans collision.
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sb-naposolo-client-auth',
  }
});
