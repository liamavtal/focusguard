// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        FOCUSGUARD POPUP SCRIPT                              ║
// ╚════════════════════════════════════════════════════════════════════════════╝

let state = null;
let presets = {};

// ══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ══════════════════════════════════════════════════════════════════════════════

const elements = {
  // Loading
  loadingOverlay: document.getElementById('loadingOverlay'),
  
  // Header
  proBadge: document.getElementById('proBadge'),
  settingsBtn: document.getElementById('settingsBtn'),
  userMenu: document.getElementById('userMenu'),
  userBtn: document.getElementById('userBtn'),
  userDropdown: document.getElementById('userDropdown'),
  userEmail: document.getElementById('userEmail'),
  userPlan: document.getElementById('userPlan'),
  manageSubscription: document.getElementById('manageSubscription'),
  syncNow: document.getElementById('syncNow'),
  signOutBtn: document.getElementById('signOutBtn'),
  authBtn: document.getElementById('authBtn'),
  
  // Focus Toggle
  focusCard: document.getElementById('focusCard'),
  focusToggle: document.getElementById('focusToggle'),
  focusStatus: document.getElementById('focusStatus'),
  scheduleIndicator: document.getElementById('scheduleIndicator'),
  scheduleText: document.getElementById('scheduleText'),
  
  // Stats
  blocksToday: document.getElementById('blocksToday'),
  blocksTotal: document.getElementById('blocksTotal'),
  streakDays: document.getElementById('streakDays'),
  
  // Auth Prompt
  authPrompt: document.getElementById('authPrompt'),
  authPromptBtn: document.getElementById('authPromptBtn'),
  
  // Presets
  presetsGrid: document.getElementById('presetsGrid'),
  
  // Sites
  limitBadge: document.getElementById('limitBadge'),
  siteInput: document.getElementById('siteInput'),
  addSiteBtn: document.getElementById('addSiteBtn'),
  siteCount: document.getElementById('siteCount'),
  sitesList: document.getElementById('sitesList'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  
  // Upgrade
  upgradeCard: document.getElementById('upgradeCard'),
  upgradeBtn: document.getElementById('upgradeBtn'),
  
  // Password Modal
  passwordModal: document.getElementById('passwordModal'),
  passwordInput: document.getElementById('passwordInput'),
  passwordError: document.getElementById('passwordError'),
  passwordCancel: document.getElementById('passwordCancel'),
  passwordConfirm: document.getElementById('passwordConfirm'),
  
  // Toast
  toast: document.getElementById('toast')
};

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Load presets
    const presetsResult = await sendMessage({ type: 'getPresets' });
    presets = presetsResult.presets || {};
    
    // Load state
    await loadState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render presets
    renderPresets();
    
    // Hide loading
    elements.loadingOverlay.classList.add('hidden');
  } catch (error) {
    console.error('[FocusGuard] Init error:', error);
    showToast('Failed to load. Please try again.', 'error');
    elements.loadingOverlay.classList.add('hidden');
  }
}

async function loadState() {
  state = await sendMessage({ type: 'getState' });
  updateUI();
}

// ══════════════════════════════════════════════════════════════════════════════
// UI UPDATE
// ══════════════════════════════════════════════════════════════════════════════

function updateUI() {
  // Focus Toggle
  if (state.focusMode) {
    elements.focusCard.classList.add('active');
    elements.focusStatus.textContent = 'Active';
  } else {
    elements.focusCard.classList.remove('active');
    elements.focusStatus.textContent = 'Inactive';
  }
  
  // Stats
  elements.blocksToday.textContent = formatNumber(state.stats?.blocksToday || 0);
  elements.blocksTotal.textContent = formatNumber(state.stats?.blocksTotal || 0);
  elements.streakDays.textContent = state.stats?.streakDays || 0;
  
  // Pro Status
  if (state.isPro) {
    elements.proBadge.style.display = 'inline';
    elements.upgradeCard.classList.remove('visible');
    elements.limitBadge.style.display = 'none';
  } else {
    elements.proBadge.style.display = 'none';
    elements.upgradeCard.classList.add('visible');
    
    // Show limit badge
    const count = state.blockedSites?.length || 0;
    const limit = CONFIG.FREE_SITE_LIMIT;
    if (count >= limit - 1) {
      elements.limitBadge.textContent = `${count}/${limit}`;
      elements.limitBadge.style.display = 'inline';
    } else {
      elements.limitBadge.style.display = 'none';
    }
  }
  
  // Schedule Indicator
  if (state.isPro && state.schedule?.enabled) {
    elements.scheduleIndicator.classList.add('visible');
    elements.scheduleText.textContent = `Scheduled: ${formatTime(state.schedule.startTime)} - ${formatTime(state.schedule.endTime)}`;
  } else {
    elements.scheduleIndicator.classList.remove('visible');
  }
  
  // Auth State
  if (state.isLoggedIn && state.user) {
    elements.userMenu.style.display = 'block';
    elements.authBtn.style.display = 'none';
    elements.authPrompt.classList.remove('visible');
    
    // User info
    const email = state.user.email || '';
    elements.userEmail.textContent = email;
    elements.userBtn.textContent = email.charAt(0).toUpperCase();
    elements.userPlan.textContent = state.isPro ? 'Pro Plan' : 'Free Plan';
  } else {
    elements.userMenu.style.display = 'none';
    elements.authBtn.style.display = 'flex';
    elements.authPrompt.classList.add('visible');
  }
  
  // Sites List
  renderSitesList();
  
  // Update presets
  updatePresetStates();
}

