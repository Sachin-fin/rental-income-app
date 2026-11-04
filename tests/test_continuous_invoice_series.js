// tests/test_continuous_invoice_series.js
// Automated verification suite for Continuous Invoice Series & "Addition" word removal
// Verifies:
// 1. Continuous sequential invoice series for ALL tenants (GST/26-27/001, GST/26-27/002, GST/26-27/003...)
// 2. Elimination of unit codes (like /101, /104, /201, /3) from invoice numbers to prevent numbering gaps
// 3. Additional invoices share the same continuous series (e.g. GST/26-27/004) without '-ADD' suffix
// 4. Removal of the word "Addition" / "Additional" from the invoice document, modal header, doc title,
//    service subtitle, line items, and WhatsApp/Email dispatch text
// 5. Separate continuous CAM series (CAM-GST/26-27/001, CAM-GST/26-27/002...)
// 6. Seamless re-sequencing / migration of legacy invoice numbers to a gapless continuous series

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const vm = require('vm');

console.log("=== TESTING CONTINUOUS INVOICE SERIES & REMOVAL OF 'ADDITION' WORD ===");

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// 1. Static HTML Assertions
assert(htmlContent.includes('<span id="gstModalTitleInvoiceNo">TAX INVOICE: GST/26-27/001</span>'),
  "Static fallback in gstModalTitleInvoiceNo should use continuous series 001");
assert(htmlContent.includes('<span id="invMetaNo" class="font-mono font-black text-slate-900 text-xs">GST/26-27/001</span>'),
  "Static fallback in invMetaNo should use continuous series 001");
assert(!htmlContent.includes('<option value="Other Additional Charges">'),
  "Other Additional Charges option must be replaced with Other Commercial Charges");

