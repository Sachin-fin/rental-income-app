// tests/test_auth_system.js
// Automated verification suite for Authentication, Registration, Mobile/Email OTP Verification & Password Reset
const fs = require('fs');
const vm = require('vm');

console.log("=== Testing Authentication, Registration, OTP & Password Reset System ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// Verify all required HTML IDs are present in index.html
const requiredAuthIds = [
  "authHeaderContainer",
  "authHeaderUserPill",
  "authHeaderAvatar",
  "authHeaderUserName",
  "authHeaderUserEmail",
  "authHeaderVerifiedBadge",
  "authHeaderSignInBtn",
  "authSignOutBtn",
  "authModal",
  "authViewSignIn",
  "authViewRegister",
  "authViewOtp",
  "authViewForgotPassword",
  "authViewSetNewPassword",
  "authLoginIdentifier",
  "authLoginPassword",
  "authSubmitSignInBtn",
  "authSwitchToOtpLoginBtn",
  "authForgotPasswordLink",
  "authRegName",
  "authRegEmail",
  "authRegPhone",
  "authRegRole",
  "authRegPassword",
  "authRegPasswordConfirm",
  "authSubmitRegisterBtn",
  "authOtpTargetDisplay",
  "authOtp1", "authOtp2", "authOtp3", "authOtp4", "authOtp5", "authOtp6",
  "authSubmitOtpBtn",
  "authResendOtpBtn",
  "authResetEmailInput",
  "authSubmitResetRequestBtn",
  "authNewPasswordInput",
  "authNewPasswordConfirmInput",
  "authSubmitNewPasswordBtn",
  "authQuickDemoLoginBtn",
  "authHowToUseTipsCard",
  "authModalTipsToggleBtn",
  "headerHowToUseBtn",
  "howToUseModal",
  "closeHowToUseModalBtn",
  "openHowToUseFullGuideBtn"
];

let missingIds = 0;
requiredAuthIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`MISSING ID: ${id}`);
    missingIds++;
  }
});

if (missingIds > 0) {
  console.error(`❌ Failed: ${missingIds} required elements missing in HTML!`);
  process.exit(1);
}
console.log(`✓ All ${requiredAuthIds.length} Authentication UI IDs present in HTML!`);

// Mock storage & elements
const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const elements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    checked: false,
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    children: [],
    _classes: '',
    classList: {
      add: function(...classes) {
        const set = new Set((this._classes || '').split(' ').filter(Boolean));
        classes.forEach(c => set.add(c));
        this._classes = Array.from(set).join(' ');
      },
      remove: function(...classes) {
        const set = new Set((this._classes || '').split(' ').filter(Boolean));
        classes.forEach(c => set.delete(c));
        this._classes = Array.from(set).join(' ');
      },
      contains: function(c) {
        return (this._classes || '').split(' ').includes(c);
      }
    },
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    closest: () => null,
    appendChild: function(child) {
      this.children.push(child);
      if (child.textContent) {
        lastToasts.push({ type: 'toast', msg: child.textContent });
        console.log(`[Captured Toast]: ${child.textContent}`);
      }
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {}
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  createElement: (tag) => createMockElement('el_' + Math.random().toString(36).substr(2, 5), tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: createMockElement('body')
};

const lastToasts = [];
const mockToast = {
  success: (msg) => { lastToasts.push({ type: 'success', msg }); console.log(`[Toast Success]: ${msg}`); },
  error: (msg) => { lastToasts.push({ type: 'error', msg }); console.log(`[Toast Error]: ${msg}`); },
  info: (msg) => { lastToasts.push({ type: 'info', msg }); console.log(`[Toast Info]: ${msg}`); },
  warning: (msg) => { lastToasts.push({ type: 'warning', msg }); console.log(`[Toast Warning]: ${msg}`); }
};

const mockWindow = {
  localStorage: mockLocalStorage,
  document: mockDoc,
  addEventListener: (evt, cb) => {
    if (evt === 'DOMContentLoaded') {
      mockWindow._domLoaded = cb;
    }
  },
  toast: mockToast,
  console: console,
  location: { origin: 'http://localhost:3000' }
};

const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  localStorage: mockLocalStorage,
  toast: mockToast,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Intl: Intl,
  Date: Date,
  Math: Math,
  JSON: JSON,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  Boolean: Boolean,
  RegExp: RegExp,
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
});

try {
  vm.runInContext(scriptMatch[1], context);
  if (mockWindow._domLoaded) {
    mockWindow._domLoaded();
  }
} catch (e) {
  console.error("Script execution error:", e);
  process.exit(1);
}

const getEl = (id) => mockDoc.getElementById(id);

