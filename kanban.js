// DOM Elements
const projectSelector = document.getElementById('projectSelector');
const newProjectModal = document.getElementById('newProjectModal');
const newTaskModal = document.getElementById('newTaskModal');
const themeToggle = document.querySelector('.theme-toggle');

// Data structure
let projects = JSON.parse(localStorage.getItem('projects')) || [];
let currentProject = null;

// Initialize the app
function init() {
    loadProjects();
    setupEventListeners();
    loadTheme();
    updateCalendar();
    updateStats();
}

// Load projects from localStorage
function loadProjects() {
    if (projects.length === 0) {
        // Create default project if none exists
        createDefaultProject();
    }
    updateProjectSelector();
    switchProject(projects[0].id);
}

// Create default project
function createDefaultProject() {
    const defaultProject = {
        id: Date.now().toString(),
        name: 'My First Project',
        description: 'Welcome to your first project!',
        columns: {
            todo: [],
            inprogress: [],
            done: []
        },
        createdAt: new Date().toISOString()
    };
    projects.push(defaultProject);
    saveProjects();
}

// Update project selector
function updateProjectSelector() {
    projectSelector.innerHTML = projects.map(project => 
        `<option value="${project.id}">${project.name}</option>`
    ).join('');
}

// Switch between projects
function switchProject(projectId) {
    currentProject = projects.find(p => p.id === projectId);
    if (currentProject) {
        renderBoard();
        updateCalendar();
        updateStats();
    }
}

// Render the board
function renderBoard() {
    const columns = ['todo', 'inprogress', 'done'];
    columns.forEach(column => {
        const taskList = document.querySelector(`#${column} .task-list`);
        taskList.innerHTML = currentProject.columns[column].map(task => createTaskElement(task)).join('');
    });
}

// Create task element
function createTaskElement(task) {
    return `
        <div class="task" draggable="true" ondragstart="drag(event)" data-id="${task.id}">
            <div class="task-header">
                <span class="task-label ${task.label.toLowerCase()}">${task.label}</span>
                <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="task-footer">
                ${task.assignee ? `<span class="task-assignee">👤 ${task.assignee}</span>` : ''}
                ${task.estimate ? `<span class="task-estimate">⏱️ ${task.estimate}h</span>` : ''}
                ${task.dueDate ? `<span class="task-due-date">📅 ${formatDate(task.dueDate)}</span>` : ''}
            </div>
        </div>
    `;
}

// Drag and drop functionality
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.dataset.id);
}

function drop(ev) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text");
    const newColumn = ev.target.closest('.column').id;
    moveTask(taskId, newColumn);
}

// Move task between columns
function moveTask(taskId, newColumn) {
    const oldColumn = Object.keys(currentProject.columns).find(col => 
        currentProject.columns[col].some(task => task.id === taskId)
    );

    if (oldColumn && oldColumn !== newColumn) {
        const task = currentProject.columns[oldColumn].find(t => t.id === taskId);
        currentProject.columns[oldColumn] = currentProject.columns[oldColumn].filter(t => t.id !== taskId);
        currentProject.columns[newColumn].push(task);
        saveProjects();
        renderBoard();
        updateStats();
    }
}

// Project modal functions
function showNewProjectModal() {
    newProjectModal.classList.add('active');
}

function closeNewProjectModal() {
    newProjectModal.classList.remove('active');
    document.querySelector('.project-templates').style.display = 'block';
    document.querySelector('.project-details').style.display = 'none';
}

function selectTemplate(template) {
    document.querySelector('.project-templates').style.display = 'none';
    document.querySelector('.project-details').style.display = 'block';
    
    // Set default values based on template
    const projectName = document.getElementById('projectName');
    const projectDescription = document.getElementById('projectDescription');
    
    switch (template) {
        case 'basic':
            projectName.value = 'Basic Project';
            projectDescription.value = 'A simple project with basic columns';
            break;
        case 'agile':
            projectName.value = 'Agile Project';
            projectDescription.value = 'Project with sprint planning and agile methodology';
            break;
        case 'bug':
            projectName.value = 'Bug Tracking';
            projectDescription.value = 'Project for tracking and fixing bugs';
            break;
        case 'custom':
            projectName.value = '';
            projectDescription.value = '';
            break;
    }
}

function createNewProject() {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    
    if (name) {
        const newProject = {
            id: Date.now().toString(),
            name,
            description,
            columns: {
                todo: [],
                inprogress: [],
                done: []
            },
            createdAt: new Date().toISOString()
        };
        
        projects.push(newProject);
        saveProjects();
        updateProjectSelector();
        switchProject(newProject.id);
        closeNewProjectModal();
    }
}

