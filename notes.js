// Initialize Quill editor
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image']
        ]
    }
});

// DOM Elements
const notesGrid = document.getElementById('notesGrid');
const addNoteBtn = document.getElementById('addNoteBtn');
const addFolderBtn = document.getElementById('addFolderBtn');
const noteModal = document.getElementById('noteModal');
const folderModal = document.getElementById('folderModal');
const noteForm = document.getElementById('noteForm');
const folderForm = document.getElementById('folderForm');
const noteFilter = document.getElementById('noteFilter');
const foldersList = document.getElementById('foldersList');
const noteFolderSelect = document.getElementById('noteFolder');

// State
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let folders = JSON.parse(localStorage.getItem('folders')) || [];
let currentNoteId = null;
let currentFolderId = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderFolders();
    renderNotes();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addNoteBtn.addEventListener('click', () => showNoteModal());
    addFolderBtn.addEventListener('click', () => showFolderModal());
    noteForm.addEventListener('submit', handleNoteSubmit);
    folderForm.addEventListener('submit', handleFolderSubmit);
    noteFilter.addEventListener('change', renderNotes);

    // Close modals when clicking outside
    [noteModal, folderModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (noteModal.classList.contains('active')) {
                closeNoteModal();
            }
            if (folderModal.classList.contains('active')) {
                closeFolderModal();
            }
        }
    });

    // Folder selection
    foldersList.addEventListener('click', (e) => {
        const folderItem = e.target.closest('.folder-item');
        if (folderItem) {
            const folderId = folderItem.dataset.folderId;
            selectFolder(folderId);
        }
    });
}

// Folder Management
function createFolder(name, color) {
    const folder = {
        id: Date.now().toString(),
        name,
        color,
        createdAt: new Date().toISOString()
    };

    folders.push(folder);
    saveFolders();
    renderFolders();
    updateFolderSelect();
}

function deleteFolder(id) {
    if (confirm('Are you sure you want to delete this folder? Notes in this folder will be moved to "No Folder".')) {
        // Move notes to "No Folder"
        notes = notes.map(note => {
            if (note.folderId === id) {
                return { ...note, folderId: '' };
            }
            return note;
        });

        // Remove folder
        folders = folders.filter(folder => folder.id !== id);
        
        saveFolders();
        saveNotes();
        renderFolders();
        renderNotes();
        updateFolderSelect();
    }
}

