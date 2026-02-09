import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pnnzmvdcafaqjtkbavdc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_k9cJ0EWM7rYwi7D7g7aVAg_Kqn0uCnk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
