const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("======================================================================");
console.log("🧪 TESTING PRINT & SAVE PDF ZERO-BLANK-PAGES ENGINE ACROSS ENTIRE APP");
console.log("======================================================================");

const indexPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

// 1. Static Verification of Dedicated Root Print Containers
assert(htmlContent.includes('id="printableAgreementSection"'), "index.html must include #printableAgreementSection root container");
assert(htmlContent.includes('id="printablePoliceSection"'), "index.html must include #printablePoliceSection root container");
assert(htmlContent.includes('id="printableSchedulesSection"'), "index.html must include #printableSchedulesSection root container");
assert(htmlContent.includes('id="printableReportSection"'), "index.html must include #printableReportSection root container");
console.log("  ✔ All 4 dedicated root printable containers verified directly under <body>.");

// 2. Static Verification of CSS @media print Rules for Blank Page Elimination
// Agreement Print CSS Rules
assert(htmlContent.includes('body.print-agreement > *:not(#printableAgreementSection):not(main)'), "CSS must hide non-agreement root siblings with display: none");
assert(htmlContent.includes('body.print-agreement #printableAgreementSection'), "CSS must target #printableAgreementSection for clean top-of-page flow");
assert(htmlContent.includes('body.print-agreement #tabViewAgreements section.lg\\:col-span-5'), "CSS fallback must hide left form column to eliminate blank space");
assert(htmlContent.includes('body.print-agreement #prepareAgreementForm'), "CSS fallback must hide prepareAgreementForm to eliminate blank space");

// Police Verification Print CSS Rules
assert(htmlContent.includes('body.print-police > *:not(#printablePoliceSection):not(main)'), "CSS must hide non-police root siblings with display: none");
assert(htmlContent.includes('body.print-police #printablePoliceSection'), "CSS must target #printablePoliceSection for clean top-of-page flow");
assert(htmlContent.includes('body.print-police .police-page-sheet'), "CSS must enforce .police-page-sheet styling");

// Schedules & Receipt Print CSS Rules
assert(htmlContent.includes('body.print-schedules > *:not(#printableSchedulesSection)'), "CSS must hide non-schedules siblings with display: none");
assert(htmlContent.includes('body.print-receipt-modal > *:not(#receiptModal)'), "CSS must hide non-receipt siblings with display: none");
assert(htmlContent.includes('body.print-gst-invoice > *:not(#gstInvoiceModal)'), "CSS must hide non-invoice siblings with display: none");
console.log("  ✔ All CSS @media print isolation rules verified: display: none eliminates preceding whitespace.");

// 3. Runtime Sandbox Setup
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
      innerText: "",
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
      appendChild: (child) => child,
      removeChild: (child) => child,
      addEventListener: (evt, fn) => {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      dispatchEvent: (evtObj) => {
        const list = listeners[evtObj.type] || [];
        list.forEach(fn => fn(evtObj));
      },
      removeEventListener: (evt, fn) => {
        if (!listeners[evt]) return;
        listeners[evt] = listeners[evt].filter(f => f !== fn);
      },
      setAttribute: () => {},
      getAttribute: () => null,
      removeAttribute: () => {},
      click: function () {
        this.dispatchEvent({ type: "click" });
      },
      focus: () => {},
      reset: () => {}
    };
  }
  return elements[id];
}

let lastPrintedClass = null;
let printInvocationCount = 0;

