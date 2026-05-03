/**
 * @file footer.js
 * @description Loads the footer component onto the page
 */

import { loadComponent } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("#footer", "/components/footer.html");
});