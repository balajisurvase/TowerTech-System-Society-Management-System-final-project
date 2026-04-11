import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = "https://mniarauxuzqcmdrplgiz.supabase.co";
const supabaseKey = "sb_publishable_lyGIIhz89nFb_vMNQVfLCA_HvJeEk_5";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
