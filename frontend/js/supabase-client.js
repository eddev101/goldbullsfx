/**
 * supabase-client.js
 * Initialises the Supabase JS client for use in the browser.
 *
 * IMPORTANT: Replace the two values below with your own from:
 *   Supabase dashboard → Settings → API
 *
 * Use the ANON / PUBLIC key here (not the service role key).
 */

const SUPABASE_URL  = 'https://ygyqhucwmrrodvngulmc.supabase.co';
const SUPABASE_ANON = 'sb_publishable_CFn8HLmvQbiFDKRPr0hQzQ_u0xmHJU8';

// Loaded via CDN in each HTML file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
