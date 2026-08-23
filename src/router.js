// ============================================================
// SPA Router — Hash-based routing
// ============================================================

const routes = {};
let currentCleanup = null;
let currentRoute = null;

export function registerRoute(path, { render, init, destroy }) {
  routes[path] = { render, init, destroy };
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return currentRoute;
}

export function initRouter(defaultRoute = 'login') {
  async function handleRoute() {
    const hash = window.location.hash.slice(1) || defaultRoute;
    const route = routes[hash];

    if (!route) {
      navigate(defaultRoute);
      return;
    }

    // Cleanup previous route
    if (currentCleanup && typeof currentCleanup === 'function') {
      currentCleanup();
    }
    if (routes[currentRoute]?.destroy) {
      routes[currentRoute].destroy();
    }

    currentRoute = hash;

    // Get the page container
    const pageContainer = document.getElementById('page-content');
    if (!pageContainer) return;

    // Add exit animation
    pageContainer.style.opacity = '0';
    pageContainer.style.transform = 'translateY(8px)';

    await new Promise(r => setTimeout(r, 100));

    // Render new page
    const html = route.render();
    pageContainer.innerHTML = html;

    // Enter animation
    requestAnimationFrame(() => {
      pageContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      pageContainer.style.opacity = '1';
      pageContainer.style.transform = 'translateY(0)';
    });

    // Initialize page
    if (route.init) {
      currentCleanup = await route.init();
    }

    // Update navbar
    updateNavbar(hash);
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function updateNavbar(activeRoute) {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    const route = tab.dataset.route;
    tab.classList.toggle('active', route === activeRoute);
  });
}
