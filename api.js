// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                     FOCUSGUARD SUPABASE CLIENT                              ║
// ║                                                                              ║
// ║  Handles authentication, database operations, and subscription management   ║
// ╚════════════════════════════════════════════════════════════════════════════╝

class FocusGuardAPI {
  constructor(config) {
    this.supabaseUrl = config.SUPABASE_URL;
    this.supabaseKey = config.SUPABASE_ANON_KEY;
    this.stripeKey = config.STRIPE_PUBLISHABLE_KEY;
    this.googleClientId = config.GOOGLE_CLIENT_ID;
    
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.profile = null;
    this.subscription = null;
    
    this._refreshPromise = null;
    this._initialized = false;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════

  async initialize() {
    if (this._initialized) return;
    
    try {
      await this.loadSession();
      this._initialized = true;
    } catch (e) {
      console.error('[FocusGuard API] Init error:', e);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HTTP HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  async request(endpoint, options = {}) {
    const headers = {
      'apikey': this.supabaseKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.supabaseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 by refreshing token
      if (response.status === 401 && this.refreshToken) {
        await this.refreshSession();
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return this._handleResponse(retryResponse);
      }

      return this._handleResponse(response);
    } catch (error) {
      console.error('[FocusGuard API] Request error:', error);
      throw error;
    }
  }

  async _handleResponse(response) {
    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      const error = new Error(data.error_description || data.message || data.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  async loadSession() {
    const { fg_session } = await chrome.storage.local.get('fg_session');
    
    if (!fg_session) {
      return null;
    }

    // Check if expired
    if (fg_session.expiresAt && Date.now() > fg_session.expiresAt - 60000) {
      this.refreshToken = fg_session.refreshToken;
      try {
        await this.refreshSession();
      } catch (e) {
        await this.clearSession();
        return null;
      }
    } else {
      this.accessToken = fg_session.accessToken;
      this.refreshToken = fg_session.refreshToken;
      this.user = fg_session.user;
    }

    // Load profile and subscription
    await this._loadUserData();
    
    return this.user;
  }

  async saveSession(data) {
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.user = data.user;

    const session = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
      expiresAt: Date.now() + ((data.expires_in || 3600) * 1000)
    };

    await chrome.storage.local.set({ fg_session: session });
    await this._loadUserData();
  }

  async clearSession() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.profile = null;
    this.subscription = null;

    await chrome.storage.local.remove(['fg_session', 'fg_profile', 'fg_subscription']);
  }

  async refreshSession() {
    // Prevent concurrent refresh attempts
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = (async () => {
      try {
        const data = await this.request('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: this.refreshToken })
        });

        await this.saveSession(data);
        return data;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  async _loadUserData() {
    if (!this.user) return;

    try {
      // Load profile
      const profiles = await this.request(`/rest/v1/profiles?id=eq.${this.user.id}&select=*`);
      this.profile = profiles[0] || null;

      // Load subscription
      const subs = await this.request(`/rest/v1/subscriptions?user_id=eq.${this.user.id}&select=*&order=created_at.desc&limit=1`);
      this.subscription = subs[0] || null;

      // Cache locally
      await chrome.storage.local.set({
        fg_profile: this.profile,
        fg_subscription: this.subscription
      });
    } catch (e) {
      console.error('[FocusGuard API] Load user data error:', e);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ══════════════════════════════════════════════════════════════════════════

  async signUp(email, password, metadata = {}) {
    const data = await this.request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        data: metadata
      })
    });

    if (data.access_token) {
      await this.saveSession(data);
      
      // Create profile
      await this.createProfile({
        display_name: metadata.display_name || email.split('@')[0]
      });
    }

    return data;
  }

  async signIn(email, password) {
    const data = await this.request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.access_token) {
      await this.saveSession(data);
    }

    return data;
  }

  async signInWithGoogle() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        try {
          // Exchange Google token for Supabase session
          const data = await this.request('/auth/v1/token?grant_type=id_token', {
            method: 'POST',
            body: JSON.stringify({
              provider: 'google',
              id_token: token
            })
          });

          if (data.access_token) {
            await this.saveSession(data);
            
            // Ensure profile exists
            if (!this.profile) {
              await this.createProfile({
                display_name: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
              });
            }
          }

          resolve(data);
        } catch (e) {
          // Revoke token on error
          chrome.identity.removeCachedAuthToken({ token });
          reject(e);
        }
      });
    });
  }

  async signOut() {
    if (this.accessToken) {
      try {
        await this.request('/auth/v1/logout', { method: 'POST' });
      } catch (e) {
        // Ignore logout errors
      }
    }

    // Revoke Google token if exists
    try {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token });
        }
      });
    } catch (e) {
      // Ignore
    }

    await this.clearSession();
  }

  async resetPassword(email) {
    return await this.request('/auth/v1/recover', {
      method: 'POST',
      body: JSON.stringify({
        email,
        redirect_to: `${CONFIG.LANDING_PAGE_URL}/reset-password`
      })
    });
  }

  async updatePassword(newPassword) {
    return await this.request('/auth/v1/user', {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword })
    });
  }

  async updateEmail(newEmail) {
    return await this.request('/auth/v1/user', {
      method: 'PUT',
      body: JSON.stringify({ email: newEmail })
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROFILE MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  async createProfile(data) {
    if (!this.user) throw new Error('Not authenticated');

    const profile = await this.request('/rest/v1/profiles', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        id: this.user.id,
        email: this.user.email,
        display_name: data.display_name || this.user.email.split('@')[0],
        avatar_url: data.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    this.profile = profile[0];
    await chrome.storage.local.set({ fg_profile: this.profile });
    return this.profile;
  }

  async updateProfile(updates) {
    if (!this.user) throw new Error('Not authenticated');

    const profile = await this.request(`/rest/v1/profiles?id=eq.${this.user.id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString()
      })
    });

    this.profile = profile[0];
    await chrome.storage.local.set({ fg_profile: this.profile });
    return this.profile;
  }

  async getProfile() {
    if (!this.user) return null;
    
    if (this.profile) return this.profile;
    
    const { fg_profile } = await chrome.storage.local.get('fg_profile');
    if (fg_profile) {
      this.profile = fg_profile;
      return this.profile;
    }

    await this._loadUserData();
    return this.profile;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  async getSubscription() {
    if (!this.user) return null;

    // Return cached if fresh
    if (this.subscription) return this.subscription;

    const { fg_subscription } = await chrome.storage.local.get('fg_subscription');
    if (fg_subscription) {
      this.subscription = fg_subscription;
      return this.subscription;
    }

    await this._loadUserData();
    return this.subscription;
  }

  async checkProStatus() {
    const sub = await this.getSubscription();
    
    if (!sub) return false;
    
    // Check if subscription is active
    if (sub.status !== 'active' && sub.status !== 'trialing') {
      return false;
    }

    // Check if not expired
    if (sub.current_period_end) {
      const endDate = new Date(sub.current_period_end);
      if (endDate < new Date()) {
        return false;
      }
    }

    return true;
  }

  async createCheckoutSession(priceId) {
    if (!this.user) throw new Error('Not authenticated');

    const data = await this.request('/functions/v1/create-checkout', {
      method: 'POST',
      body: JSON.stringify({
        priceId,
        userId: this.user.id,
        email: this.user.email,
        successUrl: chrome.runtime.getURL('options.html?checkout=success'),
        cancelUrl: chrome.runtime.getURL('options.html?checkout=cancelled')
      })
    });

    return data;
  }

  async createPortalSession() {
    if (!this.user) throw new Error('Not authenticated');

    const data = await this.request('/functions/v1/create-portal', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.user.id,
        returnUrl: chrome.runtime.getURL('options.html')
      })
    });

    return data;
  }

  async refreshSubscription() {
    if (!this.user) return null;

    const subs = await this.request(`/rest/v1/subscriptions?user_id=eq.${this.user.id}&select=*&order=created_at.desc&limit=1`);
    this.subscription = subs[0] || null;
    await chrome.storage.local.set({ fg_subscription: this.subscription });
    
    return this.subscription;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATA SYNC
  // ══════════════════════════════════════════════════════════════════════════

  async syncData(localData) {
    if (!this.user) return null;

    const data = await this.request('/rest/v1/user_settings', {
      method: 'POST',
      headers: { 
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: this.user.id,
        blocked_sites: localData.blockedSites || [],
        settings: localData.settings || {},
        schedule: localData.schedule || {},
        stats: localData.stats || {},
        updated_at: new Date().toISOString()
      })
    });

    return data[0];
  }

  async loadSyncedData() {
    if (!this.user) return null;

    const data = await this.request(`/rest/v1/user_settings?user_id=eq.${this.user.id}&select=*`);
    return data[0] || null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ══════════════════════════════════════════════════════════════════════════

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async deleteAccount() {
    if (!this.user) throw new Error('Not authenticated');

    // Cancel subscription first
    if (this.subscription?.status === 'active') {
      await this.createPortalSession(); // Let user cancel via Stripe portal
      throw new Error('Please cancel your subscription first');
    }

    // Delete user data
    await this.request(`/rest/v1/user_settings?user_id=eq.${this.user.id}`, {
      method: 'DELETE'
    });

    await this.request(`/rest/v1/profiles?id=eq.${this.user.id}`, {
      method: 'DELETE'
    });

    // Sign out
    await this.signOut();
  }
}

// Export
if (typeof window !== 'undefined') {
  window.FocusGuardAPI = FocusGuardAPI;
}

if (typeof self !== 'undefined') {
  self.FocusGuardAPI = FocusGuardAPI;
}
