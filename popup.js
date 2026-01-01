// Preset lists
const PRESETS = {
  social: [
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
    'tiktok.com', 'snapchat.com', 'linkedin.com', 'reddit.com'
  ],
  video: [
    'youtube.com', 'netflix.com', 'twitch.tv', 'hulu.com',
    'disneyplus.com', 'primevideo.com'
  ],
  news: [
    'cnn.com', 'foxnews.com', 'bbc.com', 'nytimes.com',
    'washingtonpost.com', 'theguardian.com', 'reuters.com'
  ],
  shopping: [
    'amazon.com', 'ebay.com', 'walmart.com', 'target.com',
    'aliexpress.com', 'etsy.com'
  ]
};

// Sanitize HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show message
function showMessage(text, type = 'success') {
  const container = document.getElementById('message-container');
  const message = document.createElement('div');
  message.className = `message message-${type}`;
  message.textContent = text;
  container.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 3000);
}

// Update UI
async function updateUI() {
  const { enabled = false, blockedSites = [], blocksToday = 0 } =
    await chrome.storage.local.get(['enabled', 'blockedSites', 'blocksToday']);

  // Update toggle
  const toggleSwitch = document.getElementById('toggle-switch');
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  if (enabled) {
    toggleSwitch.classList.add('active');
    statusIndicator.classList.add('active');
    statusText.textContent = 'Focus Mode';
  } else {
    toggleSwitch.classList.remove('active');
    statusIndicator.classList.remove('active');
    statusText.textContent = 'Focus Mode';
  }

  // Update stats
  document.getElementById('blocked-count').textContent = blockedSites.length;
  document.getElementById('blocks-today').textContent = blocksToday;

  // Update blocked list
  await loadBlockedSites();
}

// Toggle focus mode
async function toggleFocusMode() {
  const { enabled = false } = await chrome.storage.local.get('enabled');
  const newState = !enabled;
  
  await chrome.storage.local.set({ enabled: newState });
  
  showMessage(newState ? 'Focus Mode ON! 🛡️' : 'Focus Mode OFF');
  await updateUI();
}

// Add website to block list
async function addWebsite() {
  const input = document.getElementById('website-input');
  let url = input.value.trim().toLowerCase();

  if (!url) {
    showMessage('Please enter a website', 'error');
    return;
  }

  // Clean up URL
  url = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  url = url.replace(/\/.*$/, ''); // Remove path
  url = url.trim(); // Trim again after cleaning

  // Validate after cleaning
  if (!url) {
    showMessage('Please enter a valid website', 'error');
    return;
  }

  // Basic domain validation (must have at least one dot and no spaces)
  if (!url.includes('.') || url.includes(' ')) {
    showMessage('Please enter a valid domain (e.g., facebook.com)', 'error');
    return;
  }

  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');

  if (blockedSites.includes(url)) {
    showMessage('Website already blocked', 'error');
    return;
  }

  blockedSites.push(url);
  await chrome.storage.local.set({ blockedSites });

  input.value = '';
  showMessage(`Blocked ${url}`);
  await updateUI();
}

// Remove website from block list
async function removeWebsite(url) {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const filtered = blockedSites.filter(site => site !== url);
  
  await chrome.storage.local.set({ blockedSites: filtered });
  
  showMessage(`Unblocked ${url}`);
  await updateUI();
}

// Add preset
async function addPreset(presetName) {
  const sites = PRESETS[presetName];
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');

  const newSites = sites.filter(site => !blockedSites.includes(site));
  const updatedSites = [...blockedSites, ...newSites];

  await chrome.storage.local.set({ blockedSites: updatedSites });

  const presetNames = {
    social: 'Social Media',
    video: 'Video Sites',
    news: 'News Sites',
    shopping: 'Shopping Sites'
  };

  showMessage(`Added ${presetNames[presetName]} preset (${newSites.length} sites)`);
  await updateUI();
}

// Load and display blocked sites
async function loadBlockedSites() {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const listContainer = document.getElementById('blocked-list');

  if (blockedSites.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        No websites blocked yet
      </div>
    `;
    return;
  }

  listContainer.innerHTML = blockedSites.map(site => `
    <div class="blocked-item">
      <div class="blocked-url">${escapeHtml(site)}</div>
      <button class="remove-btn" data-url="${escapeHtml(site)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');

  // Add event listeners - use currentTarget to handle clicks on SVG children
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      removeWebsite(button.dataset.url);
    });
  });
}

// SVG icons for theme toggle
const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/>
  <line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/>
  <line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

// Theme toggle (default is dark mode)
async function loadThemePreference() {
  const { lightMode = false } = await chrome.storage.local.get('lightMode');
  const toggle = document.getElementById('theme-toggle');
  if (lightMode) {
    document.body.classList.add('light-mode');
    toggle.innerHTML = moonIcon;
  } else {
    toggle.innerHTML = sunIcon;
  }
}

async function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const toggle = document.getElementById('theme-toggle');

  if (isLight) {
    toggle.innerHTML = moonIcon;
    await chrome.storage.local.set({ lightMode: true });
  } else {
    toggle.innerHTML = sunIcon;
    await chrome.storage.local.set({ lightMode: false });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await updateUI();
  await loadThemePreference();

  // Toggle focus mode
  document.getElementById('toggle-switch').addEventListener('click', toggleFocusMode);

  // Add website
  document.getElementById('add-btn').addEventListener('click', addWebsite);

  // Enter key to add
  document.getElementById('website-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addWebsite();
    }
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const preset = e.target.dataset.preset;
      addPreset(preset);
    });
  });

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});
