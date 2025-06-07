// DOM Elements
const todoList = document.getElementById('todo-list');
const addTaskBtn = document.querySelector('.add-task-btn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const closeBtn = document.querySelector('.close-btn');
const viewBtns = document.querySelectorAll('.view-btn');
const searchInput = document.querySelector('.search-bar input');
const themeToggle = document.querySelector('.theme-toggle');

// Tasks data structure
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentView = 'all';

// Initialize the app
function init() {
    renderTasks();
    setupEventListeners();
    loadTheme();
}

// Render tasks
function renderTasks(filteredTasks = null) {
    const tasksToRender = filteredTasks || filterTasksByView(tasks);
    todoList.innerHTML = tasksToRender.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskComplete('${task.id}')">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}">
                    ${task.title}
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                <div class="task-meta">
                    <div class="task-category">
                        <i class="fas fa-tag"></i>
                        ${task.category}
                    </div>
                    ${task.dueDate ? `
                        <div class="task-due-date">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(task.dueDate)}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="editTask('${task.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Filter tasks by current view
function filterTasksByView(tasks) {
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();

    switch (currentView) {
        case 'today':
            return tasks.filter(task => 
                task.dueDate && new Date(task.dueDate).toDateString() === today
            );
        case 'upcoming':
            return tasks.filter(task => 
                task.dueDate && new Date(task.dueDate).toDateString() > today
            );
        default:
            return tasks;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add task button
    addTaskBtn.addEventListener('click', () => {
        taskModal.classList.add('active');
        taskForm.reset();
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    // Close modal when clicking outside
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.classList.remove('active');
        }
    });

    // Form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(taskForm);
        const task = {
            id: Date.now().toString(),
            title: formData.get('taskTitle'),
            description: formData.get('taskDescription'),
            dueDate: formData.get('taskDueDate'),
            priority: formData.get('taskPriority'),
            category: formData.get('taskCategory'),
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(task);
        saveTasks();
        renderTasks();
        taskModal.classList.remove('active');
    });

    // View buttons
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderTasks();
        });
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredTasks = tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm)
        );
        renderTasks(filteredTasks);
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
}

// Toggle task completion
function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
    }
}

// Edit task
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskDueDate').value = task.dueDate;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;

        taskModal.classList.add('active');
        taskForm.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(taskForm);
            task.title = formData.get('taskTitle');
            task.description = formData.get('taskDescription');
            task.dueDate = formData.get('taskDueDate');
            task.priority = formData.get('taskPriority');
            task.category = formData.get('taskCategory');

            saveTasks();
            renderTasks();
            taskModal.classList.remove('active');
            taskForm.onsubmit = null;
        };
    }
}

// Delete task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Theme management
function loadTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    themeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
}

// Initialize the app
init(); 