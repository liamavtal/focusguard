# FocusShield - Website Blocker

> Block distracting websites and stay focused. Schedule focus times and boost your productivity.

[![CI](https://github.com/yourusername/focusguard-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/focusguard-extension/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🛡️ Block any website with one click
- 📱 Preset categories (Social, Video, News, Shopping)
- ⏰ Schedule focus sessions
- 📊 Daily block statistics
- 🌙 Dark mode support
- 🔒 All data stored locally

## Quick Start

1. Install extension
2. Click the extension icon
3. Add websites to block (or use presets)
4. Toggle Focus Mode ON
5. Stay productive!

## Preset Categories

| Category | Sites Included |
|----------|---------------|
| Social | Facebook, Instagram, Twitter/X, TikTok, Reddit, LinkedIn |
| Video | YouTube, Netflix, Twitch, Hulu, Disney+ |
| News | CNN, Fox, BBC, NYTimes, Washington Post |
| Shopping | Amazon, eBay, Walmart, Target, Etsy |

## Permissions Explained

This extension requires elevated permissions to function. Here's why:

| Permission | Why It's Required |
|------------|-------------------|
| `storage` | Save your blocked sites list and preferences |
| `tabs` | Check if current site should be blocked |
| `declarativeNetRequest` | Block network requests to specified sites |
| `alarms` | Schedule focus sessions |
| `<all_urls>` | Block ANY website you choose (we can't predict which) |

**Privacy Assurance:**
- We ONLY block requests, never read page content
- We store ONLY domain names, not full URLs
- We transmit NOTHING externally
- Same permissions used by uBlock Origin, AdBlock Plus

## Installation

### From Chrome Web Store
[Install from Chrome Web Store](#) *(link pending)*

### Development
```bash
git clone https://github.com/yourusername/focusguard-extension.git
cd focusguard-extension
npm install
npm test
```

## Project Structure

```
focusguard-extension/
├── manifest.json      # Extension config with declarativeNetRequest
├── popup.html         # Main UI
├── popup.js           # Blocking logic
├── background.js      # Service worker for request blocking
├── blocked.html       # "Site Blocked" page
├── privacy.html       # Privacy policy
├── icons/             # Extension icons
└── tests/             # Jest test suite
```

## Development

```bash
npm test              # Run tests
npm run lint          # Check code quality
npm run build:zip     # Package extension
```

## Privacy

- 🔒 100% local storage
- 🚫 No external transmission
- 🚫 No page content access
- 🚫 No browsing history stored
- ✅ GDPR compliant

See [privacy.html](privacy.html) for full policy.

## License

MIT License