// Task modal functions
function showNewTaskModal(column) {
    newTaskModal.classList.add('active');
    newTaskModal.dataset.column = column;
}

function closeNewTaskModal() {
    newTaskModal.classList.remove('active');
    document.querySelector('.task-templates').style.display = 'block';
    document.querySelector('.task-details').style.display = 'none';
}

function selectTaskTemplate(template) {
    document.querySelector('.task-templates').style.display = 'none';
    document.querySelector('.task-details').style.display = 'block';
    
    // Set default values based on template
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    const taskLabel = document.getElementById('taskLabel');
    const taskPriority = document.getElementById('taskPriority');
    
    switch (template) {
        case 'feature':
            taskTitle.value = 'New Feature';
            taskDescription.value = 'Implement new feature';
            taskLabel.value = 'Feature';
            taskPriority.value = 'medium';
            break;
        case 'bug':
            taskTitle.value = 'Bug Fix';
            taskDescription.value = 'Fix reported bug';
            taskLabel.value = 'Bug';
            taskPriority.value = 'high';
            break;
        case 'improvement':
            taskTitle.value = 'Improvement';
            taskDescription.value = 'Enhance existing feature';
            taskLabel.value = 'Improvement';
            taskPriority.value = 'medium';
            break;
        case 'custom':
            taskTitle.value = '';
            taskDescription.value = '';
            taskLabel.value = 'Task';
            taskPriority.value = 'medium';
            break;
    }
}

function createNewTask() {
    const column = newTaskModal.dataset.column;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const label = document.getElementById('taskLabel').value;
    const assignee = document.getElementById('taskAssignee').value;
    const estimate = document.getElementById('taskEstimate').value;
    
    if (title) {
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            dueDate,
            priority,
            label,
            assignee,
            estimate,
            createdAt: new Date().toISOString()
        };
        
        currentProject.columns[column].push(newTask);
        saveProjects();
        renderBoard();
        updateCalendar();
        updateStats();
        closeNewTaskModal();
    }
}

// Calendar functionality
function updateCalendar() {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let calendarHTML = `
        <div class="calendar-header">
            <button onclick="previousMonth()">❮</button>
            <span>${today.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onclick="nextMonth()">❯</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
    `;
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        const isToday = date.toDateString() === new Date().toDateString();
        const tasks = getAllTasksForDate(date);
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}">
                <h3>${day}</h3>
                ${tasks.map(task => `
                    <div class="calendar-task ${task.priority}" onclick="showTaskDetails('${task.id}')">
                        <div class="calendar-task-content">
                            <div class="calendar-task-title">${task.title}</div>
                            <div class="calendar-task-meta">
                                ${task.label ? `<span class="task-label">${task.label}</span>` : ''}
                                ${task.assignee ? `<span class="task-assignee">👤 ${task.assignee}</span>` : ''}
                                ${task.estimate ? `<span class="task-estimate">⏱️ ${task.estimate}h</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;
}

function getAllTasksForDate(date) {
    const tasks = [];
    Object.values(currentProject.columns).forEach(column => {
        column.forEach(task => {
            if (task.dueDate && new Date(task.dueDate).toDateString() === date.toDateString()) {
                tasks.push(task);
            }
        });
    });
    return tasks;
}

function previousMonth() {
    // Implement previous month navigation
}

function nextMonth() {
    // Implement next month navigation
}

// Statistics functionality
function updateStats() {
    const stats = document.getElementById('stats');
    const totalTasks = Object.values(currentProject.columns).reduce((sum, col) => sum + col.length, 0);
    const completedTasks = currentProject.columns.done.length;
    const inProgressTasks = currentProject.columns.inprogress.length;
    const todoTasks = currentProject.columns.todo.length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
    
    stats.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Tasks</h3>
                <p>${totalTasks}</p>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <p>${completedTasks}</p>
            </div>
            <div class="stat-card">
                <h3>In Progress</h3>
                <p>${inProgressTasks}</p>
            </div>
            <div class="stat-card">
                <h3>To Do</h3>
                <p>${todoTasks}</p>
            </div>
            <div class="stat-card">
                <h3>Completion Rate</h3>
                <p>${completionRate}%</p>
            </div>
        </div>
    `;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
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

// Export and import functionality
function exportProject() {
    const data = JSON.stringify(currentProject);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importProject(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedProject = JSON.parse(e.target.result);
                importedProject.id = Date.now().toString();
                projects.push(importedProject);
                saveProjects();
                updateProjectSelector();
                switchProject(importedProject.id);
            } catch (error) {
                alert('Error importing project. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app
init(); 