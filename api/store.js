// ============================================================
// Vercel Serverless Function: Riot Storefront Proxy
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

  const { puuid, accessToken, entitlementsToken, region } = req.body;

  if (!puuid || !accessToken || !entitlementsToken || !region) {
    return res.status(400).json({ error: 'Missing required storefront parameters' });
  }

  try {
    const clientVersion = 'release-09.03-shipping-14-2720235';

    const response = await fetch(`https://pd.${region}.a.pvp.net/store/v2/storefront/${puuid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Riot-Entitlements-JWT': entitlementsToken,
        'X-Riot-ClientVersion': clientVersion,
        'User-Agent': 'RiotClient/43.0.1.4119853.4101837 rso-auth (Windows;10;;Professional, x64)'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Failed to fetch storefront: ' + errText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Storefront proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
