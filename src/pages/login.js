import { getAccount } from '../api/henrik.js';
import { setState, showToast } from '../api/state.js';
import { navigate } from '../router.js';
import { showNavbar } from '../main.js';

export function render() {
  return `
    <div class="page-full login-page">
      <div class="login-bg-animation"></div>
      <div class="login-container glass-panel">
        <div class="login-logo">
          <svg viewBox="0 0 100 100" class="val-logo">
            <path fill="currentColor" d="M99.25 48.66V10.28c0-.59-.75-.86-1.12-.39l-41.92 52.4a1.5 1.5 0 0 0 .03 1.91l41.87 45.42c.38.41 1.14.1 1.14-.49V48.66z"/>
            <path fill="currentColor" d="M50.41 68.74L16.29 27.67c-.36-.43-1.07-.15-1.07.41v53.11c0 .32.18.61.47.74l34.45 15.53c.48.22 1-.16.94-.68l-.67-27.42a1.5 1.5 0 0 0-.4-1.04z"/>
          </svg>
        </div>
        <h1 class="login-title">VALORANT TRACKER</h1>
        <form id="login-form">
          <div class="form-group">
            <label for="riot-id">Riot ID</label>
            <input type="text" id="riot-id" placeholder="Name#Tag" required />
          </div>
          <div class="form-group">
            <label for="region-select">Region</label>
            <select id="region-select" required>
              <option value="ap">Asia Pacific (AP)</option>
              <option value="br">Brazil (BR)</option>
              <option value="eu">Europe (EU)</option>
              <option value="kr">Korea (KR)</option>
              <option value="latam">Latin America (LATAM)</option>
              <option value="na">North America (NA)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="api-key">API Key (Optional)</label>
            <input type="text" id="api-key" placeholder="api.henrikdev.xyz key" />
            <span class="hint-text">Get free key from api.henrikdev.xyz</span>
          </div>
          <button type="submit" id="login-btn" class="btn btn-primary btn-full">SIGN IN</button>
        </form>
      </div>
    </div>
  `;
}

export function init() {
  const form = document.getElementById('login-form');
  const handler = async (e) => {
    e.preventDefault();
    await handleLogin();
  };
  form.addEventListener('submit', handler);
  
  return () => {
    form.removeEventListener('submit', handler);
  };
}

export function destroy() {
  // cleanup if needed
}

async function handleLogin() {
  const riotId = document.getElementById('riot-id').value.trim();
  const region = document.getElementById('region-select').value;
  const apiKey = document.getElementById('api-key').value.trim();
  
  if (!riotId.includes('#')) {
    showToast('Enter Riot ID as Name#Tag', 'error');
    return;
  }
  
  const [name, ...tagParts] = riotId.split('#');
  const tag = tagParts.join('#');
  
  if (!name || !tag) {
    showToast('Invalid Riot ID format', 'error');
    return;
  }
  
  // Show loading state on button
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span class="spinner-small"></span> Connecting...';
  btn.disabled = true;
  
  try {
    if (apiKey) setState({ apiKey });
    const account = await getAccount(name, tag);
    setState({
      user: {
        name: account.name,
        tag: account.tag,
        region: region,
        puuid: account.puuid,
        accountLevel: account.account_level,
        card: account.card,
      },
      isLoggedIn: true,
    });
    showNavbar();
    navigate('home');
    showToast('Welcome, ' + account.name + '!', 'success');
  } catch (e) {
    showToast('Account not found. Check your Riot ID.', 'error');
    btn.innerHTML = 'SIGN IN';
    btn.disabled = false;
  }
}
