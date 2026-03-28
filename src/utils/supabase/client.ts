import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mniarauxuzqcmdrplgiz.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_lyGIIhz89nFb_vMNQVfLCA_HvJeEk_5";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
