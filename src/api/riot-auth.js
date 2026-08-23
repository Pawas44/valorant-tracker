// ============================================================
// Real Riot Games Authentication Client
// Uses CapacitorHttp to bypass CORS and manage cookies in the APK
// ============================================================

import { setState, showToast } from './state.js';

// Helper to check if running inside the Capacitor Native App
const isCapacitor = () => {
  return window.Capacitor !== undefined && window.Capacitor.Plugins !== undefined;
};

// Generic fetch wrapper that falls back to CapacitorHttp when native, or uses standard fetch
async function request(options) {
  if (isCapacitor()) {
    const { CapacitorHttp } = window.Capacitor.Plugins;
    const response = await CapacitorHttp.request({
      method: options.method || 'GET',
      url: options.url,
      headers: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined
    });
    
    if (response.status >= 400) {
      throw new Error(response.data?.error || `API error: ${response.status}`);
    }
    return response.data;
  } else {
    // Web browser fallback - we try using a CORS proxy for best-effort
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(options.url)}`;
    const headers = {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    const response = await fetch(proxyUrl, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  }
}

// ---- Real Authentication Flow ----
export async function authenticateWithRiot(username, password, region) {
  // Check if we are in browser. Because of CORS and Cookie security, Riot's auth 
  // requires cookies which cannot be shared across domains in a browser environment.
  // In the browser, we route the request through our Vercel Serverless Function proxy!
  if (!isCapacitor()) {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid credentials. Check your username and password.');
      }

      const authData = await response.json();
      return {
        accessToken: authData.accessToken,
        entitlementsToken: authData.entitlementsToken,
        puuid: authData.puuid,
        gameName: authData.gameName,
        tagLine: authData.tagLine,
        region
      };
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message === 'Load failed') {
        // If testing on localhost:3000 where serverless /api isn't running,
        // fall back to mock data
        throw new Error('BROWSER_CORS');
      }
      throw err;
    }
  }

  try {
    const { CapacitorHttp } = window.Capacitor.Plugins;

    // 1. Initialize Auth Session
    const initResponse = await CapacitorHttp.post({
      url: 'https://auth.riotgames.com/api/v1/authorization',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RiotClient/43.0.1.4119853.4101837 rso-auth (Windows;10;;Professional, x64)'
      },
      data: {
        client_id: 'play-valorant-web-prod',
        nonce: '1',
        redirect_uri: 'https://playvalorant.com/opt_in',
        response_type: 'token id_token',
        scope: 'openid link ban lol_region'
      }
    });

    if (initResponse.status !== 200) {
      throw new Error('Failed to initialize session');
    }

    // 2. Submit Credentials
    const authResponse = await CapacitorHttp.put({
      url: 'https://auth.riotgames.com/api/v1/authorization',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RiotClient/43.0.1.4119853.4101837 rso-auth (Windows;10;;Professional, x64)'
      },
      data: {
        type: 'auth',
        username: username,
        password: password,
        remember: true
      }
    });

    if (authResponse.status !== 200) {
      throw new Error('Check your Riot Username or Password.');
    }

    const authData = authResponse.data;
    if (authData.error === 'auth_failure') {
      throw new Error('Invalid Riot Games credentials.');
    }

    // Parse the redirect URI to extract tokens
    const redirectUri = authData.response?.parameters?.uri;
    if (!redirectUri) {
      throw new Error('Authentication flow redirect failed.');
    }

    // Extract access_token & id_token from url hash
    const urlHash = new URL(redirectUri).hash.substring(1);
    const params = new URLSearchParams(urlHash);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      throw new Error('Failed to retrieve access token.');
    }

    // 3. Get Entitlements Token
    const entitlementsResponse = await CapacitorHttp.post({
      url: 'https://entitlements.auth.riotgames.com/api/token/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {}
    });

    if (entitlementsResponse.status !== 200) {
      throw new Error('Failed to retrieve entitlements.');
    }
    const entitlementsToken = entitlementsResponse.data.entitlements_token;

    // 4. Fetch User Information (PUUID, Riot Name and Tag)
    const userInfoResponse = await CapacitorHttp.post({
      url: 'https://auth.riotgames.com/api/v1/userinfo',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: {}
    });

    if (userInfoResponse.status !== 200) {
      throw new Error('Failed to retrieve user details.');
    }

    const userData = userInfoResponse.data;
    const puuid = userData.sub;
    const gameName = userData.acct?.game_name || username;
    const tagLine = userData.acct?.tag_line || 'Riot';

    return {
      accessToken,
      entitlementsToken,
      puuid,
      gameName,
      tagLine,
      region
    };
  } catch (error) {
    console.error('Riot Auth Error:', error);
    throw error;
  }
}

// ---- Retrieve Real Player Store Front (Daily Gun Skins) ----
export async function getRealStorefront(puuid, accessToken, entitlementsToken, region) {
  if (!isCapacitor()) {
    // Web browser fallback: call Vercel Serverless Function proxy
    try {
      const response = await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ puuid, accessToken, entitlementsToken, region })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch storefront');
      }
      return await response.json();
    } catch (err) {
      throw err;
    }
  }

  try {
    const { CapacitorHttp } = window.Capacitor.Plugins;
    
    // Riot Client version is required by the storefront API
    const clientVersion = 'release-09.03-shipping-14-2720235'; // Updated Client Version

    const response = await CapacitorHttp.get({
      url: `https://pd.${region}.a.pvp.net/store/v2/storefront/${puuid}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Riot-Entitlements-JWT': entitlementsToken,
        'X-Riot-ClientVersion': clientVersion
      }
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch storefront');
    }

    return response.data;
  } catch (error) {
    console.error('Real Storefront Error:', error);
    throw error;
  }
}

// ---- Exchange Access Token for Entitlements and User Info ----
export async function authenticateWithToken(accessToken, region) {
  if (!isCapacitor()) {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accessToken })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to exchange token.');
      }

      const userData = await response.json();
      return {
        accessToken,
        entitlementsToken: userData.entitlementsToken,
        puuid: userData.puuid,
        gameName: userData.gameName,
        tagLine: userData.tagLine,
        region
      };
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message === 'Load failed') {
        throw new Error('BROWSER_CORS');
      }
      throw err;
    }
  }

  try {
    const { CapacitorHttp } = window.Capacitor.Plugins;

    // 1. Get Entitlements Token
    const entitlementsResponse = await CapacitorHttp.post({
      url: 'https://entitlements.auth.riotgames.com/api/token/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {}
    });

    if (entitlementsResponse.status !== 200) {
      throw new Error('Failed to retrieve entitlements.');
    }
    const entitlementsToken = entitlementsResponse.data.entitlements_token;

    // 2. Fetch User Info
    const userInfoResponse = await CapacitorHttp.post({
      url: 'https://auth.riotgames.com/api/v1/userinfo',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: {}
    });

    if (userInfoResponse.status !== 200) {
      throw new Error('Failed to retrieve user details.');
    }

    const userData = userInfoResponse.data;
    return {
      accessToken,
      entitlementsToken,
      puuid: userData.sub,
      gameName: userData.acct?.game_name || 'Riot Player',
      tagLine: userData.acct?.tag_line || 'NA',
      region
    };
  } catch (error) {
    console.error('Riot Token Exchange Error:', error);
    throw error;
  }
}
