// ============================================================
// Vercel Serverless Function: Riot Token Exchange Proxy
// Exchange access token for entitlements and user info securely
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

  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    // 1. Get Entitlements Token
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

    // 2. Fetch User Information (PUUID, Riot Name and Tag)
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
      entitlementsToken,
      puuid: userData.sub,
      gameName: userData.acct?.game_name || 'Riot Player',
      tagLine: userData.acct?.tag_line || 'NA'
    });
  } catch (error) {
    console.error('API user exchange error:', error);
    return res.status(500).json({ error: error.message });
  }
}
