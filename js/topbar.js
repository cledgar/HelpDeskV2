/**
 * @file topbar.js
 * @description Manages the top bar component, including user profile display, dropdown menu, and logout functionality.
 */

import { loadComponent } from "./utils.js";
import { initTicketForm } from "/js/ticket-form-handler.js";
import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Load the top bar component HTML
    await loadComponent("#topbar", "/components/topbar.html");

    const profilePic = document.getElementById("profile-pic");
    const userDropdown = document.getElementById("user-dropdown");
    
    // Retrieve user data from localStorage, default to Guest if not found
    const storedUser = localStorage.getItem("userData");
    console.log("stored user:", storedUser);
    const user = storedUser ? JSON.parse(storedUser) : { username: "Guest" };
    console.log("parsed user:", user);


    // Display Profile Picture if Saved
    if (profilePic) {
        if (user.profilePic_url) {
            profilePic.src = user.profilePic_url;
        }

        // Toggle user dropdown menu visibilty on profile picture click
        profilePic.addEventListener("click", (event) => {
            event.stopPropagation();
            userDropdown.classList.toggle("show");
        });
    }
    
    if (userDropdown) {
        // Close dropdown menu when clicking anywhere else on the document
        window.addEventListener("click", () => {
            if (userDropdown.classList.contains("show")) {
                userDropdown.classList.remove("show");
            }
        });
    }

    // Handle logout link click
    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) {
        logoutLink.addEventListener("click", async (event) => {
            event.preventDefault();
            // SIgn out of Supabase Auth and clear localStorage
            await supabase.auth.signOut();
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userData");
            window.location.href = "/pages/login-page.html";
        });
    }

    // Display the current user's name in the dropdown header
    const userProfile = document.getElementById("dropdown-header");
    if (userProfile) {
        userProfile.innerHTML = `
        <p class="user-name">${user.username}</p>
    `;
    }

    // Display the current user's name in the main menu profile section
    const profileName = document.getElementById("main-menu-username");
    if (profileName) {
        profileName.innerHTML = `
            <p class="main-menu-username">${user.username}</p>
        `;
    }

    // Initialize the ticket creation form/modal listeners
    initTicketForm();

});
