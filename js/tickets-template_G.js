/**
 * @file tickets-template.js
 * @description Manages fetching, rendering, and deleting support tickets on the dashboard.
 */

let tickets = [];

/**
 * Fetches all tickets from the server and updates the UI.
 */
async function fetchTickets() {
    try {
        const response = await fetch("/getTickets");
        if (response.ok) {
            tickets = await response.json();
            renderTickets(tickets);
        }
    } catch (error) {
        console.error("Error fetching tickets:", error);
    }
}

/**
 * Renders the list of tickets into the ticket container.
 * @param {Array} tickets - Array of ticket objects to display.
 */
function renderTickets(tickets) {
    const container = document.getElementById("ticket-container");

    // Display message if no tickets are found
    if (tickets.length === 0) {
        container.innerHTML = `<h1 class="ticket-title">Tickets</h1>
                               <p class="no-tickets">No, Pending Tickets</p>`;
        return container;
    }

    // Map ticket data to HTML cards
    container.innerHTML = `<h1 class="ticket-title">Tickets</h1>` + tickets.map(ticket => `
    <div class="ticket-card" data-priority="${ticket.priority}">
        <div>
            <h3>#${ticket.id} - ${ticket.title}</h3>
            <p>Description: ${ticket.description}</p>
            <p data-priority="${ticket.priority}">Priority: ${ticket.priority}</p>
            <p>Status: ${ticket.status}</p>
            <p><strong>Created By: ${ticket.createdBy}</strong></p>
        </div>
        <button class="delete-ticket-btn" data-id="${ticket.id}" id="delete-ticket-button">Delete</button>
    </div>
    `).join("");
}

/**
 * Event delegation for ticket deletion.
 * Listens for clicks on delete buttons within the ticket container.
 */
document.getElementById("ticket-container").addEventListener("click", async (event) => {
    // Check if the clicked element is a delete button
    if (event.target.classList.contains("delete-ticket-btn")) {
        const ticketId = parseInt(event.target.getAttribute("data-id"));

        // Optimistically remove the ticket from the local array
        tickets = tickets.filter(t => t.id !== ticketId);

        try {
            // Send delete request to the server
            const response = await fetch(`/deleteTicket/${ticketId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
            });

            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error("Error deleting ticket:", error);
        }

        // Re-render the list to reflect changes
        renderTickets(tickets);
    }
});

/**
 * Listen for the custom 'ticketCreated' event to add newly created tickets to the list.
 */
document.addEventListener("ticketCreated", (event) => {
    const newTicket = event.detail;

    if (newTicket) {
        tickets.push(newTicket);
        renderTickets(tickets);
    }
});

/**
 * Initialize tickets on page load.
 */
document.addEventListener("DOMContentLoaded", () => {
    fetchTickets().catch(error => {
        console.error("Failed to initialize tickets:", error);
    });
});

// Initial render
renderTickets(tickets);

// Set up polling to keep tickets synchronized with the server every 2 seconds
setInterval(fetchTickets, 2000);