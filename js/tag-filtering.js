// Tag Filtering System - Priority-based filtering

class PriorityFilter {
    constructor() {
        this.items = [];
        this.priorities = [];
        // high > medium > low
        this.priorityOrder = ['high', 'medium', 'low'];
    }

    setItems(items) {
        this.items = items;
        this.priorities = [...new Set(items.map(item => item.priority))];
    }

    filterByPriority(priority) {
        if (!this.priorities.includes(priority)) {
            console.error('Invalid priority level');
            return [];
        }
        return this.items.filter(item => item.priority === priority);
    }

    filterByPriorities(priorityArray) {
        return this.items.filter(item => priorityArray.includes(item.priority));
    }

    sortByPriority(descending = true) {
        const order = descending ? this.priorityOrder : [...this.priorityOrder].reverse();
        
        return [...this.items].sort((a, b) => {
            const aPriorityIndex = order.indexOf(a.priority);
            const bPriorityIndex = order.indexOf(b.priority);
            
            if (aPriorityIndex !== bPriorityIndex) {
                return aPriorityIndex - bPriorityIndex;
            }
            
            return a.id - b.id;
        });
    }

    filterAbovePriority(minPriority) {
        const minIndex = this.priorityOrder.indexOf(minPriority);
        return this.items.filter(item => 
            this.priorityOrder.indexOf(item.priority) >= minIndex
        );
    }
}

// Date Filtering System - Filter by month, year, and date ranges

class DateFilter {
    constructor() {
        this.items = [];
    }

    setItems(items) {
        this.items = items;
    }

    /**
     * Filters tickets by a specific month and year
     * @param {number} month - Month number (1-12)
     * @param {number} year - Year (e.g., 2024)
     * @returns {Array} Filtered tickets
     */
    filterByMonthYear(month, year) {
        return this.items.filter(item => {
            const date = new Date(item.createdAt);
            return date.getMonth() === month - 1 && date.getFullYear() === year;
        });
    }

    /**
     * Filters tickets by a specific year
     * @param {number} year - Year (e.g., 2024)
     * @returns {Array} Filtered tickets
     */
    filterByYear(year) {
        return this.items.filter(item => {
            const date = new Date(item.createdAt);
            return date.getFullYear() === year;
        });
    }

    /**
     * Filters tickets within a date range (inclusive of both start and end dates)
     * Properly handles timezone by comparing date portions only
     * @param {Date|string} startDate - Start date (YYYY-MM-DD format from date input)
     * @param {Date|string} endDate - End date (YYYY-MM-DD format from date input)
     * @returns {Array} Filtered tickets
     */
    filterByDateRange(startDate, endDate) {
        // Parse the dates from the format YYYY-MM-DD
        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
        
        // Create date objects in UTC for comparison
        const start = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
        const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));

        return this.items.filter(item => {
            // Parse the createdAt ISO string and compare
            const date = new Date(item.createdAt);
            return date >= start && date <= end;
        });
    }

    /**
     * Filters tickets by a specific month across all years
     * @param {number} month - Month number (1-12)
     * @returns {Array} Filtered tickets
     */
    filterByMonth(month) {
        return this.items.filter(item => {
            const date = new Date(item.createdAt);
            return date.getMonth() === month - 1;
        });
    }

    /**
     * Gets all available years from tickets
     * @returns {Array} Sorted array of years
     */
    getAvailableYears() {
        const years = [...new Set(this.items.map(item => new Date(item.createdAt).getFullYear()))];
        return years.sort((a, b) => b - a);
    }

    /**
     * Gets all available months in a specific year
     * @param {number} year - Year (e.g., 2024)
     * @returns {Array} Array of month numbers (1-12) that have tickets
     */
    getAvailableMonths(year) {
        const months = [...new Set(
            this.items
                .filter(item => new Date(item.createdAt).getFullYear() === year)
                .map(item => new Date(item.createdAt).getMonth() + 1)
        )];
        return months.sort((a, b) => a - b);
    }
}

class DepartmentFilter {
    constructor() {
        this.items = [];
        this.departments = [];
    }

    setItems(items) {
        this.items = items;
        this.departments = [...new Set(items.map(item => item.department))];
    }

    filterByDepartment(department) {
        if (!this.departments.includes(department)) {
            console.error('Invalid department');
            return [];
        }
        return this.items.filter(item => item.department === department);
    }
}

export { PriorityFilter, DateFilter, DepartmentFilter };