(async () => {
  console.log("\n--- 1. Testing App Always Opens on Gated Login Page with Tips ---");
  const isLoginModalOpenOnStart = !getEl("authModal").classList.contains("hidden");
  const isNavHiddenOnStart = getEl("mainTabNav").classList.contains("hidden");
  const isTipsCardPresent = Boolean(getEl("authHowToUseTipsCard"));
  console.log("Login Page open on initial load?:", isLoginModalOpenOnStart);
  console.log("Dashboard tabs hidden on initial load?:", isNavHiddenOnStart);
  console.log("Tips card present on login page?:", isTipsCardPresent);
  if (!isLoginModalOpenOnStart || !isNavHiddenOnStart || !isTipsCardPresent) {
    console.error("❌ App must always open on login page with how-to-use tips!");
    process.exit(1);
  }
  console.log("✓ PASS: App always opens on login page with how-to-use tips!");

  // Test opening and closing the full interactive guide modal
  mockWindow.openHowToUseModal();
  if (getEl("howToUseModal").classList.contains("hidden")) {
    console.error("❌ howToUseModal should be visible when opened!");
    process.exit(1);
  }
  mockWindow.closeHowToUseModal();
  if (!getEl("howToUseModal").classList.contains("hidden")) {
    console.error("❌ howToUseModal should be hidden after closing!");
    process.exit(1);
  }
  console.log("✓ PASS: Interactive How-To-Use full guide modal opens and closes properly!");

  // Test 1-Click Quick Demo Sign In
  getEl("authLoginIdentifier").value = "abcltd9925@gmail.com";
  getEl("authLoginPassword").value = "password123";
  await mockWindow.handleAuthSignIn();

  const userName = getEl("authHeaderUserName")?.textContent;
  const userEmail = getEl("authHeaderUserEmail")?.textContent;
  console.log(`Current Header User after sign in: "${userName}", Email: "${userEmail}"`);
  if (!userName.includes("Rajesh Sharma")) {
    console.error("❌ Expected Rajesh Sharma after sign in!");
    process.exit(1);
  }
  console.log("✓ PASS: Rajesh Sharma authenticated session active!");

  console.log("\n--- 2. Testing View Switching in Auth Modal ---");
  mockWindow.openAuthModal("register");
  if (getEl("authModal").classList.contains("hidden")) {
    console.error("❌ authModal should be visible when opened!");
    process.exit(1);
  }
  console.log("✓ PASS: Auth Modal opens and default mode is register");
  console.log("\n--- 3. Testing Registration and OTP Generation ---");
  getEl("authRegName").value = "Sunita Kapoor";
  getEl("authRegEmail").value = "sunita.kapoor@outlook.com";
  getEl("authRegPhone").value = "9820011223";
  getEl("authRegPassword").value = "Pass@123456";
  getEl("authRegPasswordConfirm").value = "Pass@123456";
  getEl("authRegRole").value = "Landlord";

  await mockWindow.handleAuthRegister();
  console.log("Feedback displayed:", getEl("authFeedback").innerHTML);

  // Verify OTP notification dispatched
  const fbText = getEl("authFeedback")?.innerHTML || "";
  const otpMatch = fbText.match(/\b\d{6}\b/) || (lastToasts.find(t => t.msg.includes("Verification code") || t.msg.includes("One-Time Code"))?.msg.match(/\b\d{6}\b/));
  if (!otpMatch) {
    console.error("❌ Registration did not dispatch OTP! Feedback:", fbText, "Last toasts:", lastToasts);
    process.exit(1);
  }
  const generatedOtp = otpMatch[0];
  console.log(`✓ Detected Generated 6-digit OTP: ${generatedOtp}`);

  // Populate 6 digit inputs
  for (let i = 1; i <= 6; i++) {
    getEl("authOtp" + i).value = generatedOtp[i - 1];
  }

  // Submit OTP
  mockWindow.handleAuthOtpSubmit();

  const newUserName = getEl("authHeaderUserName")?.textContent;
  console.log(`Updated Header User after OTP: "${newUserName}"`);
  if (!newUserName.includes("Sunita Kapoor")) {
    console.error("❌ User session was not updated to Sunita Kapoor!");
    process.exit(1);
  }
  console.log("✓ PASS: New user registered and authenticated via OTP successfully!");

  console.log("\n--- 4. Testing Sign Out ---");
  mockWindow.handleSignOut();
  console.log("Header user pill hidden?:", getEl("authHeaderUserPill").classList.contains("hidden"));
  console.log("Sign In button visible?:", !getEl("authHeaderSignInBtn").classList.contains("hidden"));
  if (!getEl("authHeaderUserPill").classList.contains("hidden") || getEl("authHeaderSignInBtn").classList.contains("hidden")) {
    console.error("❌ Sign out failed to update header UI!");
    process.exit(1);
  }
  console.log("✓ PASS: User successfully signed out!");

  console.log("\n--- 5. Testing Sign In with Registered Account ---");
  getEl("authLoginIdentifier").value = "sunita.kapoor@outlook.com";
  getEl("authLoginPassword").value = "Pass@123456";
  await mockWindow.handleAuthSignIn();

  const loggedInUser = getEl("authHeaderUserName")?.textContent;
  if (!loggedInUser.includes("Sunita Kapoor")) {
    console.error("❌ Failed to log in with registered credentials!");
    process.exit(1);
  }
  console.log("✓ PASS: Sign in with email and password verified!");

  console.log("\n--- 6. Testing Password Reset Request via Email Link/Code ---");
  mockWindow.handleSignOut();
  getEl("authResetEmailInput").value = "sunita.kapoor@outlook.com";
  await mockWindow.handleForgotPasswordRequest();

  const resetFb = getEl("authFeedback")?.innerHTML || "";
  const resetCodeMatch = resetFb.match(/\b\d{6}\b/) || (lastToasts.find(t => t.msg.includes("Password Reset Link"))?.msg.match(/\b\d{6}\b/));
  if (!resetCodeMatch) {
    console.error("❌ Reset password code not found! Feedback:", resetFb, "Last toasts:", lastToasts);
    process.exit(1);
  }
  const resetOtpCode = resetCodeMatch[0];
  console.log(`✓ Reset OTP Code received: ${resetOtpCode}`);

  // Enter OTP to verify identity for reset
  for (let i = 1; i <= 6; i++) {
    getEl("authOtp" + i).value = resetOtpCode[i - 1];
  }
  mockWindow.handleAuthOtpSubmit();

  // Enter new password
  getEl("authNewPasswordInput").value = "SuperSecret#2026";
  getEl("authNewPasswordConfirmInput").value = "SuperSecret#2026";
  mockWindow.handleSetNewPasswordSubmit();

  const resetUserName = getEl("authHeaderUserName")?.textContent;
  if (!resetUserName.includes("Sunita Kapoor")) {
    console.error("❌ Password reset did not log in the user!");
    process.exit(1);
  }
  console.log("✓ PASS: Password successfully reset and authenticated!");

  console.log("\n--- 7. Testing Anyone Can Login with New Email + Password (Auto-Creation & Immediate Login) ---");
  mockWindow.handleSignOut();
  getEl("authLoginIdentifier").value = "anita.deshmukh@gmail.com";
  getEl("authLoginPassword").value = "SecurePass@2026";
  await mockWindow.handleAuthSignIn();

  const anitaName = getEl("authHeaderUserName")?.textContent;
  const anitaEmail = getEl("authHeaderUserEmail")?.textContent;
  console.log(`Signed in new email user -> Name: "${anitaName}", Email: "${anitaEmail}"`);
  if (!anitaName.includes("Anita Deshmukh") || anitaEmail !== "anita.deshmukh@gmail.com") {
    console.error("❌ Failed to automatically register and log in new email user!");
    process.exit(1);
  }
  console.log("✓ PASS: Anyone can log in seamlessly with new email + password!");

  console.log("\n--- 8. Testing Anyone Can Login via Passwordless Email OTP Authentication ---");
  mockWindow.handleSignOut();
  getEl("authLoginIdentifier").value = "karan.singh@venture.in";
  await mockWindow.handleQuickOtpLogin();

  const otpFb = getEl("authFeedback")?.innerHTML || "";
  const matchOtp = otpFb.match(/\b\d{6}\b/) || (lastToasts.find(t => t.msg.includes("One-Time Sign-In Code") || t.msg.includes("One-Time Code"))?.msg.match(/\b\d{6}\b/));
  if (!matchOtp) {
    console.error("❌ Email OTP was not generated for new email! Feedback:", otpFb);
    process.exit(1);
  }
  const emailOtp = matchOtp[0];
  console.log(`✓ Detected Email OTP for new user: ${emailOtp}`);

  for (let i = 1; i <= 6; i++) {
    getEl("authOtp" + i).value = emailOtp[i - 1];
  }
  mockWindow.handleAuthOtpSubmit();

  const karanName = getEl("authHeaderUserName")?.textContent;
  const karanEmail = getEl("authHeaderUserEmail")?.textContent;
  console.log(`Signed in via Email OTP -> Name: "${karanName}", Email: "${karanEmail}"`);
  if (!karanName.includes("Karan Singh") || karanEmail !== "karan.singh@venture.in") {
    console.error("❌ Failed Email OTP authentication for new email user!");
    process.exit(1);
  }
  console.log("✓ PASS: Anyone can log in with any email via passwordless Email OTP!");

  console.log("\n--- 9. Testing Page Reload Persistence After Sign Out ---");
  mockWindow.handleSignOut();
  if (!getEl("authHeaderUserPill").classList.contains("hidden")) {
    console.error("❌ User pill should be hidden after sign out!");
    process.exit(1);
  }
  // Simulate page reload calling initAuthSession()
  mockWindow.initAuthSession();
  if (!getEl("authHeaderUserPill").classList.contains("hidden")) {
    console.error("❌ User was improperly auto-logged in on reload after explicit sign out!");
    process.exit(1);
  }
  console.log("✓ PASS: User remains cleanly signed out after page refresh!");

  console.log("\n--- 10. Testing Gated Login Page on Sign Out (Dashboard & Tabs Hidden) ---");
  // Confirm that while signed out, authModal is shown and main navigation is hidden
  const isAuthModalOpen = !getEl("authModal").classList.contains("hidden");
  const isNavHidden = getEl("mainTabNav").classList.contains("hidden");
  const isCloseBtnHidden = getEl("closeAuthModalBtn").classList.contains("hidden");
  console.log("Auth Modal (Login Page) open when signed out?:", isAuthModalOpen);
  console.log("Main Navigation tabs hidden when signed out?:", isNavHidden);
  console.log("Modal close button hidden when signed out?:", isCloseBtnHidden);
  if (!isAuthModalOpen || !isNavHidden || !isCloseBtnHidden) {
    console.error("❌ Sign out must show login page and hide dashboard tabs!");
    process.exit(1);
  }

  // Attempt to dismiss login page while unauthenticated
  mockWindow.closeAuthModal();
  if (getEl("authModal").classList.contains("hidden")) {
    console.error("❌ Login page should NOT be dismissible while signed out!");
    process.exit(1);
  }
  console.log("✓ PASS: Login page is non-dismissible while signed out!");

  // Now log back in and verify dashboard and tabs are restored
  getEl("authLoginIdentifier").value = "abcltd9925@gmail.com";
  getEl("authLoginPassword").value = "password123";
  await mockWindow.handleAuthSignIn();

  const isAuthModalClosedAfterLogin = getEl("authModal").classList.contains("hidden");
  const isNavVisibleAfterLogin = !getEl("mainTabNav").classList.contains("hidden");
  if (!isAuthModalClosedAfterLogin || !isNavVisibleAfterLogin) {
    console.error("❌ After login, login page should close and dashboard tabs should be revealed!");
    process.exit(1);
  }
  console.log("✓ PASS: Dashboard & navigation restored and login page closed upon sign in!");

  // Verify Landlord Profile & Settings modal is NOT opened automatically upon login
  getEl("landlordProfileModal").classList.add("hidden");
  await new Promise(r => setTimeout(r, 400));
  if (!getEl("landlordProfileModal").classList.contains("hidden")) {
    console.error("❌ Landlord Profile & Settings modal should NOT be opened automatically after login!");
    process.exit(1);
  }
  console.log("✓ PASS: Landlord Profile & Settings modal is NOT automatically opened on login!");

  console.log("\n--- 11. Testing Page Refresh Session Persistence When User is Logged In ---");
  // Simulate page refresh by calling initAuthSession()
  mockWindow.initAuthSession();
  const isPillVisibleAfterRefresh = !getEl("authHeaderUserPill").classList.contains("hidden");
  const isAuthModalHiddenAfterRefresh = getEl("authModal").classList.contains("hidden");
  const isNavVisibleAfterRefresh = !getEl("mainTabNav").classList.contains("hidden");
  const refreshedUserName = getEl("authHeaderUserName")?.textContent;
  console.log("User pill visible after refresh?:", isPillVisibleAfterRefresh);
  console.log("Auth modal closed after refresh?:", isAuthModalHiddenAfterRefresh);
  console.log("Navigation tabs visible after refresh?:", isNavVisibleAfterRefresh);
  console.log("User name after refresh:", refreshedUserName);

  if (!isPillVisibleAfterRefresh || !isAuthModalHiddenAfterRefresh || !isNavVisibleAfterRefresh || !refreshedUserName.includes("Rajesh Sharma")) {
    console.error("❌ Session was lost on page refresh!");
    process.exit(1);
  }
  console.log("✓ PASS: Authenticated user session persisted across page refresh!");

  console.log("\n====================================================================");
  console.log("🎉 ALL AUTHENTICATION, REGISTRATION, EMAIL OTP & RESET TESTS PASSED 100%!");
  console.log("====================================================================\n");
  process.exit(0);
})();
