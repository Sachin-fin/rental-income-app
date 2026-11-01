const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

// 1. DOM Element checks
assert(htmlContent.includes('id="tmB2bLogoContainer"'), "Tenant Master must have #tmB2bLogoContainer");
assert(htmlContent.includes('id="tmB2bLogoPreviewImg"'), "Tenant Master must have #tmB2bLogoPreviewImg");
assert(htmlContent.includes('id="tmB2bLogoPlaceholder"'), "Tenant Master must have #tmB2bLogoPlaceholder");
assert(htmlContent.includes('id="tmB2bLogoInput"'), "Tenant Master must have #tmB2bLogoInput file input");
assert(htmlContent.includes('id="tmB2bLogoRemoveBtn"'), "Tenant Master must have #tmB2bLogoRemoveBtn");
assert(htmlContent.includes('id="tmB2bLogoUploadTextBtn"'), "Tenant Master must have #tmB2bLogoUploadTextBtn");

assert(htmlContent.includes('id="modalTenantB2bLogoContainer"'), "Link Tenant modal must have #modalTenantB2bLogoContainer");
assert(htmlContent.includes('id="modalTenantB2bLogoPreviewImg"'), "Link Tenant modal must have #modalTenantB2bLogoPreviewImg");
assert(htmlContent.includes('id="modalTenantB2bLogoInput"'), "Link Tenant modal must have #modalTenantB2bLogoInput file input");
assert(htmlContent.includes('id="modalTenantB2bLogoRemoveBtn"'), "Link Tenant modal must have #modalTenantB2bLogoRemoveBtn");
assert(htmlContent.includes('id="modalTenantB2bLogoUploadBtn"'), "Link Tenant modal must have #modalTenantB2bLogoUploadBtn");

assert(htmlContent.includes('id="invRecipientLogoContainer"'), "Tax Invoice modal must have #invRecipientLogoContainer");
assert(htmlContent.includes('id="invRecipientLogoImg"'), "Tax Invoice modal must have #invRecipientLogoImg");
console.log("PASS 1: All B2B Commercial Tenant Logo DOM elements verified in index.html.");

// 2. Runtime Execution
const scriptMatches = [...htmlContent.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches[scriptMatches.length - 1][1];

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    const classes = new Set();
    const listeners = {};
    elements[id] = {
      id,
      value: "",
      src: "",
      checked: false,
      textContent: "",
      innerHTML: "",
      className: "",
      style: {},
      dataset: {},
      options: [],
      classList: {
        add: (...c) => c.forEach((x) => classes.add(x)),
        remove: (...c) => c.forEach((x) => classes.delete(x)),
        contains: (c) => classes.has(c),
        toggle: (c) => {
          if (classes.has(c)) { classes.delete(c); return false; }
          classes.add(c); return true;
        }
      },
      appendChild: () => {},
      addEventListener: (evt, fn) => {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      dispatchEvent: (evtObj) => {
        const list = listeners[evtObj.type] || [];
        list.forEach(fn => fn(evtObj));
      },
      removeEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      removeAttribute: () => {},
      click: () => {},
      focus: () => {},
      reset: () => {}
    };
  }
  return elements[id];
}

const sandbox = {
  window: null,
  addEventListener: (evt, fn) => {
    if (evt === "DOMContentLoaded") sandbox._domReady = fn;
  },
  document: {
    getElementById: (id) => getEl(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => getEl("created_" + tag + "_" + Math.random()),
    addEventListener: (evt, fn) => {
      if (evt === "DOMContentLoaded") sandbox._domReady = fn;
    },
    body: getEl("body")
  },
  localStorage: {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; }
  },
  navigator: { userAgent: "Node", clipboard: { writeText: async () => {} } },
  location: { origin: "https://rental-income.app", pathname: "/", search: "" },
  URLSearchParams,
  Blob: function () {},
  URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => {} },
  FileReader: function () {},
  confirm: () => true,
  prompt: () => "0",
  alert: () => {},
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  console
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mainScript, sandbox);
if (sandbox._domReady) sandbox._domReady();

// 3. Test B2B Logo UI preview helper
const sampleLogoDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

sandbox.updateB2bLogoPreviewUI("tmB2bLogoContainer", "tmB2bLogoPreviewImg", "tmB2bLogoPlaceholder", "tmB2bLogoRemoveBtn", "tmB2bLogoUploadTextBtn", sampleLogoDataUrl);
assert.strictEqual(getEl("tmB2bLogoPreviewImg").src, sampleLogoDataUrl, "Preview img src should match sample logo");
assert.strictEqual(getEl("tmB2bLogoPreviewImg").classList.contains("hidden"), false, "Preview img must be visible");
assert.strictEqual(getEl("tmB2bLogoPlaceholder").classList.contains("hidden"), true, "Placeholder must be hidden when logo is present");
assert.strictEqual(getEl("tmB2bLogoRemoveBtn").classList.contains("hidden"), false, "Remove button must be visible when logo is present");

