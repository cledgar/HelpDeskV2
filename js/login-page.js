/**
 * @file login-page.js
 * @description Handles user login authentication and navigation to registration.
 */

import { supabase } from "/js/supabase.js";

// Clear any existing session when landing on login page
await supabase.auth.signOut();
localStorage.removeItem("isLoggedIn");
localStorage.removeItem("userData");

const loginForm = document.getElementById("login-form");
const signUp = document.getElementById("sign-up-button");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            // User found - saves to localStorage and redirects.
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userData", JSON.stringify(result.user));
            window.location.href = "/pages/dashboard.html";
        } else {
            errorMsg.textContent = result.message || "Invalid credentials";
            errorMsg.style.display = "block";
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMsg.textContent = "Server error. Please try again.";
        errorMsg.style.display = "block";
    }
});
/** Temporary test - delete after debugging
const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("username", "yourusername") // replace with your actual username
    .single();

console.log("data:", data);
console.log("error:", error); */
/**
 * Redirect to the user registration page when the sign-up button is clicked.
 */
signUp.addEventListener("click", () => {
    window.location.href = "/pages/user-registration.html";
});

