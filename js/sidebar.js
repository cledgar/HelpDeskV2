/**
 * @file sidebar.js
 * @description Loads the sidebar component onto the page when the DOM content is fully loaded.
 */

import {loadComponent} from "./utils.js";
import { applyDarkMode } from "/js/dark-mode.js";


document.addEventListener("DOMContentLoaded", async () => {
    // Inject the sidebar HTML template into the element with id 'sidebar'
    await loadComponent("#sidebar", "/components/sidebar.html");
    // Finds current page, sets the corresponding list item to active //
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.closest("li").classList.add("active");
        }
    });
});