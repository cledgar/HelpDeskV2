/**
 * @file dark-mode.js
 * @description Applies dark mode on page load based on saved preference.
 * Import this on every app page.
 */

export function applyDarkMode() {
    const darkMode = localStorage.getItem("darkMode") === "true";
    if (darkMode) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}

// Apply immediately on import
applyDarkMode();