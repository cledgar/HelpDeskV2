/**
 * @file settings-page.js
 * @description Loads the Settings as the User Set Them
 */

import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Element References ---
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const ticketsNotifToggle = document.getElementById("tickets-notif-toggle");
    const assignmentsNotifToggle = document.getElementById("assignments-notif-toggle");
    const systemNotifToggle = document.getElementById("system-notif-toggle");
    const firstNameInput = document.getElementById("firstname-input");
    const lastNameInput = document.getElementById("lastname-input");
    const usernameInput = document.getElementById("username-input");
    const emailInput = document.getElementById("email-input");
    const saveBtn = document.getElementById("save-settings-btn");
    const saveStatus = document.getElementById("save-status");
    const phoneNumberInput = document.getElementById("phoneNumber-input");
    const profilePicInput = document.getElementById("profilePic");
    const profilePreview = document.getElementById("preview");

    // --- Loads the Settings Preferences from Local Storage ---
    function loadSettings() {

        // --- Load Dark Mode ---
        const darkMode = localStorage.getItem("darkMode") === "true";
        darkModeToggle.checked = darkMode;
        applyDarkMode(darkMode);

        // --- Load Notifications ---
        ticketsNotifToggle.checked = localStorage.getItem("ticketsNotif") !== "false";
        assignmentsNotifToggle.checked = localStorage.getItem("assignmentsNotif") !== "false";
        systemNotifToggle.checked = localStorage.getItem("systemNotif") !== "false";

        // --- Load Profile and Account ---
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            usernameInput.value = user.username || "";
            emailInput.value = user.email || "";
            firstNameInput.value = user.firstname || "";
            lastNameInput.value = user.lastname || "";
            phoneNumberInput.value=user.phonenumber || "";

            // --- Load Profile Picture if saved ---
            if (user.profilePic_url) {
                profilePreview.src = user.profilePic_url;
                profilePreview.style.display = "block";
            }
        }
    }

    // --- Run loadSettings when page loads in ---
    loadSettings();

    
    // --- Apply Dark Mode to the Page ---
    function applyDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    }

    // --- Instant Application of Dark Mode Toggle ---
    darkModeToggle.addEventListener("change", () => {
        applyDarkMode(darkModeToggle.checked);
    });

    // --- Preview Profile Picture When Selected ---
    profilePicInput.addEventListener("change", () => {
        const file = profilePicInput.files[0];
        if (!file) return;

        // --- Validate File Size (2MB max) ---
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be under 2MB");
            profilePicInput.value = "";
            return;
        }

        // --- Validate File Type ---
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            profilePicInput.value = "";
            return;
        }

        // --- Show Preview ---
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePreview.src = e.target.result;
            profilePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    });

    // --- Upload Profile Picture to Supabase Storage ---
    async function uploadProfilePicture(userId) {
        const file = profilePicInput.files[0];
        if (!file) return null;

        // --- Store in a Folder Named After the User's ID ---
        const filePath = '${userId}/${Date.now()}_${file.name}';

        const { error: uploadError } = await supabase.storage
            .from("profile-pic")
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error("Upload error:", uploadError.message);
            return null;
        }

        // --- Get The Public URL of the Uploaded Image ---
        const { data } = supabase.storage
            .from("profile-pic")
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    // --- Save All Settings ---
    saveBtn.addEventListener("click", async () => {
        
        // --- Save Dark Mode Changes ---
        localStorage.setItem("darkMode", darkModeToggle.checked);

        // --- Save Notification Changes ---
        localStorage.setItem("ticketsNotif", ticketsNotifToggle.checked);
        localStorage.setItem("assignmentsNotif", assignmentsNotifToggle.checked);
        localStorage.setItem("systemNotif", systemNotifToggle.checked);

        // --- Get Current User ---
        const storedUser = localStorage.getItem("userData");
        const user = storedUser ? JSON.parse(storedUser) : {};

        // --- Save Account and Profile Changes to Supabase ---
        await supabase
            .from("users")
            .update({
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                firstname: firstNameInput.value.trim(),
                lastname: lastNameInput.value.trim(),
                phonenumber: phoneNumberInput.value.trim(),
                pronouns: document.getElementById("pronouns").value
            })
            .eq("id", user.id);

        // --- Update Local Storage to Show Changes ---
        user.username = usernameInput.value.trim();
        user.email = emailInput.value.trim();
        user.firstname = firstNameInput.value.trim();
        user.lastname = lastNameInput.value.trim();
        user.phone = phoneNumberInput.value.trim();
        localStorage.setItem("userData",JSON.stringify(user));

        // --- Upload Profile Picture if a New One was Selected ---
        if (profilePicInput.files[0]) {
            const profilePicUrl = await uploadProfilePicture(user.id);
            if (profilePicUrl) {
                user.profilePic_url = profilePicUrl;

                // --- Save Profile Picture URL to Supabase Users Table ---
                await supabase
                    .from("users")
                    .update({ profilePic_url: profilePicUrl })
                    .eq("id", user.id);
            }
        }

        localStorage.setItem("userData", JSON.stringify(user));

        // --- Show Confirmation of Changes ---
        saveStatus.textContent = "Settings Saved!";
        saveStatus.classList.add("visible");
        setTimeout(() => saveStatus.classList.remove("visible"), 3000);
    });

    // --- Delete Account Handler ---
    const deleteAccountBtn = document.getElementById("delete-account-btn");
    deleteAccountBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) {
            return;
        }

        const storedUser = localStorage.getItem("userData");
        if (!storedUser) {
            alert("No user is currently logged in.");
            return;
        }

        const user = JSON.parse(storedUser);

        try {
            const response = await fetch("/deleteAccount", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: user.id, username: user.username })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                localStorage.removeItem("userData");
                localStorage.removeItem("isLoggedIn");
                alert("Your account has been deleted.");
                window.location.href = "/pages/login-page.html";
            } else {
                alert(data.message || "Unable to delete account. Please try again.");
            }
        } catch (error) {
            console.error("Delete account error:", error);
            alert("Error deleting account. Please try again.");
        }
    });
});