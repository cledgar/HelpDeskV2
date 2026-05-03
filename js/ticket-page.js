/**
 * @file ticket-page.js
 * @description Manages displaying tickets assigned to the current user on the ticket page.
 */

import { PriorityFilter, DateFilter } from '/js/tag-filtering.js';

let assignedTickets = [];
let closedTickets = [];
let currentSort = 'priority'; // 'priority', 'oldest', 'newest'
let filterMode = 'none'; // 'none', 'month-year', 'year', 'date-range'
let selectedYear = null;
let selectedMonth = null;
let dateRangeStart = null;
let dateRangeEnd = null;
let selectedStatuses = new Set();
let selectedPriorities = new Set();
let selectedDepartments = new Set();
let renderTimeout = null; // Debounce for filter renders

/**
 * Fetches tickets assigned to the current user.
 */
async function fetchAssignedTickets() {
  try {
    // Get current user
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) {
      console.error("No user data found");
      return;
    }

    const response = await fetch("/getTickets");
    if (response.ok) {
      const allTickets = await response.json();
      // Filter tickets assigned to current user and exclude closed tickets
      assignedTickets = allTickets.filter(
        (ticket) => ticket.assignedTo === userData.username && ticket.status !== 'closed'
      );
      renderAssignedTickets(assignedTickets);
    }
  } catch (error) {
    console.error("Error fetching assigned tickets:", error);
  }
}

/**
 * Fetches closed tickets for the current user.
 */
async function fetchClosedTickets() {
  try {
    // Get current user
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) {
      console.error("No user data found");
      return;
    }

    const response = await fetch("/getTickets");
    if (response.ok) {
      const allTickets = await response.json();
      // Filter closed tickets assigned to current user
      closedTickets = allTickets.filter(ticket => ticket.assignedTo === userData.username && ticket.status === 'closed');
      renderClosedTickets();
    }
  } catch (error) {
    console.error("Error fetching closed tickets:", error);
  }
}

/**
 * Applies date filters to tickets based on current filter settings.
 * @param {Array} tickets - Array of ticket objects to filter.
 * @returns {Array} Filtered tickets.
 */
function getAvailableStatuses(tickets) {
  return [...new Set(tickets.map((ticket) => ticket.status || 'pending'))].sort();
}

function getAvailablePriorities(tickets) {
  return [...new Set(tickets.map((ticket) => ticket.priority || 'low'))].sort();
}

function getAvailableDepartments(tickets) {
  return [...new Set(tickets.map((ticket) => ticket.department || 'General'))].sort();
}

function applyFilters(tickets) {
  let filtered = tickets;
  const dateFilter = new DateFilter();
  dateFilter.setItems(tickets);

  if (filterMode === 'month-year' && selectedMonth && selectedYear) {
    filtered = dateFilter.filterByMonthYear(selectedMonth, selectedYear);
  } else if (filterMode === 'year' && selectedYear) {
    filtered = dateFilter.filterByYear(selectedYear);
  } else if (filterMode === 'date-range' && dateRangeStart && dateRangeEnd) {
    filtered = dateFilter.filterByDateRange(dateRangeStart, dateRangeEnd);
  }

  if (selectedStatuses.size > 0) {
    filtered = filtered.filter((ticket) => selectedStatuses.has(ticket.status));
  }

  if (selectedPriorities.size > 0) {
    filtered = filtered.filter((ticket) => selectedPriorities.has(ticket.priority));
  }

  if (selectedDepartments.size > 0) {
    filtered = filtered.filter((ticket) => selectedDepartments.has(ticket.department));
  }

  return filtered;
}

/**
 * Sorts the tickets based on the current sort mode.
 * @param {Array} tickets - Array of ticket objects to sort.
 * @returns {Array} Sorted tickets.
 */
