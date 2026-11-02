// tests/test_gst_register_all_months_search.js
// Automated verification suite for:
// 1. Showing all month invoices in GST register tab ("all" option in gstMonthSelect)
// 2. Search Tabs: All, Tenant, Property modes
// 3. Filtering by tenant name and property name
// 4. Property dropdown filter (#gstPropertyFilter)
// 5. Search clear button (#gstInvoiceSearchClearBtn)

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing GST Register All Months & Tenant/Property Search ===");

const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. Verify required DOM element IDs exist in index.html
const requiredIds = [
  "gstMonthSelect",
  "gstRegisterMonthBadge",
  "gstSearchTabGroup",
  "gstSearchTabAll",
  "gstSearchTabTenant",
  "gstSearchTabProperty",
  "gstInvoiceSearchInput",
  "gstInvoiceSearchClearBtn",
  "gstPropertyFilter",
  "gstStatusFilter",
  "gstInvoicesTableBody",
  "gstCardsViewContainer"
];

requiredIds.forEach((id) => {
  assert.ok(htmlContent.includes(`id="${id}"`), `Missing required ID in index.html: "${id}"`);
  console.log(`✓ #${id} exists in index.html`);
});

// 2. Verify "all" option exists in #gstMonthSelect
assert.ok(
  htmlContent.includes('<option value="all" selected>All Months</option>') ||
  htmlContent.includes('<option value="all">All Months</option>'),
  'gstMonthSelect must contain "all" option for All Months'
);
console.log('✓ gstMonthSelect contains All Months option!');

// 3. Verify placeholder includes tenant or property name
assert.ok(
  htmlContent.includes('placeholder="Search tenant or property name..."'),
  'gstInvoiceSearchInput placeholder must prompt for tenant or property name'
);
console.log('✓ Search input placeholder verified: "Search tenant or property name..."');

// 4. Test logic in isolated VM sandbox
const mockStorage = {};
const mockElements = new Map();

function createMockEl(id = '', tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: id === 'gstMonthSelect' ? 'all' : (id === 'gstPropertyFilter' ? 'all' : (id === 'gstStatusFilter' ? 'all' : '')),
    textContent: '',
    href: '',
    dataset: {},
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    style: {},
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    addEventListener: function(evt, handler) { this._handler = handler; },
    querySelectorAll: function() { return []; },
    focus: function() {}
  };
  let _innerHTML = '';
  Object.defineProperty(el, 'innerHTML', {
    get: function() { return _innerHTML; },
    set: function(val) {
      _innerHTML = val;
      if (val === '') this.children = [];
    }
  });
  return el;
}

const sandbox = {
  console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  scrollTo: () => {},
  location: {
    origin: 'https://rental-income.app',
    pathname: '/',
    search: '',
    href: 'https://rental-income.app/'
  },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
  },
  document: {
    getElementById: (id) => {
      if (!mockElements.has(id)) {
        mockElements.set(id, createMockEl(id));
      }
      return mockElements.get(id);
    },
    querySelectorAll: () => [],
    querySelector: () => createMockEl('dummy'),
    createElement: (tag) => createMockEl('', tag),
    body: createMockEl('body', 'body')
  },
  window: {}
};

sandbox.window = sandbox;

// Extract main script
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let mainScript = '';
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  if (match[1].length > 10000) {
    mainScript = match[1];
    break;
  }
}

const ctx = vm.createContext(sandbox);

// Provide minimal seed state required by script execution
vm.runInContext(`
  function escapeHtml(s) { return String(s || ""); }
  function formatINR(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  function showFeedback() {}
  function switchTab() {}

  var state = {
    landlord: {
      name: 'Rajesh Sharma',
      pan: 'ABCPS1234D',
      email: 'abcltd9925@gmail.com',
      phone: '+91 98110 02233',
      gstin: '07AAAAA0000A1Z5',
      state: '07 - Delhi',
      sacCode: '997212',
      upiId: 'rajesh.sharma@upi',
      gstEnabled: true,
      gstRate: 18
    },
    properties: [
      { id: 'p1', name: 'Flat 101', building: 'Sagarpur Complex', address: 'Sagarpur, New Delhi', rent: 15000 },
      { id: 'p2', name: 'Flat 102', building: 'Green Villa Towers', address: 'Dwarka, New Delhi', rent: 20000 }
    ],
    tenants: [
      { id: 't1', name: 'Rahul Sharma', unit: 'Flat 101', propertyId: 'p1', propertyName: 'Flat 101', building: 'Sagarpur Complex', rent: 15000, phone: '9876543210', mobile: '9876543210', email: 'rahul@example.com', startDate: '2026-04-01' },
      { id: 't2', name: 'Pooja Verma', unit: 'Flat 102', propertyId: 'p2', propertyName: 'Flat 102', building: 'Green Villa Towers', rent: 20000, phone: '9811223344', mobile: '9811223344', email: 'pooja@example.com', startDate: '2026-04-01' }
    ],
    gstInvoices: {},
    gstSearchMode: 'all'
  };
`, ctx);

