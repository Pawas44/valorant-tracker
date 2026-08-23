// ============================================================
// Bottom Navigation Bar Component
// ============================================================

export function renderNavbar() {
  return `
    <nav id="bottom-navbar" class="bottom-navbar">
      <div class="nav-glass"></div>
      <div class="nav-tabs">
        <button class="nav-tab active" data-route="home" id="nav-home">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="nav-label">Home</span>
          <div class="nav-indicator"></div>
        </button>
        <button class="nav-tab" data-route="live" id="nav-live">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          <span class="nav-label">Live</span>
          <div class="nav-dot-live"></div>
          <div class="nav-indicator"></div>
        </button>
        <button class="nav-tab" data-route="career" id="nav-career">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span class="nav-label">Career</span>
          <div class="nav-indicator"></div>
        </button>
        <button class="nav-tab" data-route="store" id="nav-store">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span class="nav-label">Store</span>
          <div class="nav-indicator"></div>
        </button>
        <button class="nav-tab" data-route="agents" id="nav-agents">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span class="nav-label">Agents</span>
          <div class="nav-indicator"></div>
        </button>
      </div>
    </nav>
  `;
}
