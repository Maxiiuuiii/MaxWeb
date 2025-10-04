// Application State
let files = [];
let currentView = 'grid';
let currentSort = 'name';
let searchQuery = '';
let fileIdCounter = 4; // Start from 4 since we have 3 sample files

// Sample files from application data
const sampleFiles = [
    {
        id: 1,
        name: "projekt-dokumentation.pdf",
        size: 2457600,
        type: "application/pdf",
        uploadDate: "2024-10-04T15:30:00Z",
        extension: "pdf"
    },
    {
        id: 2,
        name: "team-foto.jpg",
        size: 1048576,
        type: "image/jpeg",
        uploadDate: "2024-10-04T14:20:00Z",
        extension: "jpg"
    },
    {
        id: 3,
        name: "budget-2024.xlsx",
        size: 524288,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        uploadDate: "2024-10-04T12:15:00Z",
        extension: "xlsx"
    }
];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const filesContainer = document.getElementById('filesContainer');
const noFiles = document.getElementById('noFiles');
const fileCount = document.getElementById('fileCount');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const gridViewBtn = document.getElementById('gridView');
const listViewBtn = document.getElementById('listView');
const deleteModal = document.getElementById('deleteModal');
const fileNameToDelete = document.getElementById('fileNameToDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const toastContainer = document.getElementById('toastContainer');

let fileToDelete = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Load sample files
    files = [...sampleFiles];
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderFiles();
    updateFileCount();
});

