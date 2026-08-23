import { getMatches, getRankName } from '../api/henrik.js';
import { getAgents, getMaps } from '../api/assets.js';
import { getState, showToast } from '../api/state.js';

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function render() {
  return `
    <div class="page career-page">
      <header class="page-header">
        <h1 class="page-title">CAREER</h1>
      </header>

      <div class="filter-chips">
        <button class="chip active" data-filter="all">All</button>
        <button class="chip" data-filter="competitive">Competitive</button>
        <button class="chip" data-filter="unrated">Unrated</button>
        <button class="chip" data-filter="spikerush">Spike Rush</button>
        <button class="chip" data-filter="deathmatch">Deathmatch</button>
        <button class="chip" data-filter="swiftplay">Swiftplay</button>
      </div>

      <div id="performance-summary" class="performance-summary">
        <!-- Stats populated here -->
      </div>

      <div id="match-history" class="match-history">
        <!-- Matches populated here -->
        <div class="skeleton-match"></div>
        <div class="skeleton-match"></div>
        <div class="skeleton-match"></div>
      </div>
      
      <button id="load-more-btn" class="load-more-btn" style="display: none;">Load More</button>
    </div>
  `;
}

export async function init() {
  let isDestroyed = false;
  const state = getState();
  const historyContainer = document.getElementById('match-history');
  const summaryContainer = document.getElementById('performance-summary');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const chips = document.querySelectorAll('.chip');
  
  let currentFilter = 'all';
  let allMatches = [];

  if (!state.user) {
    showToast('User not logged in.', 'error');
    if (historyContainer) historyContainer.innerHTML = '<p class="error-msg">Please log in to view career.</p>';
    return () => { isDestroyed = true; };
  }

  const fetchAndRender = async () => {
    try {
      // Fetch 10 matches
      const filterParam = currentFilter === 'all' ? undefined : currentFilter;
      const matches = await getMatches(state.user.region, state.user.name, state.user.tag, filterParam, 10);
      
      if (isDestroyed) return;
      allMatches = matches || [];

      const mapsData = await getMaps().catch(() => []);
      renderStats(allMatches);
      renderMatches(allMatches, mapsData);
      
      if (allMatches.length > 0) {
        if (loadMoreBtn) loadMoreBtn.style.display = 'block';
      } else {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      }
    } catch (err) {
      console.error('Error fetching career matches:', err);
      if (historyContainer) historyContainer.innerHTML = '<p class="error-msg">Failed to load matches.</p>';
    }
  };

  const renderStats = (matches) => {
    if (!matches || matches.length === 0) {
      if (summaryContainer) summaryContainer.innerHTML = '';
      return;
    }

    let wins = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalHeadshots = 0;
    let totalShots = 0;
    let totalScore = 0;
    let validMatchesForAcs = 0;

    matches.forEach(m => {
      const p = m.players.all_players.find(pl => pl.puuid === state.user.puuid);
      if (!p) return;

      const myTeam = p.team;
      let hasWon = false;
      if (myTeam === 'Red' && m.teams.red?.has_won) hasWon = true;
      if (myTeam === 'Blue' && m.teams.blue?.has_won) hasWon = true;
      if (hasWon) wins++;

      totalKills += p.stats.kills;
      totalDeaths += p.stats.deaths;
      
      const hs = p.stats.headshots || 0;
      const bs = p.stats.bodyshots || 0;
      const ls = p.stats.legshots || 0;
      const shots = hs + bs + ls;
      totalHeadshots += hs;
      totalShots += shots;

      const totalRounds = (m.teams.red?.rounds_won || 0) + (m.teams.red?.rounds_lost || 0);
      if (totalRounds > 0 && p.stats.score) {
        totalScore += Math.round(p.stats.score / totalRounds);
        validMatchesForAcs++;
      }
    });

    const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;
    const kdRatio = totalDeaths === 0 ? totalKills : (totalKills / totalDeaths).toFixed(2);
    const hsPercent = totalShots === 0 ? 0 : Math.round((totalHeadshots / totalShots) * 100);
    const avgAcs = validMatchesForAcs === 0 ? 0 : Math.round(totalScore / validMatchesForAcs);

    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="stat-box">
          <div class="stat-label">Win Rate</div>
          <div class="stat-value ${winRate >= 50 ? 'good' : 'bad'}">${winRate}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">K/D Ratio</div>
          <div class="stat-value ${kdRatio >= 1 ? 'good' : 'bad'}">${kdRatio}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Headshot %</div>
          <div class="stat-value">${hsPercent}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg ACS</div>
          <div class="stat-value">${avgAcs}</div>
        </div>
      `;
    }
  };

  const renderMatches = (matches, mapsData) => {
    if (!historyContainer) return;
    
    if (!matches || matches.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p>No matches found.</p>
        </div>
      `;
      return;
    }

    const html = matches.map(m => {
      const p = m.players.all_players.find(pl => pl.puuid === state.user.puuid);
      if (!p) return '';

      const myTeam = p.team;
      let hasWon = false;
      let isDraw = false;
      
      const redWonRounds = m.teams.red?.rounds_won || 0;
      const blueWonRounds = m.teams.blue?.rounds_won || 0;
      
      if (redWonRounds === blueWonRounds) {
        isDraw = true;
      } else if (myTeam === 'Red' && m.teams.red?.has_won) {
        hasWon = true;
      } else if (myTeam === 'Blue' && m.teams.blue?.has_won) {
        hasWon = true;
      }

      let resultClass = isDraw ? 'draw' : (hasWon ? 'win' : 'loss');
      let resultText = isDraw ? 'DRAW' : (hasWon ? 'VICTORY' : 'DEFEAT');

      const totalRounds = redWonRounds + blueWonRounds;
      const acs = totalRounds > 0 && p.stats.score ? Math.round(p.stats.score / totalRounds) : 0;
      
      const mapInfo = mapsData ? mapsData.find(m2 => m2.mapUrl === m.metadata.map) : null;
      const mapName = mapInfo ? mapInfo.displayName : 'Unknown';
      const mapThumb = mapInfo ? (mapInfo.listViewIcon || '') : '';
      
      let myRounds = myTeam === 'Red' ? redWonRounds : blueWonRounds;
      let enemyRounds = myTeam === 'Red' ? blueWonRounds : redWonRounds;

      return `
        <div class="match-card ${resultClass}">
          <div class="match-bg" style="background-image: linear-gradient(to right, var(--card-bg, #2A2A2A) 40%, rgba(42,42,42,0.8) 70%, rgba(42,42,42,0)), url('${mapThumb}')"></div>
          <div class="match-content">
            <div class="match-agent">
              <img src="${p.assets.agent.small}" alt="${p.character}" />
            </div>
            <div class="match-details">
              <div class="match-result-map">
                <span class="result-text ${resultClass}">${resultText}</span>
                <span class="map-name">${mapName}</span>
              </div>
              <div class="match-mode-time">
                ${m.metadata.mode} • ${timeAgo(m.metadata.started_at)}
              </div>
            </div>
            <div class="match-stats">
              <div class="match-score">${myRounds} - ${enemyRounds}</div>
              <div class="match-kda">${p.stats.kills} / ${p.stats.deaths} / ${p.stats.assists}</div>
              <div class="match-acs">ACS: ${acs}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    historyContainer.innerHTML = html;
  };

  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      if (historyContainer) historyContainer.innerHTML = '<div class="skeleton-match"></div><div class="skeleton-match"></div>';
      fetchAndRender();
    });
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      showToast('Load more functionality coming soon.', 'info');
    });
  }

  fetchAndRender();

  return () => {
    isDestroyed = true;
  };
}

export function destroy() {
}
