// tests/test_b2b_additional_invoice_and_credit_note.js
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

console.log("=== B2B ADDITIONAL INVOICE & CREDIT NOTE TEST SUITE ===");

const htmlPath = path.join(__dirname, "..", "index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// -------------------------------------------------------------
// Test 1: DOM Verification in index.html
// -------------------------------------------------------------
console.log("PASS 1: Verifying B2B Billing & Credit Note DOM elements in index.html...");

const requiredElements = [
  "gstModalCreditNoteBtn",
  "gstModalAddlInvoiceBtn",
  "gstOpenB2bBillingModalBtn",
  "b2bBillingActionModal",
  "closeB2bBillingModalBtn",
  "b2bTabBtnAddlInvoice",
  "b2bTabBtnCreditNote",
  "b2bBillingTenantSelect",
  "b2bTenantDetailsStrip",
  "b2bPanelAddlInvoice",
  "b2bAddlMonthSelect",
  "b2bAddlCategorySelect",
  "b2bAddlDescriptionInput",
  "b2bAddlSacInput",
  "b2bAddlTaxableInput",
  "b2bAddlCalcTaxable",
  "b2bAddlCalcCgst",
  "b2bAddlCalcSgst",
  "b2bAddlCalcTotal",
  "b2bSubmitAddlInvoiceBtn",
  "b2bPanelCreditNote",
  "b2bCnOriginalInvoiceSelect",
  "b2bCnReasonSelect",
  "b2bCnRemarksInput",
  "b2bCnTaxableInput",
  "b2bCnCalcTaxable",
  "b2bCnCalcCgst",
  "b2bCnCalcSgst",
  "b2bCnCalcTotal",
  "b2bSubmitCreditNoteBtn"
];

requiredElements.forEach((id) => {
  assert(htmlContent.includes(`id="${id}"`), `DOM element #${id} must exist in index.html`);
});

// Check Tenant Master B2B action buttons
assert(htmlContent.includes('data-action="tm-addl-invoice"'), "Tenant Master must have tm-addl-invoice action button");
assert(htmlContent.includes('data-action="tm-credit-note"'), "Tenant Master must have tm-credit-note action button");

console.log("  ✔ All 30 required DOM elements and action buttons verified in index.html!");

// -------------------------------------------------------------
// Test 2: Execution in Isolated VM
// -------------------------------------------------------------
console.log("PASS 2: Testing B2B Additional Invoice and Credit Note Engine in isolated VM...");

const scriptMatches = [...htmlContent.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches[scriptMatches.length - 1][1];

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    const classes = new Set();
    if (id === "b2bBillingActionModal" || id === "b2bPanelCreditNote" || id === "invEscalationBanner" || id === "gstModalCreditNoteBtn" || id === "gstModalAddlInvoiceBtn") {
      classes.add("hidden");
    }
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
      selectedIndex: 0,
      listeners: {},
      classList: {
        add: (...c) => c.forEach((x) => classes.add(x)),
        remove: (...c) => c.forEach((x) => classes.delete(x)),
        contains: (c) => classes.has(c),
        toggle: (c) => {
          if (classes.has(c)) {
            classes.delete(c);
            return false;
          }
          classes.add(c);
          return true;
        }
      },
      addEventListener(evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      dispatchEvent(evtObj) {
        const list = this.listeners[evtObj.type] || [];
        list.forEach((fn) => fn(evtObj));
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild(child) {
        this.options = this.options || [];
        this.options.push(child);
        this.children = this.children || [];
        this.children.push(child);
        if (child && child.innerHTML) {
          this.innerHTML += child.innerHTML;
        }
      },
      scrollIntoView: () => { },
      focus: () => { },
      reset() { }
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
    createElement: (tag) => {
      const el = getEl("created_" + tag + "_" + Math.random().toString(36).slice(2));
      el.tagName = tag.toUpperCase();
      return el;
    },
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
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  location: { href: "https://rental-income.app/", search: "", origin: "https://rental-income.app", pathname: "/" },
  history: { replaceState: () => { } },
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Date,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  JSON,
  RegExp
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mainScript, sandbox);
if (sandbox._domReady) sandbox._domReady();
sandbox.state = sandbox.state || {};

// Setup mock Landlord profile
sandbox.state.landlord = {
  name: "Rajesh Sharma",
  tradeName: "Sharma Commercial Properties",
  gstin: "07AAAAA0000A1Z5",
  pan: "ABCPS1234D",
  state: "07 - Delhi",
  sacCode: "997212",
  upiId: "rajesh.sharma@upi",
  gstEnabled: true,
  gstRate: 18
};

const b2bTenant = {
  id: "ten_retail_corp",
  name: "Sunil Verma",
  businessName: "RetailCorp Logistics India Pvt Ltd",
  isB2B: true,
  gstin: "07AAACR1234F1Z5",
  pan: "AAACR1234F",
  billingAddress: "Unit 302, Cyber Tower, Sector 62, Gurugram, Haryana - 122002",
  unit: "Shop 101, Cyber City Mall",
  startDate: "2026-06-01",
  rentStartDate: "2026-06-01",
  baseRent: 50000,
  areaSqFt: 1000,
  camRatePerSqFt: 10,
  mobile: "9810112233",
  email: "billing@retailcorp.in"
};

sandbox.state.tenants = [b2bTenant];
sandbox.state.properties = [
  { id: "prop_101", name: "Shop 101, Cyber City Mall", building: "Cyber City Mall", unit: "Shop 101" }
];

// Generate standard monthly rent invoice for Nov 2026
const rentInv = sandbox.generateGstInvoiceForTenant("ten_retail_corp", "Nov 2026", true);
assert.ok(rentInv, "Monthly rent invoice must be created");
assert.strictEqual(rentInv.taxableRent, 50000);
assert.strictEqual(rentInv.totalAmount, 59000); // 50000 + 18% GST

// -------------------------------------------------------------
// Test 3: Generate B2B Additional Tax Invoice
// -------------------------------------------------------------
console.log("PASS 3: Generating B2B Additional Tax Invoice (Electricity / DG Backup)...");

const addlInv = sandbox.generateB2bAdditionalInvoice({
  tenantId: "ten_retail_corp",
  billingMonth: "Nov 2026",
  serviceCategory: "Electricity & DG Backup Charges",
  description: "DG Power Backup & Sub-metered Electricity for Nov 2026 (1,250 Units @ ₹8/Unit)",
  sacCode: "997212",
  taxableAmount: 10000,
  remarks: "Sub-meter reading: 4520 to 5770"
});

assert.ok(addlInv, "Additional invoice must be generated");
assert.strictEqual(addlInv.invoiceType, "ADDITIONAL");
assert.strictEqual(addlInv.serviceCategory, "Electricity & DG Backup Charges");
assert.strictEqual(addlInv.taxableRent, 10000);
assert.strictEqual(addlInv.cgstAmount, 900); // 9%
assert.strictEqual(addlInv.sgstAmount, 900); // 9%
assert.strictEqual(addlInv.totalAmount, 11800); // 10000 + 1800
// Continuous series: Must NOT contain -ADD suffix and must follow continuous sequence
assert(!addlInv.invoiceNo.includes("-ADD"), `Invoice number must NOT have -ADD suffix: ${addlInv.invoiceNo}`);
assert(addlInv.invoiceNo.startsWith("GST/26-27/"), `Invoice number must start with GST/26-27/: ${addlInv.invoiceNo}`);
assert.strictEqual(addlInv.invoiceNo, "GST/26-27/002", `Invoice number must be next in continuous series 'GST/26-27/002'`);

// Verify display in modal: The word "Addition" / "Additional" must be removed from the invoice
sandbox.openGstInvoiceModal(addlInv.id);
assert.strictEqual(getEl("invHeaderDocTitle").textContent, "TAX INVOICE", "Doc title must be TAX INVOICE without Additional word");
assert(!getEl("invHeaderDocTitle").textContent.includes("ADDITIONAL"), "Doc title must NOT contain word ADDITIONAL");
assert(!getEl("gstModalTitleInvoiceNo").textContent.includes("ADDITIONAL"), "Modal title must NOT contain word ADDITIONAL");
assert(getEl("invHeaderServiceSubtitle").textContent.includes("Electricity & DG Backup Charges"));
assert(!getEl("invHeaderServiceSubtitle").textContent.includes("Additional"), "Subtitle must NOT contain word Additional");
assert.strictEqual(getEl("invItemTaxable").textContent, "₹10,000.00");
assert.strictEqual(getEl("invItemTotal").textContent, "₹11,800.00");
assert.strictEqual(getEl("invEscalationBanner").classList.contains("hidden"), true, "Escalation banner should be hidden on Additional Invoice");

// Verify share text removes "Addition" / "Additional" word
const addlShareText = sandbox.getGstInvoiceShareText(addlInv);
assert(addlShareText.startsWith("🏛️ TAX INVOICE:"), "Share text must be titled TAX INVOICE");
assert(!addlShareText.includes("ADDITIONAL TAX INVOICE"), "Share text must NOT contain ADDITIONAL TAX INVOICE");
assert(!addlShareText.includes("Additional Commercial Services"), "Share text must NOT contain Additional Commercial Services");

console.log("  ✔ B2B Additional Tax Invoice successfully generated and verified in Modal!");

// -------------------------------------------------------------
// Test 4: Generate B2B Credit Note (Section 34 CGST Act, 2017)
// -------------------------------------------------------------
console.log("PASS 4: Generating B2B Credit Note under Section 34 CGST Act, 2017...");

const creditNote = sandbox.generateB2bCreditNote({
  tenantId: "ten_retail_corp",
  originalInvoiceId: rentInv.id,
  reason: "Rent Concession / Commercial Discount",
  remarks: "Agreed ₹5,000 concession for HVAC downtime in Unit 101",
  taxableAmount: 5000
});

assert.ok(creditNote, "Credit Note must be generated");
assert.strictEqual(creditNote.invoiceType, "CREDIT_NOTE");
assert.strictEqual(creditNote.isCreditNote, true);
assert.strictEqual(creditNote.originalInvoiceId, rentInv.id);
assert.strictEqual(creditNote.originalInvoiceNo, rentInv.invoiceNo);
assert.strictEqual(creditNote.creditReason, "Rent Concession / Commercial Discount");
assert.strictEqual(creditNote.taxableRent, 5000);
assert.strictEqual(creditNote.cgstAmount, 450); // 9%
assert.strictEqual(creditNote.sgstAmount, 450); // 9%
assert.strictEqual(creditNote.totalAmount, 5900); // 5000 + 900
assert(creditNote.invoiceNo.startsWith("CN/"), `Credit note number must start with CN/: ${creditNote.invoiceNo}`);

// Verify Credit Note rendering in Modal
sandbox.openGstInvoiceModal(creditNote.id);
assert.strictEqual(getEl("invHeaderDocTitle").textContent, "CREDIT NOTE");
assert(getEl("invHeaderServiceSubtitle").textContent.includes("Section 34 of CGST Act, 2017"));
assert(getEl("invItemDescription").textContent.includes(rentInv.invoiceNo), "Description must reference original invoice number");
assert(getEl("invItemDescription").textContent.includes("Rent Concession / Commercial Discount"));
assert(getEl("invAmountInWords").textContent.includes("Credit Adjustment"), "Total in words must state Credit Adjustment");
assert.strictEqual(getEl("invEscalationBanner").classList.contains("hidden"), true, "Escalation banner should be hidden on Credit Note");

console.log("  ✔ B2B Credit Note successfully generated and verified in Modal!");

// -------------------------------------------------------------
// Test 5: Verify Multi-Channel Share Text for Credit Note
// -------------------------------------------------------------
console.log("PASS 5: Verifying Credit Note share text for WhatsApp and Email...");

const shareText = sandbox.getGstInvoiceShareText(creditNote);
assert(shareText.includes("CREDIT NOTE:"), "Share text must be titled CREDIT NOTE");
assert(shareText.includes("Section 34 of CGST Act, 2017"), "Share text must reference Section 34 of CGST Act");
assert(shareText.includes(rentInv.invoiceNo), "Share text must reference original invoice number");
assert(shareText.includes("5,900"), "Share text must state total credit amount");
assert(shareText.includes("view=gst-invoice"), "Share text must provide portal link");

console.log("  ✔ Statutory Credit Note dispatch text verified!");

// -------------------------------------------------------------
// Test 6: Verify Tab 7 (GST Register) Rendering & KPI Calculations
// -------------------------------------------------------------
console.log("PASS 6: Verifying GST Register KPI calculation with Credit Note reduction...");

sandbox.renderGstTab("Nov 2026");

// In Nov 2026 we have:
// Rent Invoice: Taxable ₹50,000, Total ₹59,000
// CAM Invoice (1,000 Sq.Ft @ ₹10/Sq.Ft): Taxable ₹10,000, Total ₹11,800
// Addl Invoice: Taxable ₹10,000, Total ₹11,800
// Credit Note: Taxable ₹5,000 (credit reduction), Total ₹5,900 (credit reduction)
// Net Taxable Base = 50,000 + 10,000 (CAM) + 10,000 (Addl) - 5,000 (Credit Note) = ₹65,000
// Net Total GST = 65,000 * 18% = ₹11,700
const taxableText = getEl("gstKpiTaxableAmount").textContent;
const gstText = getEl("gstKpiTotalGst").textContent;

assert.strictEqual(taxableText, "₹65,000", `Net Taxable base must be ₹65,000, got ${taxableText}`);
assert.strictEqual(gstText, "₹11,700", `Net GST output must be ₹11,700, got ${gstText}`);

// Verify table rows contains badges
const tableHtml = getEl("gstInvoicesTableBody").innerHTML;
assert(tableHtml.includes("Credit Note"), "Table body must render Credit Note badge");
assert(tableHtml.includes("Addl"), "Table body must render Addl badge");
assert(tableHtml.includes("-₹5,000.00"), "Table body must render Credit Note reduction amount");

console.log("  ✔ GST Register accurately computed net output tax and displayed Credit Note rows!");

// -------------------------------------------------------------
// Test 7: Modal Tab Switching and Tenant Pre-population
// -------------------------------------------------------------
console.log("PASS 7: Verifying Modal interactions and B2B pre-population...");

sandbox.openB2bBillingModal("ten_retail_corp", "credit_note", rentInv.id);

assert.strictEqual(getEl("b2bBillingActionModal").classList.contains("hidden"), false);
assert.strictEqual(getEl("b2bPanelCreditNote").classList.contains("hidden"), false);
assert.strictEqual(getEl("b2bPanelAddlInvoice").classList.contains("hidden"), true);
assert.strictEqual(getEl("b2bBillingTenantSelect").value, "ten_retail_corp");
assert.strictEqual(getEl("b2bCnOriginalInvoiceSelect").value, rentInv.id);

// Close modal
sandbox.closeB2bBillingModal();
assert.strictEqual(getEl("b2bBillingActionModal").classList.contains("hidden"), true);

console.log("  ✔ B2B Billing Modal interactions and pre-population fully verified!");

console.log("\n=======================================================");
console.log("🎉 ALL B2B ADDITIONAL INVOICE & CREDIT NOTE TESTS PASSED (100%)!");
console.log("=======================================================");