function sortTickets(tickets) {
  const sorted = [...tickets];
  if (currentSort === 'priority') {
    const filter = new PriorityFilter();
    filter.setItems(sorted);
    return filter.sortByPriority(true);
  } else if (currentSort === 'oldest') {
    return sorted.sort((a, b) => a.id - b.id);
  } else if (currentSort === 'newest') {
    return sorted.sort((a, b) => b.id - a.id);
  }
  return sorted;
}

/**
 * Renders only the filter controls (without re-rendering tickets)
 * @param {Array} tickets - Array of all ticket objects (for getting available years/months)
 */
function renderFilterControls(tickets) {
  const filtersContainer = document.getElementById("filter-popup-content");
  if (!filtersContainer) return; // Container doesn't exist yet

  // Get available years for filter dropdown
  const dateFilter = new DateFilter();
  dateFilter.setItems(tickets);
  const availableYears = dateFilter.getAvailableYears();
  
  // Get available months if a year is selected
  let availableMonths = [];
  if (selectedYear) {
    availableMonths = dateFilter.getAvailableMonths(selectedYear);
  }

  const availableStatuses = getAvailableStatuses(tickets);
  const availablePriorities = getAvailablePriorities(tickets);

  // Build filter controls HTML
  let filterHTML = `
    <div class="filter-controls">
      <div class="filter-section">
        <div class="filter-section-title">Filters</div>
        <div class="filter-category">
          <div class="filter-category-title">Date</div>
          <div class="filter-item-list">
            <button type="button" class="filter-item-btn ${filterMode === 'year' ? 'active' : ''}" data-filter="year">Year</button>
            <button type="button" class="filter-item-btn ${filterMode === 'month-year' ? 'active' : ''}" data-filter="month-year">Month & Year</button>
            <button type="button" class="filter-item-btn ${filterMode === 'date-range' ? 'active' : ''}" data-filter="date-range">Date Range</button>
          </div>
          <div class="date-filter-fields">
            ${filterMode === 'none' ? `<div class="filter-help">Select a date filter to configure it.</div>` : ''}
            ${filterMode === 'year' ? `
              <div class="filter-group">
                <label for="year-select">Year:</label>
                <select id="year-select" class="filter-select">
                  <option value="">Select Year</option>
                  ${availableYears.map(year => `<option value="${year}" ${selectedYear === year ? 'selected' : ''}>${year}</option>`).join('')}
                </select>
              </div>` : ''}
            ${filterMode === 'month-year' ? `
              <div class="filter-group">
                <label for="year-select">Year:</label>
                <select id="year-select" class="filter-select">
                  <option value="">Select Year</option>
                  ${availableYears.map(year => `<option value="${year}" ${selectedYear === year ? 'selected' : ''}>${year}</option>`).join('')}
                </select>
              </div>
              <div class="filter-group">
                <label for="month-select">Month:</label>
                <select id="month-select" class="filter-select" ${availableMonths.length === 0 ? 'disabled' : ''}>
                  <option value="">Select Month</option>
                  ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => {
                    const monthNum = index + 1;
                    if (availableMonths.includes(monthNum) || selectedMonth === monthNum) {
                      return `<option value="${monthNum}" ${selectedMonth === monthNum ? 'selected' : ''}>${month}</option>`;
                    }
                    return '';
                  }).join('')}
                </select>
              </div>` : ''}
            ${filterMode === 'date-range' ? `
              <div class="filter-group">
                <label for="start-date">Start Date:</label>
                <input type="date" id="start-date" class="filter-input" value="${dateRangeStart || ''}">
              </div>
              <div class="filter-group">
                <label for="end-date">End Date:</label>
                <input type="date" id="end-date" class="filter-input" value="${dateRangeEnd || ''}">
              </div>` : ''}
          </div>
        </div>
        <div class="filter-category">
          <div class="filter-category-title">Status</div>
          <div class="filter-item-list filter-checkbox-list">
            ${availableStatuses.map((status) => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="filter-checkbox" data-filter-type="status" value="${status}" ${selectedStatuses.has(status) ? 'checked' : ''}>
                ${status}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="filter-category">
          <div class="filter-category-title">Priority</div>
          <div class="filter-item-list filter-checkbox-list">
            ${availablePriorities.map((priority) => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="filter-checkbox" data-filter-type="priority" value="${priority}" ${selectedPriorities.has(priority) ? 'checked' : ''}>
                ${priority}
              </label>
            `).join('')}
          </div>
        </div>
        <div class="filter-category">
          <div class="filter-category-title">Department</div>
          <div class="filter-item-list filter-checkbox-list">
            ${getAvailableDepartments(tickets).map((department) => `
              <label class="filter-checkbox-label">
                <input type="checkbox" class="filter-checkbox" data-filter-type="department" value="${department}" ${selectedDepartments.has(department) ? 'checked' : ''}>
                ${department}
              </label>
            `).join('')}
          </div>
        </div>
      </div>`;

  const hasStatusOrPriorityOrDepartment = selectedStatuses.size > 0 || selectedPriorities.size > 0 || selectedDepartments.size > 0;
  const showActionButtons = filterMode !== 'none' || hasStatusOrPriorityOrDepartment;

  if (showActionButtons) {
    filterHTML += `
      <div class="filter-action-row">
        <button id="apply-filters-btn" class="apply-filter-btn">Apply</button>
        <button id="clear-filters-btn" class="clear-filter-btn">Clear Filters</button>
      </div>`;
  }

  filterHTML += `</div>`;
  filtersContainer.innerHTML = filterHTML;
}

/**
 * Renders the assigned tickets.
 * @param {Array} tickets - Array of ticket objects to display.
 */
function renderAssignedTickets(tickets) {
  const container = document.getElementById("ticket-container");

  // Only render full structure on first call or when container structure needs updating
  if (!document.getElementById("tickets-list")) {
    container.innerHTML = `
      <h1 class="ticket-title">My Assigned Tickets</h1>
      <div class="ticket-toolbar">
        <div class="sort-dropdown">
          <label for="sort-select">Sort by:</label>
          <select id="sort-select" class="sort-select">
            <option value="priority" ${currentSort === 'priority' ? 'selected' : ''}>Priority</option>
            <option value="oldest" ${currentSort === 'oldest' ? 'selected' : ''}>Oldest First</option>
            <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Newest First</option>
          </select>
        </div>
        <button id="open-filter-btn" class="filter-toggle-btn">Filter</button>
      </div>
      <div id="filter-popup" class="filter-popup hidden">
        <div class="filter-popup-backdrop" id="filter-popup-backdrop"></div>
        <div class="filter-popup-panel">
          <div class="filter-popup-header">
            <h2>Ticket Filters</h2>
            <button id="close-filter-btn" class="close-filter-btn" aria-label="Close">×</button>
          </div>
          <div id="filter-popup-content"></div>
        </div>
      </div>
      <div id="tickets-list"></div>
    `;
  }

  renderFilterControls(tickets);
  renderTicketCards(tickets);
}

/**
 * Renders only the ticket cards (without re-rendering filters)
 * @param {Array} tickets - Array of ticket objects to display.
 */
function renderTicketCards(tickets) {
  const ticketsContainer = document.getElementById("tickets-list");

  // Apply all active filters
  let filteredTickets = applyFilters(tickets);

  // Display message if no tickets are found after filtering
  if (filteredTickets.length === 0) {
    ticketsContainer.innerHTML = `<p class="no-tickets">No Assigned Tickets</p>`;
    return;
  }

  // Sort the tickets
  const sortedTickets = sortTickets(filteredTickets);

  ticketsContainer.innerHTML = sortedTickets
    .map(
      (ticket) => `
  <div class="ticket-card" data-priority="${ticket.priority}">
      <div>
          <h3>#${ticket.id} - ${ticket.title}</h3>
          <p>Description: ${ticket.description}</p>
          <p data-priority="${ticket.priority}">Priority: ${ticket.priority}</p>
          <p>Department: ${ticket.department}</p>
          <p>Status: ${ticket.status}</p>
          <p><strong>Created By: ${ticket.createdBy}</strong></p>
          <p>Created At: ${new Date(ticket.createdAt).toLocaleString()}</p>
      </div>
      <div class="ticket-actions">
          <button class="close-ticket-btn status-btn" data-id="${ticket.id}">Close Ticket</button>
          <button class="status-btn" data-id="${ticket.id}">Status</button>
      </div>
  </div>
  `,
    )
    .join("");
}

/**
 * Closes a ticket by updating its status to 'closed'.
 * @param {number} ticketId - The ID of the ticket to close.
 */
async function closeTicket(ticketId) {
  console.log('closeTicket called with ticketId:', ticketId);
  try {
    console.log('Making fetch request to:', `/closeTicket/${ticketId}`);
    const response = await fetch(`/closeTicket/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      // Remove the ticket from the local array and re-render
      assignedTickets = assignedTickets.filter(ticket => ticket.id !== ticketId);
      renderAssignedTickets(assignedTickets);
      // Refresh closed tickets from server to show the newly closed ticket
      fetchClosedTickets();
    } else {
      console.error('Failed to close ticket');
      alert('Failed to close ticket. Please try again.');
    }
  } catch (error) {
    console.error('Error closing ticket:', error);
    alert('Error closing ticket. Please try again.');
  }
}

