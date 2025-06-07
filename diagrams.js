// Initialize JointJS
const graph = new joint.dia.Graph();
const paper = new joint.dia.Paper({
    el: document.getElementById('diagramCanvas'),
    model: graph,
    width: '100%',
    height: '100%',
    gridSize: 10,
    drawGrid: true,
    background: {
        color: 'rgba(0, 0, 0, 0.03)'
    },
    interactive: true
});

// DOM Elements
const diagramCanvas = document.getElementById('diagramCanvas');
const addDiagramBtn = document.getElementById('addDiagramBtn');
const diagramModal = document.getElementById('diagramModal');
const diagramForm = document.getElementById('diagramForm');
const diagramList = document.getElementById('diagramList');
const diagramFilter = document.getElementById('diagramFilter');
const templateSelect = document.getElementById('templateSelect');

// State
let diagrams = JSON.parse(localStorage.getItem('diagrams')) || [];
let currentDiagramId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderDiagrams();
    setupEventListeners();
    setupJointJS();
});

// Setup JointJS
function setupJointJS() {
    // Enable element dragging
    paper.on('element:pointerdown', (elementView) => {
        elementView.model.startPosition = elementView.model.position();
    });

    paper.on('element:pointermove', (elementView, evt) => {
        const model = elementView.model;
        const startPosition = model.startPosition;
        const dx = evt.clientX - startPosition.x;
        const dy = evt.clientY - startPosition.y;
        model.position(startPosition.x + dx, startPosition.y + dy);
    });

    // Enable link creation
    paper.on('element:pointerdown', (elementView, evt) => {
        const link = new joint.shapes.standard.Link();
        link.source(elementView.model);
        link.target(evt.clientX, evt.clientY);
        graph.addCell(link);
    });

    paper.on('element:pointermove', (elementView, evt) => {
        const link = graph.getLinks().find(link => !link.target().id);
        if (link) {
            link.target(evt.clientX, evt.clientY);
        }
    });

    paper.on('element:pointerup', (elementView, evt) => {
        const link = graph.getLinks().find(link => !link.target().id);
        if (link) {
            const targetElement = paper.findViewFromPoint(evt.clientX, evt.clientY);
            if (targetElement && targetElement.model.id !== link.source().id) {
                link.target(targetElement.model);
            } else {
                link.remove();
            }
        }
    });
}

// Event Listeners
function setupEventListeners() {
    addDiagramBtn.addEventListener('click', () => showDiagramModal());
    diagramForm.addEventListener('submit', handleDiagramSubmit);
    diagramFilter.addEventListener('change', renderDiagrams);

    // Close modal when clicking outside
    diagramModal.addEventListener('click', (e) => {
        if (e.target === diagramModal) {
            closeDiagramModal();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && diagramModal.classList.contains('active')) {
            closeDiagramModal();
        }
    });

    // Template selection
    templateSelect.addEventListener('change', handleTemplateChange);
}