sandbox.updateB2bLogoPreviewUI("tmB2bLogoContainer", "tmB2bLogoPreviewImg", "tmB2bLogoPlaceholder", "tmB2bLogoRemoveBtn", "tmB2bLogoUploadTextBtn", null);
assert.strictEqual(getEl("tmB2bLogoPreviewImg").classList.contains("hidden"), true, "Preview img must be hidden when logo is null");
assert.strictEqual(getEl("tmB2bLogoPlaceholder").classList.contains("hidden"), false, "Placeholder must be visible when logo is null");
assert.strictEqual(getEl("tmB2bLogoRemoveBtn").classList.contains("hidden"), true, "Remove button must be hidden when logo is null");
console.log("PASS 2: updateB2bLogoPreviewUI helper function toggles preview, placeholder, and remove button accurately.");

// 4. Test Registration of a B2B Commercial Tenant with Logo
sandbox.setCurrentTmB2bLogo(sampleLogoDataUrl);
assert.strictEqual(sandbox.getCurrentTmB2bLogo(), sampleLogoDataUrl, "getCurrentTmB2bLogo must return attached logo");

const tmForm = getEl("addTenantMasterForm");
getEl("tmNameInput").value = "Pooja Singhania";
getEl("tmMobileInput").value = "9811223344";
getEl("tmEmailInput").value = "pooja@singhanialuxury.com";
getEl("tmUnitSelect").value = "Unit 301, Premium Tower";
getEl("tmRentInput").value = "250000";
getEl("tmStartDateInput").value = "2026-08-01";
getEl("tmRentStartDateInput").value = "2026-10-15";
getEl("tmEndDateInput").value = "2029-07-31";
getEl("tmIsB2bCheckbox").checked = true;
getEl("tmBusinessNameInput").value = "Singhania Luxury Brands Pvt Ltd";
getEl("tmGstinInput").value = "07AAACS9988D1Z2";
getEl("tmB2bPanInput").value = "AAACS9988D";
getEl("tmBillingAddressInput").value = "3rd Floor, Saket District Centre, New Delhi";

tmForm.dispatchEvent({ type: "submit", preventDefault: () => {} });

const b2bTenantWithLogo = sandbox.state.tenants.find((t) => t.gstin === "07AAACS9988D1Z2");
assert(b2bTenantWithLogo, "Tenant with B2B Logo must be saved in state.tenants");
assert.strictEqual(b2bTenantWithLogo.b2bLogo, sampleLogoDataUrl, "tenant.b2bLogo must match uploaded logo DataURL");
console.log("PASS 3: B2B Commercial Tenant registration saves and persists tenant.b2bLogo.");

// 5. Test Tax Invoice generation incorporates tenantLogo
const inv = sandbox.generateGstInvoiceForTenant(b2bTenantWithLogo.id, "Oct 2026", true);
assert(inv, "GST Invoice must be generated");
assert.strictEqual(inv.tenantLogo, sampleLogoDataUrl, "Invoice must record tenantLogo from tenant.b2bLogo");

// 6. Test openGstInvoiceModal displays Recipient Logo
sandbox.openGstInvoiceModal(inv.id);
const recipLogoContainer = getEl("invRecipientLogoContainer");
const recipLogoImg = getEl("invRecipientLogoImg");
assert.strictEqual(recipLogoContainer.classList.contains("hidden"), false, "Recipient logo container must be visible in Invoice Modal");
assert.strictEqual(recipLogoImg.src, sampleLogoDataUrl, "Recipient logo img src must match tenant brand logo");
console.log("PASS 4: GST Tax Invoice Modal populates and displays Commercial Tenant Brand Logo.");

// 7. Test Tab 8 Rental Schedules includes b2bLogo in schedule object
const sched = sandbox.generateTenantRentalSchedule(b2bTenantWithLogo);
assert(sched, "Rental schedule must generate");
assert.strictEqual(sched.b2bLogo, sampleLogoDataUrl, "Rental schedule object must include b2bLogo");
console.log("PASS 5: Tab 8 Rental Schedule incorporates tenant.b2bLogo for card branding.");

console.log("\n🎉 ALL B2B COMMERCIAL TENANT LOGO TESTS PASSED 100%!");
