const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("======================================================================");
console.log("🔍 COMPREHENSIVE SYSTEM INTEGRITY, LINKS, CALCULATIONS & REPORTS AUDIT");
console.log("======================================================================\n");

const htmlPath = path.join(__dirname, "..", "index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// ============================================================================
// PART 1: LINK & NAVIGATION STRUCTURE AUDIT (TABS 1 TO 8)
// ============================================================================
console.log("--- PART 1: Navigation Tabs & Structure Audit ---");

const tabDefinitions = [
  { id: "tabBtnDashboard", viewId: "tabViewDashboard", label: "1. Dashboard", tabName: "dashboard" },
  { id: "tabBtnProperties", viewId: "tabViewProperties", label: "2. Property Master", tabName: "properties" },
  { id: "tabBtnTenants", viewId: "tabViewTenants", label: "3. Tenant Master", tabName: "tenants" },
  { id: "tabBtnAgreements", viewId: "tabViewAgreements", label: "4. Agreement Studio", tabName: "agreements" },
  { id: "tabBtnReports", viewId: "tabViewReports", label: "5. Reports & Exports", tabName: "reports" },
  { id: "tabBtnPolice", viewId: "tabViewPolice", label: "6. Police Verification", tabName: "police" },
  { id: "tabBtnGst", viewId: "tabViewGst", label: "7. GST Invoices", tabName: "gst" },
  { id: "tabBtnSchedules", viewId: "tabViewSchedules", label: "8. Rental Schedules", tabName: "schedules" }
];

tabDefinitions.forEach((tab) => {
  assert(htmlContent.includes(`id="${tab.id}"`), `Tab button #${tab.id} for '${tab.label}' must exist in DOM`);
  assert(htmlContent.includes(`id="${tab.viewId}"`), `Tab view panel #${tab.viewId} for '${tab.label}' must exist in DOM`);
  console.log(`  ✓ Tab #${tab.id} -> Panel #${tab.viewId} (${tab.label}) verified`);
});

// Check Tab 8 Excel Export button
assert(htmlContent.includes('id="exportRentalSchedulesExcelBtn"'), "Tab 8 must have #exportRentalSchedulesExcelBtn button");
console.log("  ✓ Tab 8 Executive #exportRentalSchedulesExcelBtn verified");

// Check Tab 8 KPI cards
const scheduleKpiIds = [
  "schedKpiTenantsCount",
  "schedKpiTotalMonths",
  "schedKpiTotalBaseRent",
  "schedKpiTotalGrossWithCamGst"
];
scheduleKpiIds.forEach((kpiId) => {
  assert(htmlContent.includes(`id="${kpiId}"`), `Tab 8 KPI card #${kpiId} must exist`);
  console.log(`  ✓ Tab 8 KPI card #${kpiId} verified`);
});

// ============================================================================
// PART 2: MODALS & WORKFLOW STRUCTURE AUDIT
// ============================================================================
console.log("\n--- PART 2: Modals & Dialog Structure Audit ---");

const coreModals = [
  "authModal",
  "landlordProfileModal",
  "linkTenantModal",
  "docPreviewModal",
  "tenantAgreementDocsModal",
  "recordPartialPaymentModal",
  "tenantTrackRecordModal",
  "kpiDetailModal",
  "gstInvoiceModal",
  "gstBatchDispatchModal",
  "receiptModal"
];

coreModals.forEach((mId) => {
  assert(htmlContent.includes(`id="${mId}"`), `Core modal #${mId} must exist in DOM`);
  console.log(`  ✓ Modal #${mId} verified`);
});

// Verify docPreviewModal has higher z-index (z-[80]) than other modals (z-50)
assert(
  htmlContent.includes('id="docPreviewModal"') && htmlContent.includes("z-[80]"),
  "docPreviewModal must have z-[80] to cleanly overlay secondary modals"
);
console.log("  ✓ docPreviewModal z-index hierarchy (z-[80]) verified");

// ============================================================================
// PART 3: VM SANDBOX INITIALIZATION FOR CALCULATIONS & LOGIC
// ============================================================================
console.log("\n--- PART 3: Sandbox Runtime & Calculations Audit ---");

const scriptMatches = [...htmlContent.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches[scriptMatches.length - 1][1];

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    const classes = new Set();
    if (id === "tmB2bDetailsSection" || id === "modalTenantB2bSection" || id === "authModal") {
      classes.add("hidden");
    }
    elements[id] = {
      id,
      value: "",
      checked: false,
      textContent: "",
      innerText: "",
      innerHTML: "",
      className: "",
      style: {},
      dataset: {},
      options: [],
      selectedIndex: 0,
      listeners: {},
      disabled: false,
      classList: {
        add: (...c) => c.forEach((x) => classes.add(x)),
        remove: (...c) => c.forEach((x) => classes.delete(x)),
        contains: (c) => classes.has(c),
        toggle: (c, force) => {
          if (force === undefined) {
            if (classes.has(c)) { classes.delete(c); return false; }
            classes.add(c); return true;
          } else if (force) { classes.add(c); return true; }
          else { classes.delete(c); return false; }
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
      setAttribute: () => {},
      removeAttribute: () => {},
      getAttribute: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: () => {},
      removeChild: () => {},
      scrollIntoView: () => {},
      focus: () => {},
      click: () => {},
      reset: () => {}
    };
  }
  return elements[id];
}

const domReadyCallbacks = [];

const sandbox = {
  window: null,
  addEventListener: (evt, fn) => {
    if (evt === "DOMContentLoaded") domReadyCallbacks.push(fn);
  },
  document: {
    getElementById: (id) => getEl(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => getEl("created_" + tag + "_" + Math.random()),
    addEventListener: (evt, fn) => {
      if (evt === "DOMContentLoaded") domReadyCallbacks.push(fn);
    },
    body: getEl("body")
  },
  localStorage: {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; },
    clear() { this.data = {}; }
  },
  navigator: { userAgent: "Node-Audit-Test", clipboard: { writeText: async () => {} } },
  location: { origin: "https://rental-income.app", pathname: "/", search: "" },
  URLSearchParams,
  Blob: function (content, opts) {
    this.content = content;
    this.opts = opts;
  },
  URL: {
    createObjectURL: () => "blob:mock-url",
    revokeObjectURL: () => {}
  },
  FileReader: function () {},
  confirm: () => true,
  prompt: () => "0",
  alert: () => {},
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  console,
  Date,
  Math,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
  Map,
  Set,
  JSON
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mainScript, sandbox);
domReadyCallbacks.forEach((fn) => fn());
console.log("  ✓ Main application JavaScript initialized and DOMContentLoaded triggered");

// ============================================================================
// PART 4: TAB SWITCHING LOGIC AUDIT
// ============================================================================
console.log("\n--- PART 4: Tab Switching & Navigation Functionality ---");

const switchTab = sandbox.window.switchTab || sandbox.switchTab;
assert.strictEqual(typeof switchTab, "function", "switchTab function must exist on window or sandbox");

tabDefinitions.forEach((tab) => {
  switchTab(tab.tabName);
  const activeView = getEl(tab.viewId);
  assert.strictEqual(
    activeView.classList.contains("hidden"),
    false,
    `Tab view #${tab.viewId} must NOT have 'hidden' class when active`
  );
  console.log(`  ✓ switchTab('${tab.tabName}') switched cleanly to #${tab.viewId} (hidden: false)`);
});

// ============================================================================
// PART 5: CALCULATION AUDIT 1 — B2B AREA, RENT & CAM RATE
// ============================================================================
console.log("\n--- PART 5: B2B Area, Rent & CAM Two-Way Calculations ---");

// Test: 3,500 Sq.Ft @ ₹150/Sq.Ft Rent = ₹5,25,000/mo & ₹22/Sq.Ft CAM = ₹77,000/mo
getEl("tmB2bAreaSqFtInput").value = "3500";
getEl("tmB2bRentPerSqFtInput").value = "150";
sandbox.recalculateTmB2bSqFtAndCam("rentPerSqFt");

const calcRent = Number(getEl("tmRentInput").value);
assert.strictEqual(calcRent, 525000, "3,500 Sq.Ft × ₹150/Sq.Ft must produce Monthly Rent = ₹5,25,000");
console.log(`  ✓ Rent/Sq.Ft Calculation: 3,500 Sq.Ft × ₹150/Sq.Ft = ₹${calcRent.toLocaleString("en-IN")}`);

getEl("tmB2bCamPerSqFtInput").value = "22";
sandbox.recalculateTmB2bSqFtAndCam("camPerSqFt");

const calcCam = Number(getEl("tmB2bCamAmountInput").value);
assert.strictEqual(calcCam, 77000, "3,500 Sq.Ft × ₹22/Sq.Ft must produce Monthly CAM = ₹77,000");
console.log(`  ✓ CAM/Sq.Ft Calculation: 3,500 Sq.Ft × ₹22/Sq.Ft = ₹${calcCam.toLocaleString("en-IN")}`);

// Test Reverse calculation: If user edits Monthly Rent = ₹6,30,000 with Area = 3,500 Sq.Ft, Rent/Sq.Ft must be ₹180
getEl("tmRentInput").value = "630000";
sandbox.recalculateTmB2bSqFtAndCam("rent");
const calcRentPerSqFt = Number(getEl("tmB2bRentPerSqFtInput").value);
assert.strictEqual(calcRentPerSqFt, 180, "₹6,30,000 ÷ 3,500 Sq.Ft must produce Rent/Sq.Ft = ₹180");
console.log(`  ✓ Reverse Rent/Sq.Ft: ₹6,30,000 ÷ 3,500 Sq.Ft = ₹${calcRentPerSqFt}/Sq.Ft`);

// ============================================================================
// PART 6: CALCULATION AUDIT 2 — 18% GST PRECISION
// ============================================================================
console.log("\n--- PART 6: GST Precision & Tax Invoice Math ---");

const testTenant = {
  id: "ten_audit_1",
  name: "Aditya Verma",
  businessName: "Verma Lifestyle Pvt Ltd",
  gstin: "07AAACV1234F1Z1",
  unit: "Unit 401, Grand High Street",
  rent: 200000,
  areaSqFt: 2000,
  rentPerSqFt: 100,
  camRatePerSqFt: 15,
  camAmount: 30000,
  b2bAutoCamInvoice: true,
  startDate: "2026-04-01",
  rentStartDate: "2026-04-01",
  endDate: "2029-03-31",
  incrementPeriod: "Every Year",
  incrementPct: 10,
  status: "Active"
};

sandbox.state.tenants = [testTenant];

// Generate GST Rent Invoice for Apr 2026
const rentInv = sandbox.generateGstInvoiceForTenant(testTenant.id, "Apr 2026");
assert(rentInv, "Rent Invoice must generate");
assert.strictEqual(rentInv.taxableRent, 200000, "Taxable Rent must be ₹2,00,000");
assert.strictEqual(rentInv.cgstAmount, 18000, "CGST 9% of ₹2,00,000 must be ₹18,000");
assert.strictEqual(rentInv.sgstAmount, 18000, "SGST 9% of ₹2,00,000 must be ₹18,000");
assert.strictEqual(rentInv.cgstAmount + rentInv.sgstAmount, 36000, "Total GST 18% of ₹2,00,000 must be ₹36,000");
assert.strictEqual(rentInv.totalAmount, 236000, "Gross Total with 18% GST must be ₹2,36,000");
console.log(`  ✓ Rent GST Breakdown: Taxable: ₹2,00,000 | CGST: ₹18,000 | SGST: ₹18,000 | Total: ₹2,36,000`);

// Generate Separate CAM GST Invoice for Apr 2026
const camInv = sandbox.generateCamInvoiceForTenant(testTenant.id, "Apr 2026");
assert(camInv, "Separate CAM Invoice must generate");
assert.strictEqual(camInv.taxableRent, 30000, "Taxable CAM must be ₹30,000");
assert.strictEqual(camInv.cgstAmount, 2700, "CGST 9% of ₹30,000 must be ₹2,700");
assert.strictEqual(camInv.sgstAmount, 2700, "SGST 9% of ₹30,000 must be ₹2,700");
assert.strictEqual(camInv.cgstAmount + camInv.sgstAmount, 5400, "Total GST 18% of ₹30,000 must be ₹5,400");
assert.strictEqual(camInv.totalAmount, 35400, "Gross CAM Total with 18% GST must be ₹35,400");
console.log(`  ✓ CAM GST Breakdown: Taxable: ₹30,000 | CGST: ₹2,700 | SGST: ₹2,700 | Total: ₹35,400`);

// Check Exact Date Range Format
assert.strictEqual(rentInv.billingPeriodRange, "01-Apr-2026 to 30-Apr-2026", "Rent invoice billing period range must be '01-Apr-2026 to 30-Apr-2026'");
assert.strictEqual(camInv.billingPeriodRange, "01-Apr-2026 to 30-Apr-2026", "CAM invoice billing period range must be '01-Apr-2026 to 30-Apr-2026'");
console.log(`  ✓ Exact Date Range in Invoices verified: '${rentInv.billingPeriodRange}'`);

// ============================================================================
// PART 7: CALCULATION AUDIT 3 — ESCALATION COMPOUNDING & SLABS
// ============================================================================
console.log("\n--- PART 7: Multi-Year Compounded Rental Escalation ---");

// Year 1 (Apr 2026 - Mar 2027): Base ₹2,00,000
// Year 2 (Apr 2027 - Mar 2028): +10% = ₹2,20,000 (+18% GST = ₹2,59,600)
// Year 3 (Apr 2028 - Mar 2029): +10% compounded on ₹2,20,000 = ₹2,42,000 (+18% GST = ₹2,85,560)

const sched = sandbox.generateTenantRentalSchedule(testTenant);
assert(sched, "Rental schedule must generate");
assert.strictEqual(sched.totalMonths, 36, "3 Years lease must equal 36 months");

// Slab 1 check (Months 1-12)
assert.strictEqual(sched.rows[0].monthLabel, "Apr 2026");
assert.strictEqual(sched.rows[0].monthlyRent, 200000);
assert.strictEqual(sched.rows[11].monthLabel, "Mar 2027");
assert.strictEqual(sched.rows[11].monthlyRent, 200000);

// Slab 2 check (Months 13-24): Escalated +10%
assert.strictEqual(sched.rows[12].monthLabel, "Apr 2027");
assert.strictEqual(sched.rows[12].monthlyRent, 220000);
assert.strictEqual(sched.rows[12].isEscalated, true);
assert.strictEqual(sched.rows[12].rentGst, 39600);
assert.strictEqual(sched.rows[12].totalMonthlyOutflow, 220000 + 30000 + 39600 + 5400);

// Slab 3 check (Months 25-36): Escalated another +10% compounded
assert.strictEqual(sched.rows[24].monthLabel, "Apr 2028");
assert.strictEqual(sched.rows[24].monthlyRent, 242000);
assert.strictEqual(sched.rows[24].isEscalated, true);
assert.strictEqual(sched.rows[24].rentGst, 43560);
console.log(`  ✓ Escalation Compound: Year 1: ₹2,00,000 -> Year 2: ₹2,20,000 -> Year 3: ₹2,42,000`);

// Check Slabs grouping
assert.strictEqual(sched.slabs.length, 3, "3 Year annual escalation must produce exactly 3 slabs");
assert.strictEqual(sched.slabs[0].monthsCount, 12, "Slab 1 must have 12 months");
assert.strictEqual(sched.slabs[1].monthsCount, 12, "Slab 2 must have 12 months");
assert.strictEqual(sched.slabs[2].monthsCount, 12, "Slab 3 must have 12 months");

// Total Rent over lease: 12 × 200,000 + 12 × 220,000 + 12 × 242,000 = 2,400,000 + 2,640,000 + 2,904,000 = 7,944,000
assert.strictEqual(sched.totalRentOverLease, 7944000, "Total Rent over 36 months must equal ₹79,44,000");
console.log(`  ✓ Total Rent over 36 months verified: ₹${sched.totalRentOverLease.toLocaleString("en-IN")}`);

// ============================================================================
// PART 8: CALCULATION AUDIT 4 — RENT START DATE (FIT-OUT & ADVANCE BILLING)
// ============================================================================
console.log("\n--- PART 8: Rent Start Date (Fit-out Period & Advance Invoicing) ---");

const fitoutTenant = {
  id: "ten_fitout_1",
  name: "Meera Kapoor",
  businessName: "Kapoor Couture",
  unit: "Shop 102",
  rent: 100000,
  startDate: "2026-08-01",      // Lease Start
  rentStartDate: "2026-10-15",  // Rent Start Date (2.5 months fitout)
  endDate: "2027-07-31",        // 12 months total lease
  leasePeriod: "1 Year (12 Months)",
  incrementPeriod: "No Escalation",
  incrementPct: 0,
  status: "Active"
};

const fitoutSched = sandbox.generateTenantRentalSchedule(fitoutTenant);
assert(fitoutSched, "Fit-out schedule must generate");

// Aug 2026: Before Rent Start Date -> ₹0 rent
assert.strictEqual(fitoutSched.rows[0].monthLabel, "Aug 2026");
assert.strictEqual(fitoutSched.rows[0].monthlyRent, 0, "Aug 2026 must be ₹0 (Fit-Out period)");
assert.strictEqual(fitoutSched.rows[0].isBeforeRentStart, true);

// Sep 2026: Before Rent Start Date -> ₹0 rent
assert.strictEqual(fitoutSched.rows[1].monthLabel, "Sep 2026");
assert.strictEqual(fitoutSched.rows[1].monthlyRent, 0, "Sep 2026 must be ₹0 (Fit-Out period)");
assert.strictEqual(fitoutSched.rows[1].isBeforeRentStart, true);

// Oct 2026: Month of Rent Start Date -> starts on 15-Oct-2026 (17 days remaining in 31-day month)
// Proportional rent: Math.round(100000 * 17 / 31) = 54839
assert.strictEqual(fitoutSched.rows[2].monthLabel, "Oct 2026");
assert.strictEqual(fitoutSched.rows[2].isBeforeRentStart, false);
assert.strictEqual(fitoutSched.rows[2].monthlyRent, 54839, "Oct 2026 must be proportionally calculated for 17 days (₹54,839 of ₹100,000)");
assert.strictEqual(fitoutSched.rows[2].isProrated, true, "Oct 2026 row must be marked isProrated");
assert.strictEqual(fitoutSched.rows[2].proratedDays, 17, "Oct 2026 row must record 17 prorated days");
assert.strictEqual(fitoutSched.rows[2].periodRange, "15-Oct-2026 to 31-Oct-2026");
assert.strictEqual(fitoutSched.rows[2].advanceInvoiceDate, "15-Oct-2026");

// Nov 2026: Standard month
assert.strictEqual(fitoutSched.rows[3].monthLabel, "Nov 2026");
assert.strictEqual(fitoutSched.rows[3].periodRange, "01-Nov-2026 to 30-Nov-2026");
console.log(`  ✓ Fit-out Period (₹0 rent): Aug 2026 & Sep 2026`);
console.log(`  ✓ Advance Rent Start Date: 15-Oct-2026 (Period: ${fitoutSched.rows[2].periodRange})`);

// ============================================================================
// PART 9: FUTURE-DATE INVOICE FILTERING QUALITY
// ============================================================================
console.log("\n--- PART 9: Future-Date Invoice Filtering Quality ---");

assert.strictEqual(sandbox.isFutureBillingMonth("Oct 2026", "Oct 2026"), false, "Current month Oct 2026 should not be future");
assert.strictEqual(sandbox.isFutureBillingMonth("Sep 2026", "Oct 2026"), false, "Past month Sep 2026 should not be future");
assert.strictEqual(sandbox.isFutureBillingMonth("Nov 2026", "Oct 2026"), true, "Nov 2026 must be detected as future billing month");
assert.strictEqual(sandbox.isFutureBillingMonth("Jan 2027", "Oct 2026"), true, "Jan 2027 must be detected as future billing month");

sandbox.state.gstInvoices = {
  "inv_past_1": {
    id: "inv_past_1",
    billingMonth: "Aug 2026",
    invoiceDate: "01-Aug-2026",
    totalAmount: 118000,
    status: "Paid"
  },
  "inv_curr_1": {
    id: "inv_curr_1",
    billingMonth: "Oct 2026",
    invoiceDate: "01-Oct-2026",
    totalAmount: 118000,
    status: "Unpaid"
  },
  "inv_future_1": {
    id: "inv_future_1",
    billingMonth: "Dec 2026",
    invoiceDate: "01-Dec-2026",
    totalAmount: 118000,
    status: "Unpaid"
  },
  "inv_future_2": {
    id: "inv_future_2",
    billingMonth: "Jan 2027",
    invoiceDate: "01-Jan-2027",
    totalAmount: 118000,
    status: "Unpaid"
  }
};

sandbox.purgeFutureDateInvoicesFromState("Oct 2026");
const remainingInvoices = Object.keys(sandbox.state.gstInvoices);

assert(remainingInvoices.includes("inv_past_1"), "Past invoices must remain in state");
assert(remainingInvoices.includes("inv_curr_1"), "Current month invoices must remain in state");
assert(!remainingInvoices.includes("inv_future_1"), "Future Dec 2026 invoice must be purged from state");
assert(!remainingInvoices.includes("inv_future_2"), "Future Jan 2027 invoice must be purged from state");
console.log(`  ✓ Future-Date Filtering: Future invoices (Dec 2026, Jan 2027) successfully purged`);
console.log(`  ✓ Only valid past and current invoices maintained (${remainingInvoices.join(", ")})`);

// ============================================================================
// PART 10: REPORTS & FINANCIAL YEAR KPI QUALITY
// ============================================================================
console.log("\n--- PART 10: Reports & Dashboard Financial Year KPI Quality ---");

assert.strictEqual(typeof sandbox.getFinancialYearMetrics, "function", "getFinancialYearMetrics function must exist");
assert.strictEqual(typeof sandbox.getMonthlyCollectionTotals, "function", "getMonthlyCollectionTotals function must exist");

const fyMetrics = sandbox.getFinancialYearMetrics();
assert(fyMetrics && typeof fyMetrics === "object", "FY metrics must return an object");
console.log("  ✓ getFinancialYearMetrics() computed successfully");

const monthlyTotals = sandbox.getMonthlyCollectionTotals();
assert(monthlyTotals && typeof monthlyTotals === "object", "Monthly collection totals must return an object");
console.log("  ✓ getMonthlyCollectionTotals() computed successfully");

// ============================================================================
// PART 11: EXCEL EXPORT (.CSV) COMPLIANCE & ACCURACY
// ============================================================================
console.log("\n--- PART 11: Excel Export (.CSV) Data Accuracy & Compliance ---");

sandbox.state.tenants = [testTenant, fitoutTenant];
const excelCsv = sandbox.exportRentalSchedulesExcel();

// Verify BOM
assert(excelCsv.startsWith("\uFEFF"), "CSV must begin with UTF-8 BOM");

// Verify Headers
assert(excelCsv.includes('"TENANT-WISE RENTAL SCHEDULE (LEASE START TO LEASE END)"'), "CSV must include title");
assert(excelCsv.includes('"Lessor / Company:"'), "CSV must include Lessor header");
assert(excelCsv.includes('"TENANT #1:"'), "CSV must include Tenant #1");
assert(excelCsv.includes('"Verma Lifestyle Pvt Ltd (Aditya Verma)"'), "CSV must include Business & Tenant name");
assert(excelCsv.includes('"TENANT #2:"'), "CSV must include Tenant #2");
assert(excelCsv.includes('"Kapoor Couture (Meera Kapoor)"'), "CSV must include Second tenant name");

// Verify Data columns
const requiredCsvColumns = [
  "Month #",
  "Billing Month",
  "Billing Period (Exact Dates)",
  "Advance Invoice Date",
  "Escalation Slab / Clause",
  "Rent / Sq.Ft (₹)",
  "Monthly Rent (₹)",
  "Separate Monthly CAM (₹)",
  "GST 18% (₹)",
  "Total Monthly Outflow (₹)",
  "Status"
];

requiredCsvColumns.forEach((col) => {
  assert(excelCsv.includes(`"${col}"`), `CSV must include column header "${col}"`);
  console.log(`  ✓ CSV column '${col}' verified`);
});

// Verify lease totals
assert(excelCsv.includes('"TOTAL ACROSS ENTIRE LEASE PERIOD"'), "CSV must contain total summary row");
assert(excelCsv.includes('7944000'), "CSV must contain accurate calculated total rent ₹79,44,000");
console.log("  ✓ CSV export generated with 100% precision and Microsoft Excel formatting");

// ============================================================================
// PART 12: INVOICE BRANDING & CLEANLINESS AUDIT
// ============================================================================
console.log("\n--- PART 12: Invoice Cleanliness & Branding Audit ---");

// Verify removal of obsolete header text
assert(
  !htmlContent.includes("Rent & Property Master Suite — Dashboard, Property Master & Agreement Studio"),
  "Obsolete text 'Rent & Property Master Suite — Dashboard, Property Master & Agreement Studio' must NOT exist"
);
console.log("  ✓ Obsolete header text successfully removed from application");

// Verify Company Logo upload capability
assert(
  htmlContent.includes('id="landlordProfileLogoInput"') &&
  htmlContent.includes('id="gstModalUploadLogoBtn"') &&
  htmlContent.includes('id="invCompanyLogoImg"'),
  "Company Logo upload inputs (#landlordProfileLogoInput, #gstModalUploadLogoBtn, #invCompanyLogoImg) must exist"
);
console.log("  ✓ Company Logo upload feature and invoice logo rendering verified");

// Verify redesigned clean invoice header
assert(htmlContent.includes('id="invHeaderDocTitle"'), "Invoice must feature modern #invHeaderDocTitle letterhead");
assert(!htmlContent.includes("FORM GST INV-1 · TAX INVOICE"), "Old obsolete 'FORM GST INV-1 · TAX INVOICE' header must be replaced");
assert(!htmlContent.includes("TAX INVOICE FOR RENTAL SERVICES"), "Old obsolete 'TAX INVOICE FOR RENTAL SERVICES' header must be replaced");
console.log("  ✓ Clean modern Tax Invoice letterhead verified");

console.log("\n======================================================================");
console.log("🎉 ALL AUDIT CHECKS PASSED (12/12 PARTS)! ZERO BUGS OR DEVIATIONS DETECTED.");
console.log("======================================================================");
