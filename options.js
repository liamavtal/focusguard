// FocusGuard Options Script
let state = null;
const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout') === 'success') {
    await sendMessage({ type: 'refreshSubscription' });
  }
  await loadState();
  setupListeners();
  $('loadingState').style.display = 'none';
  $('mainContent').style.display = 'block';
  $('supportLink').href = CONFIG.SUPPORT_URL || '#';
  $('privacyLink').href = CONFIG.PRIVACY_POLICY_URL || '#';
  $('termsLink').href = CONFIG.TERMS_URL || '#';
}

async function loadState() {
  state = await sendMessage({ type: 'getState' });
  updateUI();
}

function updateUI() {
  if (state.isLoggedIn && state.user) {
    $('loggedInState').style.display = 'block';
    $('loggedOutState').style.display = 'none';
    $('userEmail').textContent = state.user.email;
    $('userName').textContent = state.profile?.display_name || state.user.email.split('@')[0];
    $('userAvatar').textContent = (state.user.email || 'U').charAt(0).toUpperCase();
    $('deleteAccountBtn').style.display = 'inline-flex';
  } else {
    $('loggedInState').style.display = 'none';
    $('loggedOutState').style.display = 'block';
    $('deleteAccountBtn').style.display = 'none';
  }

  if (state.isPro) {
    $('proActiveState').style.display = 'block';
    $('freeState').style.display = 'none';
    $('scheduleCard').classList.remove('locked');
    $('passwordCard').classList.remove('locked');
  } else {
    $('proActiveState').style.display = 'none';
    $('freeState').style.display = 'block';
    $('scheduleCard').classList.add('locked');
    $('passwordCard').classList.add('locked');
  }

  const schedule = state.schedule || {};
  $('scheduleToggle').classList.toggle('active', schedule.enabled);
  $('startTime').value = schedule.startTime || '09:00';
  $('endTime').value = schedule.endTime || '17:00';
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.classList.toggle('active', (schedule.days || [1,2,3,4,5]).includes(parseInt(btn.dataset.day)));
  });

  const pwd = state.passwordProtection || {};
  $('passwordToggle').classList.toggle('active', pwd.enabled);
  $('passwordFields').style.display = pwd.enabled ? 'block' : 'none';

  const settings = state.settings || {};
  $('motivationToggle').classList.toggle('active', settings.showMotivation !== false);
  $('syncToggle').classList.toggle('active', settings.syncEnabled !== false);
  $('notificationsToggle').classList.toggle('active', settings.notifications !== false);

  const stats = state.stats || {};
  $('totalBlocks').textContent = formatNumber(stats.blocksTotal || 0);
  $('todayBlocks').textContent = stats.blocksToday || 0;
  $('streakDays').textContent = stats.streakDays || 0;
  $('focusMinutes').textContent = stats.totalFocusMinutes || 0;
}

function setupListeners() {
  $('signInBtn').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
  $('signOutBtn').onclick = async () => { await sendMessage({ type: 'signOut' }); await loadState(); };
  $('upgradeMonthlyBtn').onclick = () => handleUpgrade(CONFIG.STRIPE_PRICE_ID_MONTHLY);
  $('upgradeYearlyBtn').onclick = () => handleUpgrade(CONFIG.STRIPE_PRICE_ID_YEARLY);
  $('manageSubBtn').onclick = handleManageSubscription;
  $('scheduleToggle').onclick = function() { if (state.isPro) this.classList.toggle('active'); };
  document.querySelectorAll('.day-btn').forEach(btn => { btn.onclick = function() { if (state.isPro) this.classList.toggle('active'); }; });
  $('saveScheduleBtn').onclick = saveSchedule;
  $('passwordToggle').onclick = function() { if (!state.isPro) return; this.classList.toggle('active'); $('passwordFields').style.display = this.classList.contains('active') ? 'block' : 'none'; };
  $('savePasswordBtn').onclick = savePassword;
  $('motivationToggle').onclick = async function() { this.classList.toggle('active'); await sendMessage({ type: 'updateSettings', settings: { showMotivation: this.classList.contains('active') }}); };
  $('syncToggle').onclick = async function() { this.classList.toggle('active'); await sendMessage({ type: 'updateSettings', settings: { syncEnabled: this.classList.contains('active') }}); };
  $('notificationsToggle').onclick = async function() { this.classList.toggle('active'); await sendMessage({ type: 'updateSettings', settings: { notifications: this.classList.contains('active') }}); };
  $('exportDataBtn').onclick = exportData;
  $('resetStatsBtn').onclick = resetStats;
  $('resetAllBtn').onclick = resetAll;
  $('deleteAccountBtn').onclick = deleteAccount;
}

async function handleUpgrade(priceId) {
  if (!state.isLoggedIn) { chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') }); return; }
  try { const r = await sendMessage({ type: 'createCheckout', priceId }); if (r.url) chrome.tabs.create({ url: r.url }); } catch(e) { alert('Failed to start checkout.'); }
}

async function handleManageSubscription() {
  try { const r = await sendMessage({ type: 'openPortal' }); if (r.url) chrome.tabs.create({ url: r.url }); } catch(e) { alert('Failed to open portal.'); }
}

async function saveSchedule() {
  const days = [...document.querySelectorAll('.day-btn.active')].map(b => parseInt(b.dataset.day));
  const r = await sendMessage({ type: 'updateSchedule', schedule: { enabled: $('scheduleToggle').classList.contains('active'), startTime: $('startTime').value, endTime: $('endTime').value, days }});
  showStatus('scheduleStatus', r.error ? 'Failed to save' : 'Schedule saved!', !r.error);
  if (!r.error) state = r;
}

async function savePassword() {
  const enabled = $('passwordToggle').classList.contains('active');
  const password = enabled ? $('passwordInput').value : null;
  if (enabled && (!password || password.length < 4)) { showStatus('passwordStatus', 'Password must be at least 4 characters', false); return; }
  const r = await sendMessage({ type: 'setPassword', password: enabled ? password : null });
  showStatus('passwordStatus', r.error ? 'Failed to save' : 'Password saved!', !r.error);
  if (!r.error) { state = r; $('passwordInput').value = ''; }
}

async function exportData() {
  const r = await sendMessage({ type: 'exportData' });
  const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `focusguard-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
}

async function resetStats() { if (confirm('Reset all statistics?')) { await sendMessage({ type: 'resetStats' }); await loadState(); }}
async function resetAll() { if (confirm('Reset ALL settings?') && confirm('Are you sure?')) { await sendMessage({ type: 'resetAll' }); await loadState(); }}
async function deleteAccount() { if (confirm('Delete account permanently?') && confirm('Really sure?')) { try { await sendMessage({ type: 'deleteAccount' }); await loadState(); } catch(e) { alert(e.message); }}}

function showStatus(id, msg, success) { const el = $(id); el.textContent = msg; el.className = `status visible ${success ? 'success' : 'error'}`; setTimeout(() => el.classList.remove('visible'), 3000); }
function formatNumber(n) { if (n >= 1e6) return (n/1e6).toFixed(1)+'M'; if (n >= 1e3) return (n/1e3).toFixed(1)+'K'; return n.toString(); }
function sendMessage(msg) { return new Promise((res,rej) => chrome.runtime.sendMessage(msg, r => chrome.runtime.lastError ? rej(new Error(chrome.runtime.lastError.message)) : res(r))); }
