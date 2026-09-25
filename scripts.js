/**
 * Google Keep Clone - Core Application Logic
 * Adheres strictly to DRY principles, semantic conventions, and state-driven architecture.
 */

/* ==========================================================================
   1. CONSTANTS & INITIAL DATA
   ========================================================================== */
const STORAGE_KEYS = {
  NOTES: 'google_keep_notes',
  THEME: 'google_keep_theme',
  LAYOUT: 'google_keep_layout'
};

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Grocery List 🛒',
    content: '- Organic almond milk\n- Fresh blueberries & avocados\n- Sourdough bread\n- Greek yogurt\n- Dark roast coffee beans',
    isPinned: true,
    isDeleted: false,
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'note-2',
    title: 'Project Ideas: Q4 Sprint',
    content: '1. Implement real-time WebSocket sync\n2. Introduce rich text markdown preview\n3. Optimize CSS Grid rendering performance\n4. Add drag-and-drop note reordering',
    isPinned: true,
    isDeleted: false,
    updatedAt: Date.now() - 7200000
  },
  {
    id: 'note-3',
    title: 'Design Inspo: Google Keep UI',
    content: 'Love the subtle hover states, floating hover drawer with box-shadow, and minimal media queries. The auto-fit grid layout is so clean!',
    isPinned: false,
    isDeleted: false,
    updatedAt: Date.now() - 14400000
  },
  {
    id: 'note-4',
    title: 'Meeting Notes: Architecture Review',
    content: 'Key decision: Keep state immutable in handlers, persist to localStorage, and trigger a unified render pipeline. DRY and reliable.',
    isPinned: false,
    isDeleted: false,
    updatedAt: Date.now() - 28800000
  }
];

/* ==========================================================================
   2. APPLICATION STATE
   ========================================================================== */
const state = {
  notes: [],
  currentView: 'notes',     // 'notes' | 'reminders' | 'inspiration' | 'personal' | 'work' | 'edit-labels' | 'archive' | 'bin'
  searchQuery: '',
  isCreatorExpanded: false,
  isCreatorPinned: false,
  currentEditingId: null,
  isModalPinned: false,
  isSidebarCollapsed: false,
  layoutMode: 'grid',       // 'grid' | 'list'
  theme: 'light'            // 'light' | 'dark'
};

/* ==========================================================================
   3. DOM ELEMENT REFERENCES
   ========================================================================== */
const DOM = {
  // Global
  html: document.documentElement,
  appContainer: document.getElementById('app-container'),
  
  // Header
  menuBtn: document.getElementById('menu-btn'),
  searchInput: document.getElementById('search-input'),
  searchBar: document.getElementById('search-bar'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  layoutToggleBtn: document.getElementById('layout-toggle-btn'),
  layoutIcon: document.getElementById('layout-icon'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeIcon: document.getElementById('theme-icon'),
  appHeader: document.getElementById('app-header'),

  // Sidebar
  sidebar: document.getElementById('sidebar'),
  navItems: document.querySelectorAll('.nav-item'),

  // Note Creator
  creatorWrapper: document.getElementById('note-creator-wrapper'),
  creator: document.getElementById('note-creator'),
  creatorCollapsed: document.getElementById('creator-collapsed'),
  creatorExpanded: document.getElementById('creator-expanded'),
  newNoteTitle: document.getElementById('new-note-title'),
  newNoteContent: document.getElementById('new-note-content'),
  newNotePinBtn: document.getElementById('new-note-pin-btn'),
  creatorCloseBtn: document.getElementById('creator-close-btn'),

  // Display Area
  notesDisplayArea: document.getElementById('notes-display-area'),
  pinnedSection: document.getElementById('pinned-section'),
  pinnedGrid: document.getElementById('pinned-grid'),
  othersSection: document.getElementById('others-section'),
  othersTitle: document.getElementById('others-title'),
  othersGrid: document.getElementById('others-grid'),
  emptyState: document.getElementById('empty-state'),
  emptyText: document.getElementById('empty-text'),

  // Edit Modal
  editModal: document.getElementById('edit-modal'),
  modalCard: document.getElementById('modal-card'),
  modalTitle: document.getElementById('modal-title'),
  modalContent: document.getElementById('modal-content'),
  modalPinBtn: document.getElementById('modal-pin-btn'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalDeleteBtn: document.getElementById('modal-delete-btn')
};

/* ==========================================================================
   4. STATE MANAGEMENT & STORAGE OPERATIONS
   ========================================================================== */
function initStorage() {
  // Load notes
  try {
    const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (savedNotes) {
      state.notes = JSON.parse(savedNotes);
    } else {
      state.notes = [...DEFAULT_NOTES];
      saveNotesToStorage();
    }
  } catch (err) {
    console.error('Failed to load notes from localStorage:', err);
    state.notes = [...DEFAULT_NOTES];
  }

  // Load theme
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  setTheme(savedTheme);

  // Load layout mode
  const savedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT) || 'grid';
  setLayoutMode(savedLayout);
}

function saveNotesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes));
  } catch (err) {
    console.error('Failed to save notes to localStorage:', err);
  }
}

