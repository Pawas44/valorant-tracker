import { getMatches, getMMR, getRankName, getRankColor } from '../api/henrik.js';
import { getAgents, getMapByUrl, getRankIcon } from '../api/assets.js';
import { getState, showToast } from '../api/state.js';

export function render() {
  return `
    <div class="page live-page">
      <header class="page-header">
        <h1 class="page-title">
          <span class="live-dot pulsing"></span>
          LIVE MATCH
        </h1>
      </header>
      
      <div class="info-banner">
        <span>Showing most recent match data</span>
      </div>

      <div id="live-content">
        <!-- Skeleton Loading -->
        <div class="skeleton-map-hero"></div>
        <div class="skeleton-teams">
          <div class="skeleton-team"></div>
          <div class="skeleton-team"></div>
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  let isDestroyed = false;
  const state = getState();
  const content = document.getElementById('live-content');

  if (!state.user) {
    showToast('User not logged in.', 'error');
    if (content) content.innerHTML = '<p class="error-msg">Please log in to view live match.</p>';
    return () => { isDestroyed = true; };
  }

  try {
    const matches = await getMatches(state.user.region, state.user.name, state.user.tag, null, 1);
    if (isDestroyed) return;

    if (!matches || matches.length === 0) {
      if (content) content.innerHTML = '<p class="empty-msg">No recent match found.</p>';
      return () => { isDestroyed = true; };
    }

    const match = matches[0];
    const mapInfo = await getMapByUrl(match.metadata.map);
    const mapName = mapInfo ? mapInfo.displayName : 'Unknown Map';
    const mapImg = mapInfo ? (mapInfo.listViewIcon || mapInfo.splash) : '';

    const redTeamScore = match.teams.red ? match.teams.red.rounds_won : 0;
    const blueTeamScore = match.teams.blue ? match.teams.blue.rounds_won : 0;

    const redTeam = match.players.all_players.filter(p => p.team === 'Red');
    const blueTeam = match.players.all_players.filter(p => p.team === 'Blue');

    // Fetch MMR for all players in parallel
    const allPlayers = [...blueTeam, ...redTeam];
    const mmrPromises = allPlayers.map(p =>
      getMMR(state.user.region, p.name, p.tag).catch(() => null)
    );
    const mmrResults = await Promise.allSettled(mmrPromises);

    allPlayers.forEach((p, i) => {
      const res = mmrResults[i];
      if (res.status === 'fulfilled' && res.value) {
        p.mmr = res.value;
      } else {
        p.mmr = null;
      }
    });

    // Pre-fetch rank icons for all players
    const rankIconMap = {};
    const uniqueTiers = [...new Set(allPlayers.map(p => p.mmr?.currenttier || 0))];
    await Promise.all(uniqueTiers.map(async (tier) => {
      try { rankIconMap[tier] = await getRankIcon(tier); } catch { rankIconMap[tier] = null; }
    }));

    if (isDestroyed) return;

    const renderPlayerRow = (p) => {
      const rankTier = p.mmr && p.mmr.currenttier ? p.mmr.currenttier : 0;
      const rankIconUrl = rankIconMap[rankTier] || null;
      const rankName = getRankName(rankTier);
      const rr = p.mmr && p.mmr.ranking_in_tier ? p.mmr.ranking_in_tier : 0;
      const acs = p.stats.score ? Math.round(p.stats.score / (redTeamScore + blueTeamScore || 1)) : 0;

      return `
        <div class="player-row">
          <div class="player-agent">
            <img src="${p.assets.agent.small}" alt="${p.character}" />
          </div>
          <div class="player-info">
            <div class="player-name">${p.name} <span class="player-tag">#${p.tag}</span></div>
            <div class="player-rank">
              ${rankIconUrl ? `<img src="${rankIconUrl}" alt="${rankName}" class="rank-icon-small" />` : ''}
              <span>${rankName}</span> <span class="rr-text">${rr} RR</span>
            </div>
          </div>
          <div class="player-stats">
            <div class="kda">${p.stats.kills} / ${p.stats.deaths} / ${p.stats.assists}</div>
            <div class="acs">ACS: ${acs}</div>
          </div>
        </div>
      `;
    };

    if (content) {
      content.innerHTML = `
        <div class="map-hero" style="background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${mapImg}')">
          <div class="match-score-display">
            <span class="score blue">${blueTeamScore}</span>
            <span class="score-divider">-</span>
            <span class="score red">${redTeamScore}</span>
          </div>
          <div class="map-name">${mapName} - ${match.metadata.mode}</div>
        </div>
        
        <div class="teams-container">
          <div class="team-section blue-team">
            <h3 class="team-header">Blue Team</h3>
            <div class="player-list">
              ${blueTeam.map(renderPlayerRow).join('')}
            </div>
          </div>
          <div class="team-section red-team">
            <h3 class="team-header">Red Team</h3>
            <div class="player-list">
              ${redTeam.map(renderPlayerRow).join('')}
            </div>
          </div>
        </div>
      `;
    }

  } catch (err) {
    console.error('Error fetching live match:', err);
    if (content) content.innerHTML = '<p class="error-msg">Failed to load match data.</p>';
  }

  return () => {
    isDestroyed = true;
  };
}

export function destroy() {
  // Any global cleanup if needed
}