/**
 * Renders the closed tickets history section.
 */
function renderClosedTickets() {
  const container = document.getElementById("ticket-container");

  // Check if closed tickets section already exists
  let closedSection = document.getElementById("closed-tickets-section");
  if (!closedSection) {
    closedSection = document.createElement("div");
    closedSection.id = "closed-tickets-section";
    closedSection.className = "closed-tickets-section";
    container.appendChild(closedSection);
  }

  if (closedTickets.length === 0) {
    closedSection.innerHTML = `
      <h2>Closed Tickets History</h2>
      <p class="no-tickets">No closed tickets yet.</p>
    `;
    return;
  }

  closedSection.innerHTML = `
    <h2>Closed Tickets History</h2>
    <div class="closed-tickets-list">
      ${closedTickets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
        .map(
          (ticket) => `
      <div class="closed-ticket-card">
        <div class="closed-ticket-header">
          <h3>#${ticket.id} - ${ticket.title}</h3>
          <span class="closed-date">Closed: ${new Date(ticket.createdAt).toLocaleString()}</span>
        </div>
        <div class="closed-ticket-details">
          <p><strong>Description:</strong> ${ticket.description}</p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Department:</strong> ${ticket.department}</p>
          <p><strong>Created By:</strong> ${ticket.createdBy}</p>
        </div>
      </div>
      `,
        )
        .join("")}
    </div>
  `;
}

