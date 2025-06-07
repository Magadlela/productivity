// Initialize FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: loadEvents(),
        eventClick: function(info) {
            showEventDetails(info.event);
        },
        dateClick: function(info) {
            showNewEventModal(info.date);
        },
        eventDrop: function(info) {
            updateEventDate(info.event);
        },
        eventResize: function(info) {
            updateEventDate(info.event);
        }
    });
    calendar.render();

    // Load goals and milestones
    loadGoals();
    loadMilestones();
});

// Event Management
function loadEvents() {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    return events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: event.color,
        description: event.description
    }));
}

function showNewEventModal(date = null) {
    const modal = document.getElementById('newEventModal');
    const startInput = document.getElementById('eventStart');
    const endInput = document.getElementById('eventEnd');

    if (date) {
        const startDate = date.toISOString().slice(0, 16);
        const endDate = new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
        startInput.value = startDate;
        endInput.value = endDate;
    }

    modal.classList.add('active');
}

function closeNewEventModal() {
    const modal = document.getElementById('newEventModal');
    modal.classList.remove('active');
    document.getElementById('eventForm').reset();
}

function createNewEvent(event) {
    event.preventDefault();

    const newEvent = {
        id: Date.now().toString(),
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        start: document.getElementById('eventStart').value,
        end: document.getElementById('eventEnd').value,
        color: document.getElementById('eventColor').value
    };

    const events = JSON.parse(localStorage.getItem('events')) || [];
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));

    calendar.addEvent({
        id: newEvent.id,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color
    });

    closeNewEventModal();
}

function updateEventDate(event) {
    const events = JSON.parse(localStorage.getItem('events')) || [];
    const index = events.findIndex(e => e.id === event.id);
    
    if (index !== -1) {
        events[index].start = event.start.toISOString();
        events[index].end = event.end.toISOString();
        localStorage.setItem('events', JSON.stringify(events));
    }
}

// Goal Management
function loadGoals() {
    const goals = JSON.parse(localStorage.getItem('goals')) || [];
    const goalsList = document.getElementById('goalsList');
    
    goalsList.innerHTML = goals.map(goal => `
        <div class="goal-item">
            <h3>${goal.title}</h3>
            <p>${goal.description}</p>
            <div class="goal-progress">
                <div class="goal-progress-bar" style="width: ${goal.progress}%"></div>
            </div>
            <div class="goal-meta">
                <span>${goal.progress}% Complete</span>
                <span>Due: ${formatDate(goal.endDate)}</span>
            </div>
        </div>
    `).join('');
}

function showNewGoalModal() {
    const modal = document.getElementById('newGoalModal');
    modal.classList.add('active');
}

function closeNewGoalModal() {
    const modal = document.getElementById('newGoalModal');
    modal.classList.remove('active');
    document.getElementById('goalForm').reset();
}

function createNewGoal(event) {
    event.preventDefault();

    const newGoal = {
        id: Date.now().toString(),
        title: document.getElementById('goalTitle').value,
        description: document.getElementById('goalDescription').value,
        startDate: document.getElementById('goalStart').value,
        endDate: document.getElementById('goalEnd').value,
        priority: document.getElementById('goalPriority').value,
        progress: parseInt(document.getElementById('goalProgress').value)
    };

    const goals = JSON.parse(localStorage.getItem('goals')) || [];
    goals.push(newGoal);
    localStorage.setItem('goals', JSON.stringify(goals));

    loadGoals();
    closeNewGoalModal();
}

// Milestone Management
function loadMilestones() {
    const milestones = JSON.parse(localStorage.getItem('milestones')) || [];
    const milestonesList = document.getElementById('milestonesList');
    
    milestonesList.innerHTML = milestones.map(milestone => `
        <div class="milestone-item">
            <h3>${milestone.title}</h3>
            <p>${milestone.description}</p>
            <div class="milestone-meta">
                <span class="status ${milestone.status}">${milestone.status}</span>
                <span>Due: ${formatDate(milestone.date)}</span>
            </div>
        </div>
    `).join('');
}

function showNewMilestoneModal() {
    const modal = document.getElementById('newMilestoneModal');
    modal.classList.add('active');
}

function closeNewMilestoneModal() {
    const modal = document.getElementById('newMilestoneModal');
    modal.classList.remove('active');
    document.getElementById('milestoneForm').reset();
}

function createNewMilestone(event) {
    event.preventDefault();

    const newMilestone = {
        id: Date.now().toString(),
        title: document.getElementById('milestoneTitle').value,
        description: document.getElementById('milestoneDescription').value,
        date: document.getElementById('milestoneDate').value,
        status: document.getElementById('milestoneStatus').value
    };

    const milestones = JSON.parse(localStorage.getItem('milestones')) || [];
    milestones.push(newMilestone);
    localStorage.setItem('milestones', JSON.stringify(milestones));

    loadMilestones();
    closeNewMilestoneModal();
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function showEventDetails(event) {
    // Implement event details modal
    console.log('Event details:', event);
}

// Progress Bar Update
document.getElementById('goalProgress')?.addEventListener('input', function(e) {
    document.getElementById('goalProgressValue').textContent = `${e.target.value}%`;
}); 