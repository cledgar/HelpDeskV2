/**
 *  * @file utils.js
 * @description Utility functions and page security checks.
 */

/**
* Dynamically loads an HTML component and injects it into a target element.
* @param {string} componentSelector - The CSS selector for the target element.
* @param {string} componentPath - The path to the HTML file to load.
*/

export async function loadComponent(componentSelector, componentPath) {
    const target = document.querySelector(componentSelector);

    if (!target) {
        console.error(`Target element "${componentSelector}" not found.`);
        return;
    }

    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load: ${componentPath}`);

        // Set the inner HTML of the target element to the content of the loaded file
        target.innerHTML = await response.text();
    }
    catch (error) {
        console.error(error);
    }
}

import { supabase } from "/js/supabase.js";

async function applyRoleView() {

    const currentPath = window.location.pathname;
    const isPublicPage = currentPath === "/" ||
        currentPath.includes("login-page.html") ||
        currentPath.includes("user-registration.html") ||
        currentPath.includes("forgot-pw.html") ||
        currentPath.includes("business.html") ||
        currentPath.includes("faq.html") ||
        currentPath.includes("index.html") ||
        currentPath.includes("sales.html") ||
        currentPath.includes("request-demo.html") ||
        currentPath.includes("about.html");

    if (isPublicPage) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "/pages/login-page.html";
        return;
    }

    const { data: profile, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (error || !profile) {
        window.location.href = "/pages/login-page.html";
        return;
    }

    document.body.classList.add(`role-${profile.role}`);
}

applyRoleView();


/**
* IIFE for Authentication Guard:
* Redirects the user to the login page if they are not logged in.
*/
/*(function() {
const isLoggedIn = sessionStorage.getItem("isLoggedIn");

// Allow access to the login and registration pages without authentication
const currentPath = window.location.pathname;
const isPublicPage = currentPath === "/" || 
currentPath.includes("login-page.html") || 
currentPath.includes("user-registration.html");

if (!isLoggedIn && !isPublicPage) {
window.location.href = "/";
}
})(); */