/**
 * Event delegation for ticket actions, sort dropdown, and date filters.
 */
document
  .getElementById("ticket-container")
  .addEventListener("change", (event) => {
    // Handle sort dropdown change - immediate render
    if (event.target.id === 'sort-select') {
      currentSort = event.target.value;
      renderTicketCards(assignedTickets);
      return;
    }

    // Handle year selection - debounced render
    if (event.target.id === 'year-select') {
      selectedYear = event.target.value ? parseInt(event.target.value) : null;
      selectedMonth = null; // Reset month when year changes
      renderFilterControls(assignedTickets); // Update filters first (for month dropdown)
      debouncedRender(); // Then update tickets with debounce
      return;
    }

    // Handle month selection - debounced render
    if (event.target.id === 'month-select') {
      selectedMonth = event.target.value ? parseInt(event.target.value) : null;
      debouncedRender();
      return;
    }

    // Handle date input changes - just update state, don't render
    if (event.target.id === 'start-date') {
      dateRangeStart = event.target.value;
      return;
    }
    if (event.target.id === 'end-date') {
      dateRangeEnd = event.target.value;
      return;
    }

    // Handle status/priority checkbox changes
    if (event.target.classList.contains('filter-checkbox')) {
      const type = event.target.dataset.filterType;
      const value = event.target.value;
      if (type === 'status') {
        if (event.target.checked) selectedStatuses.add(value);
        else selectedStatuses.delete(value);
      }
      if (type === 'priority') {
        if (event.target.checked) selectedPriorities.add(value);
        else selectedPriorities.delete(value);
      }
      if (type === 'department') {
        if (event.target.checked) selectedDepartments.add(value);
        else selectedDepartments.delete(value);
      }
      return;
    }
  });

