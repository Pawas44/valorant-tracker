import { getAgents, AGENT_ROLES } from '../api/assets.js';
import { getState, setState, showToast } from '../api/state.js';

let agentsData = [];
let filteredAgents = [];
let activeRole = 'All';

export function render() {
  return `
    <div class="page instalock-page">
      <div class="page-header">
        <h1>AGENT SELECT</h1>
      </div>
      
      <div class="favorite-hero" id="favorite-hero">
        <!-- Filled by JS -->
      </div>
      
      <div class="role-filters" id="role-filters">
        <button class="role-chip active" data-role="All">All</button>
        <button class="role-chip" data-role="Duelist">Duelists</button>
        <button class="role-chip" data-role="Controller">Controllers</button>
        <button class="role-chip" data-role="Initiator">Initiators</button>
        <button class="role-chip" data-role="Sentinel">Sentinels</button>
      </div>

      <div class="agents-grid" id="agents-grid">
        <div class="loading-state">Loading agents...</div>
      </div>
    </div>
  `;
}

function renderFavoriteHero(container) {
  const state = getState();
  const favoriteUuid = state.favoriteAgent;
  
  if (!favoriteUuid) {
    container.innerHTML = `
      <div class="no-favorite">
        <p>Pre-select your agent for faster picks</p>
        <span>Tap an agent below to set as favorite</span>
      </div>
    `;
    return;
  }

  const agent = agentsData.find(a => a.uuid === favoriteUuid);
  if (agent) {
    container.innerHTML = `
      <div class="favorite-agent-card" style="background-image: url('${agent.background}')">
        <div class="favorite-overlay">
          <span class="favorite-label">YOUR PICK</span>
          <h2>${agent.displayName}</h2>
          <img src="${agent.displayIcon}" alt="${agent.displayName}" class="favorite-icon" />
        </div>
      </div>
    `;
  }
}

function renderAgentsGrid(container) {
  const state = getState();
  const favoriteUuid = state.favoriteAgent;
  
  container.innerHTML = filteredAgents.map(agent => {
    const isFavorite = agent.uuid === favoriteUuid;
    return `
      <div class="agent-card ${isFavorite ? 'is-favorite' : ''}" data-uuid="${agent.uuid}">
        <div class="agent-portrait">
          <img src="${agent.displayIconSmall || agent.displayIcon}" alt="${agent.displayName}" loading="lazy" />
        </div>
        <span class="agent-name">${agent.displayName}</span>
      </div>
    `;
  }).join('');
}

function showAgentModal(uuid) {
  const agent = agentsData.find(a => a.uuid === uuid);
  if (!agent) return;

  const state = getState();
  const isFavorite = state.favoriteAgent === uuid;

  const overlay = document.createElement('div');
  overlay.className = 'agent-modal-overlay';
  
  const abilitiesHtml = agent.abilities ? agent.abilities.map(ability => `
    <div class="ability-card">
      <img src="${ability.displayIcon || ''}" alt="${ability.displayName}" class="ability-icon" onerror="this.style.display='none'" />
      <div class="ability-info">
        <span class="ability-name">${ability.displayName}</span>
        <span class="ability-slot">${ability.slot}</span>
      </div>
    </div>
  `).join('') : '';

  const roleName = agent.role ? agent.role.displayName : 'Unknown';
  const roleIcon = agent.role ? agent.role.displayIcon : '';

  overlay.innerHTML = `
    <div class="agent-modal">
      <div class="modal-close" id="modal-close">×</div>
      <div class="modal-hero" style="background-image: url('${agent.background}')">
        <img src="${agent.fullPortraitV2 || agent.fullPortrait || agent.displayIcon}" alt="${agent.displayName}" class="modal-portrait" />
      </div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>${agent.displayName}</h2>
          <div class="agent-role">
            ${roleIcon ? `<img src="${roleIcon}" alt="${roleName}" />` : ''}
            <span>${roleName}</span>
          </div>
        </div>
        
        <div class="abilities-section">
          <h3>Abilities</h3>
          <div class="abilities-list">
            ${abilitiesHtml}
          </div>
        </div>

        <button class="set-favorite-btn ${isFavorite ? 'active' : ''}" id="set-favorite-btn">
          ${isFavorite ? 'CURRENT FAVORITE' : 'SET AS FAVORITE'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.style.animation = 'fadeOut 0.2s ease forwards';
    overlay.querySelector('.agent-modal').style.animation = 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 200);
  };

  overlay.querySelector('#modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  overlay.querySelector('#set-favorite-btn').addEventListener('click', () => {
    setState({ favoriteAgent: uuid });
    showToast(`${agent.displayName} set as favorite`);
    closeModal();
    // Re-render
    const mainContainer = document.querySelector('.instalock-page');
    if (mainContainer) {
      renderFavoriteHero(mainContainer.querySelector('#favorite-hero'));
      renderAgentsGrid(mainContainer.querySelector('#agents-grid'));
    }
  });
}

export async function init() {
  try {
    agentsData = await getAgents();
    // Filter out duplicate Sova from API if exists (UUID: 320b2a48-4d9b-a075-30f1-1f93a9b638fa is old sova)
    agentsData = agentsData.filter(a => a.isPlayableCharacter);
    
    // Sort alphabetically
    agentsData.sort((a, b) => a.displayName.localeCompare(b.displayName));
    filteredAgents = agentsData;
    
    const heroContainer = document.getElementById('favorite-hero');
    const gridContainer = document.getElementById('agents-grid');
    
    renderFavoriteHero(heroContainer);
    renderAgentsGrid(gridContainer);

    // Setup role filters
    const roleFilters = document.getElementById('role-filters');
    roleFilters.addEventListener('click', (e) => {
      const chip = e.target.closest('.role-chip');
      if (!chip) return;

      document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      activeRole = chip.dataset.role;
      if (activeRole === 'All') {
        filteredAgents = agentsData;
      } else {
        filteredAgents = agentsData.filter(a => a.role && a.role.displayName === activeRole);
      }
      
      renderAgentsGrid(gridContainer);
    });

    // Setup agent clicks
    gridContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.agent-card');
      if (card) {
        showAgentModal(card.dataset.uuid);
      }
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    showToast('Failed to load agents');
  }

  return () => {
    destroy();
  };
}

export function destroy() {
  const overlay = document.querySelector('.agent-modal-overlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}