// Event Listeners Setup
function setupEventListeners() {
    // Upload area events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Search and sort
    searchInput.addEventListener('input', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    
    // View toggle
    gridViewBtn.addEventListener('click', () => setView('grid'));
    listViewBtn.addEventListener('click', () => setView('list'));
    
    // Modal events
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleDelete);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal || e.target.classList.contains('modal-backdrop')) {
            closeDeleteModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    if (!uploadArea.contains(e.relatedTarget)) {
        uploadArea.classList.remove('dragover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
}

// File Selection Handler
function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
}

// Process Files for Upload
function processFiles(fileList) {
    if (fileList.length === 0) return;
    
    // Validate files
    const validFiles = fileList.filter(file => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (file.size > maxSize) {
            showToast(`Datei "${file.name}" ist zu groß (max. 10MB)`, 'error');
            return false;
        }
        
        if (!validTypes.includes(file.type) && !isValidExtension(file.name)) {
            showToast(`Dateityp von "${file.name}" wird nicht unterstützt`, 'error');
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length > 0) {
        simulateUpload(validFiles);
    }
}

// Check valid file extension
function isValidExtension(filename) {
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.docx', '.txt'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return validExtensions.includes(ext);
}

// Simulate File Upload
function simulateUpload(fileList) {
    uploadProgress.classList.remove('hidden');
    uploadArea.style.display = 'none';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            completeUpload(fileList);
        }
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Hochladen... ${Math.round(progress)}%`;
    }, 200);
}

// Complete Upload Process
function completeUpload(fileList) {
    setTimeout(() => {
        fileList.forEach(file => {
            const fileObj = {
                id: fileIdCounter++,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString(),
                extension: getFileExtension(file.name),
                fileData: file // Store actual file for download
            };
            files.push(fileObj);
        });
        
        // Reset upload UI
        uploadProgress.classList.add('hidden');
        uploadArea.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Hochladen... 0%';
        fileInput.value = '';
        
        // Update display
        renderFiles();
        updateFileCount();
        
        // Show success message
        const fileWord = fileList.length === 1 ? 'Datei' : 'Dateien';
        showToast(`${fileList.length} ${fileWord} erfolgreich hochgeladen!`, 'success');
    }, 500);
}

// Get File Extension
function getFileExtension(filename) {
    return filename.toLowerCase().substring(filename.lastIndexOf('.') + 1);
}

// Search Handler
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    renderFiles();
}

// Sort Handler
function handleSort(e) {
    currentSort = e.target.value;
    renderFiles();
}

// Set View Mode
function setView(view) {
    currentView = view;
    
    // Update button states
    gridViewBtn.classList.toggle('active', view === 'grid');
    listViewBtn.classList.toggle('active', view === 'list');
    
    renderFiles();
}

// Filter and Sort Files
function getFilteredAndSortedFiles() {
    let filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery)
    );
    
    // Sort files
    filteredFiles.sort((a, b) => {
        switch (currentSort) {
            case 'name':
                return a.name.localeCompare(b.name, 'de');
            case 'size':
                return b.size - a.size;
            case 'date':
                return new Date(b.uploadDate) - new Date(a.uploadDate);
            case 'type':
                return a.extension.localeCompare(b.extension);
            default:
                return 0;
        }
    });
    
    return filteredFiles;
}

// Render Files
function renderFiles() {
    const filteredFiles = getFilteredAndSortedFiles();
    
    if (filteredFiles.length === 0) {
        filesContainer.innerHTML = '';
        filesContainer.appendChild(noFiles);
        return;
    }
    
    const containerClass = currentView === 'grid' ? 'files-grid' : 'files-list';
    filesContainer.innerHTML = `<div class="${containerClass}" id="filesList"></div>`;
    
    const filesList = document.getElementById('filesList');
    
    filteredFiles.forEach(file => {
        const fileElement = createFileElement(file);
        filesList.appendChild(fileElement);
    });
}

// Create File Element
function createFileElement(file) {
    const div = document.createElement('div');
    div.className = `file-item file-item-${currentView}`;
    
    const iconClass = getFileIconClass(file.extension);
    const formattedSize = formatFileSize(file.size);
    const formattedDate = formatDate(file.uploadDate);
    
    if (currentView === 'grid') {
        div.innerHTML = `
            <div class="file-icon ${iconClass}">${file.extension.toUpperCase()}</div>
            <div class="file-name">${file.name}</div>
            <div class="file-meta">
                <span>${formattedSize}</span>
                <span>${formattedDate}</span>
            </div>
            <div class="file-actions">
                <button class="action-btn download" onclick="downloadFile(${file.id})" title="Herunterladen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Herunterladen
                </button>
                <button class="action-btn delete" onclick="confirmDeleteFile(${file.id})" title="Löschen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6m3,0V4a2,2 0,0,1,2-2h4a2,2 0,0,1,2,2v2"/>
                    </svg>
                    Löschen
                </button>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="file-icon ${iconClass}">${file.extension.toUpperCase()}</div>
            <div class="file-details">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">
                    <span>${formattedSize}</span>
                    <span>${formattedDate}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="action-btn download" onclick="downloadFile(${file.id})" title="Herunterladen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Herunterladen
                </button>
                <button class="action-btn delete" onclick="confirmDeleteFile(${file.id})" title="Löschen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6m3,0V4a2,2 0,0,1,2,2h4a2,2 0,0,1,2,2v2"/>
                    </svg>
                    Löschen
                </button>
            </div>
        `;
    }
    
    return div;
}

// Get File Icon Class
function getFileIconClass(extension) {
    const iconMap = {
        pdf: 'pdf',
        jpg: 'jpg',
        jpeg: 'jpeg',
        png: 'png',
        xlsx: 'xlsx',
        xls: 'xlsx',
        docx: 'docx',
        doc: 'docx',
        txt: 'txt'
    };
    
    return iconMap[extension] || 'default';
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update File Count
function updateFileCount() {
    const count = files.length;
    const fileWord = count === 1 ? 'Datei' : 'Dateien';
    fileCount.textContent = `${count} ${fileWord}`;
}

// Download File
function downloadFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    if (file.fileData) {
        // For uploaded files, download the actual file
        const url = URL.createObjectURL(file.fileData);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        // For sample files, create a placeholder file
        const content = `Dies ist eine Beispieldatei: ${file.name}\nGröße: ${formatFileSize(file.size)}\nTyp: ${file.type}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showToast(`Datei "${file.name}" wird heruntergeladen`, 'success');
}

// Confirm Delete File
function confirmDeleteFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    fileToDelete = file;
    fileNameToDelete.textContent = file.name;
    deleteModal.classList.remove('hidden');
}

// Close Delete Modal
function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    fileToDelete = null;
}

// Handle Delete
function handleDelete() {
    if (!fileToDelete) return;
    
    files = files.filter(f => f.id !== fileToDelete.id);
    
    showToast(`Datei "${fileToDelete.name}" erfolgreich gelöscht`, 'success');
    
    renderFiles();
    updateFileCount();
    closeDeleteModal();
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
         </svg>` :
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
         </svg>`;
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// Keyboard Shortcuts
function handleKeyboard(e) {
    // ESC to close modal
    if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
        closeDeleteModal();
    }
    
    // Ctrl/Cmd + U to focus upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInput.click();
    }
    
    // Ctrl/Cmd + F to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
}

// Global functions for onclick handlers
window.downloadFile = downloadFile;
window.confirmDeleteFile = confirmDeleteFile;
