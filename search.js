// Global search functionality
class GlobalSearch {
    constructor() {
        this.searchInput = document.getElementById('globalSearch');
        this.searchButton = document.getElementById('searchButton');
        this.searchResults = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', this.debounce(() => this.performSearch(), 300));
        this.searchButton.addEventListener('click', () => this.performSearch());
        document.addEventListener('click', (e) => this.handleClickOutside(e));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (query.length < 2) {
            this.clearResults();
            return;
        }

        const results = await this.searchAllComponents(query);
        this.displayResults(results);
    }

    async searchAllComponents(query) {
        const results = [];

        // Search in Kanban tasks
        const kanbanTasks = this.searchKanbanTasks(query);
        results.push(...kanbanTasks);

        // Search in Notes
        const notes = this.searchNotes(query);
        results.push(...notes);

        // Search in Todo items
        const todos = this.searchTodos(query);
        results.push(...todos);

        return results;
    }

    searchKanbanTasks(query) {
        const projects = JSON.parse(localStorage.getItem('projects')) || [];
        const results = [];

        projects.forEach(project => {
            Object.entries(project.columns).forEach(([column, tasks]) => {
                tasks.forEach(task => {
                    if (this.matchesSearch(task, query)) {
                        results.push({
                            type: 'Kanban Task',
                            title: task.title,
                            preview: task.description,
                            project: project.name,
                            column: column,
                            id: task.id,
                            projectId: project.id,
                            action: () => this.navigateToKanbanTask(project.id, task.id)
                        });
                    }
                });
            });
        });

        return results;
    }

    searchNotes(query) {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const results = [];

        notes.forEach(note => {
            if (this.matchesSearch(note, query)) {
                results.push({
                    type: 'Note',
                    title: note.title,
                    preview: note.content,
                    id: note.id,
                    action: () => this.navigateToNote(note.id)
                });
            }
        });

        return results;
    }

    searchTodos(query) {
        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        const results = [];

        todos.forEach(todo => {
            if (this.matchesSearch(todo, query)) {
                results.push({
                    type: 'Todo',
                    title: todo.title,
                    preview: todo.description,
                    id: todo.id,
                    action: () => this.navigateToTodo(todo.id)
                });
            }
        });

        return results;
    }

    matchesSearch(item, query) {
        const searchableFields = ['title', 'description', 'content'];
        const queryLower = query.toLowerCase();

        return searchableFields.some(field => {
            if (item[field]) {
                return item[field].toLowerCase().includes(queryLower);
            }
            return false;
        });
    }

    displayResults(results) {
        this.clearResults();

        if (results.length === 0) {
            return;
        }

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';

        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="result-type">${result.type}</div>
                <div class="result-title">${result.title}</div>
                <div class="result-preview">${result.preview || ''}</div>
            `;
            resultItem.addEventListener('click', () => {
                result.action();
                this.clearResults();
            });
            resultsContainer.appendChild(resultItem);
        });

        this.searchResults = resultsContainer;
        this.searchInput.parentElement.appendChild(resultsContainer);
    }

    clearResults() {
        if (this.searchResults) {
            this.searchResults.remove();
            this.searchResults = null;
        }
    }

    handleClickOutside(event) {
        if (this.searchResults && !event.target.closest('.global-search')) {
            this.clearResults();
        }
    }

    navigateToKanbanTask(projectId, taskId) {
        // Navigate to Kanban board and highlight the task
        window.location.href = `kanban.html?project=${projectId}&task=${taskId}`;
    }

    navigateToNote(noteId) {
        // Navigate to Notes and highlight the note
        window.location.href = `notes.html?note=${noteId}`;
    }

    navigateToTodo(todoId) {
        // Navigate to Todo list and highlight the todo
        window.location.href = `todo.html?todo=${todoId}`;
    }
}

// Initialize global search
document.addEventListener('DOMContentLoaded', () => {
    new GlobalSearch();
}); 