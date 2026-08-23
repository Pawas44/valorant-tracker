// ============================================================
// Global State Manager
// ============================================================

const STATE_KEY = 'valorant_tracker_state';

const defaultState = {
  user: null,       // { name, tag, region, puuid, accountLevel, card }
  apiKey: '',       // HenrikDev API key
  isLoggedIn: false,
  preferredAgent: null,  // { id, name, displayIcon }
  agentPresets: [],      // saved agent presets
  theme: 'dark',
};

let state = { ...defaultState };
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  state = { ...state, ...updates };
  saveState();
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return state;
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

export function clearState() {
  state = { ...defaultState };
  localStorage.removeItem(STATE_KEY);
  listeners.forEach(fn => fn(state));
}

// Toast notification system
let toastContainer = null;

export function showToast(message, type = 'info') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