// Extract the GST engine code
const startIdx = mainScript.indexOf("const STORAGE_KEY_GST =");
const endIdx = mainScript.indexOf("// --- INITIAL BOOTSTRAP ---", startIdx);
const engineCode = mainScript.substring(startIdx, endIdx);

vm.runInContext(engineCode, ctx);

// Test A: Auto-generate invoices for "all" months
console.log("\n--- Testing 'all' months invoice generation ---");
const countCreated = vm.runInContext("autoCheckAndGenerateMonthlyGstInvoices('all')", ctx);
console.log(`Generated invoices across all FY months: ${countCreated}`);
assert.ok(countCreated > 0, "Should generate invoices across past FY cycles");

// Check state.gstInvoices has both Oct 2026 and Nov 2026 for tenants
const invOctT1 = vm.runInContext("state.gstInvoices['inv_oct_2026_t1']", ctx);
const invNovT1 = vm.runInContext("state.gstInvoices['inv_nov_2026_t1']", ctx);
assert.ok(invOctT1, "Oct 2026 invoice must exist");
assert.ok(invNovT1, "Nov 2026 invoice must exist");
console.log("✓ Invoices exist for both Oct 2026 and Nov 2026!");

// Test B: renderGstTab('all') displays all months
console.log("\n--- Testing renderGstTab('all') ---");
vm.runInContext("renderGstTab('all')", ctx);
const badgeEl = sandbox.document.getElementById("gstRegisterMonthBadge");
assert.strictEqual(badgeEl.textContent, "All Months", "Register badge should show All Months");
const tbodyEl = sandbox.document.getElementById("gstInvoicesTableBody");
assert.ok(tbodyEl.children.length > 2, `Should render multiple month invoices in table (rendered ${tbodyEl.children.length})`);
console.log(`✓ renderGstTab('all') rendered ${tbodyEl.children.length} invoices across all months!`);

// Test C: Search by Tenant Name "Rahul"
console.log("\n--- Testing Search Filter by Tenant Name 'Rahul' ---");
sandbox.document.getElementById("gstInvoiceSearchInput").value = "Rahul";
sandbox.document.getElementById("gstPropertyFilter").value = "all";
vm.runInContext("state.gstSearchMode = 'all'; renderGstTab('all');", ctx);
// All rendered rows should match Rahul Sharma
tbodyEl.children.forEach((tr) => {
  assert.ok(tr.innerHTML.includes("Rahul Sharma"), "Row should match tenant Rahul Sharma");
  assert.ok(!tr.innerHTML.includes("Pooja Verma"), "Row should NOT contain Pooja Verma");
});
console.log("✓ Search by Tenant Name 'Rahul' successfully filters invoices!");

// Test D: Search by Property Name "Green Villa"
console.log("\n--- Testing Search Filter by Property Name 'Green Villa' ---");
sandbox.document.getElementById("gstInvoiceSearchInput").value = "Green Villa";
vm.runInContext("state.gstSearchMode = 'all'; renderGstTab('all');", ctx);
tbodyEl.children.forEach((tr) => {
  assert.ok(tr.innerHTML.includes("Green Villa"), "Row should match property Green Villa");
  assert.ok(!tr.innerHTML.includes("Sagarpur Complex"), "Row should NOT contain Sagarpur Complex");
});
console.log("✓ Search by Property Name 'Green Villa' successfully filters invoices!");

// Test E: Search Tab Mode 'tenant' vs 'property'
console.log("\n--- Testing Search Tab Modes ('tenant' vs 'property') ---");
// Under 'tenant' mode, searching 'Green Villa' (a property name) should return 0 results
sandbox.document.getElementById("gstInvoiceSearchInput").value = "Green Villa";
vm.runInContext("state.gstSearchMode = 'tenant'; renderGstTab('all');", ctx);
assert.ok(tbodyEl.innerHTML.includes("No invoices match the selected search or filter"), "Tenant-only search should not match property name");
console.log("✓ 'tenant' search tab mode correctly isolates tenant search!");

// Under 'property' mode, searching 'Green Villa' should match
vm.runInContext("state.gstSearchMode = 'property'; renderGstTab('all');", ctx);
assert.ok(tbodyEl.children.length > 0, "Property search tab mode should find Green Villa invoices");
console.log("✓ 'property' search tab mode correctly matches property name!");

// Test F: Property Dropdown Filter (#gstPropertyFilter)
console.log("\n--- Testing Property Dropdown Filter ---");
sandbox.document.getElementById("gstInvoiceSearchInput").value = "";
sandbox.document.getElementById("gstPropertyFilter").value = "Sagarpur Complex";
vm.runInContext("state.gstSearchMode = 'all'; renderGstTab('all');", ctx);
tbodyEl.children.forEach((tr) => {
  assert.ok(tr.innerHTML.includes("Sagarpur Complex"), "Row should belong to Sagarpur Complex");
});
console.log("✓ Property dropdown filter successfully filters by property!");

console.log("\n=======================================================");
console.log("🎉 ALL GST REGISTER ALL MONTHS & SEARCH TESTS PASSED 100%!");
console.log("=======================================================\n");
