const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

console.log("=== Testing Senior Software Engineer Review Enhancements (UI, Security & Data Management) ===");

const htmlPath = path.join(__dirname, "..", "index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// 1. Static HTML / UI Verification
assert.ok(htmlContent.includes('id="headerDataSecurityBtn"'), "Header must include Data & Security Center button (#headerDataSecurityBtn)");
assert.ok(htmlContent.includes('id="openDataSecurityCenterMenuBtn"'), "Profile dropdown must include Data Backup & Security menu item");
assert.ok(htmlContent.includes('id="dataSecurityManagerModal"'), "HTML must include Enterprise Data Management & Security Center Modal (#dataSecurityManagerModal)");
assert.ok(htmlContent.includes('id="userFormPasswordStrength"'), "User Form modal must include live password strength badge");
assert.ok(htmlContent.includes('id="toggleUserFormPassBtn"'), "User Form modal must include password visibility toggle button");
assert.ok(htmlContent.includes('id="resetPasswordStrength"'), "Reset Password modal must include live password strength badge");
assert.ok(htmlContent.includes('id="toggleResetPassBtn"'), "Reset Password modal must include password visibility toggle button");
console.log("✓ 1. UI View: Header button, Data & Security Center modal, and password visibility/strength controls verified in DOM");

// 2. Build VM Sandbox to test runtime Security & Data Management engines
const storage = {};
const mockLocalStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); }
};

const elements = {};
function createMockElement(id, tag = "div") {
  return {
    id,
    tagName: tag.toUpperCase(),
    type: id.toLowerCase().includes("password") ? "password" : "text",
    value: "",
    checked: false,
    disabled: false,
    className: "",
    textContent: "",
    innerHTML: "",
    style: {},
    dataset: {},
    children: [],
    options: [],
    classList: {
      _set: new Set(id.includes("Modal") ? ["hidden"] : []),
      add: function (...cls) { cls.forEach((c) => this._set.add(c)); },
      remove: function (...cls) { cls.forEach((c) => this._set.delete(c)); },
      contains: function (c) { return this._set.has(c); },
      toggle: function (c) {
        if (this._set.has(c)) { this._set.delete(c); return false; }
        this._set.add(c); return true;
      }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    closest: () => null,
    appendChild: () => {},
    insertBefore: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {},
    select: () => {},
    click: () => {}
  };
}

const mockDoc = {
  title: "EstateManager",
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createMockElement(id);
    return elements[id];
  },
  createElement: (tag) => createMockElement("el_" + Math.random().toString(36).slice(2, 7), tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  body: createMockElement("body")
};

const sandbox = {
  window: {},
  document: mockDoc,
  localStorage: mockLocalStorage,
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  alert: () => {},
  confirm: () => true,
  prompt: () => "",
  URL: {
    createObjectURL: () => "blob:mock-url",
    revokeObjectURL: () => {}
  },
  Blob: function (parts, opts) { this.parts = parts; this.opts = opts; }
};
sandbox.window = sandbox;
let domLoadedCb = null;
sandbox.window.addEventListener = (ev, cb) => {
  if (ev === "DOMContentLoaded") domLoadedCb = cb;
};

const scriptStart = htmlContent.indexOf("<script>");
const scriptEnd = htmlContent.indexOf("</script>", scriptStart);
const jsCode = htmlContent.slice(scriptStart + 8, scriptEnd);

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);
if (domLoadedCb) domLoadedCb();

// 3. Test Security Sanitization & Statutory Validators
const dirtyInput = `<script>alert("xss")</script>Hello <img src=x onerror="evil()"> javascript:void(0) World`;
const cleanOutput = sandbox.sanitizeInputString(dirtyInput);
assert.ok(!cleanOutput.includes("<script>"), "sanitizeInputString must remove <script> tags");
assert.ok(!cleanOutput.includes("onerror="), "sanitizeInputString must remove inline event handlers");
assert.ok(!cleanOutput.includes("javascript:"), "sanitizeInputString must remove javascript: protocol");
assert.ok(cleanOutput.includes("Hello") && cleanOutput.includes("World"), "sanitizeInputString must preserve legitimate text");

assert.strictEqual(sandbox.isValidIndianPan("ABCPS1234D"), true, "Valid PAN should pass");
assert.strictEqual(sandbox.isValidIndianPan("INVALID123"), false, "Invalid PAN should fail");
assert.strictEqual(sandbox.isValidIndianGstin("07AAAAA0000A1Z5"), true, "Valid 15-digit GSTIN should pass");
assert.strictEqual(sandbox.isValidIndianGstin("URP"), true, "Unregistered Person (URP) should pass");
assert.strictEqual(sandbox.isValidIndianGstin("99BADGSTIN"), false, "Invalid GSTIN should fail");

