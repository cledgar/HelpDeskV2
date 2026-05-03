// js/status-page.js
// Renders a detailed ticket status view based on ticketId in the query string

async function loadTicketStatus() {
  const params = new URLSearchParams(window.location.search);
  const ticketId = params.get('ticketId');
  const container = document.getElementById('status-container');

  if (!ticketId) {
    container.innerHTML = '<p class="error">No ticket id provided in the URL.</p>';
    return;
  }

  try {
    const res = await fetch('/getTickets');
    if (!res.ok) throw new Error('Failed to fetch tickets');

    const tickets = await res.json();
    const ticket = tickets.find(t => String(t.id) === String(ticketId));

    if (!ticket) {
      container.innerHTML = `<p class="error">Ticket with id ${ticketId} not found.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="ticket-status-card" data-priority="${ticket.priority}">
        <div class="header">
          <h2>#${ticket.id} - ${ticket.title}</h2>
          <div class="current-status ${ticket.status}">${ticket.status}</div>
        </div>

        <div class="priority-box">Priority: <span class="priority-value">${ticket.priority}</span></div>

        <div class="department-box">Department: <span class="department-value">${ticket.department}</span></div>

        <div class="description-box">
          <h4>Description</h4>
          <p>${ticket.description}</p>
        </div>

        <p class="created-by">Created By: ${ticket.createdBy}</p>

        <div class="actions">
          <a class="back-link" href="/index.html">← Back to Tickets</a>
        </div>
      </div>
    `;

    // adjust status class for visibility
    const statusEl = container.querySelector('.current-status');
    if (statusEl) {
      statusEl.textContent = String(ticket.status).toUpperCase();
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="error">Error loading ticket status.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadTicketStatus);
