/**
 * @file supabase.js
 * @description Initializes and exports the Supabase client for use across the site.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://adnjlrxbqgerjlhgirlq.supabase.co";
const SUPABASE_KEY = "sb_publishable_sNNSlaz28kpULCpWkBCM3Q_OY6FN8cv";

export const supabase = createClient (SUPABASE_URL, SUPABASE_KEY);

/**
//Connection Test (TEMP)
const { data, error } = await supabase.from("users").select("*");
if (error) {
    console.error("Supabase connection failed:", error.message);
} else {
    console.log("Supabase connected!", data);
}

// Test anon query
const { data, error } = await supabase
    .from("users")
    .select("email")
    .ilike("username", "yourusername");

console.log("anon test data:", data);
console.log("anon test error:", error);
*/