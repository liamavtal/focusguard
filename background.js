// Background service worker for FocusGuard
// Uses declarativeNetRequest for reliable blocking

const RULE_ID_START = 1;

// Update blocking rules based on current settings
async function updateBlockingRules() {
  const { enabled = false, blockedSites = [] } =
    await chrome.storage.local.get(['enabled', 'blockedSites']);

  // Remove all existing dynamic rules first
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);

  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });
  }

  // If not enabled or no sites, we're done
  if (!enabled || blockedSites.length === 0) {
    return;
  }

  // Create redirect rules for each blocked site
  const redirectUrl = chrome.runtime.getURL('blocked.html');
  const newRules = blockedSites.map((site, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { url: redirectUrl }
    },
    condition: {
      urlFilter: `||${site}`,
      resourceTypes: ['main_frame']
    }
  }));

  if (newRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });
  }
}

// Track blocks (called from blocked.html or via tabs listener)
async function incrementBlockCount() {
  const { blocksToday = 0 } = await chrome.storage.local.get('blocksToday');
  await chrome.storage.local.set({ blocksToday: blocksToday + 1 });
}

// Listen for tab updates to count blocks
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('blocked.html')) {
    incrementBlockCount();
  }
});

// Update rules whenever storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.enabled || changes.blockedSites) {
      updateBlockingRules();
    }
  }
});

// Reset daily counter at midnight
chrome.alarms.create('resetDailyStats', {
  when: getNextMidnight(),
  periodInMinutes: 24 * 60
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetDailyStats') {
    chrome.storage.local.set({ blocksToday: 0 });
  }
});

function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Initialize on install (only set defaults if not already set)
chrome.runtime.onInstalled.addListener(async (details) => {
  // Only initialize on fresh install, not updates
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      enabled: false,
      blockedSites: [],
      blocksToday: 0
    });
  } else if (details.reason === 'update') {
    // On update, just ensure blocksToday exists (don't wipe user data!)
    const { blocksToday } = await chrome.storage.local.get('blocksToday');
    if (blocksToday === undefined) {
      await chrome.storage.local.set({ blocksToday: 0 });
    }
  }
});

// Load rules on service worker startup
updateBlockingRules();