function renderFolders() {
    const allNotesCount = notes.length;
    const folderCounts = notes.reduce((acc, note) => {
        acc[note.folderId || 'none'] = (acc[note.folderId || 'none'] || 0) + 1;
        return acc;
    }, {});

    foldersList.innerHTML = `
        <div class="folder-item ${currentFolderId === 'all' ? 'active' : ''}" data-folder-id="all">
            <i class="fas fa-folder"></i>
            <span>All Notes</span>
            <span class="note-count">${allNotesCount}</span>
        </div>
        ${folders.map(folder => `
            <div class="folder-item ${currentFolderId === folder.id ? 'active' : ''}" 
                 data-folder-id="${folder.id}" 
                 data-color="${folder.color}">
                <i class="fas fa-folder"></i>
                <span>${escapeHtml(folder.name)}</span>
                <span class="note-count">${folderCounts[folder.id] || 0}</span>
                <button class="folder-delete-btn" onclick="deleteFolder('${folder.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('')}
    `;
}

function updateFolderSelect() {
    noteFolderSelect.innerHTML = `
        <option value="">No Folder</option>
        ${folders.map(folder => `
            <option value="${folder.id}">${escapeHtml(folder.name)}</option>
        `).join('')}
    `;
}

function selectFolder(folderId) {
    currentFolderId = folderId;
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.toggle('active', item.dataset.folderId === folderId);
    });
    renderNotes();
}

// Note Management
function createNote(title, content, color, folderId) {
    const note = {
        id: Date.now().toString(),
        title,
        content,
        color,
        folderId: folderId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false
    };

    notes.unshift(note);
    saveNotes();
    renderNotes();
    renderFolders();
}

function updateNote(id, title, content, color, folderId) {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex] = {
            ...notes[noteIndex],
            title,
            content,
            color,
            folderId: folderId || '',
            updatedAt: new Date().toISOString()
        };
        saveNotes();
        renderNotes();
        renderFolders();
    }
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== id);
        saveNotes();
        renderNotes();
    }
}

function toggleFavorite(id) {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].isFavorite = !notes[noteIndex].isFavorite;
        saveNotes();
        renderNotes();
    }
}

// UI Functions
function renderNotes() {
    const filter = noteFilter.value;
    let filteredNotes = [...notes];

    // Filter by folder
    if (currentFolderId !== 'all') {
        filteredNotes = filteredNotes.filter(note => note.folderId === currentFolderId);
    }

    // Apply additional filters
    switch (filter) {
        case 'favorites':
            filteredNotes = filteredNotes.filter(note => note.isFavorite);
            break;
        case 'recent':
            filteredNotes = filteredNotes.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            break;
    }

    notesGrid.innerHTML = filteredNotes.map(note => `
        <div class="note ${note.color}" data-id="${note.id}">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <div class="note-actions">
                    <button class="note-action-btn favorite-btn" onclick="toggleFavorite('${note.id}')">
                        <i class="fas fa-star ${note.isFavorite ? 'active' : ''}"></i>
                    </button>
                    <button class="note-action-btn edit-btn" onclick="editNote('${note.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="note-action-btn delete-btn" onclick="deleteNote('${note.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-footer">
                <span class="note-folder">${getFolderName(note.folderId)}</span>
                <span class="note-date">${formatDate(note.updatedAt)}</span>
            </div>
        </div>
    `).join('');
}

function getFolderName(folderId) {
    if (!folderId) return '';
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : '';
}

// Modal Functions
function showFolderModal() {
    folderModal.classList.add('active');
    document.getElementById('folderName').focus();
}

function closeFolderModal() {
    folderModal.classList.remove('active');
    folderForm.reset();
}

function handleFolderSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('folderName').value.trim();
    const color = document.querySelector('input[name="folderColor"]:checked').value;

    createFolder(name, color);
    closeFolderModal();
}

function showNoteModal(noteId = null) {
    currentNoteId = noteId;
    const modal = document.getElementById('noteModal');
    const form = document.getElementById('noteForm');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');

    if (noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            titleInput.value = note.title;
            contentInput.value = note.content;
            document.querySelector(`input[name="noteColor"][value="${note.color}"]`).checked = true;
            noteFolderSelect.value = note.folderId || '';
        }
    } else {
        form.reset();
        noteFolderSelect.value = currentFolderId !== 'all' ? currentFolderId : '';
    }

    modal.classList.add('active');
    titleInput.focus();
}

function closeNoteModal() {
    noteModal.classList.remove('active');
    noteForm.reset();
    currentNoteId = null;
}

function handleNoteSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const color = document.querySelector('input[name="noteColor"]:checked').value;
    const folderId = document.getElementById('noteFolder').value;

    if (currentNoteId) {
        updateNote(currentNoteId, title, content, color, folderId);
    } else {
        createNote(title, content, color, folderId);
    }

    closeNoteModal();
}

function editNote(id) {
    showNoteModal(id);
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

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function saveFolders() {
    localStorage.setItem('folders', JSON.stringify(folders));
}

function closeModal(modal) {
    modal.classList.remove('active');
    if (modal === noteModal) {
        noteForm.reset();
        currentNoteId = null;
    } else if (modal === folderModal) {
        folderForm.reset();
    }
}

// Make functions available globally
window.toggleFavorite = toggleFavorite;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.deleteFolder = deleteFolder;
window.closeNoteModal = closeNoteModal;
window.closeFolderModal = closeFolderModal; 