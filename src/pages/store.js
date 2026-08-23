import { getWeaponSkins, getContentTiers, getBundles, SKIN_TIER_COLORS } from '../api/assets.js';
import { getRealStorefront } from '../api/riot-auth.js';
import { getState, showToast } from '../api/state.js';

let countdownInterval = null;

export function render() {
  return `
    <div class="page store-page">
      <div class="page-header">
        <h1>DAILY STORE</h1>
        <div class="vp-balance">
          <div class="vp-icon">V</div>
          <span>1,850</span>
        </div>
      </div>
      
      <div class="store-countdown-container">
        <span class="countdown-label">RESETS IN</span>
        <div class="countdown-timer" id="store-countdown">00:00:00</div>
      </div>

      <div class="store-section">
        <h2>DAILY OFFERS</h2>
        <div class="daily-offers-grid" id="daily-offers">
          <div class="loading-state">Loading offers...</div>
        </div>
      </div>

      <div class="store-section">
        <h2>FEATURED BUNDLE</h2>
        <div class="featured-bundle" id="featured-bundle">
          <div class="loading-state">Loading bundle...</div>
        </div>
      </div>
    </div>
  `;
}

function getDailyStore(skins, count = 4) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // Simple seeded shuffle
  function seededRandom(s) {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }
  const premiumSkins = skins.filter(s => s.displayIcon);
  const indices = [];
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(seededRandom(seed + i * 7919) * premiumSkins.length);
    while (indices.includes(idx)) {
      idx = (idx + 1) % premiumSkins.length;
    }
    indices.push(idx);
  }
  return indices.map(i => premiumSkins[i]);
}

function getTimeUntilReset() {
  const now = new Date();
  const reset = new Date(now);
  reset.setUTCDate(reset.getUTCDate() + 1);
  reset.setUTCHours(0, 0, 0, 0);
  const diff = reset - now;
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getSkinPrice(tierUuid, tiers) {
  const tier = tiers.find(t => t.uuid === tierUuid);
  const tierName = tier ? tier.devName : '';
  
  if (tierName.includes('Select')) return 875;
  if (tierName.includes('Deluxe')) return 1275;
  if (tierName.includes('Premium')) return 1775;
  if (tierName.includes('Ultra')) return 2475;
  if (tierName.includes('Exclusive')) return 2675;
  return 1275;
}

export async function init() {
  const countdownEl = document.getElementById('store-countdown');
  const state = getState();
  const user = state.user;
  
  let useRealStore = false;
  let storefront = null;

  try {
    const [skins, tiers, bundles] = await Promise.all([
      getWeaponSkins(),
      getContentTiers(),
      getBundles()
    ]);

    if (user && user.isRealAuth && user.accessToken && user.entitlementsToken) {
      // Attempt to load real storefront from Riot CDN
      storefront = await getRealStorefront(user.puuid, user.accessToken, user.entitlementsToken, user.region).catch(() => null);
      if (storefront) {
        useRealStore = true;
      }
    }

    // Configure Countdown Timer
    if (useRealStore && storefront) {
      let secondsLeft = storefront.SkinsPanelLayout?.SingleItemOffersRemainingDurationInSeconds || 86400;
      const updateRealCountdown = () => {
        if (countdownEl) {
          if (secondsLeft <= 0) {
            countdownEl.textContent = '00:00:00';
            return;
          }
          const h = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
          const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
          const s = String(secondsLeft % 60).padStart(2, '0');
          countdownEl.textContent = `${h}:${m}:${s}`;
          secondsLeft--;
        }
      };
      updateRealCountdown();
      countdownInterval = setInterval(updateRealCountdown, 1000);
    } else {
      const updateCountdown = () => {
        if (countdownEl) {
          countdownEl.textContent = getTimeUntilReset();
        }
      };
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }

    let dailyOffers = [];
    if (useRealStore && storefront) {
      const offerUuids = storefront.SkinsPanelLayout?.SingleItemOffers || [];
      dailyOffers = offerUuids.map(uuid => {
        // Find skin that matches this level or base skin uuid
        return skins.find(s => s.uuid === uuid || s.levels?.some(l => l.uuid === uuid) || s.chromas?.some(c => c.uuid === uuid));
      }).filter(Boolean);
    } else {
      dailyOffers = getDailyStore(skins);
    }

    const offersContainer = document.getElementById('daily-offers');
    if (offersContainer) {
      offersContainer.innerHTML = dailyOffers.map(skin => {
        const tier = tiers.find(t => t.uuid === skin.contentTierUuid);
        const price = getSkinPrice(skin.contentTierUuid, tiers);
        const tierColorObj = tier ? SKIN_TIER_COLORS[tier.devName] : null;
        const tierColor = tierColorObj ? tierColorObj.color : '#aaa';
        const weaponType = skin.weaponName || 'Weapon';

        return `
          <div class="skin-card">
            <div class="skin-image-container">
              <img src="${skin.displayIcon}" alt="${skin.displayName}" class="skin-image" />
            </div>
            <div class="skin-details">
              <div class="skin-name-row">
                <span class="skin-name">${skin.displayName}</span>
                <span class="weapon-type">${weaponType}</span>
              </div>
              <div class="skin-price-row">
                <div class="skin-price">
                  <div class="vp-icon-small">V</div>
                  <span>${price}</span>
                </div>
                ${tier ? `<div class="tier-badge" style="border-color: ${tierColor};">
                  <div class="tier-dot" style="background-color: ${tierColor};"></div>
                </div>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const bundleContainer = document.getElementById('featured-bundle');
    if (bundles && bundles.length > 0 && bundleContainer) {
      const featuredBundle = bundles.find(b => b.displayIcon2) || bundles[0];
      if (featuredBundle) {
        bundleContainer.innerHTML = `
          <div class="bundle-card">
            <img src="${featuredBundle.displayIcon2 || featuredBundle.displayIcon}" alt="${featuredBundle.displayName}" class="bundle-image" />
            <div class="bundle-overlay">
              <h3>${featuredBundle.displayName}</h3>
            </div>
          </div>
        `;
      }
    }

  } catch (error) {
    console.error('Error fetching store data:', error);
    showToast('Failed to load store data');
  }

  return () => {
    destroy();
  };
}

export function destroy() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}
