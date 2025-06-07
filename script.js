let taskIdCounter = 0;
let currentProject = "Default";
let keyboardShortcuts = {
    'n': () => newProject(),
    't': () => addTask('todo'),
    'i': () => addTask('inprogress'),
    'd': () => addTask('done'),
    's': () => document.getElementById('projectSelector').focus(),
    'm': () => document.getElementById('darkModeToggle').click()
};

let currentTaskColumn = '';

window.onload = () => {
    const dark = localStorage.getItem("darkMode");
    if (dark === "true") document.body.classList.add("dark");

    loadProjects();
    switchProject(currentProject);
    updateCalendar();
    updateStats();
    setupKeyboardShortcuts();
};

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            const key = e.key.toLowerCase();
            if (keyboardShortcuts[key]) {
                e.preventDefault();
                keyboardShortcuts[key]();
            }
        }
    });
}

document.getElementById("darkModeToggle").onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
};

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text");
    const task = document.getElementById(taskId);
    const taskList = ev.target.closest(".task-list");
    if (task && taskList) {
        taskList.appendChild(task);
        saveProject();
        updateCalendar();
        updateStats();
    }
}

function addTask(columnId) {
    const text = prompt("Task title:");
    if (!text) return;

    const dueDate = prompt("Due date (YYYY-MM-DD):");
    if (dueDate && !isValidDate(dueDate)) {
        alert("Invalid date format. Please use YYYY-MM-DD");
        return;
    }

    const priority = prompt("Priority (low, medium, high):", "medium").toLowerCase();
    if (!['low', 'medium', 'high'].includes(priority)) {
        alert("Invalid priority. Using 'medium' as default.");
        priority = 'medium';
    }

    const label = prompt("Label (e.g., Bug, Feature, etc.):", "Task");

    const task = createTask(text, dueDate, priority, label);
    document.getElementById(columnId).querySelector(".task-list").appendChild(task);
    saveProject();
    updateCalendar();
    updateStats();
}

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

function createTask(text, dueDate, priority, label) {
    const task = document.createElement("div");
    task.className = `task ${priority}`;
    task.id = "task" + taskIdCounter++;
    task.draggable = true;
    task.ondragstart = drag;

    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';
    const isOverdue = dueDate && new Date(dueDate) < new Date() && !task.closest('#done');

    task.innerHTML = `
        <div class="task-header">
            <strong>${text}</strong>
            <div class="task-actions">
                <button onclick="editTask(this)" class="edit-btn">✏️</button>
                <button onclick="deleteTask(this)" class="delete-btn">🗑️</button>
            </div>
        </div>
        <div class="details ${isOverdue ? 'overdue' : ''}">
            📅 ${formattedDate} | 🏷️ ${label}
        </div>
    `;

    return task;
}

function editTask(button) {
    const task = button.closest('.task');
    const title = task.querySelector('strong').textContent;
    const details = task.querySelector('.details').textContent;
    const [, dueDatePart, , label] = details.split(/\s+/);
    const priority = [...task.classList].find(c => ["low", "medium", "high"].includes(c));

    // Show task modal in edit mode
    showNewTaskModal(task.closest('.column').id);
    
    // Fill form with existing task data
    document.getElementById('taskTitle').value = title;
    document.getElementById('taskDueDate').value = dueDatePart;
    document.getElementById('taskPriority').value = priority;
    document.getElementById('taskLabel').value = label;

    // Show task details form
    document.querySelector('.task-templates').style.display = 'none';
    document.querySelector('.task-details').style.display = 'block';

    // Remove the old task
    task.remove();
}

function deleteTask(button) {
    if (confirm("Delete this task?")) {
        button.closest('.task').remove();
        saveProject();
        updateCalendar();
        updateStats();
    }
}

function saveProject() {
    const data = {};
    document.querySelectorAll(".column").forEach(column => {
        const tasks = [];
        column.querySelectorAll(".task").forEach(task => {
            const title = task.querySelector("strong").textContent;
            const details = task.querySelector(".details").textContent;
            const [, dueDatePart, , label] = details.split(/\s+/);
            const priority = [...task.classList].find(c => ["low", "medium", "high"].includes(c));
            tasks.push({ text: title, dueDate: dueDatePart, label, priority });
        });
        data[column.id] = tasks;
    });

    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    projects[currentProject] = data;
    localStorage.setItem("kanbanProjects", JSON.stringify(projects));
}