function generateId() {
  return 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

/* ==========================================================================
   5. CRUD OPERATIONS
   ========================================================================== */
/**
 * Create a new note and re-render
 */
function createNote(title, content, isPinned = false) {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle && !trimmedContent) {
    return;
  }

  const newNote = {
    id: generateId(),
    title: trimmedTitle,
    content: trimmedContent,
    isPinned: Boolean(isPinned),
    isDeleted: false,
    updatedAt: Date.now()
  };

  state.notes.unshift(newNote);
  saveNotesToStorage();
  renderNotes();
}

/**
 * Update an existing note
 */
function updateNote(id, updates) {
  const noteIndex = state.notes.findIndex(note => note.id === id);
  if (noteIndex === -1) return;

  state.notes[noteIndex] = {
    ...state.notes[noteIndex],
    ...updates,
    updatedAt: Date.now()
  };

  // If note has neither title nor content, remove it cleanly
  if (!state.notes[noteIndex].title.trim() && !state.notes[noteIndex].content.trim()) {
    state.notes.splice(noteIndex, 1);
  }

  saveNotesToStorage();
  renderNotes();
}

/**
 * Toggle pin status
 */
function togglePin(id) {
  const note = state.notes.find(n => n.id === id);
  if (note) {
    updateNote(id, { isPinned: !note.isPinned });
  }
}

/**
 * Soft delete note (mark isDeleted = true)
 */
function softDeleteNote(id) {
  updateNote(id, { isDeleted: true, isPinned: false });
}

/**
 * Restore soft-deleted note
 */
function restoreNote(id) {
  updateNote(id, { isDeleted: false });
}

/**
 * Permanently delete note
 */
function permanentlyDeleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  saveNotesToStorage();
  renderNotes();
}

/* ==========================================================================
   6. UI RENDERING PIPELINE (DRY)
   ========================================================================== */
/**
 * Create a Note Card HTML Element
 */
function createNoteCardElement(note) {
  const card = document.createElement('article');
  card.className = 'note-card';
  card.dataset.id = note.id;

  const isBinView = state.currentView === 'bin';

  card.innerHTML = `
    <!-- Top-left Select Badge -->
    <button class="card-select-btn" title="Select note" aria-label="Select note">
      <span class="material-symbols-outlined">check</span>
    </button>

    <!-- Top-right Pin Button (Hidden in Bin view) -->
    ${!isBinView ? `
      <button class="card-pin-btn ${note.isPinned ? 'active' : ''}" title="${note.isPinned ? 'Unpin note' : 'Pin note'}" aria-label="Pin note">
        <span class="material-symbols-outlined">${note.isPinned ? 'push_pin' : 'push_pin'}</span>
      </button>
    ` : ''}

    <!-- Clickable Content Body -->
    <div class="card-body-click-target">
      ${note.title ? `<h3 class="card-title">${escapeHTML(note.title)}</h3>` : ''}
      ${note.content ? `<p class="card-content">${escapeHTML(note.content)}</p>` : ''}
    </div>

    <!-- Bottom Action Toolbar -->
    <div class="card-actions">
      <div class="card-actions-left">
        ${!isBinView ? `
          <button class="icon-btn icon-btn-sm" title="Remind me" aria-label="Remind me">
            <span class="material-symbols-outlined">add_alert</span>
          </button>
          <button class="icon-btn icon-btn-sm" title="Collaborator" aria-label="Collaborator">
            <span class="material-symbols-outlined">person_add</span>
          </button>
          <button class="icon-btn icon-btn-sm" title="Background options" aria-label="Background options">
            <span class="material-symbols-outlined">palette</span>
          </button>
          <button class="icon-btn icon-btn-sm" title="Add image" aria-label="Add image">
            <span class="material-symbols-outlined">image</span>
          </button>
          <button class="icon-btn icon-btn-sm" title="Archive" aria-label="Archive">
            <span class="material-symbols-outlined">archive</span>
          </button>
        ` : `
          <button class="icon-btn icon-btn-sm btn-restore-note" title="Restore note" aria-label="Restore note">
            <span class="material-symbols-outlined">restore_from_trash</span>
          </button>
          <button class="icon-btn icon-btn-sm btn-perm-delete-note" title="Delete forever" aria-label="Delete forever">
            <span class="material-symbols-outlined">delete_forever</span>
          </button>
        `}
      </div>

      ${!isBinView ? `
        <!-- 3-Dot More Menu -->
        <div class="dropdown-container">
          <button class="icon-btn icon-btn-sm card-more-btn" title="More" aria-label="More options">
            <span class="material-symbols-outlined">more_vert</span>
          </button>
          <div class="dropdown-menu">
            <button class="dropdown-item btn-delete-note">
              <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
              Delete note
            </button>
            <button class="dropdown-item btn-add-label">
              <span class="material-symbols-outlined" style="font-size: 18px;">label</span>
              Add label
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  return card;
}

