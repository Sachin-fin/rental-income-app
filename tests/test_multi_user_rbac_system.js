// tests/test_multi_user_rbac_system.js
// Automated verification suite for Multi-User Management & Admin-Controlled Permission Matrix (RBAC)

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("======================================================================");
console.log("🚀 TESTING MULTI-USER RBAC & ADMIN PERMISSION MATRIX SYSTEM");
console.log("======================================================================");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// -------------------------------------------------------------
// Test 1: Verify Required RBAC DOM Elements in HTML
// -------------------------------------------------------------
console.log("\n--- Test 1: Checking Required RBAC DOM Elements in HTML ---");
const requiredRbacIds = [
  // Navigation & Badges
  "tabBtnUsers",
  "navUsersCount",
  "tabViewUsers",

  // Tab 9 KPIs
  "usersKpiTotal",
  "usersKpiActive",
  "usersKpiInactive",
  "usersKpiRoles",

  // Sub-Tab Navigation
  "subTabBtnUserDir",
  "subTabBtnPermMatrix",
  "subTabBtnRoles",
  "subTabBtnDataVis",
  "subTabBtnAudit",

  // Sub-Tab Views
  "usersViewDirectory",
  "usersViewMatrix",
  "usersViewRoles",
  "usersViewData",
  "usersViewAudit",

  // Action Controls
  "btnAddNewUser",
  "userSearchInput",
  "userRoleFilter",
  "userStatusFilter",
  "userDirectoryTableBody",

  // Permission Matrix Screen
  "matrixUserSelect",
  "matrixUserRoleDisplay",
  "btnCopyMatrixFromUser",
  "matrixSourceUserSelect",
  "btnResetMatrixToDefaults",
  "btnSaveMatrixPermissions",
  "permissionMatrixTableBody",

  // Data Visibility Controls
  "dataVisUserSelect",
  "dataVisScopeAll",
  "dataVisScopeCustom",
  "dataVisPropertiesContainer",
  "btnSaveDataVisibility",

  // Audit & Login History
  "auditViewModeToggleTrail",
  "auditViewModeToggleLogin",
  "auditSearchInput",
  "auditLogTableBody",
  "btnExportAuditLogs",

  // Modals
  "userFormModal",
  "closeUserFormModalBtn",
  "userFormTitle",
  "userFormName",
  "userFormEmail",
  "userFormPhone",
  "userFormRole",
  "userFormDepartment",
  "userFormStatus",
  "userFormPassword",
  "btnSubmitUserForm",

  "userResetPasswordModal",
  "closeResetPasswordModalBtn",
  "resetPasswordTargetUser",
  "resetPasswordNewInput",
  "btnSubmitResetPassword",

  "accessDeniedModal",
  "closeAccessDeniedModalBtn",
  "accessDeniedRequiredPerm",
  "accessDeniedUserRole"
];

let missingIds = [];
requiredRbacIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    missingIds.push(id);
  }
});

if (missingIds.length > 0) {
  console.error(`❌ Failed: Missing ${missingIds.length} RBAC element IDs in index.html:`, missingIds);
} else {
  console.log(`✓ All ${requiredRbacIds.length} RBAC element IDs verified in HTML!`);
}

// -------------------------------------------------------------
// Test 2: In-Memory VM Verification of Permission Engine & State
// -------------------------------------------------------------
console.log("\n--- Test 2: In-Memory VM Verification of RBAC Engine & State ---");

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
    appendChild: function(c) { this.children.push(c); },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {}
  };
}

const mockDoc = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  },
  createElement: (tag) => createMockElement('el_' + Math.random().toString(36).substr(2, 5), tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: createMockElement('body')
};

const mockWindow = {
  localStorage: mockLocalStorage,
  document: mockDoc,
  addEventListener: (evt, cb) => {
    if (evt === 'DOMContentLoaded') {
      mockWindow._domLoaded = cb;
    }
  },
  toast: {
    success: (m) => console.log(`[Toast Success]: ${m}`),
    error: (m) => console.log(`[Toast Error]: ${m}`),
    info: (m) => console.log(`[Toast Info]: ${m}`),
    warning: (m) => console.log(`[Toast Warning]: ${m}`)
  },
  console: console,
  location: { origin: 'http://localhost:3000' }
};

const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>[\s\S]*?<\/body>/);
if (!scriptMatch) {
  console.error("❌ No script tag found in index.html!");
  process.exit(1);
}

