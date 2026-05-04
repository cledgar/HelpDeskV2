/**
 * @file user-page.js
 * @description Handles loading, filtering, searching and displaying users.
 * Admins can edit user roles via an inline modal.
 */

import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {

    // --- State ---
    let allUsers = [];
    let currentFilter = "all";
    let currentView = "table";
    let searchQuery = "";

    // --- Element References ---
    const tableBody = document.getElementById("table-body");
    const gridBody = document.getElementById("grid-body");
    const tableView = document.getElementById("table-view");
    const gridView = document.getElementById("grid-view");
    const loadingState = document.getElementById("loading-state");
    const emptyState = document.getElementById("empty-state");
    const userSearch = document.getElementById("user-search");
    const tableViewBtn = document.getElementById("table-view-btn");
    const gridViewBtn = document.getElementById("grid-view-btn");
    const filterTabs = document.querySelectorAll(".filter-tab");

    // --- Get current user role ---
    const storedUser = localStorage.getItem("userData");
    const currentUser = storedUser ?JSON.parse(storedUser) : null;
    const isAdmin = currentUser?.role === "admin";

    // --- Inject Modal into page ---
    const modal = document.createElement("div");
    modal.id = "role-modal";
    modal.className = "role-modal-overlay hidden";
    modal.innerHTML = `
        <div class="role-modal">
            <div class="role-modal-header">
                <h3>Change User Role</h3>
                <button class="role-modal-close" id="close-role-modal">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="role-modal-body">
                <div class="role-modal-user" id="modal-user-info"></div>
                <label for="modal-role-select">Select Role</label>
                <select id="modal-role-select" class="role-select">
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                </select>
                <p class="role-modal-desc">
                    <i class="fa-solid fa-circle-info"></i>
                    Changing a user's role affects what they can see and do in the system.
                </p>
            </div>
            <div class="role-modal-footer">
                <button class="role-cancel-btn" id="cancel-role-modal">Cancel</button>
                <button class="role-save-btn" id="save-role-btn">
                    <i class="fa-solid fa-floppy-disk"></i> Save Role
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let editingUserId = null;
    
    // --- Open Modal ---
    function openRoleModal(user) {
        editingUserId = user.id;
        const initials = ((user.firstname?.[0] || "") + (user.lastname?.[0] || "")).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
        const avatarHtml = user.avatar_url
            ? `<img src="${user.avatar_url}" alt="${user.username}">`
            : initials;

        document.getElementById("modal-user-info").innerHTML = `
            <div class="modal-avatar">${avatarHtml}</div>
            <div>
                <div class="modal-user-name">${(user.firstname || "") + " " + (user.lastname || "")}</div>
                <div class="modal-user-username">@${user.username}</div>
            </div>
        `;

        document.getElementById("modal-role-select").value = user.role;
        modal.classList.remove("hidden");
    }

    // --- Close Modal ---

    function closeModal() {
        modal.classList.add("hidden");
        editingUserId = null;
    }

    document.getElementById("close-role-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-role-modal").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    // --- Save Role ---
    document.getElementById("save-role-btn").addEventListener("click", async () => {
        const newRole = document.getElementById("modal-role-select").value;
        const saveBtn = document.getElementById("save-role-btn");

        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;

        const { error } = await supabase
            .from("users")
            .update({ role: newRole })
            .eq("id", editingUserId);
        
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Role';
        saveBtn.disabled = false;

        if (error) {
            console.error("Role update error:", error);
            alert("Failed to update role. Please try again.");
            return;
        }

        // Update local data and re-render
        const user = allUsers.find(u => u.id === editingUserId);
        if (user) user.role = newRole;
        updateCounts();
        renderUsers();
        closeModal();
    });

    // --- Fetch Users ---
    async function fetchUsers() {
        loadingState.style.display = "flex";
        tableView.style.display = "none";
        gridView.style.display = "none";
        emptyState.style.display = "none";

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });
        
        loadingState.style.display = "none";

        if (error) {
            console.error("Error fetching users:", error);
            return;
        }

        allUsers = data;
        updateCounts();
        renderUsers();
    }

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

    console.log("data:", data);
    console.log("error:", error);
    console.log("session:", await supabase.auth.getSession());

    // --- Update Tab Counts ---
    function updateCounts() {
        document.getElementById("count-all").textContent = allUsers.length;
        document.getElementById("count-client").textContent = allUsers.filter(u => u.role === "client").length;
        document.getElementById("count-employee").textContent = allUsers.filter(u => u.role === "employee").length;
        document.getElementById("count-admin").textContent = allUsers.filter(u => u.role === "admin").length;
    }

    // --- Filter and Search Users ---
    function getFilteredUsers() {
        return allUsers.filter(user => {
            const matchesFilter = currentFilter === "all" || user.role === currentFilter;
            const query = searchQuery.toLowerCase();
            const matchesSearch = !query ||
                (user.firstname && user.firstname.toLowerCase().includes(query)) ||
                (user.lastname && user.lastname.toLowerCase().includes(query)) ||
                (user.username && user.username.toLowerCase().includes(query)) ||
                (user.email && user.email.toLowerCase().includes(query));
            return matchesFilter && matchesSearch;
        });
    }

    // --- Get Initials ---
    function getInitials(user) {
        const first = user.firstname?.[0] || "";
        const last = user.lastname?.[0] || "";
        return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || "?";
    }

    // --- Format Date ---
    function formatDate(dateString) {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    }

    // --- Render Avatar ---
    function renderAvatar(user, size = "small") {
        const cls = size === "large" ? "user-card-avatar" : "user-avatar";
        if (user.avatar_url) {
            return `<div class="${cls}"><img src="${user.avatar_url}" alt="${user.username}"></div>`;
        }
        return `<div class="${cls}">${getInitials(user)}</div>`;
    }
    
    // --- Render Edit Button (Admin only) ---
    function renderEditBtn(userId) {
        if (!isAdmin) return "";
        return `<button class="action-btn edit-btn" data-id="${userId}">
            <i class="fa-solid fa-shield"></i> Role
        </button>`;
    }

    // --- Render Table View ---
    function renderTable(users) {
        if (users.length === 0) {
            tableView.style.display = "none";
            emptyState.style.display = "flex";
            return;
        }

        emptyState.style.display = "none";
        tableView.style.display = "block";

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-cell">
                        ${renderAvatar(user)}
                        <span class="user-full-name">${user.firstname || ""} ${user.lastname || ""}</span>
                    </div>
                </td>
                <td>@${user.username || "—"}</td>
                <td>${user.email || "—"}</td>
                <td>${user.phone || "—"}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${formatDate(user.created_at)}</td>
                ${isAdmin ? `<td>${renderEditBtn(user.id)}</td>` : ""}
            </tr>
        `).join("");
    }

    // --- Render Grid View ---
    function renderGrid(users) {
        if (users.length === 0) {
            gridView.style.display = "none";
            emptyState.style.display = "flex";
            return;
        }

        emptyState.style.display = "none";
        gridView.style.display = "block";

        gridBody.innerHTML = users.map(user => `
            <div class="user-card">
                ${renderAvatar(user, "large")}
                <div class="user-card-name">${user.firstname || ""} ${user.lastname || ""}</div>
                <div class="user-card-username">@${user.username || "—"}</div>
                <div class="user-card-email">${user.email || "—"}</div>
                <span class="role-badge ${user.role}">${user.role}</span>
                ${renderEditBtn(user.id)}
            </div>
        `).join("");
    }

    // --- Render Users ---
    function renderUsers() {
        const filtered = getFilteredUsers();
        tableView.style.display = "none";
        gridView.style.display = "none";

        if (currentView === "table") {
            renderTable(filtered);
        } else {
            renderGrid(filtered);
        }

        // Attach edit button listeners
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const userId = btn.getAttribute("data-id");
                const user = allUsers.find(u => u.id === userId);
                if (user) openRoleModal(user);
            });
        });
    }

    // --- View Toggle ---
    tableViewBtn.addEventListener("click", () => {
        currentView = "table";
        tableViewBtn.classList.add("active");
        gridViewBtn.classList.remove("active");
        renderUsers();
    });

    gridViewBtn.addEventListener("click", () => {
        currentView = "grid";
        gridViewBtn.classList.add("active");
        tableViewBtn.classList.remove("active");
        renderUsers();
    });

    // --- Filter Tabs ---
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentFilter = tab.getAttribute("data-filter");
            renderUsers();
        });
    });

    // --- Search ---
    userSearch.addEventListener("input", () => {
        searchQuery = userSearch.value;
        renderUsers();
    });

    // --- Init ---
    fetchUsers();
});