function renderPresets() {
  elements.presetsGrid.innerHTML = '';
  
  for (const [id, preset] of Object.entries(presets)) {
    const chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.dataset.preset = id;
    
    const isActive = state.enabledPresets?.includes(id);
    const isLocked = !state.isPro && (state.enabledPresets?.length || 0) >= CONFIG.FREE_PRESET_LIMIT && !isActive;
    
    if (isActive) chip.classList.add('active');
    if (isLocked) chip.classList.add('locked');
    
    chip.innerHTML = `
      ${preset.icon} ${preset.name}
      ${isLocked ? '<svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' : ''}
    `;
    
    chip.addEventListener('click', () => togglePreset(id, isLocked));
    elements.presetsGrid.appendChild(chip);
  }
}

function updatePresetStates() {
  const chips = elements.presetsGrid.querySelectorAll('.preset-chip');
  chips.forEach(chip => {
    const id = chip.dataset.preset;
    const isActive = state.enabledPresets?.includes(id);
    const isLocked = !state.isPro && (state.enabledPresets?.length || 0) >= CONFIG.FREE_PRESET_LIMIT && !isActive;
    
    chip.classList.toggle('active', isActive);
    chip.classList.toggle('locked', isLocked);
  });
}

function renderSitesList() {
  const sites = state.blockedSites || [];
  elements.siteCount.textContent = sites.length;
  
  if (sites.length === 0) {
    elements.sitesList.innerHTML = '<div class="empty-state">No sites blocked yet</div>';
    return;
  }
  
  elements.sitesList.innerHTML = sites.map(site => `
    <div class="site-item">
      <span class="site-name">${escapeHtml(site)}</span>
      <button class="site-remove" data-site="${escapeHtml(site)}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Add click handlers
  elements.sitesList.querySelectorAll('.site-remove').forEach(btn => {
    btn.addEventListener('click', (e) => removeSite(e.currentTarget.dataset.site));
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Focus Toggle
  elements.focusCard.addEventListener('click', handleFocusToggle);
  
  // Settings
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // User Menu
  elements.userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.userDropdown.classList.toggle('visible');
  });
  
  document.addEventListener('click', () => {
    elements.userDropdown.classList.remove('visible');
  });
  
  elements.manageSubscription.addEventListener('click', handleManageSubscription);
  elements.syncNow.addEventListener('click', handleSyncNow);
  elements.signOutBtn.addEventListener('click', handleSignOut);
  
  // Auth
  elements.authBtn.addEventListener('click', openAuthPage);
  elements.authPromptBtn.addEventListener('click', openAuthPage);
  
  // Add Site
  elements.addSiteBtn.addEventListener('click', handleAddSite);
  elements.siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddSite();
  });
  
  // Clear All
  elements.clearAllBtn.addEventListener('click', handleClearAll);
  
  // Upgrade
  elements.upgradeBtn.addEventListener('click', handleUpgrade);
  
  // Password Modal
  elements.passwordCancel.addEventListener('click', closePasswordModal);
  elements.passwordConfirm.addEventListener('click', handlePasswordConfirm);
  elements.passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePasswordConfirm();
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

async function handleFocusToggle() {
  // Check if password required
  if (state.focusMode && state.isPro && state.passwordProtection?.enabled) {
    openPasswordModal();
    return;
  }
  
  const result = await sendMessage({ type: 'toggleFocus' });
  
  if (result.error) {
    showToast('Failed to toggle focus mode', 'error');
    return;
  }
  
  state = result;
  updateUI();
  showToast(state.focusMode ? 'Focus Mode activated! 🎯' : 'Focus Mode disabled', 'success');
}

async function togglePreset(id, isLocked) {
  if (isLocked) {
    showToast('Upgrade to Pro for unlimited presets', 'error');
    return;
  }
  
  const result = await sendMessage({ type: 'togglePreset', preset: id });
  
  if (result.error === 'PRESET_LIMIT_REACHED') {
    showToast('Upgrade to Pro for unlimited presets', 'error');
    return;
  }
  
  if (result.error) {
    showToast('Failed to update preset', 'error');
    return;
  }
  
  state = result;
  updateUI();
  
  const isNowActive = state.enabledPresets?.includes(id);
  showToast(isNowActive ? `${presets[id]?.name} sites blocked` : `${presets[id]?.name} sites unblocked`, 'success');
}

async function handleAddSite() {
  const site = elements.siteInput.value.trim();
  if (!site) return;
  
  const result = await sendMessage({ type: 'addSite', site });
  
  if (result.error === 'LIMIT_REACHED') {
    showToast(`Upgrade to Pro for unlimited sites (limit: ${result.limit})`, 'error');
    return;
  }
  
  if (result.warning === 'ALREADY_BLOCKED') {
    showToast('This site is already blocked', 'error');
    return;
  }
  
  if (result.error) {
    showToast('Failed to add site', 'error');
    return;
  }
  
  state = result;
  elements.siteInput.value = '';
  updateUI();
  showToast(`${site} added to block list`, 'success');
}

async function removeSite(site) {
  const result = await sendMessage({ type: 'removeSite', site });
  
  if (result.error) {
    showToast('Failed to remove site', 'error');
    return;
  }
  
  state = result;
  updateUI();
  showToast(`${site} removed`, 'success');
}

async function handleClearAll() {
  if (!confirm('Remove all blocked sites?')) return;
  
  for (const site of [...state.blockedSites]) {
    await sendMessage({ type: 'removeSite', site });
  }
  
  // Disable all presets
  for (const preset of [...state.enabledPresets]) {
    await sendMessage({ type: 'togglePreset', preset });
  }
  
  await loadState();
  showToast('All sites cleared', 'success');
}

async function handleManageSubscription() {
  elements.userDropdown.classList.remove('visible');
  
  try {
    const result = await sendMessage({ type: 'openPortal' });
    if (result.url) {
      chrome.tabs.create({ url: result.url });
    } else if (result.error) {
      showToast('Failed to open subscription portal', 'error');
    }
  } catch (e) {
    showToast('Failed to open subscription portal', 'error');
  }
}

async function handleSyncNow() {
  elements.userDropdown.classList.remove('visible');
  
  try {
    await sendMessage({ type: 'syncNow' });
    showToast('Synced successfully', 'success');
  } catch (e) {
    showToast('Sync failed', 'error');
  }
}

async function handleSignOut() {
  elements.userDropdown.classList.remove('visible');
  
  await sendMessage({ type: 'signOut' });
  await loadState();
  showToast('Signed out', 'success');
}

function openAuthPage() {
  chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
}

async function handleUpgrade() {
  if (!state.isLoggedIn) {
    openAuthPage();
    return;
  }
  
  try {
    const result = await sendMessage({ 
      type: 'createCheckout', 
      priceId: CONFIG.STRIPE_PRICE_ID_MONTHLY 
    });
    
    if (result.url) {
      chrome.tabs.create({ url: result.url });
    } else if (result.error) {
      showToast('Failed to start checkout', 'error');
    }
  } catch (e) {
    showToast('Failed to start checkout', 'error');
  }
}

// Password Modal
function openPasswordModal() {
  elements.passwordModal.classList.add('visible');
  elements.passwordInput.value = '';
  elements.passwordError.classList.remove('visible');
  elements.passwordInput.focus();
}

function closePasswordModal() {
  elements.passwordModal.classList.remove('visible');
  elements.passwordInput.value = '';
  elements.passwordError.classList.remove('visible');
}

async function handlePasswordConfirm() {
  const password = elements.passwordInput.value;
  
  const result = await sendMessage({ type: 'toggleFocus', password });
  
  if (result.error === 'PASSWORD_REQUIRED') {
    elements.passwordError.classList.add('visible');
    elements.passwordInput.value = '';
    elements.passwordInput.focus();
    return;
  }
  
  closePasswordModal();
  state = result;
  updateUI();
  showToast('Focus Mode disabled', 'success');
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `toast visible ${type}`;
  
  setTimeout(() => {
    elements.toast.classList.remove('visible');
  }, 2500);
}