/**
 * Filter notes based on active view and search query
 */
function getFilteredNotes() {
  const query = state.searchQuery.trim().toLowerCase();

  return state.notes.filter(note => {
    // View filtering
    if (state.currentView === 'bin') {
      if (!note.isDeleted) return false;
    } else {
      if (note.isDeleted) return false;
    }

    // Search query filtering
    if (query) {
      const matchTitle = note.title && note.title.toLowerCase().includes(query);
      const matchContent = note.content && note.content.toLowerCase().includes(query);
      return matchTitle || matchContent;
    }

    return true;
  });
}

/**
 * Main Render Pipeline
 */
function renderNotes() {
  const filtered = getFilteredNotes();
  const isBinView = state.currentView === 'bin';

  // Toggle Note Creator visibility based on view
  if (DOM.creatorWrapper) {
    DOM.creatorWrapper.style.display = isBinView ? 'none' : 'block';
  }

  // Clear existing grids
  DOM.pinnedGrid.innerHTML = '';
  DOM.othersGrid.innerHTML = '';

  // Apply layout mode (grid vs list)
  DOM.pinnedGrid.classList.toggle('list-view', state.layoutMode === 'list');
  DOM.othersGrid.classList.toggle('list-view', state.layoutMode === 'list');

  // Handle Empty State
  if (filtered.length === 0) {
    DOM.pinnedSection.style.display = 'none';
    DOM.othersSection.style.display = 'none';
    DOM.emptyState.style.display = 'flex';

    if (state.searchQuery) {
      DOM.emptyText.textContent = 'No matching notes found';
    } else if (isBinView) {
      DOM.emptyText.textContent = 'No notes in Bin';
    } else if (state.currentView === 'archive') {
      DOM.emptyText.textContent = 'Your archived notes appear here';
    } else if (state.currentView === 'reminders') {
      DOM.emptyText.textContent = 'Notes with upcoming reminders appear here';
    } else {
      DOM.emptyText.textContent = 'Notes that you add appear here';
    }
    return;
  }

  DOM.emptyState.style.display = 'none';

  // Partition notes into Pinned & Others
  const pinnedNotes = !isBinView ? filtered.filter(n => n.isPinned) : [];
  const otherNotes = !isBinView ? filtered.filter(n => !n.isPinned) : filtered;

  if (pinnedNotes.length > 0) {
    // Show PINNED section
    DOM.pinnedSection.style.display = 'block';
    pinnedNotes.forEach(note => {
      DOM.pinnedGrid.appendChild(createNoteCardElement(note));
    });

    // Show OTHERS section with header title
    DOM.othersSection.style.display = 'block';
    DOM.othersTitle.style.display = otherNotes.length > 0 ? 'block' : 'none';
    otherNotes.forEach(note => {
      DOM.othersGrid.appendChild(createNoteCardElement(note));
    });
  } else {
    // No pinned notes: hide PINNED section and hide "OTHERS" label
    DOM.pinnedSection.style.display = 'none';
    DOM.othersSection.style.display = 'block';
    DOM.othersTitle.style.display = 'none';
    otherNotes.forEach(note => {
      DOM.othersGrid.appendChild(createNoteCardElement(note));
    });
  }
}

/* ==========================================================================
   7. AUTO-EXPANDING TEXTAREAS
   ========================================================================== */
function autoResizeTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

/* ==========================================================================
   8. NOTE CREATOR EXPANSION & SAVING
   ========================================================================== */
function expandCreator() {
  if (state.isCreatorExpanded) return;
  state.isCreatorExpanded = true;
  DOM.creator.classList.add('expanded');
  DOM.newNoteTitle.focus();
  autoResizeTextarea(DOM.newNoteContent);
}

