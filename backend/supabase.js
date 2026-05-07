/**
 * supabase.js
 * Supabase client + database helpers for the backend.
 * Uses the SERVICE ROLE key (server-side only, never expose to browser).
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Insert a new signal row.
 * @param {Object} signal - parsed signal object from parser.js
 * @returns {Object} inserted row or throws
 */
async function insertSignal(signal) {
  const { data, error } = await supabase
    .from('signals')
    .insert([signal])
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  return data;
}

/**
 * Update signal status / result (for manual updates later).
 * @param {string} id - signal UUID
 * @param {Object} updates - fields to update
 */
async function updateSignal(id, updates) {
  const { data, error } = await supabase
    .from('signals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Supabase update error: ${error.message}`);
  return data;
}

module.exports = { supabase, insertSignal, updateSignal };