const weakPwd = sandbox.evaluatePasswordStrength("12345");
const strongPwd = sandbox.evaluatePasswordStrength("Estate#2026!Pro");
assert.ok(weakPwd.score < 25, "Short numeric password must be rated weak (< 25)");
assert.strictEqual(strongPwd.score, 100, "Mixed-case + digit + symbol 15-char password must score 100/100");

// Test password visibility toggle
const passInputEl = sandbox.document.getElementById("userFormPassword");
passInputEl.type = "password";
sandbox.togglePasswordVisibility("userFormPassword", "toggleUserFormPassBtn");
assert.strictEqual(passInputEl.type, "text", "togglePasswordVisibility should unmask password input to text");
sandbox.togglePasswordVisibility("userFormPassword", "toggleUserFormPassBtn");
assert.strictEqual(passInputEl.type, "password", "togglePasswordVisibility should re-mask password input to password");

// Test Security Posture Report
const secReport = sandbox.getSecurityPostureReport();
assert.strictEqual(secReport.grade, "A+", "Security Posture Report should achieve grade A+");
assert.strictEqual(secReport.scorePct, 100, "All 6 enterprise security checks must pass");
console.log("✓ 2. Security Engine: XSS sanitization, PAN/GSTIN validators, password strength/toggle, and A+ security posture verified");

// 4. Test Data Integrity & Self-Healing Engine
sandbox.state.properties.push(
  { id: "dup_prop_1", name: "Test Flat 101", rent: -500, deposit: "NaN_val", building: "" },
  { id: "dup_prop_1", name: "Duplicate Flat 101", rent: 15000, deposit: 30000, building: "Sagarpur" }
);
sandbox.state.tenants.push(
  { id: "dup_ten_1", name: "Test Tenant A", unit: "Test Flat 101", rent: "bad", osAmount: -200, status: "InvalidStatus" },
  { id: "dup_ten_1", name: "Duplicate Tenant A", unit: "Test Flat 101", rent: 12000, osAmount: 0, status: "Active" }
);

const repairReport = sandbox.validateAndRepairStateIntegrity();
assert.strictEqual(repairReport.valid, true, "Integrity report must return valid: true");
assert.ok(repairReport.issuesRepaired >= 5, "Self-healing engine must detect and repair duplicate IDs and invalid numeric/status fields");
const repairedProp = sandbox.state.properties.find((p) => p.id === "dup_prop_1");
assert.strictEqual(repairedProp.rent, 12000, "Negative rent should be normalized to default 12000");
assert.strictEqual(repairedProp.building, "Sagarpur", "Missing building should be normalized");
const repairedTen = sandbox.state.tenants.find((t) => t.id === "dup_ten_1");
assert.strictEqual(repairedTen.status, "Active", "Invalid status should be normalized to Active");
assert.strictEqual(repairedTen.osAmount, 0, "Negative osAmount should be normalized to 0");
console.log("✓ 3. Data Integrity Engine: Self-healing deduplication and field normalization verified");

// 5. Test Full-State Checksummed JSON Backup, Tamper Detection, Restore & Rollback
const propCountBefore = sandbox.state.properties.length;
const backupSnapshot = sandbox.exportDatabaseBackupJson();
assert.ok(backupSnapshot && backupSnapshot.checksum.startsWith("fnv1a_"), "Backup must include deterministic FNV-1a checksum");
assert.strictEqual(backupSnapshot.recordCounts.properties, propCountBefore, "Backup snapshot must record exact property count");

// Test tamper detection
const tamperedBackup = JSON.parse(JSON.stringify(backupSnapshot));
tamperedBackup.data.properties = [];
const tamperRes = sandbox.importDatabaseBackupJson(tamperedBackup);
assert.strictEqual(tamperRes.success, false, "Tampered backup with mismatched checksum must be rejected");
assert.ok(tamperRes.message.includes("Checksum verification failed"), "Rejection message must cite checksum mismatch");

// Test clean restore and automatic rollback
const reducedStateBackup = JSON.parse(JSON.stringify(backupSnapshot));
reducedStateBackup.data.properties = reducedStateBackup.data.properties.slice(0, 3);
reducedStateBackup.checksum = sandbox.computeBackupChecksum(JSON.stringify(reducedStateBackup.data));

const importRes = sandbox.importDatabaseBackupJson(JSON.stringify(reducedStateBackup));
assert.strictEqual(importRes.success, true, "Valid checksummed backup should import cleanly");
assert.strictEqual(sandbox.state.properties.length, 3, "State should reflect imported 3 properties");

// Test 1-click Rollback to pre-import state
const rollbackRes = sandbox.rollbackLastDatabaseImport();
assert.strictEqual(rollbackRes.success, true, "Rollback must succeed");
assert.strictEqual(sandbox.state.properties.length, propCountBefore, "Rollback must restore exact pre-import property count");
console.log("✓ 4. Data Backup & Restore Engine: Checksummed export, tamper rejection, restore, and 1-click rollback verified");

console.log("✅ ALL SENIOR SOFTWARE ENGINEER REVIEW ENHANCEMENT TESTS PASSED 100%!");