const context = vm.createContext({
  window: mockWindow,
  document: mockDoc,
  localStorage: mockLocalStorage,
  toast: mockWindow.toast,
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
  console.error("❌ Script initialization error:", e);
  process.exit(1);
}

// Ensure required methods are exposed
const requiredFunctions = [
  "hasPermission",
  "canAccessProperty",
  "canAccessTenant",
  "filterPropertiesForUser",
  "filterTenantsForUser",
  "createUser",
  "updateUser",
  "deactivateUser",
  "activateUser",
  "deleteUser",
  "resetUserPassword",
  "updateUserPermissions",
  "copyUserPermissions",
  "resetUserPermissionsToRole",
  "recordAuditEvent",
  "getAuditLogs",
  "recordLoginHistory",
  "getLoginHistory",
  "renderUsersTab"
];

console.log("\n--- Checking Exposed RBAC Functions on window ---");
requiredFunctions.forEach(fn => {
  assert(typeof mockWindow[fn] === "function", `Expected window.${fn} to be a function!`);
  console.log(`✓ window.${fn} is available`);
});

// Run functional tests:
console.log("\n--- Testing Role-Based Permission Logic ---");

const superAdmin = { id: "usr_master_rajesh", role: "Super Admin", status: "Active", assignedProperties: ["all"] };
const manager = { id: "usr_mgr_priya", role: "Manager", status: "Active", assignedProperties: ["all"] };
const accountant = { id: "usr_acct_amit", role: "Accountant", status: "Active", assignedProperties: ["all"] };
const viewer = { id: "usr_view_rohit", role: "Viewer / Read Only", status: "Active", assignedProperties: ["all"] };
const deactivatedUser = { id: "usr_deact", role: "Super Admin", status: "Inactive", assignedProperties: ["all"] };

// Super Admin has unrestricted permissions
assert.strictEqual(mockWindow.hasPermission("properties", "delete", superAdmin), true, "Super Admin should have properties:delete");
assert.strictEqual(mockWindow.hasPermission("users", "manage", superAdmin), true, "Super Admin should have users:manage");
assert.strictEqual(mockWindow.hasPermission("gst", "approve", superAdmin), true, "Super Admin should have gst:approve");

// Manager has operational permissions, but cannot delete or manage users
assert.strictEqual(mockWindow.hasPermission("properties", "view", manager), true, "Manager can view properties");
assert.strictEqual(mockWindow.hasPermission("properties", "create", manager), true, "Manager can create properties");
assert.strictEqual(mockWindow.hasPermission("properties", "delete", manager), false, "Manager cannot delete properties");
assert.strictEqual(mockWindow.hasPermission("users", "manage", manager), false, "Manager cannot manage users");

// Accountant has finance & invoicing permissions
assert.strictEqual(mockWindow.hasPermission("gst", "create", accountant), true, "Accountant can create GST invoices");
assert.strictEqual(mockWindow.hasPermission("gst", "approve", accountant), true, "Accountant can approve GST invoices");
assert.strictEqual(mockWindow.hasPermission("reports", "export", accountant), true, "Accountant can export reports");
assert.strictEqual(mockWindow.hasPermission("properties", "create", accountant), false, "Accountant cannot create properties");

// Viewer is read-only
assert.strictEqual(mockWindow.hasPermission("properties", "view", viewer), true, "Viewer can view properties");
assert.strictEqual(mockWindow.hasPermission("properties", "create", viewer), false, "Viewer cannot create properties");
assert.strictEqual(mockWindow.hasPermission("properties", "edit", viewer), false, "Viewer cannot edit properties");
assert.strictEqual(mockWindow.hasPermission("gst", "create", viewer), false, "Viewer cannot create GST");

// Inactive user is denied everything
assert.strictEqual(mockWindow.hasPermission("dashboard", "view", deactivatedUser), false, "Deactivated user denied view");
assert.strictEqual(mockWindow.hasPermission("properties", "view", deactivatedUser), false, "Deactivated user denied properties");

console.log("✓ PASS: Default Role-Based Access Control matrix verified!");

// Test Custom User-Level Overrides
console.log("\n--- Testing User-Level Permission Overrides ---");
const customUser = {
  id: "usr_custom_1",
  role: "Viewer / Read Only",
  status: "Active",
  assignedProperties: ["all"],
  permissions: {
    properties: { edit: true },
    gst: { export: true }
  }
};
assert.strictEqual(mockWindow.hasPermission("properties", "edit", customUser), true, "Custom override granted properties:edit");
assert.strictEqual(mockWindow.hasPermission("gst", "export", customUser), true, "Custom override granted gst:export");
assert.strictEqual(mockWindow.hasPermission("properties", "delete", customUser), false, "Non-overridden action denied");
console.log("✓ PASS: Granular user-level overrides work correctly!");

// Test Property-Level & Data Scoping
console.log("\n--- Testing Property & Tenant Data Scoping ---");
const testProps = [
  { id: "prop_101", name: "Oberoi Woods A-101", building: "Oberoi Woods" },
  { id: "prop_102", name: "Oberoi Woods A-102", building: "Oberoi Woods" },
  { id: "prop_201", name: "Phoenix One B-201", building: "Phoenix Tower" }
];
const testTenants = [
  { id: "t_1", name: "Alice", propertyId: "prop_101", unit: "Oberoi Woods A-101" },
  { id: "t_2", name: "Bob", propertyId: "prop_102", unit: "Oberoi Woods A-102" },
  { id: "t_3", name: "Charlie", propertyId: "prop_201", unit: "Phoenix One B-201" }
];

const scopedUser = {
  id: "usr_scoped",
  role: "Manager",
  status: "Active",
  assignedProperties: ["prop_101"]
};

assert.strictEqual(mockWindow.canAccessProperty("prop_101", scopedUser), true, "Can access assigned prop_101");
assert.strictEqual(mockWindow.canAccessProperty("prop_201", scopedUser), false, "Cannot access unassigned prop_201");

const filteredProps = mockWindow.filterPropertiesForUser(testProps, scopedUser);
assert.strictEqual(filteredProps.length, 1, "Should filter to only 1 assigned property");
assert.strictEqual(filteredProps[0].id, "prop_101");

const filteredTenants = mockWindow.filterTenantsForUser(testTenants, scopedUser);
assert.strictEqual(filteredTenants.length, 1, "Should filter to only tenants in assigned property");
assert.strictEqual(filteredTenants[0].name, "Alice");
console.log("✓ PASS: Property and Tenant data scoping verified!");

// Test User Operations & Security Constraints
console.log("\n--- Testing User Operations & Super Admin Safeguards ---");
const initialAccounts = mockWindow.getStoredAccounts();
console.log(`Initial stored accounts count: ${initialAccounts.length}`);

// Test Super Admin cannot be deleted
const deleteSuperAdminResult = mockWindow.deleteUser("usr_master_rajesh");
assert.strictEqual(deleteSuperAdminResult.success, false, "Deleting Super Admin must fail!");
console.log("✓ PASS: Super Admin deletion prevented!");

// Test Super Admin cannot be deactivated
const deactSuperAdminResult = mockWindow.deactivateUser("usr_master_rajesh");
assert.strictEqual(deactSuperAdminResult.success, false, "Deactivating Super Admin must fail!");
console.log("✓ PASS: Super Admin deactivation prevented!");

// Test adding a new user
const newUserRes = mockWindow.createUser({
  name: "Neha Sharma",
  email: "neha.finance@rentals.com",
  phone: "9876500000",
  role: "Accountant",
  department: "Finance",
  status: "Active",
  assignedProperties: ["all"],
  password: "securePassword123"
});
assert.strictEqual(newUserRes.success, true, "User creation should succeed");
assert(newUserRes.user && newUserRes.user.id, "Created user should have ID");
console.log("✓ PASS: New user created successfully!");

// Test updating user permissions
const permUpdateRes = mockWindow.updateUserPermissions(newUserRes.user.id, {
  reports: { export: true, print: true, share: true }
});
assert.strictEqual(permUpdateRes.success, true, "Permission update should succeed");
console.log("✓ PASS: User permissions updated!");

// Test Audit Logging
console.log("\n--- Testing Audit Logging & Login History ---");
const auditLogs = mockWindow.getAuditLogs();
assert(Array.isArray(auditLogs) && auditLogs.length > 0, "Audit logs should record events");
console.log(`✓ Audit log contains ${auditLogs.length} events (latest: ${auditLogs[0].action} - ${auditLogs[0].details})`);

mockWindow.recordLoginHistory("usr_test", "Test User", "test@test.com", "LOGIN_SUCCESS", "Password Authentication");
const loginHistory = mockWindow.getLoginHistory();
assert(Array.isArray(loginHistory) && loginHistory.length > 0, "Login history should record events");
assert.strictEqual(loginHistory[0].event, "LOGIN_SUCCESS");
console.log("✓ PASS: Audit logging and login history verified!");

console.log("\n======================================================================");
console.log("🎉 ALL RBAC & PERMISSION MATRIX SYSTEM TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================\n");