// Diagram Management
function createDiagram(title, description, template) {
    const diagram = {
        id: Date.now().toString(),
        title,
        description,
        template,
        elements: [],
        links: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    diagrams.unshift(diagram);
    saveDiagrams();
    renderDiagrams();
    loadDiagram(diagram.id);
}

function updateDiagram(id, title, description) {
    const diagramIndex = diagrams.findIndex(diagram => diagram.id === id);
    if (diagramIndex !== -1) {
        diagrams[diagramIndex] = {
            ...diagrams[diagramIndex],
            title,
            description,
            updatedAt: new Date().toISOString()
        };
        saveDiagrams();
        renderDiagrams();
    }
}

function deleteDiagram(id) {
    if (confirm('Are you sure you want to delete this diagram?')) {
        diagrams = diagrams.filter(diagram => diagram.id !== id);
        saveDiagrams();
        renderDiagrams();
        if (currentDiagramId === id) {
            clearCanvas();
            currentDiagramId = null;
        }
    }
}

function loadDiagram(id) {
    const diagram = diagrams.find(d => d.id === id);
    if (diagram) {
        currentDiagramId = id;
        clearCanvas();
        
        // Load elements
        diagram.elements.forEach(element => {
            const shape = createShapeFromTemplate(element.type, element);
            graph.addCell(shape);
        });

        // Load links
        diagram.links.forEach(link => {
            const jointLink = new joint.shapes.standard.Link({
                source: { id: link.source },
                target: { id: link.target },
                labels: link.labels
            });
            graph.addCell(jointLink);
        });
    }
}

function saveCurrentDiagram() {
    if (currentDiagramId) {
        const diagramIndex = diagrams.findIndex(d => d.id === currentDiagramId);
        if (diagramIndex !== -1) {
            const elements = graph.getElements().map(element => ({
                id: element.id,
                type: element.attributes.type,
                position: element.position(),
                size: element.size(),
                attrs: element.attributes.attrs
            }));

            const links = graph.getLinks().map(link => ({
                source: link.source().id,
                target: link.target().id,
                labels: link.attributes.labels
            }));

            diagrams[diagramIndex] = {
                ...diagrams[diagramIndex],
                elements,
                links,
                updatedAt: new Date().toISOString()
            };
            saveDiagrams();
            renderDiagrams();
        }
    }
}

// Template Management
function handleTemplateChange(e) {
    const template = e.target.value;
    if (template) {
        clearCanvas();
        createTemplateDiagram(template);
    }
}

function createTemplateDiagram(template) {
    switch (template) {
        case 'flowchart':
            createFlowchartTemplate();
            break;
        case 'mindmap':
            createMindmapTemplate();
            break;
        case 'orgchart':
            createOrgChartTemplate();
            break;
    }
}

function createFlowchartTemplate() {
    const start = new joint.shapes.standard.Rectangle({
        position: { x: 100, y: 100 },
        size: { width: 100, height: 40 },
        attrs: {
            body: { fill: '#4CAF50' },
            label: { text: 'Start', fill: 'white' }
        }
    });

    const process = new joint.shapes.standard.Rectangle({
        position: { x: 100, y: 200 },
        size: { width: 100, height: 40 },
        attrs: {
            body: { fill: '#2196F3' },
            label: { text: 'Process', fill: 'white' }
        }
    });

    const end = new joint.shapes.standard.Rectangle({
        position: { x: 100, y: 300 },
        size: { width: 100, height: 40 },
        attrs: {
            body: { fill: '#F44336' },
            label: { text: 'End', fill: 'white' }
        }
    });

    graph.addCells([start, process, end]);

    const link1 = new joint.shapes.standard.Link({
        source: { id: start.id },
        target: { id: process.id }
    });

    const link2 = new joint.shapes.standard.Link({
        source: { id: process.id },
        target: { id: end.id }
    });

    graph.addCells([link1, link2]);
}

function createMindmapTemplate() {
    const center = new joint.shapes.standard.Circle({
        position: { x: 300, y: 200 },
        size: { width: 60, height: 60 },
        attrs: {
            body: { fill: '#9C27B0' },
            label: { text: 'Main', fill: 'white' }
        }
    });

    const topics = [
        { x: 100, y: 100, text: 'Topic 1' },
        { x: 100, y: 300, text: 'Topic 2' },
        { x: 500, y: 100, text: 'Topic 3' },
        { x: 500, y: 300, text: 'Topic 4' }
    ];

    const topicElements = topics.map(topic => 
        new joint.shapes.standard.Circle({
            position: { x: topic.x, y: topic.y },
            size: { width: 40, height: 40 },
            attrs: {
                body: { fill: '#E91E63' },
                label: { text: topic.text, fill: 'white' }
            }
        })
    );

    graph.addCells([center, ...topicElements]);

    topicElements.forEach(topic => {
        const link = new joint.shapes.standard.Link({
            source: { id: center.id },
            target: { id: topic.id }
        });
        graph.addCell(link);
    });
}

function createOrgChartTemplate() {
    const ceo = new joint.shapes.standard.Rectangle({
        position: { x: 300, y: 50 },
        size: { width: 120, height: 40 },
        attrs: {
            body: { fill: '#FF9800' },
            label: { text: 'CEO', fill: 'white' }
        }
    });

    const managers = [
        { x: 100, y: 150, text: 'Manager 1' },
        { x: 300, y: 150, text: 'Manager 2' },
        { x: 500, y: 150, text: 'Manager 3' }
    ];

    const managerElements = managers.map(manager =>
        new joint.shapes.standard.Rectangle({
            position: { x: manager.x, y: manager.y },
            size: { width: 120, height: 40 },
            attrs: {
                body: { fill: '#2196F3' },
                label: { text: manager.text, fill: 'white' }
            }
        })
    );

    graph.addCells([ceo, ...managerElements]);

    managerElements.forEach(manager => {
        const link = new joint.shapes.standard.Link({
            source: { id: ceo.id },
            target: { id: manager.id }
        });
        graph.addCell(link);
    });
}

// UI Functions
function renderDiagrams() {
    const filter = diagramFilter.value;
    let filteredDiagrams = [...diagrams];

    switch (filter) {
        case 'recent':
            filteredDiagrams.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            break;
        case 'templates':
            filteredDiagrams = filteredDiagrams.filter(d => d.template);
            break;
    }

    diagramList.innerHTML = filteredDiagrams.map(diagram => `
        <div class="diagram-item ${currentDiagramId === diagram.id ? 'active' : ''}" 
             data-id="${diagram.id}">
            <div class="diagram-info">
                <h3>${escapeHtml(diagram.title)}</h3>
                <p>${escapeHtml(diagram.description)}</p>
                <span class="diagram-date">${formatDate(diagram.updatedAt)}</span>
            </div>
            <div class="diagram-actions">
                <button class="diagram-action-btn edit-btn" onclick="editDiagram('${diagram.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="diagram-action-btn delete-btn" onclick="deleteDiagram('${diagram.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Add click handlers for diagram selection
    document.querySelectorAll('.diagram-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.diagram-action-btn')) {
                const diagramId = item.dataset.id;
                loadDiagram(diagramId);
            }
        });
    });
}

// Modal Functions
function showDiagramModal(diagramId = null) {
    currentDiagramId = diagramId;
    const modal = document.getElementById('diagramModal');
    const form = document.getElementById('diagramForm');
    const titleInput = document.getElementById('diagramTitle');
    const descriptionInput = document.getElementById('diagramDescription');

    if (diagramId) {
        const diagram = diagrams.find(d => d.id === diagramId);
        if (diagram) {
            titleInput.value = diagram.title;
            descriptionInput.value = diagram.description;
            templateSelect.value = diagram.template || '';
        }
    } else {
        form.reset();
    }

    modal.classList.add('active');
    titleInput.focus();
}

function closeDiagramModal() {
    diagramModal.classList.remove('active');
    diagramForm.reset();
    currentDiagramId = null;
}

function handleDiagramSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('diagramTitle').value.trim();
    const description = document.getElementById('diagramDescription').value.trim();
    const template = document.getElementById('templateSelect').value;

    if (currentDiagramId) {
        updateDiagram(currentDiagramId, title, description);
    } else {
        createDiagram(title, description, template);
    }

    closeDiagramModal();
}

// Utility Functions
function clearCanvas() {
    graph.clear();
}

function createShapeFromTemplate(type, data) {
    switch (type) {
        case 'rectangle':
            return new joint.shapes.standard.Rectangle({
                id: data.id,
                position: data.position,
                size: data.size,
                attrs: data.attrs
            });
        case 'circle':
            return new joint.shapes.standard.Circle({
                id: data.id,
                position: data.position,
                size: data.size,
                attrs: data.attrs
            });
        default:
            return null;
    }
}

function saveDiagrams() {
    localStorage.setItem('diagrams', JSON.stringify(diagrams));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Make functions available globally
window.editDiagram = editDiagram;
window.deleteDiagram = deleteDiagram;
window.closeDiagramModal = closeDiagramModal; 