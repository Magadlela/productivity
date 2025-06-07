// Keyboard shortcuts functionality
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.setupShortcuts();
        this.setupEventListeners();
    }

    setupShortcuts() {
        // Global shortcuts
        this.addShortcut('ctrl+/', 'Show keyboard shortcuts', () => this.showShortcutsModal());
        this.addShortcut('ctrl+s', 'Save current item', (e) => {
            e.preventDefault();
            this.saveCurrentItem();
        });
        this.addShortcut('ctrl+f', 'Focus search', (e) => {
            e.preventDefault();
            document.getElementById('globalSearch').focus();
        });

        // Navigation shortcuts
        this.addShortcut('ctrl+1', 'Go to Home', () => window.location.href = 'index.html');
        this.addShortcut('ctrl+2', 'Go to Kanban', () => window.location.href = 'kanban.html');
        this.addShortcut('ctrl+3', 'Go to Notes', () => window.location.href = 'notes.html');
        this.addShortcut('ctrl+4', 'Go to Todo', () => window.location.href = 'todo.html');

        // Theme toggle
        this.addShortcut('ctrl+t', 'Toggle theme', () => {
            const themeToggle = document.querySelector('.theme-toggle');
            if (themeToggle) themeToggle.click();
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    addShortcut(key, description, callback) {
        this.shortcuts.set(key, { description, callback });
    }

    handleKeyPress(event) {
        const key = this.getKeyCombo(event);
        const shortcut = this.shortcuts.get(key);
        
        if (shortcut) {
            event.preventDefault();
            shortcut.callback(event);
        }
    }

    getKeyCombo(event) {
        const keys = [];
        if (event.ctrlKey) keys.push('ctrl');
        if (event.altKey) keys.push('alt');
        if (event.shiftKey) keys.push('shift');
        if (event.key !== 'Control' && event.key !== 'Alt' && event.key !== 'Shift') {
            keys.push(event.key.toLowerCase());
        }
        return keys.join('+');
    }

    showShortcutsModal() {
        const modal = document.createElement('div');
        modal.className = 'shortcuts-modal';
        modal.innerHTML = `
            <div class="shortcuts-content">
                <div class="shortcuts-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="shortcuts-list">
                    ${Array.from(this.shortcuts.entries())
                        .map(([key, { description }]) => `
                            <div class="shortcut-item">
                                <div class="shortcut-key">${key}</div>
                                <div class="shortcut-description">${description}</div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside or on close button
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-button')) {
                modal.remove();
            }
        });

        // Close modal with Escape key
        const closeModal = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeModal);
            }
        };
        document.addEventListener('keydown', closeModal);
    }

    saveCurrentItem() {
        // Determine current page and save accordingly
        const path = window.location.pathname;
        if (path.includes('kanban.html')) {
            // Save current project
            const saveButton = document.querySelector('.save-project');
            if (saveButton) saveButton.click();
        } else if (path.includes('notes.html')) {
            // Save current note
            const saveButton = document.querySelector('.save-note');
            if (saveButton) saveButton.click();
        } else if (path.includes('todo.html')) {
            // Save current todo
            const saveButton = document.querySelector('.save-todo');
            if (saveButton) saveButton.click();
        }
    }
}

// Add styles for shortcuts modal
const style = document.createElement('style');
style.textContent = `
    .shortcuts-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .shortcuts-content {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 20px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .shortcuts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .shortcuts-header h2 {
        margin: 0;
        color: var(--text-color);
    }

    .close-button {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
    }

    .shortcuts-list {
        display: grid;
        gap: 10px;
    }

    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: var(--hover-bg);
        border-radius: 4px;
    }

    .shortcut-key {
        background: var(--input-bg);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: monospace;
        color: var(--text-color);
    }

    .shortcut-description {
        color: var(--text-secondary);
    }
`;
document.head.appendChild(style);

// Initialize keyboard shortcuts
document.addEventListener('DOMContentLoaded', () => {
    new KeyboardShortcuts();
}); 