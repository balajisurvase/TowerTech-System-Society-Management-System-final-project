import { createClient } from '@supabase/supabase-js'

let rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (rawSupabaseUrl && rawSupabaseUrl.startsWith('//')) {
  rawSupabaseUrl = `https:${rawSupabaseUrl}`;
}

if (!rawSupabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Anon Key is missing or invalid. Please check your environment variables.");
}

export const supabaseUrl = rawSupabaseUrl;
export const supabase = createClient(rawSupabaseUrl || '', supabaseKey || '')

export const isSupabaseConfigured = !!(rawSupabaseUrl && supabaseKey);

// Test Connection logs as requested
async function testConnection() {
  try {
    const { data: residents } = await supabase.from('resident').select('*').limit(1);
    console.log('Residents Data:', residents);
    
    const { data: admins } = await supabase.from('admin').select('*').limit(1);
    console.log('Admin Data:', admins);
    
    const { data: complaints } = await supabase.from('complaint').select('*').limit(1);
    console.log('Complaints Data:', complaints);
    
    console.log('✅ Database connection test completed');
  } catch (err) {
    console.log('❌ Database connection test failed:', err);
  }
}

testConnection();
