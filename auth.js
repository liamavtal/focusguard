// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        FOCUSGUARD AUTH SCRIPT                               ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ══════════════════════════════════════════════════════════════════════════════

const elements = {
  // Screens
  welcomeScreen: document.getElementById('welcomeScreen'),
  authForms: document.getElementById('authForms'),
  successScreen: document.getElementById('successScreen'),
  
  // Welcome
  getStartedBtn: document.getElementById('getStartedBtn'),
  skipForNow: document.getElementById('skipForNow'),
  
  // Tabs
  tabs: document.querySelectorAll('.tab'),
  
  // Forms
  signinForm: document.getElementById('signinForm'),
  signupForm: document.getElementById('signupForm'),
  resetForm: document.getElementById('resetForm'),
  
  // Sign In
  signinEmail: document.getElementById('signinEmail'),
  signinPassword: document.getElementById('signinPassword'),
  signinBtn: document.getElementById('signinBtn'),
  googleSigninBtn: document.getElementById('googleSigninBtn'),
  forgotPasswordLink: document.getElementById('forgotPasswordLink'),
  
  // Sign Up
  signupName: document.getElementById('signupName'),
  signupEmail: document.getElementById('signupEmail'),
  signupPassword: document.getElementById('signupPassword'),
  signupBtn: document.getElementById('signupBtn'),
  googleSignupBtn: document.getElementById('googleSignupBtn'),
  
  // Reset
  resetEmail: document.getElementById('resetEmail'),
  resetBtn: document.getElementById('resetBtn'),
  backToSignin: document.getElementById('backToSignin'),
  
  // Alert
  alert: document.getElementById('alert'),
  
  // Success
  closeTabBtn: document.getElementById('closeTabBtn'),
  
  // Links
  termsLink: document.getElementById('termsLink'),
  privacyLink: document.getElementById('privacyLink')
};

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const isWelcome = params.get('welcome') === 'true';
  
  // Check if already logged in
  const state = await sendMessage({ type: 'getState' });
  
  if (state.isLoggedIn) {
    // Already logged in, show success or close
    showScreen('success');
    return;
  }
  
  // Show appropriate screen
  if (isWelcome) {
    showScreen('welcome');
  } else {
    showScreen('auth');
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Set link URLs
  elements.termsLink.href = CONFIG.TERMS_URL;
  elements.privacyLink.href = CONFIG.PRIVACY_POLICY_URL;
}

function showScreen(screen) {
  elements.welcomeScreen.classList.remove('active');
  elements.authForms.style.display = 'none';
  elements.successScreen.classList.remove('active');
  
  switch (screen) {
    case 'welcome':
      elements.welcomeScreen.classList.add('active');
      break;
    case 'auth':
      elements.authForms.style.display = 'block';
      break;
    case 'success':
      elements.successScreen.classList.add('active');
      break;
  }
}

function showForm(form) {
  elements.signinForm.classList.remove('active');
  elements.signupForm.classList.remove('active');
  elements.resetForm.classList.remove('active');
  
  elements.tabs.forEach(tab => tab.classList.remove('active'));
  
  hideAlert();
  
  switch (form) {
    case 'signin':
      elements.signinForm.classList.add('active');
      elements.tabs[0].classList.add('active');
      break;
    case 'signup':
      elements.signupForm.classList.add('active');
      elements.tabs[1].classList.add('active');
      break;
    case 'reset':
      elements.resetForm.classList.add('active');
      break;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Welcome
  elements.getStartedBtn.addEventListener('click', () => showScreen('auth'));
  elements.skipForNow.addEventListener('click', () => window.close());
  
  // Tabs
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => showForm(tab.dataset.tab));
  });
  
  // Sign In
  elements.signinBtn.addEventListener('click', handleSignIn);
  elements.signinPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignIn();
  });
  elements.googleSigninBtn.addEventListener('click', handleGoogleAuth);
  elements.forgotPasswordLink.addEventListener('click', () => showForm('reset'));
  
  // Sign Up
  elements.signupBtn.addEventListener('click', handleSignUp);
  elements.signupPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignUp();
  });
  elements.googleSignupBtn.addEventListener('click', handleGoogleAuth);
  
  // Reset
  elements.resetBtn.addEventListener('click', handleResetPassword);
  elements.resetEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleResetPassword();
  });
  elements.backToSignin.addEventListener('click', () => showForm('signin'));
  
  // Success
  elements.closeTabBtn.addEventListener('click', () => window.close());
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

