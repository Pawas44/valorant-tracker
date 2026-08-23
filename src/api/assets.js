// ============================================================
// Valorant-API.com - Game Assets Client (no key needed)
// Docs: https://valorant-api.com
// ============================================================

const BASE_URL = 'https://valorant-api.com/v1';

let agentsCache = null;
let weaponsCache = null;
let mapsCache = null;
let ranksCache = null;
let bundlesCache = null;

async function fetchAssets(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Assets API error: ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (e) {
    console.error('Assets API error:', e);
    throw e;
  }
}

// ---- Agents ----
export async function getAgents() {
  if (agentsCache) return agentsCache;
  const agents = await fetchAssets('/agents?isPlayableCharacter=true');
  agentsCache = agents;
  return agents;
}

export async function getAgentByUuid(uuid) {
  const agents = await getAgents();
  return agents.find(a => a.uuid === uuid);
}

// ---- Weapons & Skins ----
export async function getWeapons() {
  if (weaponsCache) return weaponsCache;
  const weapons = await fetchAssets('/weapons');
  weaponsCache = weapons;
  return weapons;
}

export async function getWeaponSkins() {
  const weapons = await getWeapons();
  const skins = [];
  weapons.forEach(weapon => {
    weapon.skins.forEach(skin => {
      if (!skin.displayName.includes('Standard') && !skin.displayName.includes('Random') && skin.displayIcon) {
        skins.push({
          ...skin,
          weaponName: weapon.displayName,
          weaponUuid: weapon.uuid,
        });
      }
    });
  });
  return skins;
}

export async function getSkinByUuid(uuid) {
  const weapons = await getWeapons();
  for (const weapon of weapons) {
    for (const skin of weapon.skins) {
      if (skin.uuid === uuid) return { ...skin, weaponName: weapon.displayName };
      for (const level of skin.levels || []) {
        if (level.uuid === uuid) return { ...skin, weaponName: weapon.displayName };
      }
      for (const chroma of skin.chromas || []) {
        if (chroma.uuid === uuid) return { ...skin, weaponName: weapon.displayName };
      }
    }
  }
  return null;
}

// ---- Maps ----
export async function getMaps() {
  if (mapsCache) return mapsCache;
  const maps = await fetchAssets('/maps');
  mapsCache = maps;
  return maps;
}

export async function getMapByUrl(mapUrl) {
  const maps = await getMaps();
  return maps.find(m => m.mapUrl === mapUrl);
}

// ---- Competitive Tiers ----
export async function getCompetitiveTiers() {
  if (ranksCache) return ranksCache;
  const tiers = await fetchAssets('/competitivetiers');
  // Get the latest season tiers (last entry)
  ranksCache = tiers[tiers.length - 1];
  return ranksCache;
}

export async function getRankIcon(tier) {
  const tiers = await getCompetitiveTiers();
  const tierData = tiers.tiers.find(t => t.tier === tier);
  return tierData?.largeIcon || tierData?.smallIcon || null;
}

// ---- Bundles ----
export async function getBundles() {
  if (bundlesCache) return bundlesCache;
  const bundles = await fetchAssets('/bundles');
  bundlesCache = bundles;
  return bundles;
}

// ---- Player Cards ----
export async function getPlayerCards() {
  return fetchAssets('/playercards');
}

// ---- Content Tiers (skin rarity) ----
export async function getContentTiers() {
  return fetchAssets('/contenttiers');
}

// ---- Sprays ----
export async function getSprays() {
  return fetchAssets('/sprays');
}

// ---- Buddies ----
export async function getBuddies() {
  return fetchAssets('/buddies');
}

// Agent role mapping
export const AGENT_ROLES = {
  'Duelist': { icon: '⚔️', color: '#FF4655' },
  'Controller': { icon: '🛡️', color: '#17DEE6' },
  'Initiator': { icon: '🎯', color: '#B388FF' },
  'Sentinel': { icon: '🔒', color: '#2DFD6A' },
};

// Skin tier colors (content tier)
export const SKIN_TIER_COLORS = {
  'Select Edition': { color: '#5A9FE6', bg: 'rgba(90, 159, 230, 0.1)' },
  'Deluxe Edition': { color: '#009B8D', bg: 'rgba(0, 155, 141, 0.1)' },
  'Premium Edition': { color: '#D1548D', bg: 'rgba(209, 84, 141, 0.1)' },
  'Ultra Edition': { color: '#FAD663', bg: 'rgba(250, 214, 99, 0.1)' },
  'Exclusive Edition': { color: '#F5955B', bg: 'rgba(245, 149, 91, 0.1)' },
};
