import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When the two environment variables are missing the site runs in "demo mode":
// everything is stored in the visitor's own browser only. See SETUP.md.
export const supabase = url && key ? createClient(url, key) : null;
export const isDemo = !supabase;