function collapseAndSaveCreator() {
  if (!state.isCreatorExpanded) return;

  const title = DOM.newNoteTitle.value;
  const content = DOM.newNoteContent.value;
  const isPinned = state.isCreatorPinned;

  // Save if non-empty
  createNote(title, content, isPinned);

  // Reset creator state & inputs
  DOM.newNoteTitle.value = '';
  DOM.newNoteContent.value = '';
  DOM.newNoteContent.style.height = 'auto';
  state.isCreatorPinned = false;
  DOM.newNotePinBtn.classList.remove('active');
  state.isCreatorExpanded = false;
  DOM.creator.classList.remove('expanded');
}

/* ==========================================================================
   9. EDIT MODAL LOGIC
   ========================================================================== */
function openEditModal(noteId) {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return;

  state.currentEditingId = noteId;
  state.isModalPinned = note.isPinned;

  DOM.modalTitle.value = note.title || '';
  DOM.modalContent.value = note.content || '';
  DOM.modalPinBtn.classList.toggle('active', note.isPinned);

  DOM.editModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Resize content height
  setTimeout(() => {
    autoResizeTextarea(DOM.modalContent);
    DOM.modalContent.focus();
  }, 50);
}

function closeAndSaveEditModal() {
  if (!state.currentEditingId) return;

  const title = DOM.modalTitle.value;
  const content = DOM.modalContent.value;
  const isPinned = state.isModalPinned;

  updateNote(state.currentEditingId, {
    title,
    content,
    isPinned
  });

  state.currentEditingId = null;
  DOM.editModal.classList.remove('open');
  document.body.style.overflow = '';
}

/* ==========================================================================
   10. THEME & VIEW TOGGLES
   ========================================================================== */
function setTheme(theme) {
  state.theme = theme;
  DOM.html.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.THEME, theme);

  if (DOM.themeIcon) {
    DOM.themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    DOM.themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Toggle light mode' : 'Toggle dark mode');
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'light' ? 'dark' : 'light';
  setTheme(nextTheme);
}

function setLayoutMode(mode) {
  state.layoutMode = mode;
  localStorage.setItem(STORAGE_KEYS.LAYOUT, mode);

  if (DOM.layoutIcon) {
    DOM.layoutIcon.textContent = mode === 'grid' ? 'view_agenda' : 'grid_view';
    DOM.layoutToggleBtn.setAttribute('title', mode === 'grid' ? 'List view' : 'Grid view');
  }

  renderNotes();
}

function toggleLayoutMode() {
  const nextMode = state.layoutMode === 'grid' ? 'list' : 'grid';
  setLayoutMode(nextMode);
}

function toggleSidebar() {
  if (window.innerWidth <= 768) {
    // Mobile slide-out drawer
    DOM.sidebar.classList.toggle('mobile-open');
  } else {
    // Desktop mini-rail collapse
    state.isSidebarCollapsed = !state.isSidebarCollapsed;
    DOM.sidebar.classList.toggle('collapsed', state.isSidebarCollapsed);
  }
}

/* ==========================================================================
   11. UTILITY HELPERS
   ========================================================================== */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    menu.classList.remove('show');
    const actions = menu.closest('.card-actions');
    if (actions) actions.classList.remove('menu-open');
  });
}

/* ==========================================================================
   12. EVENT LISTENERS
   ========================================================================== */
