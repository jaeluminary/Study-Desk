/**
 * STUDY DESK - STATE MANAGEMENT & PERSISTENCE
 * Centralized reactive store with event dispatching and local/cloud persistence.
 */

const STORAGE_KEY = 'study_desk_state_v1';

// Initial cozy demo seed state
const DEFAULT_STATE = {
  theme: 'theme-a', // 'theme-a' or 'theme-b'
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  soundEnabled: true,
  notificationsEnabled: true,
  user: null, // { uid, email, displayName, photoURL }

  // 1. Focus State
  focus: {
    currentSubject: 'Organic Chemistry',
    currentTopic: 'Reaction Mechanisms (Ch 8)',
    materialId: 'mat-1',
    intention: 'Master SN1 vs SN2 reaction coordinates without getting stuck',
    lastUpdated: Date.now() - 3600000,
    history: [
      { subject: 'Organic Chemistry', topic: 'Ch 8 Reactions', timestamp: Date.now() - 3600000 },
      { subject: 'Linear Algebra', topic: 'Eigenvectors & Values', timestamp: Date.now() - 86400000 },
      { subject: 'Modern European History', topic: 'Industrial Revolution Notes', timestamp: Date.now() - 172800000 }
    ]
  },

  // 2. Goals State
  goals: [
    {
      id: 'g-1',
      title: 'Practice 15 Chem Mechanism Problems',
      subject: 'Organic Chemistry',
      targetCount: 15,
      currentCount: 8,
      repeat: 'daily', // 'one-time' | 'daily' | 'weekly' | 'custom'
      streak: 4,
      cyclesCompleted: 1,
      lastCheckIn: Date.now() - (14 * 3600 * 1000), // 14 hours ago (eligible for check-in)
      createdAt: Date.now() - 432000000,
      checkInHistory: [
        Date.now() - (14 * 3600 * 1000),
        Date.now() - (38 * 3600 * 1000),
        Date.now() - (62 * 3600 * 1000)
      ]
    },
    {
      id: 'g-2',
      title: 'Review 30 Flashcards Daily',
      subject: 'Spanish Literature',
      targetCount: 30,
      currentCount: 30,
      repeat: 'daily',
      streak: 7,
      cyclesCompleted: 3,
      lastCheckIn: Date.now() - (2 * 3600 * 1000), // 2 hours ago (disabled countdown active)
      createdAt: Date.now() - 600000000,
      checkInHistory: [Date.now() - (2 * 3600 * 1000)]
    },
    {
      id: 'g-3',
      title: 'Draft Essay Outline',
      subject: 'Modern European History',
      targetCount: 5,
      currentCount: 2,
      repeat: 'one-time',
      streak: 1,
      cyclesCompleted: 0,
      lastCheckIn: Date.now() - (20 * 3600 * 1000),
      createdAt: Date.now() - 100000000,
      checkInHistory: []
    }
  ],

  // 3. Timer State & Sessions
  timer: {
    mode: 'focus', // 'focus' | 'short-break' | 'long-break'
    presetMinutes: 25,
    customMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    isRunning: false,
    startedAt: null,
    targetEndTime: null,
    remainingSeconds: 25 * 60,
    totalSessionsCompleted: 14,
    sessions: [
      { id: 'ts-1', subject: 'Organic Chemistry', durationMinutes: 25, completedAt: Date.now() - 3600000 },
      { id: 'ts-2', subject: 'Linear Algebra', durationMinutes: 50, completedAt: Date.now() - 86400000 },
      { id: 'ts-3', subject: 'Organic Chemistry', durationMinutes: 25, completedAt: Date.now() - 90000000 },
      { id: 'ts-4', subject: 'Spanish Literature', durationMinutes: 45, completedAt: Date.now() - 172800000 },
      { id: 'ts-5', subject: 'Modern European History', durationMinutes: 60, completedAt: Date.now() - 259200000 },
      { id: 'ts-6', subject: 'Organic Chemistry', durationMinutes: 30, completedAt: Date.now() - 345600000 },
      { id: 'ts-7', subject: 'Linear Algebra', durationMinutes: 45, completedAt: Date.now() - 432000000 }
    ]
  },

  // 4. Music (Spotify) State
  music: {
    connected: false,
    isPremium: true,
    isPlaying: true,
    trackTitle: 'Lofi Study Coffee Beans',
    artistName: 'Cozy Beats Collective',
    albumArt: null, // Will show code-drawn cozy album placeholder or Spotify art
    albumName: 'Late Night Chill Hop',
    progressMs: 74000,
    durationMs: 165000,
    lastPolled: Date.now()
  },

  // 5. Materials ("Hall of Materials")
  materials: [
    {
      id: 'mat-1',
      title: 'SN1 vs SN2 Mechanisms Cheat Sheet',
      type: 'note', // 'note' | 'document' | 'link'
      subject: 'Organic Chemistry',
      folderId: 'f-1',
      tags: ['Chemistry', 'Exam Prep', 'Reactions'],
      content: '# SN1 vs SN2 Reaction Coordinates\n\n- **SN1**: Two-step mechanism via carbocation intermediate. Favors tertiary substrates and polar protic solvents.\n- **SN2**: One-step concerted backside attack with inversion of stereochemistry. Favors primary/secondary substrates and polar aprotic solvents.',
      dateAdded: Date.now() - 86400000 * 2,
      fileSize: null,
      fileUrl: null
    },
    {
      id: 'mat-2',
      title: 'Eigenvalues & Diagonalization Lecture Slides.pdf',
      type: 'document',
      subject: 'Linear Algebra',
      folderId: 'f-2',
      tags: ['Math', 'Matrices', 'Vectors'],
      content: 'Lecture notes covering characteristic polynomial, algebraic vs geometric multiplicity, and matrix diagonalization rules.',
      dateAdded: Date.now() - 86400000 * 4,
      fileSize: '2.4 MB',
      fileUrl: null
    },
    {
      id: 'mat-3',
      title: 'Interactive 3D Molecular Model Simulator',
      type: 'link',
      subject: 'Organic Chemistry',
      folderId: 'f-1',
      tags: ['Chemistry', 'Tools', 'Visualization'],
      content: 'https://molview.org - Web-based tool to inspect 3D molecular conformations and bond angles.',
      dateAdded: Date.now() - 86400000 * 5,
      fileSize: null,
      fileUrl: null
    }
  ],

  folders: [
    { id: 'f-1', name: 'Organic Chemistry', icon: 'flask-conical' },
    { id: 'f-2', name: 'Linear Algebra', icon: 'binary' },
    { id: 'f-3', name: 'Modern European History', icon: 'book-open' },
    { id: 'f-4', name: 'Spanish Literature', icon: 'languages' }
  ],

  // 6. Score Tracker & Monthly Postcards
  scores: [
    { id: 'sc-1', subject: 'Organic Chemistry', name: 'Midterm 1: Stereochemistry', type: 'exam', score: 92, maxScore: 100, date: '2026-09-12' },
    { id: 'sc-2', subject: 'Linear Algebra', name: 'Vector Spaces Quiz', type: 'quiz', score: 19, maxScore: 20, date: '2026-09-15' },
    { id: 'sc-3', subject: 'Modern European History', name: 'Primary Source Analysis Essay', type: 'assignment', score: 88, maxScore: 100, date: '2026-09-18' },
    { id: 'sc-4', subject: 'Spanish Literature', name: 'Vocab & Grammar Unit 3', type: 'quiz', score: 48, maxScore: 50, date: '2026-09-20' },
    { id: 'sc-5', subject: 'Organic Chemistry', name: 'Lab Report 2: Distillation', type: 'assignment', score: 96, maxScore: 100, date: '2026-09-21' }
  ],

  monthlyPostcards: [
    {
      id: 'pc-2026-08',
      monthYear: 'August 2026',
      overallAverage: 91.4,
      changePercent: 3.2,
      bestSubject: 'Organic Chemistry',
      mostImproved: 'Linear Algebra',
      scoresCount: 6,
      studyHours: 28.5,
      quote: 'Consistency isn’t about perfection; it’s about showing up quietly, cup of tea in hand.',
      dateGenerated: '2026-09-01'
    }
  ],

  // 7. Reminders & Tasks
  reminders: [
    {
      id: 'rem-1',
      title: 'Submit Chem Lab Pre-Reading Questions',
      subject: 'Organic Chemistry',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      priority: 'high', // 'low' | 'medium' | 'high'
      completed: false,
      subtasks: [
        { id: 'st-1', text: 'Read procedure section 4.2', completed: true },
        { id: 'st-2', text: 'Calculate theoretical yield table', completed: false }
      ]
    },
    {
      id: 'rem-2',
      title: 'Review Chapter 5 Practice Problems',
      subject: 'Linear Algebra',
      dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 16),
      priority: 'medium',
      completed: false,
      subtasks: []
    },
    {
      id: 'rem-3',
      title: 'Borrow Spanish Anthology from Campus Library',
      subject: 'Spanish Literature',
      dueDate: new Date(Date.now() - 3600000 * 4).toISOString().slice(0, 16), // Overdue
      priority: 'low',
      completed: false,
      subtasks: []
    },
    {
      id: 'rem-4',
      title: 'Organize study desk flashcards box',
      subject: 'General',
      dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 16),
      priority: 'low',
      completed: true,
      subtasks: []
    }
  ]
};

class Store {
  constructor() {
    this.listeners = new Map();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Merge with defaults so new fields are never undefined
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (err) {
      console.warn('Could not read state from localStorage:', err);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }

  getState() {
    return this.state;
  }

  setState(updater, sourceEvent = 'state_change') {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.saveState();
    this.dispatch(sourceEvent, this.state);
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  dispatch(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in subscriber callback for ${event}:`, e);
        }
      });
    }
    // Also trigger global '*' listener
    if (event !== '*' && this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => cb({ event, data }));
    }
  }

  resetAllData() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
    this.dispatch('state_reset', this.state);
  }
}

export const store = new Store();