async function handleSignIn() {
  const email = elements.signinEmail.value.trim();
  const password = elements.signinPassword.value;
  
  // Validation
  if (!email) {
    showAlert('Please enter your email', 'error');
    return;
  }
  
  if (!password) {
    showAlert('Please enter your password', 'error');
    return;
  }
  
  // Submit
  setLoading(elements.signinBtn, true);
  hideAlert();
  
  try {
    const result = await sendMessage({ type: 'signIn', email, password });
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    showScreen('success');
  } catch (error) {
    showAlert(getErrorMessage(error), 'error');
  } finally {
    setLoading(elements.signinBtn, false);
  }
}

async function handleSignUp() {
  const name = elements.signupName.value.trim();
  const email = elements.signupEmail.value.trim();
  const password = elements.signupPassword.value;
  
  // Validation
  if (!name) {
    showAlert('Please enter your name', 'error');
    return;
  }
  
  if (!email) {
    showAlert('Please enter your email', 'error');
    return;
  }
  
  if (!password || password.length < 8) {
    showAlert('Password must be at least 8 characters', 'error');
    return;
  }
  
  // Submit
  setLoading(elements.signupBtn, true);
  hideAlert();
  
  try {
    const result = await sendMessage({ 
      type: 'signUp', 
      email, 
      password,
      metadata: { display_name: name }
    });
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Check if email confirmation required
    if (result.user && !result.access_token) {
      showAlert('Check your email to confirm your account!', 'success');
      showForm('signin');
    } else {
      showScreen('success');
    }
  } catch (error) {
    showAlert(getErrorMessage(error), 'error');
  } finally {
    setLoading(elements.signupBtn, false);
  }
}

async function handleGoogleAuth() {
  const btn = event.target.closest('.btn');
  setLoading(btn, true);
  hideAlert();
  
  try {
    const result = await sendMessage({ type: 'signInWithGoogle' });
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    showScreen('success');
  } catch (error) {
    showAlert(getErrorMessage(error), 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function handleResetPassword() {
  const email = elements.resetEmail.value.trim();
  
  // Validation
  if (!email) {
    showAlert('Please enter your email', 'error');
    return;
  }
  
  // Submit
  setLoading(elements.resetBtn, true);
  hideAlert();
  
  try {
    const result = await sendMessage({ type: 'resetPassword', email });
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    showAlert('Check your email for the reset link!', 'success');
  } catch (error) {
    showAlert(getErrorMessage(error), 'error');
  } finally {
    setLoading(elements.resetBtn, false);
  }
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

function setLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function showAlert(message, type) {
  elements.alert.textContent = message;
  elements.alert.className = `alert visible alert-${type}`;
}

function hideAlert() {
  elements.alert.classList.remove('visible');
}

function getErrorMessage(error) {
  const message = error.message || error.toString();
  
  // Map common errors to user-friendly messages
  const errorMap = {
    'Invalid login credentials': 'Incorrect email or password',
    'Email not confirmed': 'Please confirm your email first',
    'User already registered': 'An account with this email already exists',
    'Password should be at least': 'Password must be at least 8 characters',
    'Invalid email': 'Please enter a valid email address',
    'API_NOT_CONFIGURED': 'Sign-in is not available yet. Please try again later.',
    'Network request failed': 'Connection error. Please check your internet.',
    'The user denied access': 'Google sign-in was cancelled'
  };
  
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value;
    }
  }
  
  return message;
}
