import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseUrl.startsWith('//')) {
  supabaseUrl = `https:${supabaseUrl}`;
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Anon Key is missing or invalid. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

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
