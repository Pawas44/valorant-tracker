import { getAccount } from '../api/henrik.js';
import { authenticateWithRiot, authenticateWithToken } from '../api/riot-auth.js';
import { setState, showToast } from '../api/state.js';
import { navigate } from '../router.js';
import { showNavbar } from '../main.js';

export function render() {
  return `
    <div class="page-full riot-auth-page">
      <!-- Riot Games Top Left Logo -->
      <div class="riot-page-logo">
        <svg viewBox="0 0 230 60" class="riot-logo-svg">
          <path fill="#ffffff" d="M12.4 35.8c-.8 0-1.5.3-2.1.8l-8 7.2c-1.1 1-1.3 2.7-.3 3.8l1.6 1.8c.9 1 2.5 1.2 3.6.4l5.3-3.8v29.6c0 1.5 1.2 2.7 2.7 2.7h13.3c1.5 0 2.7-1.2 2.7-2.7V42.1l4.8 3.5c1.1.8 2.7.6 3.6-.4l1.6-1.8c1-1.1.8-2.8-.3-3.8l-8-7.2c-.6-.5-1.3-.8-2.1-.8H12.4zm44.2 0c-.8 0-1.5.3-2.1.8l-8 7.2c-1.1 1-1.3 2.7-.3 3.8l1.6 1.8c.9 1 2.5 1.2 3.6.4l5.3-3.8v29.6c0 1.5 1.2 2.7 2.7 2.7h13.3c1.5 0 2.7-1.2 2.7-2.7V42.1l4.8 3.5c1.1.8 2.7.6 3.6-.4l1.6-1.8c1-1.1.8-2.8-.3-3.8l-8-7.2c-.6-.5-1.3-.8-2.1-.8H56.6zm23 15.6c-.8 0-1.5.3-2.1.8l-8 7.2c-1.1 1-1.3 2.7-.3 3.8l1.6 1.8c.9 1 2.5 1.2 3.6.4l5.3-3.8v13.8c0 1.5 1.2 2.7 2.7 2.7H96c1.5 0 2.7-1.2 2.7-2.7V57.9l4.8 3.5c1.1.8 2.7.6 3.6-.4l1.6-1.8c1-1.1.8-2.8-.3-3.8l-8-7.2c-.6-.5-1.3-.8-2.1-.8H79.6z"/>
          <!-- Riot Games Text Logo -->
          <text x="120" y="52" fill="#ffffff" font-family="'Rajdhani', sans-serif" font-weight="900" font-size="28" letter-spacing="2">RIOT GAMES</text>
        </svg>
      </div>

      <div class="riot-login-card">
        <h2 class="riot-title">Sign in</h2>
        
        <!-- Tab 1: Real credentials (default view matching official 1:1) -->
        <form id="login-form-credentials" class="login-form active">
          <div class="input-floating-group">
            <input type="text" id="riot-username" required placeholder=" " />
            <label for="riot-username">USERNAME</label>
          </div>
          
          <div class="input-floating-group">
            <input type="password" id="riot-password" required placeholder=" " />
            <label for="riot-password">PASSWORD</label>
          </div>
          
          <div class="input-floating-group select-floating-group">
            <select id="riot-region" required>
              <option value="ap">Asia Pacific (AP)</option>
              <option value="na">North America (NA)</option>
              <option value="eu">Europe (EU)</option>
              <option value="kr">Korea (KR)</option>
              <option value="latam">Latin America (LATAM)</option>
              <option value="br">Brazil (BR)</option>
            </select>
            <label for="riot-region">REGION</label>
          </div>

          <!-- Social Buttons Row exactly like original -->
          <div class="social-login-row">
            <a href="https://auth.riotgames.com/authorize?client_id=play-valorant-web-prod&nonce=1&redirect_uri=https://playvalorant.com/opt_in&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region" target="_blank" class="social-btn facebook-btn" id="social-fb" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
            </a>
            <a href="https://auth.riotgames.com/authorize?client_id=play-valorant-web-prod&nonce=1&redirect_uri=https://playvalorant.com/opt_in&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region" target="_blank" class="social-btn google-btn" id="social-google" title="Google">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.535 0-6.403-2.868-6.403-6.403s2.868-6.403 6.403-6.403c1.582 0 3.024.574 4.14 1.522l3.075-3.075C19.167 2.227 15.93 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.76 0 12.24-5.48 12.24-12.24 0-.79-.08-1.57-.24-2.32H12.24z"/></svg>
            </a>
            <a href="https://auth.riotgames.com/authorize?client_id=play-valorant-web-prod&nonce=1&redirect_uri=https://playvalorant.com/opt_in&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region" target="_blank" class="social-btn apple-btn" id="social-apple" title="Apple">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.73-1.2 1.87-1.05 2.98 1.12.09 2.26-.57 3-.143z"/></svg>
            </a>
            <a href="https://auth.riotgames.com/authorize?client_id=play-valorant-web-prod&nonce=1&redirect_uri=https://playvalorant.com/opt_in&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region" target="_blank" class="social-btn xbox-btn" id="social-xbox" title="Xbox">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M11.62 0C5.176 0 0 5.177 0 11.622c0 6.446 5.176 11.622 11.62 11.622 6.445 0 11.62-5.176 11.62-11.622C23.24 5.177 18.065 0 11.62 0zm-1.842 4.135c1.474-.897 3.398-.923 4.904-.064 1.346.77 2.051 2.372 1.63 3.73-.205.68-.692 1.295-1.128 1.834-.693.858-1.564 1.589-2.502 2.193-.974-.693-1.91-1.462-2.617-2.399-.449-.602-.91-1.256-1.012-1.986-.18-.73-.013-1.577.41-2.203.22-.32.55-.654.915-1.105zm3.834 14.654c-1.397.666-3.115.538-4.385-.295-.615-.423-1.09-.948-1.487-1.538-1.064-1.564-1.526-3.487-1.744-5.359.743.68 1.55 1.308 2.45 1.82 1.55.885 3.32 1.385 5.166 1.385 1.846 0 3.615-.5 5.166-1.384.9-.513 1.707-1.14 2.45-1.821-.218 1.872-.68 3.795-1.744 5.36-.397.59-.872 1.115-1.487 1.538-1.27.833-2.988.96-4.385.295z"/></svg>
            </a>
            <a href="https://auth.riotgames.com/authorize?client_id=play-valorant-web-prod&nonce=1&redirect_uri=https://playvalorant.com/opt_in&response_type=token%20id_token&scope=openid%20link%20ban%20lol_region" target="_blank" class="social-btn psn-btn" id="social-psn" title="PlayStation">
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon"><path d="M23.669 16.745c-.477-.736-1.535-1.343-3.14-1.815-1.606-.473-3.693-.787-6.26-.938V12.75c3.04.148 5.766.495 8.169 1.04 1.36.31 2.378.719 3.056 1.23.678.51 1.018 1.157 1.018 1.94 0 .907-.468 1.636-1.402 2.186-.933.551-2.274.965-4.02 1.242-1.747.277-3.835.438-6.262.482v-2.09c1.947-.073 3.649-.221 5.105-.445 1.455-.223 2.502-.516 3.14-.88.636-.363.955-.785.955-1.264s-.32-.897-.959-1.246zm-12.782.9c0 .484.341.91.1.22-.387-.698-1.528-1.306-3.424-1.823-1.895-.518-4.484-.863-7.766-1.037V11.75c3.708.148 6.953.513 9.734 1.096 1.61.336 2.825.776 3.645 1.32.82.544 1.23 1.233 1.23 2.068 0 .97-.565 1.748-1.696 2.336-1.13.587-2.753 1.028-4.869 1.322-2.115.294-4.636.467-7.564.516v-2.247c2.355-.078 4.41-.237 6.17-.478 1.76-.24 3.024-.555 3.792-.947.77-.39 1.148-.844 1.148-1.362z"/></svg>
            </a>
          </div>
          
          <div class="form-checkbox-row">
            <label class="checkbox-container">
              <input type="checkbox" checked />
              <span class="checkmark"></span>
              Stay signed in
            </label>
          </div>
          
          <div class="login-action-container">
            <button type="submit" id="credentials-btn" class="riot-next-btn">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="3">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </form>

        <!-- Tab 2: Public Riot ID Name#Tag (hidden toggle view) -->
        <form id="login-form-riotid" class="login-form">
          <div class="input-floating-group">
            <input type="text" id="riot-id" required placeholder=" " />
            <label for="riot-id">RIOT ID (NAME#TAG)</label>
          </div>
          
          <div class="input-floating-group select-floating-group">
            <select id="riotid-region" required>
              <option value="ap">Asia Pacific (AP)</option>
              <option value="na">North America (NA)</option>
              <option value="eu">Europe (EU)</option>
              <option value="kr">Korea (KR)</option>
              <option value="latam">Latin America (LATAM)</option>
              <option value="br">Brazil (BR)</option>
            </select>
            <label for="riotid-region">REGION</label>
          </div>
          
          <div class="login-action-container">
            <button type="submit" id="riotid-btn" class="riot-next-btn active">
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="3">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </form>

        <!-- Official Web OAuth flow token paste panel (hidden by default) -->
        <div id="riot-token-input-container" class="token-input-container" style="display: none;">
          <p class="token-instruction">
            Riot Sign-In has been opened in a new tab.
            <br/><br/>
            1. Log in there (using <strong>Google</strong>, Xbox, Apple, or credentials).
            <br/>
            2. After signing in, you will see a blank page. <strong>Copy the URL of that page</strong> from the address bar (starts with <code>playvalorant.com/opt_in#...</code>).
            <br/>
            3. Paste it below to complete sign-in:
          </p>
          <div class="input-floating-group">
            <input type="text" id="riot-pasted-url" placeholder=" " />
            <label for="riot-pasted-url">PASTE REDIRECT URL HERE</label>
          </div>
          <button type="button" id="token-login-btn" class="riot-red-btn-full" style="margin-top: 15px; font-weight: bold; text-transform: uppercase;">
            COMPLETE SIGN IN
          </button>
          <button type="button" id="cancel-token-login" class="riot-cancel-btn" style="margin-top: 10px; width: 100%; border: none; background: transparent; color: #999999; font-size: 0.75rem; font-weight: 700; cursor: pointer; text-transform: uppercase;">
            Back to standard login
          </button>
        </div>
        
        <div class="riot-footer-links">
          <a href="#" id="toggle-auth-mode">SIGN IN WITH PUBLIC RIOT ID</a>
          <a href="https://recovery.riotgames.com" target="_blank">CAN'T SIGN IN?</a>
          <a href="https://signup.riotgames.com" target="_blank">CREATE ACCOUNT</a>
        </div>
      </div>

      <!-- Riot Games Page Footer -->
      <div class="riot-page-footer">
        <div class="footer-links">
          <a href="https://support.riotgames.com" target="_blank">SUPPORT</a>
          <a href="https://www.riotgames.com/en/privacy-notice" target="_blank">PRIVACY NOTICE</a>
          <a href="https://www.riotgames.com/en/terms-of-service" target="_blank">TERMS OF SERVICE</a>
          <a href="#" id="cookie-preferences">COOKIE PREFERENCES</a>
        </div>
        <div class="recaptcha-notice">
          THIS SITE IS PROTECTED BY HCAPTCHA AND ITS <a href="https://www.hcaptcha.com/privacy" target="_blank">PRIVACY POLICY</a> AND <a href="https://www.hcaptcha.com/terms" target="_blank">TERMS OF SERVICE</a> APPLY.
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const credentialsForm = document.getElementById('login-form-credentials');
  const riotidForm = document.getElementById('login-form-riotid');
  const tokenContainer = document.getElementById('riot-token-input-container');
  const modeToggle = document.getElementById('toggle-auth-mode');
  const titleEl = document.querySelector('.riot-title');
  const pasteUrlInput = document.getElementById('riot-pasted-url');
  
  let isRiotIdMode = false;

  // Toggle mode logic (hides tabs and switches cleanly)
  modeToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isRiotIdMode = !isRiotIdMode;
    tokenContainer.style.display = 'none';

    if (isRiotIdMode) {
      credentialsForm.style.display = 'none';
      riotidForm.classList.add('active');
      titleEl.textContent = 'Sign in with Riot ID';
      modeToggle.textContent = 'SIGN IN WITH RIOT ACCOUNT';
    } else {
      riotidForm.classList.remove('active');
      credentialsForm.style.display = 'flex';
      credentialsForm.classList.add('active');
      titleEl.textContent = 'Sign in';
      modeToggle.textContent = 'SIGN IN WITH PUBLIC RIOT ID';
    }
  });

  // Handle Social Clicks (Google, Apple, Xbox, etc.) - Opens Official Login portal
  const socialBtns = document.querySelectorAll('.social-btn');
  socialBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      showToast(`Opening official Riot Sign-In for ${btn.title}...`, 'info');
      
      // Hide standard forms and show the token input fields
      credentialsForm.style.display = 'none';
      riotidForm.classList.remove('active');
      tokenContainer.style.display = 'flex';
      titleEl.textContent = 'Link Account';
      pasteUrlInput.focus();
    });
  });

  // Cancel Token Login Button
  document.getElementById('cancel-token-login').addEventListener('click', () => {
    tokenContainer.style.display = 'none';
    credentialsForm.style.display = 'flex';
    credentialsForm.classList.add('active');
    titleEl.textContent = 'Sign in';
  });

  // Complete Token Login
  const tokenLoginBtn = document.getElementById('token-login-btn');
  tokenLoginBtn.addEventListener('click', async () => {
    const pastedUrl = pasteUrlInput.value.trim();
    if (!pastedUrl) {
      showToast('Please paste the redirect URL first.', 'error');
      return;
    }

    let accessToken = '';
    try {
      if (pastedUrl.includes('access_token=')) {
        const hash = pastedUrl.includes('#') ? pastedUrl.split('#')[1] : pastedUrl;
        const params = new URLSearchParams(hash);
        accessToken = params.get('access_token');
      } else {
        accessToken = pastedUrl; // assume they pasted the raw token directly
      }
    } catch {
      showToast('Invalid URL format. Please copy the entire blank page URL.', 'error');
      return;
    }

    if (!accessToken) {
      showToast('Could not find access token in the pasted URL.', 'error');
      return;
    }

    tokenLoginBtn.disabled = true;
    tokenLoginBtn.textContent = 'Syncing...';

    try {
      const region = document.getElementById('riot-region').value;
      const authData = await authenticateWithToken(accessToken, region);
      
      let account;
      try {
        account = await getAccount(authData.gameName, authData.tagLine);
      } catch {
        account = {
          name: authData.gameName,
          tag: authData.tagLine,
          puuid: authData.puuid,
          account_level: 1,
          card: {
            wide: 'https://media.valorant-api.com/playercards/9fb34a2e-41de-4ee2-da79-b097b6ec7c61/wideart.png',
            small: 'https://media.valorant-api.com/playercards/9fb34a2e-41de-4ee2-da79-b097b6ec7c61/smallart.png'
          }
        };
      }

      setState({
        user: {
          name: account.name,
          tag: account.tag,
          region: region,
          puuid: authData.puuid,
          accountLevel: account.account_level,
          card: account.card,
          accessToken: authData.accessToken,
          entitlementsToken: authData.entitlementsToken,
          authType: 'credentials',
          isRealAuth: true
        },
        isLoggedIn: true,
      });

      showNavbar();
      navigate('home');
      showToast(`Logged in successfully! Welcome, ${account.name}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to sync account details. Please check the token.', 'error');
    } finally {
      tokenLoginBtn.disabled = false;
      tokenLoginBtn.textContent = 'COMPLETE SIGN IN';
    }
  });

  // Handle Tab 1 submit (Username & Password credentials)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    await handleCredentialsLogin();
  };
  credentialsForm.addEventListener('submit', handleCredentialsSubmit);

  // Handle Tab 2 submit (Public Riot ID Name#Tag)
  const handleRiotidSubmit = async (e) => {
    e.preventDefault();
    await handleRiotidLogin();
  };
  riotidForm.addEventListener('submit', handleRiotidSubmit);

  // Simple input validation to highlight next arrow when inputs are filled
  const checkInputs = () => {
    const usernameVal = document.getElementById('riot-username').value;
    const passwordVal = document.getElementById('riot-password').value;
    const nextBtn = document.getElementById('credentials-btn');
    if (usernameVal && passwordVal) {
      nextBtn.classList.add('active');
      nextBtn.querySelector('.arrow-icon').setAttribute('stroke', '#111111');
    } else {
      nextBtn.classList.remove('active');
      nextBtn.querySelector('.arrow-icon').setAttribute('stroke', '#999999');
    }
  };

  const usernameInput = document.getElementById('riot-username');
  const passwordInput = document.getElementById('riot-password');
  usernameInput.addEventListener('input', checkInputs);
  passwordInput.addEventListener('input', checkInputs);

  return () => {
    credentialsForm.removeEventListener('submit', handleCredentialsSubmit);
    riotidForm.removeEventListener('submit', handleRiotidSubmit);
    usernameInput.removeEventListener('input', checkInputs);
    passwordInput.removeEventListener('input', checkInputs);
  };
}