function loadProjects() {
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    const selector = document.getElementById("projectSelector");
    selector.innerHTML = "";

    for (let name in projects) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (name === currentProject) option.selected = true;
        selector.appendChild(option);
    }

    // If currentProject does not exist, set it to the first available project or 'Default'
    if (!projects[currentProject]) {
        const projectNames = Object.keys(projects);
        currentProject = projectNames.length > 0 ? projectNames[0] : "Default";
    }
}

function renderBoard() {
    // Clear all columns
    document.querySelectorAll('.task-list').forEach(list => list.innerHTML = "");
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    const data = projects[currentProject] || {};

    if (data.tasks) {
        // New project structure
        Object.entries(data.tasks).forEach(([columnId, tasks]) => {
            const column = document.getElementById(columnId);
            if (!column) return;
            const list = column.querySelector('.task-list');
            list.innerHTML = "";
            tasks.forEach(taskData => {
                const task = createTask(taskData.text, taskData.dueDate, taskData.priority, taskData.label);
                list.appendChild(task);
            });
        });
    } else {
        // Legacy project structure
        for (let columnId in data) {
            const column = document.getElementById(columnId);
            if (!column) continue;
            const list = column.querySelector('.task-list');
            list.innerHTML = "";
            data[columnId].forEach(taskData => {
                const task = createTask(taskData.text, taskData.dueDate, taskData.priority, taskData.label);
                list.appendChild(task);
            });
        }
    }
}

function switchProject(projectName) {
    currentProject = projectName;
    renderBoard();
    updateCalendar && updateCalendar();
    updateStats && updateStats();
}

// Add event listener for project selector
window.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('projectSelector');
    if (selector) {
        selector.onchange = function() {
            switchProject(this.value);
        };
    }
});

function updateCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;
    
    calendar.innerHTML = '';
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    const data = projects[currentProject] || {};
    
    // Get current month's dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Create calendar header with navigation
    const header = document.createElement('div');
    header.className = 'calendar-header';
    
    const prevMonth = document.createElement('button');
    prevMonth.innerHTML = '←';
    prevMonth.onclick = () => {
        today.setMonth(today.getMonth() - 1);
        updateCalendar();
    };
    
    const nextMonth = document.createElement('button');
    nextMonth.innerHTML = '→';
    nextMonth.onclick = () => {
        today.setMonth(today.getMonth() + 1);
        updateCalendar();
    };
    
    const monthYear = document.createElement('span');
    monthYear.textContent = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    header.appendChild(prevMonth);
    header.appendChild(monthYear);
    header.appendChild(nextMonth);
    calendar.appendChild(header);
    
    // Create calendar grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let date = 1; date <= lastDay.getDate(); date++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dateHeader = document.createElement('h3');
        dateHeader.textContent = date;
        dayCell.appendChild(dateHeader);
        
        // Add tasks for this day
        const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
        
        // Collect all tasks from all columns
        let dayTasks = [];
        if (data.tasks) {
            // New project structure
            Object.values(data.tasks).forEach(tasks => {
                tasks.forEach(task => {
                    if (task.dueDate === currentDate) {
                        dayTasks.push(task);
                    }
                });
            });
        } else {
            // Legacy project structure
            Object.values(data).forEach(tasks => {
                tasks.forEach(task => {
                    if (task.dueDate === currentDate) {
                        dayTasks.push(task);
                    }
                });
            });
        }
        
        // Sort tasks by priority
        dayTasks.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        // Add tasks to the day cell
        dayTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `calendar-task ${task.priority}`;
            
            const taskContent = document.createElement('div');
            taskContent.className = 'calendar-task-content';
            
            const taskTitle = document.createElement('div');
            taskTitle.className = 'calendar-task-title';
            taskTitle.textContent = task.text;
            
            const taskMeta = document.createElement('div');
            taskMeta.className = 'calendar-task-meta';
            taskMeta.innerHTML = `
                <span class="task-label">${task.label}</span>
                ${task.assignee ? `<span class="task-assignee">👤 ${task.assignee}</span>` : ''}
                ${task.estimate ? `<span class="task-estimate">⏱️ ${task.estimate}h</span>` : ''}
            `;
            
            taskContent.appendChild(taskTitle);
            taskContent.appendChild(taskMeta);
            taskElement.appendChild(taskContent);
            dayCell.appendChild(taskElement);
        });
        
        // Add today highlight
        if (date === new Date().getDate() && 
            today.getMonth() === new Date().getMonth() && 
            today.getFullYear() === new Date().getFullYear()) {
            dayCell.classList.add('today');
        }
        
        grid.appendChild(dayCell);
    }
    
    calendar.appendChild(grid);
}

