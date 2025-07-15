import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con los de tu proyecto Supabase:
const supabaseUrl = 'https://rxiawbqgzikzoyrnvwkh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);