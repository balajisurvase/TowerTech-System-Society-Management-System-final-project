import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xxdgmfhcwlxnznnmwcjb.supabase.co";
const supabaseKey = "sb_publishable_hDRxUuapy0dtUHuA3Mvkpg_xnw1wzV_";

export const supabase = createClient(supabaseUrl, supabaseKey)

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
