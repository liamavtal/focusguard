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
    statusIndicator.classList.remove('inactive');
    statusText.textContent = 'Focus Mode: ON';
  } else {
    toggleSwitch.classList.remove('active');
    statusIndicator.classList.add('inactive');
    statusText.textContent = 'Focus Mode: OFF';
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
      <div class="blocked-url">${site}</div>
      <button class="remove-btn" data-url="${site}">✕</button>
    </div>
  `).join('');

  // Add event listeners
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeWebsite(e.target.dataset.url);
    });
  });
}

// Dark mode
async function loadThemePreference() {
  const { darkMode = false } = await chrome.storage.local.get('darkMode');
  if (darkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-toggle').textContent = '☀️';
  }
}

async function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  const toggle = document.getElementById('theme-toggle');
  
  if (isDark) {
    toggle.textContent = '☀️';
    await chrome.storage.local.set({ darkMode: true });
  } else {
    toggle.textContent = '🌙';
    await chrome.storage.local.set({ darkMode: false });
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
