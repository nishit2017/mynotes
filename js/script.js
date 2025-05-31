// Application state
let notesConfig = [];
let currentNote = null;
let filteredNotes = [];

// DOM elements
const notesList = document.getElementById('notesList');
const noteContent = document.getElementById('noteContent');
const welcomeScreen = document.getElementById('welcomeScreen');
const searchBox = document.getElementById('searchBox');
const sidebar = document.getElementById('sidebar');
const backBtn = document.getElementById('backBtn');

console.log('🚀 Script loaded! DOM elements check:', {
    notesList: !!notesList,
    noteContent: !!noteContent,
    welcomeScreen: !!welcomeScreen,
    searchBox: !!searchBox,
    sidebar: !!sidebar,
    backBtn: !!backBtn
});

// Load notes from index file
async function discoverNotes() {
    console.log('📂 Starting note discovery...');
    
    try {
        // First try to load from index.json file
        console.log('🔍 Trying to fetch notes/index.json...');
        const response = await fetch('notes/index.json');
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (response.ok) {
            console.log('✅ index.json found! Parsing...');
            const fileList = await response.json();
            console.log('📋 Files in index.json:', fileList);
            
            const notes = [];
            let id = 1;

            for (const filename of fileList) {
                console.log(`🔍 Processing: ${filename}`);
                const noteConfig = createNoteConfig(filename, id++);
                if (noteConfig) {
                    notes.push(noteConfig);
                    console.log(`✅ Added: ${noteConfig.title}`);
                }
            }

            console.log('📝 Total notes created:', notes.length);
            return notes.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            console.log('❌ index.json not found, trying legacy method...');
            return await discoverNotesLegacy();
        }
    } catch (error) {
        console.error('❌ Error with index.json:', error);
        console.log('🔄 Falling back to legacy...');
        return await discoverNotesLegacy();
    }
}

// Legacy discovery method (fallback)
async function discoverNotesLegacy() {
    console.log('🔄 Using legacy discovery...');
    
    const knownFiles = [
        'system-design-fundamentals.html',
        'microservices-architecture.html', 
        'clean-code-robert-martin.html',
        'database-indexing.html',
        'design-patterns-gof.html',
        'distributed-systems-concepts.html'
    ];

    console.log('📋 Checking these files:', knownFiles);
    const notes = [];
    let id = 1;

    for (const filename of knownFiles) {
        try {
            console.log(`🔍 Checking: ${filename}`);
            const response = await fetch(`notes/${filename}`, { method: 'HEAD' });
            
            if (response.ok) {
                const noteConfig = createNoteConfig(filename, id++);
                if (noteConfig) {
                    notes.push(noteConfig);
                    console.log(`✅ Found: ${noteConfig.title}`);
                }
            } else {
                console.log(`❌ Not found: ${filename} (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ Error with ${filename}:`, error.message);
        }
    }

    console.log(`📝 Legacy method found ${notes.length} notes`);
    return notes;
}

// Create note configuration from filename (simplified - no async needed)
function createNoteConfig(filename, id) {
    try {
        const title = filename
            .replace('.html', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return {
            id: id,
            title: title,
            file: filename
        };
    } catch (error) {
        console.error(`❌ Error creating config for ${filename}:`, error);
        return null;
    }
}

// Initialize the application
async function init() {
    console.log('🎯 Initializing app...');
    
    // Show loading state
    if (notesList) {
        notesList.innerHTML = '<li><div class="loading">Discovering notes...</div></li>';
    } else {
        console.error('❌ notesList element not found!');
        return;
    }
    
    try {
        // Discover all notes
        console.log('🔍 Starting discovery...');
        notesConfig = await discoverNotes();
        filteredNotes = [...notesConfig];
        
        console.log(`📊 Discovery complete! Found ${notesConfig.length} notes:`, notesConfig);
        
        if (notesConfig.length === 0) {
            notesList.innerHTML = '<li><div class="error">No notes found in the notes/ directory</div></li>';
            console.log('⚠️ No notes found');
            return;
        }

        // Render the notes list
        console.log('🖼️ Rendering notes list...');
        renderNotesList();
        setupEventListeners();
        
        console.log('✅ App initialization complete!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        if (notesList) {
            notesList.innerHTML = '<li><div class="error">Error loading notes</div></li>';
        }
    }
}

// Render the list of notes in the sidebar
function renderNotesList() {
    console.log(`🖼️ Rendering ${filteredNotes.length} notes...`);
    
    if (!notesList) {
        console.error('❌ notesList element not found!');
        return;
    }
    
    notesList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<li><div style="padding: 20px; text-align: center; color: #6c757d;">No notes match your search</div></li>';
        return;
    }
    
    filteredNotes.forEach(note => {
        console.log(`🔗 Creating link for: ${note.title}`);
        
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'note-link';
        link.dataset.noteId = note.id;
        
        if (currentNote && currentNote.id === note.id) {
            link.classList.add('active');
        }
        
        link.innerHTML = `<strong>${note.title}</strong>`;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`🎯 Clicked on: ${note.title}`);
            showNote(note.id);
        });
        
        li.appendChild(link);
        notesList.appendChild(li);
    });
    
    console.log('✅ Notes list rendered successfully!');
}