function initEventListeners() {
  // --- Header interactions ---
  DOM.menuBtn.addEventListener('click', toggleSidebar);
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  DOM.layoutToggleBtn.addEventListener('click', toggleLayoutMode);
  
  window.addEventListener('scroll', () => {
    DOM.appHeader.classList.toggle('scrolled', window.scrollY > 0);
  });

  DOM.refreshBtn.addEventListener('click', () => {
    DOM.refreshBtn.style.transform = 'rotate(360deg)';
    DOM.refreshBtn.style.transition = 'transform 0.4s ease';
    setTimeout(() => {
      DOM.refreshBtn.style.transform = 'none';
      DOM.refreshBtn.style.transition = 'none';
      renderNotes();
    }, 400);
  });

  // Search input real-time filtering
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    DOM.searchBar.classList.toggle('has-query', state.searchQuery.length > 0);
    renderNotes();
  });

  DOM.searchInput.addEventListener('focus', () => {
    DOM.searchBar.classList.add('focused');
  });

  DOM.searchInput.addEventListener('blur', () => {
    DOM.searchBar.classList.remove('focused');
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    state.searchQuery = '';
    DOM.searchInput.value = '';
    DOM.searchBar.classList.remove('has-query');
    DOM.searchInput.focus();
    renderNotes();
  });

  // --- Sidebar navigation ---
  DOM.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      DOM.navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      const view = item.dataset.view;
      state.currentView = view;

      // On mobile, close drawer on navigation
      if (window.innerWidth <= 768) {
        DOM.sidebar.classList.remove('mobile-open');
      }

      renderNotes();
    });
  });

  // --- Note Creator interactions ---
  DOM.creatorCollapsed.addEventListener('click', expandCreator);

  DOM.newNoteContent.addEventListener('input', () => {
    autoResizeTextarea(DOM.newNoteContent);
  });

  DOM.newNotePinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.isCreatorPinned = !state.isCreatorPinned;
    DOM.newNotePinBtn.classList.toggle('active', state.isCreatorPinned);
  });

  DOM.creatorCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    collapseAndSaveCreator();
  });

  // Close creator when clicking outside
  document.addEventListener('click', (e) => {
    if (state.isCreatorExpanded && !DOM.creator.contains(e.target)) {
      collapseAndSaveCreator();
    }

    // Close any open card dropdowns when clicking outside
    if (!e.target.closest('.dropdown-container')) {
      closeAllDropdowns();
    }
  });

  // --- Event Delegation on Notes Display Area ---
  DOM.notesDisplayArea.addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (!card) return;
    const noteId = card.dataset.id;

    // Pin Button Click
    const pinBtn = e.target.closest('.card-pin-btn');
    if (pinBtn) {
      e.stopPropagation();
      togglePin(noteId);
      return;
    }

    // Select Checkmark Click
    const selectBtn = e.target.closest('.card-select-btn');
    if (selectBtn) {
      e.stopPropagation();
      card.classList.toggle('selected');
      return;
    }

    // 3-Dot More Menu Click
    const moreBtn = e.target.closest('.card-more-btn');
    if (moreBtn) {
      e.stopPropagation();
      const dropdown = moreBtn.nextElementSibling;
      const actions = moreBtn.closest('.card-actions');
      const isAlreadyOpen = dropdown.classList.contains('show');
      closeAllDropdowns();
      if (!isAlreadyOpen) {
        dropdown.classList.add('show');
        if (actions) actions.classList.add('menu-open');
      }
      return;
    }

    // Delete Note Click
    const deleteBtn = e.target.closest('.btn-delete-note');
    if (deleteBtn) {
      e.stopPropagation();
      closeAllDropdowns();
      softDeleteNote(noteId);
      return;
    }

    // Restore Note Click (Bin view)
    const restoreBtn = e.target.closest('.btn-restore-note');
    if (restoreBtn) {
      e.stopPropagation();
      restoreNote(noteId);
      return;
    }

    // Permanently Delete Note Click (Bin view)
    const permDeleteBtn = e.target.closest('.btn-perm-delete-note');
    if (permDeleteBtn) {
      e.stopPropagation();
      permanentlyDeleteNote(noteId);
      return;
    }

    // Ignore other toolbar action clicks
    if (e.target.closest('.icon-btn') || e.target.closest('.dropdown-menu')) {
      e.stopPropagation();
      return;
    }

    // Card Body Click -> Open Edit Modal (if not in Bin view)
    if (state.currentView !== 'bin') {
      openEditModal(noteId);
    }
  });

  // --- Edit Modal interactions ---
  DOM.modalContent.addEventListener('input', () => {
    autoResizeTextarea(DOM.modalContent);
  });

  DOM.modalPinBtn.addEventListener('click', () => {
    state.isModalPinned = !state.isModalPinned;
    DOM.modalPinBtn.classList.toggle('active', state.isModalPinned);
  });

  DOM.modalCloseBtn.addEventListener('click', closeAndSaveEditModal);

  DOM.modalDeleteBtn.addEventListener('click', () => {
    if (state.currentEditingId) {
      const idToDelete = state.currentEditingId;
      state.currentEditingId = null;
      DOM.editModal.classList.remove('open');
      document.body.style.overflow = '';
      softDeleteNote(idToDelete);
    }
  });

  // Close modal when clicking on backdrop
  DOM.editModal.addEventListener('click', (e) => {
    if (e.target === DOM.editModal) {
      closeAndSaveEditModal();
    }
  });

  // Escape key closes modal / creator / dropdowns
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.editModal.classList.contains('open')) {
        closeAndSaveEditModal();
      } else if (state.isCreatorExpanded) {
        collapseAndSaveCreator();
      }
      closeAllDropdowns();
    }
  });
}

/* ==========================================================================
   13. INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initEventListeners();
  renderNotes();
});