document
  .getElementById("ticket-container")
  .addEventListener("click", async (event) => {
    // Handle apply button for filters
    if (event.target.id === 'apply-filters-btn') {
      let valid = true;
      if (filterMode === 'year') {
        valid = selectedYear !== null;
        if (!valid) alert('Please select a year.');
      } else if (filterMode === 'month-year') {
        valid = selectedYear !== null && selectedMonth !== null;
        if (!selectedYear) alert('Please select a year.');
        else if (!selectedMonth) alert('Please select a month.');
      } else if (filterMode === 'date-range') {
        valid = Boolean(dateRangeStart && dateRangeEnd);
        if (!dateRangeStart || !dateRangeEnd) alert('Please select both start and end dates.');
      }

      if (valid) {
        renderTicketCards(assignedTickets);
        const popup = document.getElementById('filter-popup');
        if (popup) popup.classList.add('hidden');
      }
      return;
    }

    // Handle filter item selection within the category list
    if (event.target.classList.contains('filter-item-btn')) {
      const selectedFilter = event.target.dataset.filter;
      if (selectedFilter && selectedFilter !== filterMode) {
        filterMode = selectedFilter;
        selectedYear = null;
        selectedMonth = null;
        dateRangeStart = null;
        dateRangeEnd = null;
        renderFilterControls(assignedTickets);
      }
      return;
    }

    // Handle clear filters button
    if (event.target.id === 'clear-filters-btn') {
      filterMode = 'none';
      selectedYear = null;
      selectedMonth = null;
      dateRangeStart = null;
      dateRangeEnd = null;
      selectedStatuses.clear();
      selectedPriorities.clear();
      selectedDepartments.clear();
      renderAssignedTickets(assignedTickets); // Full render to reset all controls
      return;
    }

    // Open filter popup
    if (event.target.id === 'open-filter-btn') {
      const popup = document.getElementById('filter-popup');
      if (popup) popup.classList.remove('hidden');
      return;
    }

    // Close filter popup by close button or backdrop
    if (event.target.id === 'close-filter-btn' || event.target.id === 'filter-popup-backdrop') {
      const popup = document.getElementById('filter-popup');
      if (popup) popup.classList.add('hidden');
      return;
    }

    // Handle close ticket button
    if (event.target.classList.contains("close-ticket-btn")) {
      const ticketId = parseInt(event.target.getAttribute("data-id"));
      if (confirm("Are you sure you want to close this ticket?")) {
        closeTicket(ticketId);
      }
      return;
    }

    // Navigate to status page when Status button clicked
    if (event.target.classList.contains("status-btn")) {
      const ticketId = parseInt(event.target.getAttribute("data-id"));
      window.location.href = `/pages/status-page.html?ticketId=${ticketId}`;
      return;
    }
  });

/**
 * Initialize assigned tickets on page load.
 */
document.addEventListener("DOMContentLoaded", () => {
  fetchAssignedTickets().catch((error) => {
    console.error("Failed to initialize assigned tickets:", error);
  });
  fetchClosedTickets().catch((error) => {
    console.error("Failed to initialize closed tickets:", error);
  });
});

// Set up polling to keep tickets synchronized with the server every 2 seconds
setInterval(() => {
  fetchAssignedTickets();
  fetchClosedTickets();
}, 2000);