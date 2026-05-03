/**
 * @file navbar.js
 * @description Loads the Navbar component onto the page
 */

import { loadComponent } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("#navbar", "/components/navbar.html");
});