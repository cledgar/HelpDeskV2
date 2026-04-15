/**
 * @file landing.js
 * @description Redirects already logged in users straight to the dashboard.
 */

import { supabase } from "/js/supabase.js";

// If user is logged in, skip landing page and go to dashboard
const { data: { session } } = await supabase.auth.getSession();
if (session) {
    window.location.href = "/pages/dashboard.html";
}