import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
  plugins: [
    {
      name: 'riot-auth-local-dev-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // --- Auth Proxy Endpoint ---
          if (req.url.startsWith('/api/auth') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { username, password } = JSON.parse(body);
                
                // 1. Initialize session
                const initRes = await fetch('https://auth.riotgames.com/api/v1/authorization', {
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

                if (!initRes.ok) {
                  const errText = await initRes.text();
                  res.statusCode = initRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to initialize session: ' + errText }));
                  return;
                }

                // Extract cookies
                const setCookieHeaders = initRes.headers.getSetCookie();
                let asidCookie = '';
                setCookieHeaders.forEach(cookie => {
                  if (cookie.includes('asid=')) {
                    asidCookie = cookie.split(';')[0];
                  }
                });

                if (!asidCookie) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'asid cookie not set by Riot auth server' }));
                  return;
                }

                // 2. Submit credentials
                const authRes = await fetch('https://auth.riotgames.com/api/v1/authorization', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cookie': asidCookie,
                    'User-Agent': 'RiotClient/43.0.1.4119853.4101837 rso-auth (Windows;10;;Professional, x64)'
                  },
                  body: JSON.stringify({
                    type: 'auth',
                    username,
                    password,
                    remember: true
                  })
                });

                const authData = await authRes.json();
                if (authData.error === 'auth_failure') {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Invalid credentials. Check your username and password.' }));
                  return;
                }

                const redirectUri = authData.response?.parameters?.uri;
                if (!redirectUri) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Authentication redirect failed' }));
                  return;
                }

                const urlHash = new URL(redirectUri).hash.substring(1);
                const params = new URLSearchParams(urlHash);
                const accessToken = params.get('access_token');

                if (!accessToken) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to extract access token' }));
                  return;
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
                  res.statusCode = entitlementsResponse.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to fetch entitlements token' }));
                  return;
                }
                const entitlementsData = await entitlementsResponse.json();
                const entitlementsToken = entitlementsData.entitlements_token;

                // 4. Fetch User Info
                const userInfoResponse = await fetch('https://auth.riotgames.com/api/v1/userinfo', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`
                  }
                });

                if (!userInfoResponse.ok) {
                  res.statusCode = userInfoResponse.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to fetch user info' }));
                  return;
                }

                const userData = await userInfoResponse.json();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  accessToken,
                  entitlementsToken,
                  puuid: userData.sub,
                  gameName: userData.acct?.game_name || username,
                  tagLine: userData.acct?.tag_line || 'Riot'
                }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          // --- Store Proxy Endpoint ---
          if (req.url.startsWith('/api/store') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const { puuid, accessToken, entitlementsToken, region } = JSON.parse(body);
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
                  res.statusCode = response.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Failed to fetch storefront: ' + errText }));
                  return;
                }

                const data = await response.json();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }

          next();
        });
      }
    }
  ]
});
