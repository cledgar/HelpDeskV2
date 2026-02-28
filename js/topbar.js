import {loadComponent} from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("#topbar", "/components/topbar.html");

    const profilePic = document.getElementById("profile-pic");
    const userDropdown = document.getElementById("user-dropdown");

    if (profilePic && userDropdown) {
        // Toggle dropdown on click
        profilePic.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent closing when clicking the pic
            userDropdown.classList.toggle("show");
        });

        // Close dropdown when clicking anywhere else on the page
        window.addEventListener("click", () => {
            if (userDropdown.classList.contains("show")) {
                userDropdown.classList.remove("show");
            }
        });
    }

    const testButton = document.getElementById("test-button");
    const testDropdown = document.getElementById("test-dropdown");

    if (testButton && testDropdown) {
        testButton.addEventListener("click", (event) => {
            event.stopPropagation()
            testDropdown.classList.toggle("show");
        });

        window.addEventListener("click", () => {
            if (testDropdown.classList.contains("show")) {
                testDropdown.classList.remove("show");
            }
        });
    }

    const createTicketBtn = document.getElementById("create-ticket-btn");
    if (createTicketBtn) {
        createTicketBtn.addEventListener("click", () => {
            alert("Create Ticket Button has been pressed!");
        });
    }
});
