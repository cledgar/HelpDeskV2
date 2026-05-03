/**
 * @file tickets-template.js
 * @description Manages fetching, rendering, and deleting support tickets on the dashboard.
 */

import { PriorityFilter, DateFilter } from './tag-filtering.js';

let tickets = [];
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
 * Fetches all tickets from the server and updates the UI.
 */
async function fetchTickets() {
  try {
    const response = await fetch("/getTickets");
    if (response.ok) {
      tickets = await response.json();
      if (document.getElementById("tickets-list")) {
        renderTicketCards(tickets);
      } else {
        renderTickets(tickets);
      }
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
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
 * Renders only the ticket cards (without re-rendering filters)
 * @param {Array} tickets - Array of ticket objects to display.
 */
function renderTicketCards(tickets) {
  const container = document.getElementById("ticket-container");
  const ticketsContainer = document.getElementById("tickets-list");

  // Apply all active filters
  let filteredTickets = applyFilters(tickets);

  // Display message if no tickets are found after filtering
  if (filteredTickets.length === 0) {
    ticketsContainer.innerHTML = `<p class="no-tickets">No Pending Tickets</p>`;
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
          <button class="status-btn" data-id="${ticket.id}">Status</button>
          <button class="delete-ticket-btn" data-id="${ticket.id}" id="delete-ticket-button">Delete</button>
      </div>
  </div>
  `,
    )
    .join("");
}

/**
 * Renders the complete tickets section with filters and cards.
 * Separates filter rendering from ticket rendering for better responsiveness.
 * @param {Array} tickets - Array of ticket objects to display.
 */
function renderTickets(tickets) {
  const container = document.getElementById("ticket-container");

  // Only render full structure on first call or when container structure needs updating
  if (!document.getElementById("tickets-list")) {
    container.innerHTML = `
      <h1 class="ticket-title">Tickets</h1>
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
 * Debounced function to update ticket display
 * Prevents rapid re-renders by debouncing filter changes
 */
function debouncedRender() {
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  renderTimeout = setTimeout(() => {
    renderTicketCards(tickets);
    renderTimeout = null;
  }, 100); // 100ms debounce
}

/**
 * Event delegation for ticket deletion, sort dropdown, and date filters.
 * Listens for clicks on delete buttons and changes on dropdowns/inputs within the ticket container.
 */
document
  .getElementById("ticket-container")
  .addEventListener("change", (event) => {
    // Handle sort dropdown change - immediate render
    if (event.target.id === 'sort-select') {
      currentSort = event.target.value;
      renderTicketCards(tickets);
      return;
    }

    // Handle year selection - debounced render
    if (event.target.id === 'year-select') {
      selectedYear = event.target.value ? parseInt(event.target.value) : null;
      selectedMonth = null; // Reset month when year changes
      renderFilterControls(tickets); // Update filters first (for month dropdown)
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
      return;
      }
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
        renderTicketCards(tickets);
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
        renderFilterControls(tickets);
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
      renderTickets(tickets); // Full render to reset all controls
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

    // Navigate to status page when Status button clicked
    if (event.target.classList.contains("status-btn")) {
      const ticketId = parseInt(event.target.getAttribute("data-id"));
      window.location.href = `/pages/status-page.html?ticketId=${ticketId}`;
      return;
    }

    // Check if the clicked element is a delete button
    if (event.target.classList.contains("delete-ticket-btn")) {
      const ticketId = parseInt(event.target.getAttribute("data-id"));

      // Optimistically remove the ticket from the local array
      tickets = tickets.filter((t) => t.id !== ticketId);

      try {
        // Send delete request to the server
        const response = await fetch(`/deleteTicket/${ticketId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        console.log(result.message);
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }

      // Re-render the tickets to reflect changes
      renderTicketCards(tickets);
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
  fetchTickets().catch((error) => {
    console.error("Failed to initialize tickets:", error);
  });
});

// Initial render
renderTickets(tickets);

// Set up polling to keep tickets synchronized with the server every 2 seconds
setInterval(fetchTickets, 2000);
