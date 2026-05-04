/**
 * @file ticket-form-handler.js
 * @description Manages the support ticket creation modal and form submission.
 */

/**
 * Returns the current timestamp in ISO string format.
 * @returns {string} The current timestamp.
 */
function getCurrentTimestamp() {
    return new Date().toISOString();
}

/**
 * Populates the user assignment dropdown with available users.
 */
async function populateUserDropdown() {
    const assignedToSelect = document.getElementById("assigned-to");
    if (!assignedToSelect) return;

    try {
        const response = await fetch("/getUsers");
        if (response.ok) {
            const users = await response.json();
            
            // Clear existing options except the first one
            assignedToSelect.innerHTML = '<option value="">Unassigned</option>';
            
            // Add user options
            users.forEach(user => {
                const option = document.createElement("option");
                option.value = user.username;
                option.textContent = user.username;
                assignedToSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

/**
 * Initializes the ticket form functionality.
 * Sets up event listeners for opening/closing the modal and submitting the form.
 */
export function initTicketForm() {

    const createTicketBtn = document.getElementById("create-ticket-btn");
    const ticketModal = document.getElementById("ticket-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const ticketForm = document.getElementById("ticket-form");

    if (createTicketBtn && ticketModal) {
        // Show modal on 'Create Ticket' button click
        createTicketBtn.addEventListener("click", async () => {
            await populateUserDropdown();
            ticketModal.classList.remove("hidden");
        });

        // Hide modal on 'Close' button click
        closeModalBtn.addEventListener("click", () => {
            ticketModal.classList.add("hidden");
        });

        /**
         * Handle ticket form submission.
         * Collects form data and sends it to the server.
         */
        ticketForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Extract values from form inputs
            const ticketTitle = document.querySelector("#ticket-title").value;
            const ticketDescription = document.querySelector("#ticket-description").value;
            const ticketPriority = document.querySelector("#ticket-priority").value;
            const department = document.querySelector("#departments").value;
            const assignedTo = document.querySelector("#assigned-to").value;

            // Get current user information from local storage (set during login)
            const userData = JSON.parse(localStorage.getItem("userData"));
            const createdBy = userData ? userData.username : "Guest";

            // Get current timestamp
            const createdAt = getCurrentTimestamp();

            try {
                // Send ticket data to the server
                const response = await fetch("/createTicket", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ticketTitle, ticketDescription, ticketPriority, department, createdBy, createdAt, assignedTo: assignedTo || null })
                });

                const data = await response.json();

                if (response.ok) {
                    console.log("Server says:", data.message);
                    // Dispatch custom event to notify other components that a new ticket was created
                    const ticketEvent = new CustomEvent("ticketCreated", {
                        
                        detail: data.ticket
                    });
                    document.dispatchEvent(ticketEvent);
                } else {
                    console.error("Failed to create ticket:", data.message);
                }
            } catch (error) {
                console.error("Error creating ticket:", error);
            }

            // Hide modal and reset form after submission (success or failure)
            ticketModal.classList.add("hidden");
            ticketForm.reset();
        });
    }
}