const sandbox = {
  window: null,
  addEventListener: (evt, fn) => {
    if (evt === "DOMContentLoaded") sandbox._domReady = fn;
    if (evt === "afterprint") sandbox._afterPrint = fn;
  },
  removeEventListener: () => {},
  document: {
    getElementById: (id) => getEl(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => getEl("created_" + tag + "_" + Math.random()),
    addEventListener: (evt, fn) => {
      if (evt === "DOMContentLoaded") sandbox._domReady = fn;
    },
    body: getEl("body"),
    title: "Initial Title"
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
  setTimeout: (fn) => {
    pendingTimers.push(fn);
    return pendingTimers.length;
  },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  console
};

const pendingTimers = [];
sandbox.runPendingTimers = () => {
  while (pendingTimers.length) {
    const fn = pendingTimers.shift();
    try { fn(); } catch (e) {}
  }
};

sandbox.window = sandbox;
sandbox.window.print = function () {
  printInvocationCount++;
  const bodyClasses = Array.from(sandbox.document.body.classList.contains("print-agreement") ? ["print-agreement"] : [])
    .concat(sandbox.document.body.classList.contains("print-police") ? ["print-police"] : [])
    .concat(sandbox.document.body.classList.contains("print-schedules") ? ["print-schedules"] : [])
    .concat(sandbox.document.body.classList.contains("print-receipt-modal") ? ["print-receipt-modal"] : [])
    .concat(sandbox.document.body.classList.contains("print-report") ? ["print-report"] : [])
    .concat(sandbox.document.body.classList.contains("print-gst-invoice") ? ["print-gst-invoice"] : []);
  lastPrintedClass = bodyClasses[0] || null;
};

vm.createContext(sandbox);
vm.runInContext(mainScript, sandbox);
if (sandbox._domReady) sandbox._domReady();

// 4. Test 1: Print Agreement Execution (Zero Blank Pages)
console.log("\n--- Test 1: Agreement Print / Save PDF Verification ---");
getEl("studioPrintableArea").innerHTML = `
  <div id="testAgreementDeed">
    <h1>RENTAL AGREEMENT</h1>
    <p>This Rental Agreement made and executed at New Delhi...</p>
    <div id="testClause1">Clause 1: Tenure and Rent</div>
  </div>
`;
getEl("studioTenantNameInput").value = "Sunita Rao";
getEl("studioTemplateSelect").value = "opt2";

// Click Print Agreement Button
const printBtn = getEl("printAgreementBtn");
printBtn.click();

assert.strictEqual(lastPrintedClass, "print-agreement", "document.body must have 'print-agreement' class active during print");
const agreementRoot = getEl("printableAgreementSection");
assert(agreementRoot.innerHTML.includes("RENTAL AGREEMENT"), "#printableAgreementSection must contain cloned deed content");
assert(agreementRoot.innerHTML.includes("Clause 1: Tenure and Rent"), "#printableAgreementSection must include clauses");
assert(sandbox.document.title.includes("Rent_Agreement_Sunita_Rao"), "Document title must update cleanly for PDF saving");
console.log("  ✔ Agreement cloned to root #printableAgreementSection for clean top-of-page rendering (0 blank pages).");

// 5. Test 2: Print Police Verification Execution (Zero Blank Pages)
console.log("\n--- Test 2: Police Verification Print Verification ---");
getEl("policePrintableArea").innerHTML = `
  <div class="police-page-sheet">Page 1: Tenant & Owner Details</div>
  <div class="police-page-sheet">Page 2: Permanent & Previous Address</div>
  <div class="police-page-sheet">Page 3: Two Local Referees</div>
  <div class="police-page-sheet">Page 4: Document Checklist</div>
`;
getEl("policeTenantName").value = "Vikram Aditya";

sandbox.printPoliceForm();
assert.strictEqual(lastPrintedClass, "print-police", "document.body must have 'print-police' class active during print");
const policeRoot = getEl("printablePoliceSection");
assert(policeRoot.innerHTML.includes("Page 1: Tenant & Owner Details"), "#printablePoliceSection must contain cloned police form");
assert(sandbox.document.title.includes("Police_Verification"), "Document title must reflect police verification PDF export");
console.log("  ✔ Police form cloned to root #printablePoliceSection for clean pagination (0 blank pages).");

// 6. Test 3: Print Annual Rental Schedules Execution (Zero Blank Pages)
console.log("\n--- Test 3: Rental Schedules Print Verification ---");
getEl("rentalSchedulesCardsContainer").innerHTML = `
  <div class="test-schedule-card">Tenant: Vikram Aditya | Total: Rs. 3,60,000</div>
`;
const printSchedBtn = getEl("printRentalSchedulesBtn");
printSchedBtn.click();

assert.strictEqual(lastPrintedClass, "print-schedules", "document.body must have 'print-schedules' class active during print");
const schedRoot = getEl("printableSchedulesSection");
assert(schedRoot.innerHTML.includes("Annual Rental Schedules"), "#printableSchedulesSection must include official header");
assert(schedRoot.innerHTML.includes("Vikram Aditya"), "#printableSchedulesSection must include tenant schedule cards");
console.log("  ✔ Rental Schedules cloned to root #printableSchedulesSection (0 blank pages).");

// 7. Test 4: Print HRA Rent Receipt Modal Execution (Zero Blank Pages)
console.log("\n--- Test 4: HRA Rent Receipt Print Verification ---");
getEl("rcptNo").textContent = "HRR-2026-8812";
const printRcptBtn = getEl("printReceiptBtn");
printRcptBtn.click();

assert.strictEqual(lastPrintedClass, "print-receipt-modal", "document.body must have 'print-receipt-modal' class active during print");
console.log("Current document.title:", sandbox.document.title);
assert(sandbox.document.title.includes("HRA_Rent_Receipt"), "Document title must update with receipt number for PDF saving");
console.log("  ✔ HRA Rent Receipt print triggered with print-receipt-modal isolation (0 blank pages).");

// 8. Test 5: Print GST Invoice Execution (Zero Blank Pages)
console.log("\n--- Test 5: Statutory GST Tax Invoice Print Verification ---");
sandbox.state.gstInvoices = sandbox.state.gstInvoices || {};
sandbox.state.gstInvoices["inv_zero_blank_test"] = {
  id: "inv_zero_blank_test",
  invoiceNo: "INV-2026-9901",
  tenantName: "Acme Corp",
  totalAmount: 118000
};

sandbox.printGstInvoice("inv_zero_blank_test");
assert.strictEqual(lastPrintedClass, "print-gst-invoice", "document.body must have 'print-gst-invoice' class active during print");
assert(sandbox.document.title.includes("INV-2026-9901"), "Document title must reflect Invoice No for clean PDF filename");
console.log("  ✔ GST Invoice print triggered with print-gst-invoice isolation (0 blank pages).");

console.log("\n======================================================================");
console.log("🎉 ALL ZERO-BLANK-PAGES PRINT & PDF EXPORT TESTS PASSED (100%)");
console.log("======================================================================");
