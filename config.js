// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        FOCUSGUARD CONFIGURATION                             ║
// ║                                                                              ║
// ║  Fill in your API keys below before publishing the extension.               ║
// ║  See docs/SETUP.md for detailed instructions.                               ║
// ╚════════════════════════════════════════════════════════════════════════════╝

const CONFIG = {
  // ══════════════════════════════════════════════════════════════════════════
  // SUPABASE CONFIGURATION (https://supabase.com - Free tier available)
  // ══════════════════════════════════════════════════════════════════════════
  // 1. Create project at supabase.com
  // 2. Go to Project Settings > API
  // 3. Copy Project URL and anon/public key
  
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key-here',
  
  // ══════════════════════════════════════════════════════════════════════════
  // STRIPE CONFIGURATION (https://stripe.com)
  // ══════════════════════════════════════════════════════════════════════════
  // 1. Create account at stripe.com
  // 2. Get publishable key from Developers > API Keys
  // 3. Create Product > Add Price > Copy price ID
  
  STRIPE_PUBLISHABLE_KEY: 'pk_live_your_key_here',
  STRIPE_PRICE_ID_MONTHLY: 'price_monthly_id_here',
  STRIPE_PRICE_ID_YEARLY: 'price_yearly_id_here',
  
  // ══════════════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH (https://console.cloud.google.com)
  // ══════════════════════════════════════════════════════════════════════════
  // 1. Create project in Google Cloud Console
  // 2. Enable Google+ API
  // 3. Create OAuth 2.0 credentials
  // 4. Add Chrome extension ID to authorized origins
  
  GOOGLE_CLIENT_ID: 'your-google-client-id.apps.googleusercontent.com',
  
  // ══════════════════════════════════════════════════════════════════════════
  // APPLICATION SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  
  APP_NAME: 'FocusGuard',
  APP_VERSION: '1.0.0',
  APP_TAGLINE: 'Block Distractions. Stay Focused.',
  
  // URLs
  LANDING_PAGE_URL: 'https://focusguard.app',
  PRIVACY_POLICY_URL: 'https://focusguard.app/privacy',
  TERMS_URL: 'https://focusguard.app/terms',
  SUPPORT_URL: 'https://focusguard.app/support',
  SUPPORT_EMAIL: 'support@focusguard.app',
  
  // Free tier limits
  FREE_SITE_LIMIT: 5,
  FREE_PRESET_LIMIT: 2,
  
  // Pricing (for display)
  PRICING: {
    monthly: {
      amount: 4.99,
      currency: 'USD',
      interval: 'month'
    },
    yearly: {
      amount: 39.99,
      currency: 'USD',
      interval: 'year',
      savings: '33%'
    }
  },
  
  // Feature flags
  FEATURES: {
    GOOGLE_LOGIN: true,
    CLOUD_SYNC: true,
    ANALYTICS: false
  }
};

// Validation
(function validateConfig() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'STRIPE_PUBLISHABLE_KEY'];
  const missing = required.filter(key => 
    !CONFIG[key] || CONFIG[key].includes('your') || CONFIG[key].includes('here')
  );
  
  if (missing.length > 0 && typeof console !== 'undefined') {
    console.warn('[FocusGuard] Missing configuration:', missing.join(', '));
    console.warn('[FocusGuard] See docs/SETUP.md for configuration instructions.');
  }
})();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
