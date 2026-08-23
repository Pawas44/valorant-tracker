// ============================================================
// Vercel Serverless Function: Riot Games Authentication Proxy
// Bypasses browser CORS restrictions securely
// ============================================================

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 1. Initialize Auth Session
    const initResponse = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RiotClient/43.0.1.4119853.4101837 rso-auth (Windows;10;;Professional, x64)'
      },
      body: JSON.stringify({
        client_id: 'play-valorant-web-prod',
        nonce: '1',
        redirect_uri: 'https://playvalorant.com/opt_in',
        response_type: 'token id_token',
        scope: 'openid link ban lol_region'
      })
    });

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      return res.status(initResponse.status).json({ error: 'Failed to initialize session: ' + errText });
    }

    // Extract cookies from header to forward them in the PUT request
    const cookieHeader = initResponse.headers.get('set-cookie') || '';
    let asidCookie = '';
    const cookieMatch = cookieHeader.match(/asid=([^;]+)/);
    if (cookieMatch) {
      asidCookie = `asid=${cookieMatch[1]}`;
    }

    if (!asidCookie) {
      return res.status(500).json({ error: 'asid cookie not set by Riot auth server' });
    }

    // 2. Submit Credentials
    const authResponse = await fetch('https://auth.riotgames.com/api/v1/authorization', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': asidCookie,
        'User-Agent': 'RiotClient/43.0.1.4119853.4101837 rso-auth (Windows;10;;Professional, x64)'
      },
      body: JSON.stringify({
        type: 'auth',
        username: username,
        password: password,
        remember: true
      })
    });

    const authData = await authResponse.json();
    if (authData.error === 'auth_failure') {
      return res.status(401).json({ error: 'Invalid Riot Games credentials' });
    }

    const redirectUri = authData.response?.parameters?.uri;
    if (!redirectUri) {
      return res.status(401).json({ error: 'Authentication redirect failed: ' + JSON.stringify(authData) });
    }

    // Extract access_token & id_token from url hash
    const urlHash = new URL(redirectUri).hash.substring(1);
    const params = new URLSearchParams(urlHash);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      return res.status(401).json({ error: 'Failed to extract access token' });
    }

    // 3. Get Entitlements Token
    const entitlementsResponse = await fetch('https://entitlements.auth.riotgames.com/api/token/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({})
    });

    if (!entitlementsResponse.ok) {
      return res.status(entitlementsResponse.status).json({ error: 'Failed to fetch entitlements token' });
    }
    const entitlementsData = await entitlementsResponse.json();
    const entitlementsToken = entitlementsData.entitlements_token;

    // 4. Fetch User Information (PUUID, Riot Name and Tag)
    const userInfoResponse = await fetch('https://auth.riotgames.com/api/v1/userinfo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      return res.status(userInfoResponse.status).json({ error: 'Failed to fetch user info' });
    }

    const userData = await userInfoResponse.json();

    return res.status(200).json({
      accessToken,
      entitlementsToken,
      puuid: userData.sub,
      gameName: userData.acct?.game_name || username,
      tagLine: userData.acct?.tag_line || 'Riot'
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
