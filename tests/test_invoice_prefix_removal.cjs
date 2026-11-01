const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

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

console.log("=== INVOICE PREFIX 'BILL/' REMOVAL TEST SUITE ===");

// Test 1: sanitizeInvoiceNo helper
assert.strictEqual(typeof sandbox.sanitizeInvoiceNo, "function", "sanitizeInvoiceNo must be exported to window");
assert.strictEqual(sandbox.sanitizeInvoiceNo("BILL/26-27/OCT/101"), "26-27/OCT/101", "BILL/ prefix must be removed");
assert.strictEqual(sandbox.sanitizeInvoiceNo("CAM-BILL/26-27/OCT/101"), "CAM/26-27/OCT/101", "CAM-BILL/ prefix must be converted to CAM/");
assert.strictEqual(sandbox.sanitizeInvoiceNo("GST/26-27/OCT/101"), "GST/26-27/OCT/101", "GST/ prefix must be preserved");
assert.strictEqual(sandbox.sanitizeInvoiceNo("CAM-GST/26-27/OCT/101"), "CAM-GST/26-27/OCT/101", "CAM-GST/ prefix must be preserved");
console.log("PASS 1: sanitizeInvoiceNo correctly strips 'BILL/' and preserves GST prefixes");

// Test 2: generateGstInvoiceForTenant when GST is disabled (gstEnabled = false)
sandbox.state.landlord.gstEnabled = false;
sandbox.state.tenants = [{
  id: "t_nobill_1",
  name: "Vikram Malhotra",
  unit: "Unit 105",
  rent: 50000,
  status: "Active"
}];

const nonGstInv = sandbox.generateGstInvoiceForTenant("t_nobill_1", "Oct 2026", true);
assert(nonGstInv, "Invoice should be generated");
assert(!nonGstInv.invoiceNo.startsWith("BILL/"), "Invoice number must NOT start with 'BILL/'. Actual: " + nonGstInv.invoiceNo);
assert(nonGstInv.invoiceNo.includes("26-27/OCT/105"), "Invoice number should contain fiscal year, month and unit: " + nonGstInv.invoiceNo);
assert.strictEqual(nonGstInv.invoiceNo, "26-27/OCT/105", "Invoice number must be '26-27/OCT/105' without 'BILL/' prefix");
console.log("PASS 2: When GST is disabled, rent invoiceNo is '" + nonGstInv.invoiceNo + "' (without 'BILL/' prefix)");

// Test 3: generateCamInvoiceForTenant when GST is disabled (gstEnabled = false)
sandbox.state.tenants = [{
  id: "t_nobill_cam",
  name: "Vikram Retail Pvt Ltd",
  unit: "Shop 204",
  rent: 80000,
  camAmount: 15000,
  autoBillCamSeparateInvoice: true,
  status: "Active"
}];

const nonGstCam = sandbox.generateCamInvoiceForTenant("t_nobill_cam", "Oct 2026", true);
assert(nonGstCam, "CAM Invoice should be generated");
assert(!nonGstCam.invoiceNo.startsWith("CAM-BILL/"), "CAM Invoice number must NOT start with 'CAM-BILL/'. Actual: " + nonGstCam.invoiceNo);
assert(nonGstCam.invoiceNo.startsWith("CAM/"), "CAM Invoice number should start with 'CAM/'. Actual: " + nonGstCam.invoiceNo);
assert.strictEqual(nonGstCam.invoiceNo, "CAM/26-27/OCT/204", "CAM Invoice number must be 'CAM/26-27/OCT/204'");
console.log("PASS 3: When GST is disabled, CAM invoiceNo is '" + nonGstCam.invoiceNo + "' (without 'BILL/' prefix)");

// Test 4: generateGstInvoiceForTenant when GST is enabled (gstEnabled = true)
sandbox.state.landlord.gstEnabled = true;
sandbox.state.tenants.push({
  id: "t_nobill_gst",
  name: "Vikram Malhotra",
  unit: "Unit 105",
  rent: 50000,
  status: "Active"
});
const gstInv = sandbox.generateGstInvoiceForTenant("t_nobill_gst", "Oct 2026", true);
assert(gstInv, "GST Invoice should be generated");
assert(gstInv.invoiceNo.startsWith("GST/"), "GST Invoice should start with 'GST/'. Actual: " + gstInv.invoiceNo);
assert(!gstInv.invoiceNo.includes("BILL"), "GST Invoice must not contain 'BILL'");
assert.strictEqual(gstInv.invoiceNo, "GST/26-27/OCT/105", "GST Invoice number must be 'GST/26-27/OCT/105'");
console.log("PASS 4: When GST is enabled, rent invoiceNo starts with 'GST/' ('" + gstInv.invoiceNo + "')");

console.log("\n🎉 ALL INVOICE PREFIX 'BILL/' REMOVAL TESTS PASSED 100%!");
