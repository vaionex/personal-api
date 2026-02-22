import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } from '$env/static/private';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