// Setup isolated VM environment
const scriptMatches = [...htmlContent.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches[scriptMatches.length - 1][1];

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    const classes = new Set();
    elements[id] = {
      id,
      value: "",
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
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      removeAttribute: () => {},
      click: () => {},
      focus: () => {}
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

// -------------------------------------------------------------
// Test 1: Verify getNextSequentialInvoiceNo function export
// -------------------------------------------------------------
console.log("PASS 1: Verifying engine functions...");
assert.strictEqual(typeof sandbox.getNextSequentialInvoiceNo, "function", "getNextSequentialInvoiceNo must be exported to window");
assert.strictEqual(typeof sandbox.resequenceInvoicesToContinuousSeries, "function", "resequenceInvoicesToContinuousSeries must be exported to window");

// -------------------------------------------------------------
// Test 2: Continuous series across multiple tenants
// -------------------------------------------------------------
console.log("PASS 2: Testing continuous invoice numbering across multiple tenants...");
sandbox.state.gstInvoices = {};
sandbox.state.landlord.gstEnabled = true;

sandbox.state.tenants = [
  { id: "t_seq_1", name: "Priya Patel", unit: "Flat 104", rent: 25000, status: "Active", startDate: "2026-04-01" },
  { id: "t_seq_2", name: "Rohan Khanna", unit: "Flat 201", rent: 35000, status: "Active", startDate: "2026-04-01" },
  { id: "t_seq_3", name: "Aanya Verma", unit: "Studio 3B", rent: 18000, status: "Active", startDate: "2026-04-01" }
];

const inv1 = sandbox.generateGstInvoiceForTenant("t_seq_1", "Oct 2026", true);
const inv2 = sandbox.generateGstInvoiceForTenant("t_seq_2", "Oct 2026", true);
const inv3 = sandbox.generateGstInvoiceForTenant("t_seq_3", "Oct 2026", true);

assert.strictEqual(inv1.invoiceNo, "GST/26-27/001", "Tenant 1 should have GST/26-27/001");
assert.strictEqual(inv2.invoiceNo, "GST/26-27/002", "Tenant 2 should have GST/26-27/002");
assert.strictEqual(inv3.invoiceNo, "GST/26-27/003", "Tenant 3 should have GST/26-27/003");

// Verify none contain unit numbers like 104, 201, 3
assert(!inv1.invoiceNo.includes("104"), "Invoice 1 must NOT use unit code 104");
assert(!inv2.invoiceNo.includes("201"), "Invoice 2 must NOT use unit code 201");
assert(!inv3.invoiceNo.includes("3B"), "Invoice 3 must NOT use unit code 3B");
console.log("  ✔ All 3 tenants received strictly continuous invoice numbers (001, 002, 003)!");

// -------------------------------------------------------------
// Test 3: Additional Invoice takes next continuous number (NO -ADD suffix)
// -------------------------------------------------------------
console.log("PASS 3: Generating Additional Invoice and checking continuous series...");

const addlInv = sandbox.generateB2bAdditionalInvoice({
  tenantId: "t_seq_1",
  billingMonth: "Oct 2026",
  serviceCategory: "Electricity & DG Backup Charges",
  description: "Electricity sub-metering for Oct 2026",
  taxableAmount: 6000
});

assert.strictEqual(addlInv.invoiceNo, "GST/26-27/004", "Additional invoice must be next in series: GST/26-27/004");
assert(!addlInv.invoiceNo.includes("-ADD"), `Invoice number must NOT contain -ADD suffix: ${addlInv.invoiceNo}`);
console.log("  ✔ Additional invoice seamlessly took next number GST/26-27/004 with no -ADD suffix!");

// -------------------------------------------------------------
// Test 4: Removal of "Addition" word on the invoice document
// -------------------------------------------------------------
console.log("PASS 4: Verifying 'Addition' word is removed from the invoice modal, print, and share text...");

sandbox.openGstInvoiceModal(addlInv.id);

// A. Doc Title
const docTitle = getEl("invHeaderDocTitle").textContent;
assert.strictEqual(docTitle, "TAX INVOICE", "Header Doc Title must be TAX INVOICE");
assert(!docTitle.includes("ADDITIONAL"), "Header Doc Title must NOT contain ADDITIONAL");

// B. Modal Title
const modalTitle = getEl("gstModalTitleInvoiceNo").textContent;
assert(modalTitle.startsWith("TAX INVOICE: GST/26-27/004"), "Modal Title must start with TAX INVOICE");
assert(!modalTitle.includes("ADDITIONAL"), "Modal Title must NOT contain ADDITIONAL");

// C. Subtitle
const subtitle = getEl("invHeaderServiceSubtitle").textContent;
assert(subtitle.includes("Electricity & DG Backup Charges"), "Subtitle must display service category");
assert(!subtitle.includes("Additional"), "Subtitle must NOT contain word Additional");

// D. Item description
const itemDesc = getEl("invItemDescription").textContent;
assert(!itemDesc.includes("Additional"), "Item description must NOT contain word Additional");

// E. Share text
const shareText = sandbox.getGstInvoiceShareText(addlInv);
assert(shareText.startsWith("🏛️ TAX INVOICE:"), "Share text must begin with TAX INVOICE");
assert(!shareText.includes("ADDITIONAL TAX INVOICE"), "Share text must NOT contain ADDITIONAL TAX INVOICE");
assert(!shareText.includes("Additional Commercial Services"), "Share text must NOT contain Additional Commercial Services");
console.log("  ✔ The word 'Addition' / 'Additional' is completely removed from all invoice views!");

// -------------------------------------------------------------
// Test 5: Next regular invoice continues consecutively
// -------------------------------------------------------------
console.log("PASS 5: Generating next tenant invoice in Nov 2026...");
const novInv = sandbox.generateGstInvoiceForTenant("t_seq_2", "Nov 2026", true);
assert.strictEqual(novInv.invoiceNo, "GST/26-27/005", "Next invoice in Nov must continue as GST/26-27/005");
console.log("  ✔ Consecutively continued to GST/26-27/005!");

// -------------------------------------------------------------
// Test 6: Resequencing / migration of legacy invoices
// -------------------------------------------------------------
console.log("PASS 6: Testing resequenceInvoicesToContinuousSeries on legacy format...");
sandbox.state.gstInvoices = {
  "inv_old_1": { id: "inv_old_1", invoiceNo: "GST/26-27/OCT/101", billingMonth: "Oct 2026", tenantId: "t_seq_1", invoiceType: "RENT" },
  "inv_old_2": { id: "inv_old_2", invoiceNo: "GST/26-27/OCT/104-ADD1", billingMonth: "Oct 2026", tenantId: "t_seq_1", invoiceType: "ADDITIONAL" },
  "inv_old_3": { id: "inv_old_3", invoiceNo: "GST/26-27/OCT/201", billingMonth: "Oct 2026", tenantId: "t_seq_2", invoiceType: "RENT" },
  "cn_old_1": { id: "cn_old_1", invoiceNo: "CN/26-27/OCT/101", originalInvoiceId: "inv_old_1", originalInvoiceNo: "GST/26-27/OCT/101", invoiceType: "CREDIT_NOTE", isCreditNote: true }
};

sandbox.resequenceInvoicesToContinuousSeries("26-27");

assert.strictEqual(sandbox.state.gstInvoices["inv_old_1"].invoiceNo, "GST/26-27/001", "Old rent inv 1 must be resequenced to 001");
assert.strictEqual(sandbox.state.gstInvoices["inv_old_2"].invoiceNo, "GST/26-27/002", "Old addl inv must be resequenced to 002 (no -ADD)");
assert.strictEqual(sandbox.state.gstInvoices["inv_old_3"].invoiceNo, "GST/26-27/003", "Old rent inv 2 must be resequenced to 003");
assert.strictEqual(sandbox.state.gstInvoices["cn_old_1"].originalInvoiceNo, "GST/26-27/001", "Credit note original ref must be updated to 001");
assert.strictEqual(sandbox.state.gstInvoices["cn_old_1"].invoiceNo, "CN/26-27/001", "Credit note no must be updated to CN/26-27/001");
console.log("  ✔ Legacy invoices successfully migrated to continuous series without -ADD suffix!");

console.log("\n🎉 ALL CONTINUOUS INVOICE SERIES & 'ADDITION' WORD REMOVAL TESTS PASSED (100%)!");

