/**
 * @file utils.js
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
    } catch (error) {
        console.error(error);
    }
}

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
})();*/