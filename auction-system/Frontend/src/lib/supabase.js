import { createClient } from '@supabase/supabase-js'

// Lấy environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
