import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(URL && KEY);

export const supabase = isConfigured
  ? createClient(URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
