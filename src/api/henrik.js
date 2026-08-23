// ============================================================
// HenrikDev Valorant API Client
// Docs: https://docs.henrikdev.xyz
// ============================================================

import { getState, showToast } from './state.js';

const BASE_URL = 'https://api.henrikdev.xyz';

async function apiRequest(endpoint) {
  const { apiKey } = getState();
  const headers = {};
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { headers });

    if (response.status === 429) {
      showToast('Rate limited. Please wait a moment.', 'error');
      throw new Error('Rate limited');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.errors?.[0]?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message === 'Rate limited') throw error;
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// ---- Account ----
export async function getAccount(name, tag) {
  const data = await apiRequest(`/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?force=true`);
  return data.data;
}

// ---- MMR / Rank ----
export async function getMMR(region, name, tag) {
  const platform = 'pc';
  const data = await apiRequest(`/valorant/v3/mmr/${region}/${platform}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  return data.data;
}

export async function getMMRByPuuid(region, puuid) {
  const platform = 'pc';
  const data = await apiRequest(`/valorant/v3/by-puuid/mmr/${region}/${platform}/${puuid}`);
  return data.data;
}

// ---- Match History ----
export async function getMatches(region, name, tag, mode = null, size = 10) {
  let endpoint = `/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${size}`;
  if (mode) endpoint += `&mode=${mode}`;
  const data = await apiRequest(endpoint);
  return data.data;
}

export async function getMatchesByPuuid(region, puuid, mode = null, size = 10) {
  let endpoint = `/valorant/v3/by-puuid/matches/${region}/${puuid}?size=${size}`;
  if (mode) endpoint += `&mode=${mode}`;
  const data = await apiRequest(endpoint);
  return data.data;
}

// ---- MMR History ----
export async function getMMRHistory(region, name, tag) {
  const platform = 'pc';
  const data = await apiRequest(`/valorant/v1/mmr-history/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  return data.data;
}

// ---- Store Featured ----
export async function getStoreOffers() {
  const data = await apiRequest(`/valorant/v2/store-offers`);
  return data.data;
}

// ---- Leaderboard ----
export async function getLeaderboard(region, name = null, tag = null) {
  let endpoint = `/valorant/v3/leaderboard/${region}?`;
  if (name && tag) {
    endpoint += `name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}`;
  }
  const data = await apiRequest(endpoint);
  return data.data;
}

// ---- Premier ----
export async function getPremierTeam(name, tag) {
  try {
    const data = await apiRequest(`/valorant/v1/premier/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
    return data.data;
  } catch {
    return null;
  }
}

// Rank tier mapping
export const RANK_TIERS = {
  0: 'Unranked',
  3: 'Iron 1', 4: 'Iron 2', 5: 'Iron 3',
  6: 'Bronze 1', 7: 'Bronze 2', 8: 'Bronze 3',
  9: 'Silver 1', 10: 'Silver 2', 11: 'Silver 3',
  12: 'Gold 1', 13: 'Gold 2', 14: 'Gold 3',
  15: 'Platinum 1', 16: 'Platinum 2', 17: 'Platinum 3',
  18: 'Diamond 1', 19: 'Diamond 2', 20: 'Diamond 3',
  21: 'Ascendant 1', 22: 'Ascendant 2', 23: 'Ascendant 3',
  24: 'Immortal 1', 25: 'Immortal 2', 26: 'Immortal 3',
  27: 'Radiant',
};

export function getRankName(tier) {
  return RANK_TIERS[tier] || 'Unranked';
}

export function getRankColor(tier) {
  if (tier >= 27) return '#FFFFAA';      // Radiant
  if (tier >= 24) return '#BF4053';      // Immortal
  if (tier >= 21) return '#1B8C5F';      // Ascendant
  if (tier >= 18) return '#B489C6';      // Diamond
  if (tier >= 15) return '#17DEE6';      // Platinum
  if (tier >= 12) return '#ECB641';      // Gold
  if (tier >= 9) return '#BCC4C9';       // Silver
  if (tier >= 6) return '#A5855A';       // Bronze
  if (tier >= 3) return '#6E7876';       // Iron
  return '#768079';                       // Unranked
}
