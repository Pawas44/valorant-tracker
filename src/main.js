// ============================================================
// VALORANT Tracker — Main Entry Point
// ============================================================

import './styles/index.css';
import './styles/navbar.css';
import './styles/login.css';
import './styles/home.css';
import './styles/live.css';
import './styles/career.css';
import './styles/store.css';
import './styles/instalock.css';

import { registerRoute, initRouter, navigate } from './router.js';
import { loadState, getState } from './api/state.js';
import { renderNavbar } from './components/navbar.js';
import * as loginPage from './pages/login.js';
import * as homePage from './pages/home.js';
import * as livePage from './pages/live.js';
import * as careerPage from './pages/career.js';
import * as storePage from './pages/store.js';
import * as instalockPage from './pages/instalock.js';

function init() {
  const state = loadState();

  // Build app shell
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="page-content" style="flex:1; transition: opacity 0.3s ease, transform 0.3s ease;"></div>
    ${state.isLoggedIn ? renderNavbar() : ''}
  `;

  // Register routes
  registerRoute('login', loginPage);
  registerRoute('home', homePage);
  registerRoute('live', livePage);
  registerRoute('career', careerPage);
  registerRoute('store', storePage);
  registerRoute('agents', instalockPage);

  // Setup navbar click handlers
  setupNavbar();

  // Start router
  const defaultRoute = state.isLoggedIn ? 'home' : 'login';
  initRouter(defaultRoute);
}

function setupNavbar() {
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.nav-tab');
    if (tab) {
      e.preventDefault();
      const route = tab.dataset.route;
      if (route) navigate(route);

      // Haptic-like visual feedback
      tab.style.transform = 'scale(0.9)';
      setTimeout(() => { tab.style.transform = ''; }, 150);
    }
  });
}

// Called after login to show navbar
export function showNavbar() {
  const app = document.getElementById('app');
  const existing = document.getElementById('bottom-navbar');
  if (!existing) {
    app.insertAdjacentHTML('beforeend', renderNavbar());
    setupNavbar();
  }
}

export function hideNavbar() {
  const navbar = document.getElementById('bottom-navbar');
  if (navbar) navbar.remove();
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