export function destroy() {
  // Cleanup
}

// Tab 1 logic: Riot username/password
async function handleCredentialsLogin() {
  const username = document.getElementById('riot-username').value.trim();
  const password = document.getElementById('riot-password').value;
  const region = document.getElementById('riot-region').value;
  const btn = document.getElementById('credentials-btn');

  // Set loading state
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    let authData = null;
    let isRealAuth = false;

    try {
      // Attempt real Riot games authentication (works natively in Capacitor APK or via Vercel serverless proxy)
      authData = await authenticateWithRiot(username, password, region);
      isRealAuth = true;
    } catch (authError) {
      if (authError.message === 'BROWSER_CORS') {
        showToast('Browser CORS: Simulating login for local testing. Deploy to Vercel/APK for real auth.', 'info');
      } else {
        throw authError; // rethrow real credential failures
      }
    }

    let account;
    if (isRealAuth && authData) {
      // Fetched real user info
      // Try to get account details from HenrikDev using real name/tag
      try {
        account = await getAccount(authData.gameName, authData.tagLine);
      } catch {
        account = {
          name: authData.gameName,
          tag: authData.tagLine,
          puuid: authData.puuid,
          account_level: 1,
          card: {
            wide: 'https://media.valorant-api.com/playercards/9fb34a2e-41de-4ee2-da79-b097b6ec7c61/wideart.png',
            small: 'https://media.valorant-api.com/playercards/9fb34a2e-41de-4ee2-da79-b097b6ec7c61/smallart.png'
          }
        };
      }

      setState({
        user: {
          name: account.name,
          tag: account.tag,
          region: region,
          puuid: authData.puuid,
          accountLevel: account.account_level,
          card: account.card,
          accessToken: authData.accessToken,
          entitlementsToken: authData.entitlementsToken,
          authType: 'credentials',
          isRealAuth: true
        },
        isLoggedIn: true,
      });

      showToast(`Logged in successfully as ${account.name}!`, 'success');
    } else {
      // Browser simulated fallback (Tenz)
      try {
        account = await getAccount(username, 'Riot');
      } catch {
        account = {
          name: username,
          tag: 'RIOT',
          puuid: 'test-puuid-tenz-12345',
          account_level: 198,
          card: {
            wide: 'https://media.valorant-api.com/playercards/9fb34a2e-41de-4ee2-da79-b097b6ec7c61/wideart.png',
            small: 'https://media.valorant-api.com/playercards/9fb34a2e-41de-4ee2-da79-b097b6ec7c61/smallart.png'
          }
        };
      }

      setState({
        user: {
          name: account.name,
          tag: account.tag,
          region: region,
          puuid: account.puuid,
          accountLevel: account.account_level,
          card: account.card,
          authType: 'credentials',
          isRealAuth: false
        },
        isLoggedIn: true,
      });

      showToast(`Logged in as ${account.name} (Simulated)`, 'success');
    }

    showNavbar();
    navigate('home');
  } catch (error) {
    console.error("Login failure:", error);
    showToast(error.message || 'Failed to authenticate. Check credentials.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// Tab 2 logic: Riot ID Name#Tag
async function handleRiotidLogin() {
  const riotId = document.getElementById('riot-id').value.trim();
  const region = document.getElementById('riotid-region').value;
  const btn = document.getElementById('riotid-btn');

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

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const account = await getAccount(name, tag);
    setState({
      user: {
        name: account.name,
        tag: account.tag,
        region: region,
        puuid: account.puuid,
        accountLevel: account.account_level,
        card: account.card,
        authType: 'riotid',
        isRealAuth: false
      },
      isLoggedIn: true,
    });
    
    showNavbar();
    navigate('home');
    showToast(`Welcome, ${account.name}!`, 'success');
  } catch (e) {
    showToast('Account not found. Verify your Riot ID.', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}
