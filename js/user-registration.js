/**
 * @file user-registration.js
 * @description Handles new user registration via the registration form.
 */

import { supabase } from "/js/supabase.js";

const registrationForm = document.getElementById("register-form");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm-password");
const requirementsBox = document.getElementById("password-requirements");

// Force hide
requirementsBox.style.display = "none";

/** Show/hide requirements box */
function allRequirementsMet() {
    const val = passwordInput.value;
    return (
        val.length>=8 &&
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[^A-Za-z0-9]/.test(val)
    );
}

function updateRequirements() {
    const val = passwordInput.value;
    toggleReq("req-length", val.length >= 8);
    toggleReq("req-upper", /[A-Z]/.test(val));
    toggleReq("req-lower", /[a-z]/.test(val));
    toggleReq("req-number", /[0-9]/.test(val));
    toggleReq("req-special", /[^A-Za-z0-9]/.test(val));
}

function toggleReq(id, met) {
    const el = document.getElementById(id);
    if (met) {
        el.classList.add("met");
    } else {
        el.classList.remove("met");
    }
}

let passwordFocused = false;
let confirmPwFocused = false;

// Show when field is focused, hide when met or focus leaves
passwordInput.addEventListener("focus", () => {
    passwordFocused = true;
    if (!allRequirementsMet()) requirementsBox.style.display = "block";
});

passwordInput.addEventListener("blur", () => {
    passwordFocused = false;
    if (!confirmPwFocused) requirementsBox.style.display = "none";
})

passwordInput.addEventListener("input", () => {
    updateRequirements();
    if (allRequirementsMet()) {
        requirementsBox.style.display = "none";
    } else if (passwordFocused) {
        requirementsBox.style.display = "block";
    }

});

confirmInput.addEventListener("focus", () => {
    confirmPwFocused = true;
    if (!allRequirementsMet()) requirementsBox.style.display = "block";
});

confirmInput.addEventListener("blur", () => {
    confirmPwFocused = false;
    if (!passwordFocused) requirementsBox.style.display = "none";
});

/**
 * Handle registration form submission.
 * Validates and sends new user credentials to the server.
 */
registrationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const errorMsg = document.getElementById("error-msg");

    if (!allRequirementsMet()) {
        errorMsg.textContent = "Not all password requirements met.";
        errorMsg.style.display = "block";
        requirementsBox.style.display = "block";
        return;
    }

    if (password !== confirmPassword) {
        errorMsg.textContent = "Passwords do not match";
        errorMsg.style.display = "block";
        return;
    }

    const { data: existingUsername } = await supabase
        .from("users")
        .select("username")
        .ilike("username", username)
        .single();
    
    if (existingUsername) {
        errorMsg.textContent = "That username is already taken.";
        errorMsg.style.display = "block";
        return;
    }

    const { data: existingEmail } = await supabase
        .from("users")
        .select("email")
        .ilike("email", email)
        .single();
    
    if (existingEmail) {
        errorMsg.textContent = "That email is already registered.";
        errorMsg.style.display = "block";
        return;
    }

    // Create Authorized Account
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        errorMsg.textContent = authError.message;
        errorMsg.style.display = "block";
        return;
    }

    // Add user info
    const { error: profileError } = await supabase
        .from("users")
        .insert([{
            id: authData.user.id,
            username,
            email,
            phone,
            role: "client",
            firstname: document.getElementById("first").value.trim(),
            lastname: document.getElementById("last").value.trim()
        }]);

    if (profileError) {
        console.error("Profile error:", profileError);

        if (profileError.code === "23505") {
            if (profileError.message.includes("username")) {
                errorMsg.textContent = "That username is already taken.";
            } else if (profileError.message.includes("email")) {
                errorMsg.textContent = "That email is already registered.";
            } else {
                errorMsg.textContent = "An account with those details already exists.";
            }
        } else {
            errorMsg.textContent = "Registration failed. Please try again.";
        }
        errorMsg.style.display = "block";
        return;
    }

    console.log("Registration successful!");
    window.location.href = "/pages/login-page.html";

});