// Load and show a specific note
async function showNote(noteId) {
    console.log(`📖 Loading note with ID: ${noteId}`);
    
    const note = notesConfig.find(n => n.id === noteId);
    if (!note) {
        console.error(`❌ Note with ID ${noteId} not found!`);
        return;
    }

    console.log(`📖 Loading: ${note.title} (${note.file})`);
    currentNote = note;
    
    // Update active state in sidebar
    document.querySelectorAll('.note-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.noteId == noteId) {
            link.classList.add('active');
        }
    });

    // Hide welcome screen
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    
    // Show loading state
    if (noteContent) {
        noteContent.innerHTML = '<div class="loading">Loading...</div>';
    }

    try {
        // Load the note content from file
        console.log(`📥 Fetching: notes/${note.file}`);
        const response = await fetch(`notes/${note.file}`);
        console.log(`📡 Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load note: ${response.statusText}`);
        }
        
        const content = await response.text();
        console.log(`📄 Content loaded (${content.length} characters)`);
        
        if (noteContent) {
            noteContent.innerHTML = `
                <div class="note-detail active">
                    <h2>${note.title}</h2>
                    <div class="note-description">
                        ${content}
                    </div>
                </div>
            `;
        }
        
        console.log('✅ Note displayed successfully!');
    } catch (error) {
        console.error('❌ Error loading note:', error);
        if (noteContent) {
            noteContent.innerHTML = `
                <div class="error">
                    <h3>Error Loading Note</h3>
                    <p>Could not load the note content. Please try again later.</p>
                </div>
            `;
        }
    }

    // On mobile, hide sidebar after selecting a note
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('mobile-show');
    }
}

// Filter notes based on search
function filterNotes(searchTerm) {
    console.log(`🔍 Filtering notes with term: "${searchTerm}"`);
    const term = searchTerm.toLowerCase();
    filteredNotes = notesConfig.filter(note => 
        note.title.toLowerCase().includes(term)
    );
    console.log(`📊 Filtered to ${filteredNotes.length} notes`);
    renderNotesList();
}

// Setup event listeners
function setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Search functionality
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            filterNotes(e.target.value);
        });
        console.log('✅ Search listener added');
    }

    // Mobile back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (sidebar) {
                sidebar.classList.remove('mobile-show');
            }
        });
        console.log('✅ Back button listener added');
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebar) {
            sidebar.classList.remove('mobile-show');
        }
    });
    console.log('✅ Resize listener added');
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 DOM loaded, starting initialization...');
    init();
});

console.log('📜 Script file loaded completely!');