function updateStats() {
    const stats = document.getElementById('stats');
    if (!stats) return;
    
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    const data = projects[currentProject] || {};
    
    let total = 0;
    let completed = 0;
    let overdue = 0;
    let priorityCounts = { low: 0, medium: 0, high: 0 };
    
    Object.entries(data).forEach(([columnId, tasks]) => {
        total += tasks.length;
        if (columnId === 'done') completed = tasks.length;
        
        tasks.forEach(task => {
            if (task.dueDate && new Date(task.dueDate) < new Date() && columnId !== 'done') {
                overdue++;
            }
            priorityCounts[task.priority]++;
        });
    });
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    stats.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Tasks</h3>
                <p>${total}</p>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <p>${completed} (${completionRate}%)</p>
            </div>
            <div class="stat-card">
                <h3>Overdue</h3>
                <p>${overdue}</p>
            </div>
            <div class="stat-card">
                <h3>Priority Distribution</h3>
                <p>High: ${priorityCounts.high}</p>
                <p>Medium: ${priorityCounts.medium}</p>
                <p>Low: ${priorityCounts.low}</p>
            </div>
        </div>
    `;
}

function exportProject() {
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    const dataStr = JSON.stringify(projects, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'kanban-projects.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importProject(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const projects = JSON.parse(e.target.result);
            localStorage.setItem("kanbanProjects", JSON.stringify(projects));
            loadProjects();
            switchProject(currentProject);
            updateCalendar();
            updateStats();
            alert("Project imported successfully!");
        } catch (error) {
            alert("Error importing project. Please check the file format.");
        }
    };
    reader.readAsText(file);
}

function newProject() {
    const projectName = prompt("Enter new project name:");
    if (!projectName) return;

    // Check if project name already exists
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    if (projects[projectName]) {
        alert("A project with this name already exists!");
        return;
    }

    // Create new project with empty columns
    projects[projectName] = {
        todo: [],
        inprogress: [],
        done: []
    };

    // Save to localStorage
    localStorage.setItem("kanbanProjects", JSON.stringify(projects));

    // Update project selector
    loadProjects();
    
    // Switch to the new project
    switchProject(projectName);
}

function showNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    modal.classList.add('show');
}

function closeNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    modal.classList.remove('show');
    // Reset form
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    // Show templates again
    document.querySelector('.project-templates').style.display = 'block';
    document.querySelector('.project-details').style.display = 'none';
}

function selectTemplate(template) {
    const templates = {
        basic: {
            columns: ['To Do', 'In Progress', 'Done']
        },
        agile: {
            columns: ['Backlog', 'Sprint Planning', 'In Progress', 'Review', 'Done']
        },
        bug: {
            columns: ['New', 'In Progress', 'Testing', 'Fixed', 'Closed']
        },
        custom: {
            columns: ['To Do', 'In Progress', 'Done']
        }
    };

    const selectedTemplate = templates[template];
    const columnList = document.getElementById('columnList');
    columnList.innerHTML = '';

    selectedTemplate.columns.forEach(column => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = column;
        if (template !== 'custom') {
            input.readOnly = true;
        }
        columnItem.appendChild(input);
        columnList.appendChild(columnItem);
    });

    // Show project details form
    document.querySelector('.project-templates').style.display = 'none';
    document.querySelector('.project-details').style.display = 'block';
}

function createNewProject() {
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    
    if (!projectName) {
        alert('Please enter a project name');
        return;
    }

    // Check if project name already exists
    const projects = JSON.parse(localStorage.getItem("kanbanProjects") || "{}");
    if (projects[projectName]) {
        alert("A project with this name already exists!");
        return;
    }

    // Get columns from the form
    const columns = Array.from(document.querySelectorAll('.column-item input'))
        .map(input => input.value.trim())
        .filter(value => value !== '');

    // Create new project structure
    const projectData = {
        description: projectDescription,
        columns: columns,
        tasks: {}
    };

    // Initialize empty task lists for each column
    columns.forEach(column => {
        projectData.tasks[column.toLowerCase().replace(/\s+/g, '')] = [];
    });

    // Save to localStorage
    projects[projectName] = projectData;
    localStorage.setItem("kanbanProjects", JSON.stringify(projects));

    // Update project selector
    loadProjects();
    
    // Switch to the new project
    switchProject(projectName);

    // Close modal
    closeNewProjectModal();
}

function showNewTaskModal(columnId) {
    currentTaskColumn = columnId;
    const modal = document.getElementById('newTaskModal');
    modal.classList.add('show');
}

function closeNewTaskModal() {
    const modal = document.getElementById('newTaskModal');
    modal.classList.remove('show');
    // Reset form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskLabel').value = 'Task';
    document.getElementById('taskAssignee').value = '';
    document.getElementById('taskEstimate').value = '';
    // Show templates again
    document.querySelector('.task-templates').style.display = 'block';
    document.querySelector('.task-details').style.display = 'none';
}

function selectTaskTemplate(template) {
    const templates = {
        feature: {
            title: 'New Feature',
            description: 'Implement new feature',
            priority: 'medium',
            label: 'Feature',
            estimate: 4
        },
        bug: {
            title: 'Bug Fix',
            description: 'Fix reported bug',
            priority: 'high',
            label: 'Bug',
            estimate: 2
        },
        improvement: {
            title: 'Feature Improvement',
            description: 'Enhance existing feature',
            priority: 'medium',
            label: 'Improvement',
            estimate: 3
        },
        custom: {
            title: '',
            description: '',
            priority: 'medium',
            label: 'Task',
            estimate: ''
        }
    };

    const selectedTemplate = templates[template];
    
    // Fill form with template data
    document.getElementById('taskTitle').value = selectedTemplate.title;
    document.getElementById('taskDescription').value = selectedTemplate.description;
    document.getElementById('taskPriority').value = selectedTemplate.priority;
    document.getElementById('taskLabel').value = selectedTemplate.label;
    document.getElementById('taskEstimate').value = selectedTemplate.estimate;

    // Set default due date to 7 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    document.getElementById('taskDueDate').value = defaultDueDate.toISOString().split('T')[0];

    // Show task details form
    document.querySelector('.task-templates').style.display = 'none';
    document.querySelector('.task-details').style.display = 'block';
}

function createNewTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const label = document.getElementById('taskLabel').value;
    const assignee = document.getElementById('taskAssignee').value.trim();
    const estimate = document.getElementById('taskEstimate').value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    const task = createTask(title, dueDate, priority, label, description, assignee, estimate);
    document.getElementById(currentTaskColumn).querySelector(".task-list").appendChild(task);
    
    saveProject();
    updateCalendar();
    updateStats();
    closeNewTaskModal();
}

function createTask(text, dueDate, priority, label, description = '', assignee = '', estimate = '') {
    const task = document.createElement("div");
    task.className = `task ${priority}`;
    task.id = "task" + taskIdCounter++;
    task.draggable = true;
    task.ondragstart = drag;

    const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date';
    const isOverdue = dueDate && new Date(dueDate) < new Date() && !task.closest('#done');

    task.innerHTML = `
        <div class="task-header">
            <strong>${text}</strong>
            <div class="task-actions">
                <button onclick="editTask(this)" class="edit-btn">✏️</button>
                <button onclick="deleteTask(this)" class="delete-btn">🗑️</button>
            </div>
        </div>
        <div class="details ${isOverdue ? 'overdue' : ''}">
            ${description ? `<div class="task-description">${description}</div>` : ''}
            <div class="task-meta">
                📅 ${formattedDate} | 🏷️ ${label}
                ${assignee ? ` | 👤 ${assignee}` : ''}
                ${estimate ? ` | ⏱️ ${estimate}h` : ''}
            </div>
        </div>
    `;

    return task;
}