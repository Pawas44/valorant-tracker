import { getMMR, getMatches, getMMRByPuuid, getMatchesByPuuid, getRankName, getRankColor } from '../api/henrik.js';
import { getRankIcon, getAgentByUuid, getMapByUrl } from '../api/assets.js';
import { getState } from '../api/state.js';

export function render() {
  const state = getState();
  const user = state.user || {};
  const cardUrl = user.card?.wide || user.card?.small || '';
  
  return `
    <div class="page home-page">
      <header class="home-header">
        <div class="greeting">
          <p class="greeting-sub">Welcome back,</p>
          <h2 class="greeting-name">${user.name || 'Player'}</h2>
        </div>
      </header>
      
      <section class="player-card-section" style="--card-bg: url('${cardUrl}')">
        <div class="player-card-content">
          <div class="player-identity">
            <h3 class="player-name">${user.name || 'Unknown'}<span class="player-tag">#${user.tag || '0000'}</span></h3>
            <div class="player-level">Level ${user.accountLevel || 0}</div>
          </div>
        </div>
      </section>
      
      <section class="rank-section skeleton-container" id="rank-container">
        <div class="section-header">
          <div class="accent-line"></div>
          <h4>Current Rank</h4>
        </div>
        <div class="rank-display skeleton"></div>
      </section>
      
      <section class="stats-section skeleton-container" id="stats-container">
        <div class="section-header">
          <div class="accent-line"></div>
          <h4>Recent Performance</h4>
        </div>
        <div class="stats-grid">
          <div class="stat-card skeleton"></div>
          <div class="stat-card skeleton"></div>
          <div class="stat-card skeleton"></div>
          <div class="stat-card skeleton"></div>
        </div>
      </section>
      
      <section class="matches-section skeleton-container" id="matches-container">
        <div class="section-header">
          <div class="accent-line"></div>
          <h4>Recent Matches</h4>
        </div>
        <div class="matches-list">
          <div class="match-card skeleton"></div>
          <div class="match-card skeleton"></div>
          <div class="match-card skeleton"></div>
        </div>
      </section>
    </div>
  `;
}

export function init() {
  loadDashboardData();
  return () => {};
}

export function destroy() {
  // cleanup
}

async function loadDashboardData() {
  const state = getState();
  const user = state.user;
  
  if (!user) return;

  try {
    const usePuuid = user.puuid && !user.puuid.startsWith('test-');
    
    const [mmrData, matchesData] = await Promise.all([
      usePuuid
        ? getMMRByPuuid(user.region, user.puuid).catch(() => null)
        : getMMR(user.region, user.name, user.tag).catch(() => null),
      usePuuid
        ? getMatchesByPuuid(user.region, user.puuid).catch(() => null)
        : getMatches(user.region, user.name, user.tag).catch(() => null)
    ]);

    renderRank(mmrData);
    
    if (matchesData && matchesData.length > 0) {
      renderStats(matchesData, user.puuid);
      renderMatches(matchesData.slice(0, 3), user.puuid);
    } else {
      const statsEl = document.getElementById('stats-container');
      const matchesEl = document.getElementById('matches-container');
      if (statsEl) statsEl.innerHTML = '<p class="empty-msg">No recent stats found.</p>';
      if (matchesEl) matchesEl.innerHTML = '<p class="empty-msg">No recent matches found.</p>';
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function renderRank(mmr) {
  const container = document.getElementById('rank-container');
  if (!container) return;
  
  if (!mmr || !mmr.currenttier) {
    container.innerHTML = `
      <div class="section-header">
        <div class="accent-line"></div>
        <h4>Current Rank</h4>
      </div>
      <div class="rank-display unranked">Unranked</div>
    `;
    return;
  }

  const rankName = getRankName(mmr.currenttier);
  const rankColor = getRankColor(mmr.currenttier);
  const rankIconUrl = await getRankIcon(mmr.currenttier);
  const rr = mmr.ranking_in_tier || 0;

  const html = `
    <div class="section-header">
      <div class="accent-line"></div>
      <h4>Current Rank</h4>
    </div>
    <div class="rank-display" style="--rank-color: ${rankColor}">
      <img src="${rankIconUrl}" alt="${rankName}" class="rank-icon" />
      <div class="rank-info">
        <div class="rank-name">${rankName}</div>
        <div class="rr-container">
          <div class="rr-text">${rr} RR</div>
          <div class="rr-bar-bg">
            <div class="rr-bar-fill" style="width: ${rr}%"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

function renderStats(matches, puuid) {
  const container = document.getElementById('stats-container');
  if (!container) return;
  
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalHeadshots = 0;
  let totalShots = 0;
  const agentCounts = {};
  
  matches.forEach(match => {
    const player = match.players.all_players.find(p => p.puuid === puuid);
    if (!player) return;
    
    const team = match.teams[player.team.toLowerCase()];
    if (team && team.has_won) wins++;
    
    totalKills += player.stats.kills;
    totalDeaths += player.stats.deaths;
    
    totalHeadshots += player.stats.headshots;
    totalShots += player.stats.headshots + player.stats.bodyshots + player.stats.legshots;
    
    const agentKey = player.character || 'Unknown';
    agentCounts[agentKey] = (agentCounts[agentKey] || 0) + 1;
  });
  
  const winRate = Math.round((wins / matches.length) * 100) || 0;
  const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills;
  const hs = totalShots > 0 ? Math.round((totalHeadshots / totalShots) * 100) : 0;
  
  let topAgentName = 'N/A';
  let maxCount = 0;
  for (const [name, count] of Object.entries(agentCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topAgentName = name;
    }
  }

  container.innerHTML = `
    <div class="section-header">
      <div class="accent-line"></div>
      <h4>Recent Performance (Last ${matches.length})</h4>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div class="stat-value">${winRate}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">K/D Ratio</div>
        <div class="stat-value">${kd}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Headshot %</div>
        <div class="stat-value">${hs}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Top Agent</div>
        <div class="stat-value">${topAgentName}</div>
      </div>
    </div>
  `;
}

async function renderMatches(matches, puuid) {
  const container = document.getElementById('matches-container');
  if (!container) return;

  const maps = await import('../api/assets.js').then(m => m.getMaps()).catch(() => []);

  const matchesHtml = matches.map(match => {
    const player = match.players.all_players.find(p => p.puuid === puuid);
    if (!player) return '';
    
    const team = match.teams[player.team.toLowerCase()];
    const isWin = team ? team.has_won : false;
    const isDraw = !match.teams.red.has_won && !match.teams.blue.has_won;
    
    let resultClass = isWin ? 'win' : (isDraw ? 'draw' : 'loss');
    let resultText = isWin ? 'WIN' : (isDraw ? 'DRAW' : 'LOSS');
    
    const map = maps ? maps.find(m => m.mapUrl === match.metadata.map) : null;
    const mapName = map ? map.displayName : 'Unknown';
    const score = `${team ? team.rounds_won : 0} - ${team ? team.rounds_lost : 0}`;

    return `
      <div class="match-card ${resultClass}">
        <div class="match-result-badge">${resultText}</div>
        <img src="${player.assets.agent.small}" alt="${player.character}" class="match-agent-icon" />
        <div class="match-info">
          <div class="match-map">${mapName}</div>
          <div class="match-score">${score}</div>
        </div>
        <div class="match-stats">
          <div class="match-kda">${player.stats.kills}/${player.stats.deaths}/${player.stats.assists}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="section-header">
      <div class="accent-line"></div>
      <h4>Recent Matches</h4>
    </div>
    <div class="matches-list">
      ${matchesHtml}
    </div>
  `;
}
