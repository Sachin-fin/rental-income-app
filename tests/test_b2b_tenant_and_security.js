const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("=== B2B TENANT REGISTRATION & AUTH SECURITY TEST SUITE ===");

const htmlPath = path.join(__dirname, "..", "index.html");
const htmlContent = fs.readFileSync(htmlPath, "utf8");

// 1. Verify B2B Business UI Elements in Tenant Master & Link Tenant Modal
assert(htmlContent.includes('id="tmIsB2bCheckbox"'), "Tenant Master form must include #tmIsB2bCheckbox");
assert(htmlContent.includes('id="tmB2bDetailsSection"'), "Tenant Master form must include collapsible #tmB2bDetailsSection");
assert(htmlContent.includes('id="tmBusinessNameInput"'), "Tenant Master form must include #tmBusinessNameInput");
assert(htmlContent.includes('id="tmGstinInput"'), "Tenant Master form must include #tmGstinInput");
assert(htmlContent.includes('id="tmB2bPanInput"'), "Tenant Master form must include #tmB2bPanInput");
assert(htmlContent.includes('id="tmBillingAddressInput"'), "Tenant Master form must include #tmBillingAddressInput");
assert(htmlContent.includes('id="tmCopyPermToBillingBtn"'), "Tenant Master form must include #tmCopyPermToBillingBtn");
assert(htmlContent.includes('id="tmB2bIncrementPeriodSelect"'), "Tenant Master form must include #tmB2bIncrementPeriodSelect");
assert(htmlContent.includes('value="Every Year"'), "Increment period must include 'Every Year' option");
assert(htmlContent.includes('value="After 3 Years"'), "Increment period must include 'After 3 Years' option");
assert(htmlContent.includes('id="tmB2bIncrementPctInput"'), "Tenant Master form must include #tmB2bIncrementPctInput");
assert(htmlContent.includes('id="tmB2bLockInSelect"'), "Tenant Master form must include #tmB2bLockInSelect");
assert(htmlContent.includes('id="tmB2bLeasePeriodSelect"'), "Tenant Master form must include #tmB2bLeasePeriodSelect");
assert(htmlContent.includes('id="tmB2bIncrementClauseInput"'), "Tenant Master form must include #tmB2bIncrementClauseInput");

assert(htmlContent.includes('id="modalTenantIsB2b"'), "Link Tenant modal must include #modalTenantIsB2b");
assert(htmlContent.includes('id="modalTenantB2bSection"'), "Link Tenant modal must include #modalTenantB2bSection");
assert(htmlContent.includes('id="modalTenantGstin"'), "Link Tenant modal must include #modalTenantGstin");
assert(htmlContent.includes('id="modalTenantB2bPan"'), "Link Tenant modal must include #modalTenantB2bPan");
assert(htmlContent.includes('id="modalTenantBillingAddress"'), "Link Tenant modal must include #modalTenantBillingAddress");
assert(htmlContent.includes('id="modalTenantB2bIncrementPeriod"'), "Link Tenant modal must include #modalTenantB2bIncrementPeriod");
assert(htmlContent.includes('id="modalTenantB2bIncrementPct"'), "Link Tenant modal must include #modalTenantB2bIncrementPct");
assert(htmlContent.includes('id="modalTenantB2bLockIn"'), "Link Tenant modal must include #modalTenantB2bLockIn");
assert(htmlContent.includes('id="modalTenantB2bLeasePeriod"'), "Link Tenant modal must include #modalTenantB2bLeasePeriod");
assert(htmlContent.includes('id="modalTenantB2bIncrementClause"'), "Link Tenant modal must include #modalTenantB2bIncrementClause");

// 2. Verify Security UI Elements in #authModal
assert(htmlContent.includes('id="authSecurityStatusBanner"'), "Auth modal must include #authSecurityStatusBanner");
assert(htmlContent.includes('id="authSecurityRateBadge"'), "Auth modal must include #authSecurityRateBadge");
assert(htmlContent.includes('id="toggleRegPasswordBtn"'), "Register form must include #toggleRegPasswordBtn");
assert(htmlContent.includes('id="authRegPasswordStrengthBar"'), "Register form must include #authRegPasswordStrengthBar");
console.log("PASS 1: All B2B Business & Security DOM elements verified in index.html.");

// 3. Extract and execute script in VM sandbox to test runtime behavior
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
      appendChild: () => { },
      scrollIntoView: () => { },
      focus: () => { },
      reset() {
        // reset mock
      }
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
    removeItem(k) { delete this._store[k]; }
  },
  navigator: { clipboard: { writeText: async () => { } } },
  location: { origin: "https://rental-income.app", pathname: "/", search: "" },
  URLSearchParams,
  Blob: function () { },
  URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => { } },
  FileReader: function () { },
  confirm: () => true,
  prompt: () => "0",
  alert: () => { },
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => { },
  setInterval: () => 1,
  clearInterval: () => { },
  console
};
sandbox.window = sandbox;

vm.createContext(sandbox);
vm.runInContext(mainScript, sandbox);
if (sandbox._domReady) sandbox._domReady();

// 4. Test GSTIN formatting, validation & B2B section toggling
assert.strictEqual(sandbox.formatGstinString("07aabcu9603r1zm"), "07AABCU9603R1ZM");
assert.strictEqual(sandbox.isValidGstin("07AABCU9603R1ZM"), true);
assert.strictEqual(sandbox.isValidGstin("SHORT"), false);

sandbox.toggleTmB2bSection(true);
assert.strictEqual(getEl("tmIsB2bCheckbox").checked, true);
assert.strictEqual(getEl("tmB2bDetailsSection").classList.contains("hidden"), false);

sandbox.toggleTmB2bSection(false);
assert.strictEqual(getEl("tmIsB2bCheckbox").checked, false);
assert.strictEqual(getEl("tmB2bDetailsSection").classList.contains("hidden"), true);
console.log("PASS 2: B2B toggle & GSTIN formatting/validation work accurately.");

// 5. Test GSTIN auto-extracting PAN (chars 3-12) on input
sandbox.toggleTmB2bSection(true);
const gstinEl = getEl("tmGstinInput");
gstinEl.value = "07aabcu9603r1zm";
gstinEl.dispatchEvent({ type: "input", target: gstinEl });

assert.strictEqual(gstinEl.value, "07AABCU9603R1ZM", "GSTIN should auto-uppercase");
assert.strictEqual(getEl("tmB2bPanInput").value, "AABCU9603R", "Business PAN should be auto-extracted from GSTIN chars 3-12");
assert.strictEqual(getEl("tmPanInput").value, "AABCU9603R", "Main KYC PAN should also sync with extracted Business PAN");
console.log("PASS 3: Live GSTIN input auto-extracts 10-char PAN and syncs with KYC PAN.");

// 6. Test B2B Rental Increment Clause Builder & Lease End Date Calculator
const clause3Yr = sandbox.buildB2bIncrementClauseText({
  incrementPeriod: "After 3 Years",
  incrementPct: 15,
  lockInPeriod: "2 Years (24 Months)",
  leasePeriod: "5 Years (60 Months)",
  baseRent: 45000
});
assert(clause3Yr.includes("15%"), "Clause must include 15% increase");
assert(clause3Yr.includes("After 3 Years"), "Clause must reflect 'After 3 Years' period");
assert(clause3Yr.includes("Lock-in Period of 2 Years (24 Months)"), "Clause must include Lock-in Period");
assert(clause3Yr.includes("5 Years (60 Months)"), "Clause must include Lease Period");

const calcEnd = sandbox.calculateLeaseEndDateFromPeriod("2026-01-01", "3 Years (36 Months)");
assert.strictEqual(calcEnd, "2028-12-31", "3 Years (36 Months) from 2026-01-01 should end on 2028-12-31");

// 7. Test B2B Tenant Registration via #addTenantMasterForm (including Increment, Lock-in & Lease Period)
getEl("tmNameInput").value = "Vikram Malhotra";
getEl("tmMobileInput").value = "9811223344";
getEl("tmEmailInput").value = "vikram@apextech.in";
getEl("tmUnitSelect").value = "Unassigned";
getEl("tmRentInput").value = "45000";
getEl("tmStartDateInput").value = "2026-04-01";
getEl("tmIsB2bCheckbox").checked = true;
getEl("tmBusinessNameInput").value = "Apex Tech Solutions Pvt Ltd";
getEl("tmGstinInput").value = "07AABCU9603R1ZM";
getEl("tmB2bPanInput").value = "AABCU9603R";
getEl("tmBillingAddressInput").value = "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020";
getEl("tmB2bIncrementPeriodSelect").value = "After 3 Years";
getEl("tmB2bIncrementPctInput").value = "15";
getEl("tmB2bLockInSelect").value = "2 Years (24 Months)";
getEl("tmB2bLeasePeriodSelect").value = "5 Years (60 Months)";
getEl("tmB2bIncrementClauseInput").value = "";

const tmForm = getEl("addTenantMasterForm");
tmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const b2bTenant = sandbox.state.tenants.find((t) => t.name === "Vikram Malhotra");
assert(b2bTenant, "B2B Tenant should be saved in state.tenants");
assert.strictEqual(b2bTenant.isB2B, true);
assert.strictEqual(b2bTenant.businessName, "Apex Tech Solutions Pvt Ltd");
assert.strictEqual(b2bTenant.gstin, "07AABCU9603R1ZM");
assert.strictEqual(b2bTenant.pan, "AABCU9603R");
assert.strictEqual(b2bTenant.billingAddress, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");
assert.strictEqual(b2bTenant.incrementPeriod, "After 3 Years");
assert.strictEqual(b2bTenant.incrementPct, 15);
assert.strictEqual(b2bTenant.lockInPeriod, "2 Years (24 Months)");
assert.strictEqual(b2bTenant.leasePeriod, "5 Years (60 Months)");
assert(b2bTenant.b2bIncrementClause.includes("15%"), "Saved B2B tenant must store generated b2bIncrementClause");
assert(Array.isArray(b2bTenant.customClauses) && b2bTenant.customClauses[0].includes("RENTAL INCREMENT CLAUSE"), "B2B Increment Clause should auto-sync to tenant.customClauses");
console.log("PASS 4: B2B Tenant registration persists GSTIN, PAN, Billing Address, Increment Period, % of Increase, Lock-in, Lease Period & Increment Clause.");

// 7. Test loadTenantIntoForm & GST Invoice integration for B2B Tenant
sandbox.loadTenantIntoForm(b2bTenant.id);
assert.strictEqual(getEl("tmIsB2bCheckbox").checked, true);
assert.strictEqual(getEl("tmBusinessNameInput").value, "Apex Tech Solutions Pvt Ltd");
assert.strictEqual(getEl("tmGstinInput").value, "07AABCU9603R1ZM");
assert.strictEqual(getEl("tmBillingAddressInput").value, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");

const inv = sandbox.generateGstInvoiceForTenant(b2bTenant.id, "Oct 2026");
assert(inv, "GST Invoice should be generated for B2B tenant");
assert.strictEqual(inv.isB2B, true);
assert.strictEqual(inv.tenantGstin, "07AABCU9603R1ZM");
assert.strictEqual(inv.tenantPan, "AABCU9603R");
assert.strictEqual(inv.billingAddress, "Plot 42, Okhla Industrial Estate Phase III, New Delhi - 110020");

sandbox.openGstInvoiceModal(inv.id);
assert(getEl("invRecipientName").textContent.includes("Apex Tech Solutions Pvt Ltd"));
assert(getEl("invRecipientAddress").textContent.includes("Plot 42, Okhla Industrial Estate Phase III"));
assert(getEl("invRecipientGstin").textContent.includes("07AABCU9603R1ZM"));
console.log("PASS 5: GST Tax Invoice populates B2B Business Name, GSTIN, PAN, and Billing Address.");

// 8. Test Auth Security Functions (Salted Hashing, Verification & Password Strength)
const hashed = sandbox.hashPasswordSync("MySecurePass#2026", "user@example.com");
assert(hashed.startsWith("sh2$user@example.com$"), "Hash must include version prefix and salt");
assert.strictEqual(sandbox.verifyPasswordSync("MySecurePass#2026", hashed, "user@example.com"), true);
assert.strictEqual(sandbox.verifyPasswordSync("WrongPassword", hashed, "user@example.com"), false);
assert.strictEqual(sandbox.verifyPasswordSync("password123", "password123", "abcltd9925@gmail.com"), true, "Legacy plaintext password must remain backward compatible");

const strengthWeak = sandbox.evaluatePasswordStrength("123");
const strengthStrong = sandbox.evaluatePasswordStrength("RentMaster@2026#Secure");
assert(strengthStrong.score >= 80, "Complex password should score >= 80");
assert(strengthWeak.score < 25, "Short password should score < 25");
console.log("PASS 6: Auth Security salted password hashing, verification & strength meter work accurately.");

// 9. Test Property Master: Super Area, Carpet Area, Common Area & Type of Building ("Mall", "High Street", "Residential", "Other")
assert(htmlContent.includes('id="pmBuildingTypeInput"'), "Property Master must include #pmBuildingTypeInput");
assert(htmlContent.includes('value="Mall"'), "Type of Building must include 'Mall'");
assert(htmlContent.includes('value="High Street"'), "Type of Building must include 'High Street'");
assert(htmlContent.includes('value="Residential"'), "Type of Building must include 'Residential'");
assert(htmlContent.includes('value="Other"'), "Type of Building must include 'Other'");
assert(htmlContent.includes('id="pmSuperAreaInput"'), "Property Master must include #pmSuperAreaInput");
assert(htmlContent.includes('id="pmCarpetAreaInput"'), "Property Master must include #pmCarpetAreaInput");
assert(htmlContent.includes('id="pmCommonAreaInput"'), "Property Master must include #pmCommonAreaInput");

getEl("pmBuildingInput").value = "Select Citywalk";
getEl("pmUnitInput").value = "Shop G-14";
getEl("pmTypeInput").value = "Commercial Shop / Office";
getEl("pmBuildingTypeInput").value = "Mall";
getEl("pmAddressInput").value = "A-3, Saket District Centre, New Delhi - 110017";
getEl("pmSuperAreaInput").value = "2000";
getEl("pmCarpetAreaInput").value = "1400";
sandbox.recalculatePropertyAreas("super_or_carpet");
assert.strictEqual(String(getEl("pmCommonAreaInput").value), "600", "Common Area should auto-calculate as Super Area (2000) - Carpet Area (1400) = 600 Sq.Ft");

const pmForm = getEl("addPropertyMasterForm");
pmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const mallProp = sandbox.state.properties.find((p) => p.name.includes("Shop G-14"));
assert(mallProp, "Registered Mall property should exist in state.properties");
assert.strictEqual(mallProp.buildingType, "Mall");
assert.strictEqual(mallProp.superArea, 2000);
assert.strictEqual(mallProp.carpetArea, 1400);
assert.strictEqual(mallProp.commonArea, 600);
console.log("PASS 7: Property Master Super Area, Carpet Area, Common Area & Type of Building (Mall/High Street/Residential/Other) verified.");

// 10. Test Automatic Rental Increment & Escalated GST Invoice Generation
// A) "After 3 Years" (+15% on Base ₹45,000 starting 2026-04-01 -> Apr 2029 = ₹51,750)
const invInitial = sandbox.generateGstInvoiceForTenant(b2bTenant.id, "Oct 2026");
assert.strictEqual(invInitial.taxableRent, 45000, "Before 3 years (Oct 2026), taxable rent should remain base ₹45,000");
assert.strictEqual(invInitial.isEscalated, false);

const invAfter3Yrs = sandbox.generateGstInvoiceForTenant(b2bTenant.id, "Apr 2029");
assert.strictEqual(invAfter3Yrs.baseRent, 45000);
assert.strictEqual(invAfter3Yrs.taxableRent, 51750, "After 3 years (Apr 2029), +15% increment must automatically increase rent from ₹45,000 to ₹51,750");
assert.strictEqual(invAfter3Yrs.isEscalated, true);
assert.strictEqual(invAfter3Yrs.completedIntervals, 1);
assert.strictEqual(invAfter3Yrs.escalationAmount, 6750);
assert.strictEqual(invAfter3Yrs.cgstAmount, 4657.5);
assert.strictEqual(invAfter3Yrs.sgstAmount, 4657.5);
assert.strictEqual(invAfter3Yrs.totalAmount, 61065, "Total GST invoice after 15% escalation must be ₹51,750 + 18% GST = ₹61,065");

sandbox.openGstInvoiceModal(invAfter3Yrs.id);
assert.strictEqual(getEl("invEscalationBanner").classList.contains("hidden"), false, "Escalation banner should be visible in GST Invoice Modal");
assert(getEl("invEscalationSummaryText").textContent.includes("51,750"), "Escalation banner should display escalated rent ₹51,750");

// B) "Every Year" (+10% on Base ₹50,000 starting 2025-10-01 -> Oct 2026 = ₹55,000, Oct 2027 = ₹60,500)
sandbox.state.tenants.unshift({
  id: "ten_annual_inc",
  name: "Rohan Mehta",
  businessName: "Mehta Retail Pvt Ltd",
  isB2B: true,
  gstin: "07AAACM1234F1Z5",
  pan: "AAACM1234F",
  billingAddress: "Shop G-14, Select Citywalk, Saket, New Delhi",
  unit: mallProp.name,
  baseRent: 50000,
  rent: 50000,
  incrementPeriod: "Every Year",
  incrementPct: 10,
  startDate: "2025-10-01",
  endDate: "2028-09-30",
  status: "Active"
});

sandbox.applyAutomaticRentalIncrements("Oct 2026");
const annualTenant = sandbox.state.tenants.find((t) => t.id === "ten_annual_inc");
assert.strictEqual(annualTenant.rent, 55000, "applyAutomaticRentalIncrements('Oct 2026') must auto-increase rent from ₹50,000 to ₹55,000 (+10% Every Year)");
assert.strictEqual(annualTenant.baseRent, 50000, "Original baseRent (₹50,000) must be preserved");

const invYr1 = sandbox.generateGstInvoiceForTenant("ten_annual_inc", "Oct 2026");
assert.strictEqual(invYr1.taxableRent, 55000, "Oct 2026 invoice must bill escalated ₹55,000");
assert.strictEqual(invYr1.totalAmount, 64900, "Oct 2026 total with 18% GST must be ₹64,900");

const invYr2 = sandbox.generateGstInvoiceForTenant("ten_annual_inc", "Oct 2027");
assert.strictEqual(invYr2.taxableRent, 60500, "Oct 2027 (Year 2) invoice must compound +10% to ₹60,500");
assert.strictEqual(invYr2.completedIntervals, 2);
console.log("PASS 8: Automatic Rental Increment ('Every Year' & 'After 3 Years') and escalated GST Tax Invoice generation verified.");

// 11. Test B2B Rent per Month in Sq. Ft., CAM Charges & Auto-Bill Separate CAM GST Invoice
assert(htmlContent.includes('id="tmB2bAreaSqFtInput"'), "Tenant Master B2B section must include #tmB2bAreaSqFtInput");
assert(htmlContent.includes('id="tmB2bRentPerSqFtInput"'), "Tenant Master B2B section must include #tmB2bRentPerSqFtInput");
assert(htmlContent.includes('id="tmB2bCamPerSqFtInput"'), "Tenant Master B2B section must include #tmB2bCamPerSqFtInput");
assert(htmlContent.includes('id="tmB2bCamAmountInput"'), "Tenant Master B2B section must include #tmB2bCamAmountInput");
assert(htmlContent.includes('id="tmB2bAutoCamInvoiceCheckbox"'), "Tenant Master B2B section must include #tmB2bAutoCamInvoiceCheckbox");

// Test two-way live calculation: 2000 Sq.Ft @ ₹120/Sq.Ft Rent = ₹2,40,000/mo & ₹18/Sq.Ft CAM = ₹36,000/mo
getEl("tmIsB2bCheckbox").checked = true;
getEl("tmUnitSelect").value = mallProp.name;
getEl("tmB2bAreaSqFtInput").value = "2000";
getEl("tmB2bRentPerSqFtInput").value = "120";
sandbox.recalculateTmB2bSqFtAndCam("rentPerSqFt");
assert.strictEqual(Number(getEl("tmRentInput").value), 240000, "2000 Sq.Ft × ₹120/Sq.Ft must auto-calculate Monthly Rent = ₹2,40,000");

getEl("tmB2bCamPerSqFtInput").value = "18";
sandbox.recalculateTmB2bSqFtAndCam("camPerSqFt");
assert.strictEqual(Number(getEl("tmB2bCamAmountInput").value), 36000, "2000 Sq.Ft × ₹18/Sq.Ft must auto-calculate Monthly CAM = ₹36,000");

// Register B2B tenant with Rent/Sq.Ft and Separate CAM Auto-Billing via Tenant Master form
getEl("tmNameInput").value = "Karan Singhania";
getEl("tmMobileInput").value = "9811223344";
getEl("tmEmailInput").value = "accounts@singhaniaretail.in";
getEl("tmBusinessNameInput").value = "Singhania Luxury Retail Pvt Ltd";
getEl("tmGstinInput").value = "07AAACS9988K1Z2";
getEl("tmB2bPanInput").value = "AAACS9988K";
getEl("tmBillingAddressInput").value = "Shop G-14, Select Citywalk Mall, Saket, New Delhi - 110017";
getEl("tmB2bAutoCamInvoiceCheckbox").checked = true;
getEl("tmB2bIncrementPeriodSelect").value = "Every Year";
getEl("tmB2bIncrementPctInput").value = "10";
getEl("tmStartDateInput").value = "2026-10-01";

tmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const camB2bTenant = sandbox.state.tenants.find((t) => t.gstin === "07AAACS9988K1Z2");
assert(camB2bTenant, "Registered B2B Tenant with Sq.Ft & CAM should exist in state.tenants");
assert.strictEqual(camB2bTenant.areaSqFt, 2000);
assert.strictEqual(camB2bTenant.rentPerSqFt, 120);
assert.strictEqual(camB2bTenant.rent, 240000);
assert.strictEqual(camB2bTenant.camRatePerSqFt, 18);
assert.strictEqual(camB2bTenant.camAmount, 36000);
assert.strictEqual(camB2bTenant.autoBillCamSeparateInvoice, true);

// Verify separate invoices were automatically generated: 1 for Monthly Rent, 1 for Monthly CAM
const rentInvId = "inv_oct_2026_" + camB2bTenant.id;
const camInvId = "cam_inv_oct_2026_" + camB2bTenant.id;
const rentInvoice = sandbox.state.gstInvoices[rentInvId] || sandbox.generateGstInvoiceForTenant(camB2bTenant.id, "Oct 2026");
const camInvoice = sandbox.state.gstInvoices[camInvId] || sandbox.generateCamInvoiceForTenant(camB2bTenant.id, "Oct 2026");

assert(rentInvoice, "Monthly Rent GST Invoice must be generated");
assert(camInvoice, "Separate Monthly CAM GST Invoice must be auto-generated");
assert.notStrictEqual(rentInvoice.id, camInvoice.id, "Rent Invoice and CAM Invoice must have separate IDs");
assert.notStrictEqual(rentInvoice.invoiceNo, camInvoice.invoiceNo, "Rent Invoice and CAM Invoice must have separate Invoice Numbers");
assert.strictEqual(rentInvoice.invoiceType, "RENT");
assert.strictEqual(camInvoice.invoiceType, "CAM");
assert(camInvoice.invoiceNo.startsWith("CAM-GST/"), "Separate CAM Invoice No must use CAM-GST/ prefix");
assert.strictEqual(camInvoice.sacCode, "997222", "CAM Invoice SAC Code should be 997222");
assert.strictEqual(rentInvoice.taxableRent, 240000, "Rent Invoice taxable value should be ₹2,40,000");
assert.strictEqual(rentInvoice.totalAmount, 283200, "Rent Invoice total with 18% GST should be ₹2,83,200");
assert.strictEqual(camInvoice.taxableRent, 36000, "Separate CAM Invoice taxable value should be ₹36,000");
assert.strictEqual(camInvoice.cgstAmount, 3240, "CAM CGST (9%) should be ₹3,240");
assert.strictEqual(camInvoice.sgstAmount, 3240, "CAM SGST (9%) should be ₹3,240");
assert.strictEqual(camInvoice.totalAmount, 42480, "Separate CAM Invoice total with 18% GST should be ₹42,480");
console.log("PASS 9: B2B Rent per Month in Sq. Ft., CAM calculation & Auto-Billing in Separate CAM GST Invoice verified.");

// 12. Test Exact Start-to-End Dates in Invoice "Service Period" and "Billing Period" (e.g., 01-Nov-2026 to 30-Nov-2026)
const novRange = sandbox.getBillingMonthDateRange("Nov 2026");
assert.strictEqual(novRange.startDate, "01-Nov-2026");
assert.strictEqual(novRange.endDate, "30-Nov-2026");
assert.strictEqual(novRange.rangeText, "01-Nov-2026 to 30-Nov-2026");

const octRange = sandbox.getBillingMonthDateRange("Oct 2026");
assert.strictEqual(octRange.rangeText, "01-Oct-2026 to 31-Oct-2026");

const febRange = sandbox.getBillingMonthDateRange("Feb 2027");
assert.strictEqual(febRange.rangeText, "01-Feb-2027 to 28-Feb-2027");

const novInvoice = sandbox.generateGstInvoiceForTenant(camB2bTenant.id, "Nov 2026", true);
assert.strictEqual(novInvoice.billingPeriodRange, "01-Nov-2026 to 30-Nov-2026");
assert.strictEqual(novInvoice.invoiceDate, "01-Nov-2026");
assert.strictEqual(novInvoice.invoiceEndDate, "30-Nov-2026");

sandbox.openGstInvoiceModal(novInvoice.id);
assert.strictEqual(getEl("invMetaPeriod").textContent, "01-Nov-2026 to 30-Nov-2026", "Billing Period in Invoice Meta Strip must show exact date range '01-Nov-2026 to 30-Nov-2026'");
assert(getEl("invItemPeriodNote").textContent.startsWith("Service Period: 01-Nov-2026 to 30-Nov-2026"), "Service Period line item note must start with 'Service Period: 01-Nov-2026 to 30-Nov-2026'");
assert(!getEl("invItemPeriodNote").textContent.includes("to Month End"), "Service Period must not say 'to Month End'");
console.log("PASS 10: Exact start-to-end date range (01-Nov-2026 to 30-Nov-2026) verified in Invoice Service Period and Billing Period.");

// 13. Test Company Logo Upload for Tax Invoice, Removal of Old Title Wording & Redesigned Invoice Header
assert(!htmlContent.includes("Rent & Property Master Suite — Dashboard, Property Master & Agreement Studio"), "Old 'Rent & Property Master Suite — Dashboard, Property Master & Agreement Studio' wording must be removed");
assert(!htmlContent.includes("FORM GST INV-1 · TAX INVOICE"), "Old 'FORM GST INV-1 · TAX INVOICE' header should be replaced by redesigned header");
assert(!htmlContent.includes("TAX INVOICE FOR RENTAL SERVICES"), "Old 'TAX INVOICE FOR RENTAL SERVICES' header should be replaced by redesigned header");
assert(htmlContent.includes('id="invCompanyLogoImg"'), "Invoice must include #invCompanyLogoImg for printing company logo");
assert(htmlContent.includes('id="gstModalUploadLogoBtn"'), "Invoice modal must include #gstModalUploadLogoBtn");
assert(htmlContent.includes('id="landlordProfileLogoInput"'), "Landlord Profile modal must include #landlordProfileLogoInput");
assert(htmlContent.includes('id="invHeaderDocTitle"'), "Redesigned invoice header must include #invHeaderDocTitle");

const sampleLogoDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
sandbox.saveCompanyLogoDataUrl(sampleLogoDataUrl);
assert.strictEqual(sandbox.state.landlord.companyLogo, sampleLogoDataUrl, "Company logo DataURL must be saved in state.landlord.companyLogo");
assert.strictEqual(getEl("invCompanyLogoImg").src, sampleLogoDataUrl, "#invCompanyLogoImg src must be updated to uploaded Company Logo");
assert.strictEqual(getEl("invCompanyLogoContainer").classList.contains("hidden"), false, "#invCompanyLogoContainer must be visible when logo is uploaded");
assert.strictEqual(getEl("invCompanyLogoPlaceholder").classList.contains("hidden"), true, "#invCompanyLogoPlaceholder must be hidden when logo is uploaded");
console.log("PASS 11: Company Logo upload on Tax Invoice, removal of old suite title wording & redesigned Tax Invoice letterhead verified.");

// 14. Test Future Date Invoices Hidden & Tab 8 "8. Rental Schedules" (Tenant-wise Lease Start to Lease End Schedule)
assert.strictEqual(sandbox.isFutureBillingMonth("Oct 2026", "Oct 2026"), false, "Current month Oct 2026 should not be future");
assert.strictEqual(sandbox.isFutureBillingMonth("Sep 2026", "Oct 2026"), false, "Past month Sep 2026 should not be future");
assert.strictEqual(sandbox.isFutureBillingMonth("Nov 2026", "Oct 2026"), true, "Nov 2026 must be detected as future billing month");
assert.strictEqual(sandbox.isFutureBillingMonth("Apr 2029", "Oct 2026"), true, "Apr 2029 must be detected as future billing month");

// Verify future-dated invoices were purged when rendering GST Invoices tab
sandbox.purgeFutureDateInvoicesFromState("Oct 2026");
const remainingFutureInvoices = Object.values(sandbox.state.gstInvoices).filter((inv) =>
  sandbox.isFutureBillingMonth(inv.billingMonth, "Oct 2026")
);
assert.strictEqual(remainingFutureInvoices.length, 0, "All future-dated invoices must be purged/excluded from GST Invoices state when rendering Invoices tab");

// Verify Tab 8 "8. Rental Schedules" exists in HTML & switches properly
assert(htmlContent.includes('id="tabBtnSchedules"'), "Tab button #tabBtnSchedules must exist");
assert(htmlContent.includes('8. Rental Schedules'), "Tab button must be labeled '8. Rental Schedules'");
assert(htmlContent.includes('id="tabViewSchedules"'), "Tab view #tabViewSchedules must exist");

const scheduleAnnual = sandbox.generateTenantRentalSchedule(annualTenant);
assert(scheduleAnnual, "generateTenantRentalSchedule must return a valid schedule object for annualTenant");
assert.strictEqual(scheduleAnnual.totalMonths, 36, "3-year lease (2025-10-01 to 2028-09-30) must generate 36 monthly schedule rows");
assert.strictEqual(scheduleAnnual.rows[0].monthIndex, 1, "First row must be Month 1");
assert.strictEqual(scheduleAnnual.rows[0].billingMonth, "Oct 2025", "First row must start at Lease Start month Oct 2025");
assert.strictEqual(scheduleAnnual.rows[0].monthlyRent, 50000, "Month 1 rent must be base rent ₹50,000");
assert.strictEqual(scheduleAnnual.rows[11].billingMonth, "Sep 2026", "Month 12 must be Sep 2026 (end of Year 1)");
assert.strictEqual(scheduleAnnual.rows[11].monthlyRent, 50000, "Month 12 rent must still be ₹50,000");
assert.strictEqual(scheduleAnnual.rows[12].billingMonth, "Oct 2026", "Month 13 must be Oct 2026 (start of Year 2)");
assert.strictEqual(scheduleAnnual.rows[12].monthlyRent, 55000, "Month 13 rent must escalate by 10% to ₹55,000");
assert.strictEqual(scheduleAnnual.rows[24].billingMonth, "Oct 2027", "Month 25 must be Oct 2027 (start of Year 3)");
assert.strictEqual(scheduleAnnual.rows[24].monthlyRent, 60500, "Month 25 rent must escalate by another 10% to ₹60,500");
assert.strictEqual(scheduleAnnual.rows[35].billingMonth, "Sep 2028", "Last row (Month 36) must be Lease End month Sep 2028");
assert.strictEqual(scheduleAnnual.slabs.length, 3, "3-year lease with annual escalation must have 3 escalation slabs");

// Also test 9-year B2B lease with 'After 3 Years' (+15%)
const nineYearB2b = {
  id: "ten_9yr_b2b",
  name: "Vikramaditya Rao",
  businessName: "Apex Global Logistics Pvt Ltd",
  isB2B: true,
  gstin: "07AABCA1122B1Z5",
  unit: mallProp.name,
  baseRent: 85000,
  rent: 85000,
  incrementPeriod: "After 3 Years",
  incrementPct: 15,
  startDate: "2026-04-01",
  endDate: "2035-03-31",
  status: "Active"
};
const scheduleData = sandbox.generateTenantRentalSchedule(nineYearB2b);
assert.strictEqual(scheduleData.totalMonths, 108, "9-year lease (2026-04-01 to 2035-03-31) must generate 108 monthly schedule rows");
assert.strictEqual(scheduleData.rows[0].billingMonth, "Apr 2026", "First row must start at Lease Start month Apr 2026");
assert.strictEqual(scheduleData.rows[0].monthlyRent, 85000, "Month 1 rent must be base rent ₹85,000");
assert.strictEqual(scheduleData.rows[35].billingMonth, "Mar 2029", "Month 36 must be Mar 2029 (end of Slab 1)");
assert.strictEqual(scheduleData.rows[35].monthlyRent, 85000, "Month 36 rent must still be ₹85,000 before 3-year escalation");
assert.strictEqual(scheduleData.rows[36].billingMonth, "Apr 2029", "Month 37 must be Apr 2029 (start of Slab 2 after 3 years)");
assert.strictEqual(scheduleData.rows[36].monthlyRent, 97750, "Month 37 rent must escalate by 15% to ₹97,750");
assert.strictEqual(scheduleData.rows[107].billingMonth, "Mar 2035", "Last row (Month 108) must be Lease End month Mar 2035");
assert.strictEqual(scheduleData.rows[107].monthlyRent, 112412, "Month 108 rent must reflect second 15% escalation (₹1,12,412)");
assert(scheduleData.slabs.length === 3, "9-year lease with 3-year escalation must have 3 escalation slabs");

sandbox.switchTab("schedules");
assert.strictEqual(getEl("tabViewSchedules").classList.contains("hidden"), false, "#tabViewSchedules must be visible when switched to 'schedules' tab");
assert(getEl("rentalSchedulesContainer").innerHTML.includes("Mehta Retail Pvt Ltd"), "Rental Schedules container must render tenant-wise schedule for Mehta Retail Pvt Ltd");
console.log("PASS 12: Future-date invoices hidden from Invoices tab & Tab 8 ('8. Rental Schedules') tenant-wise schedule from Lease Start to Lease End verified.");

// 15. Test Rent Start Date in Tenant Master & Advance Invoice Generation from Rent Start Date
assert(htmlContent.includes('id="tmRentStartDateInput"'), "Tenant Master form must include #tmRentStartDateInput");
assert(htmlContent.includes('id="tmSyncRentStartBtn"'), "Tenant Master form must include #tmSyncRentStartBtn");
assert(htmlContent.includes('id="modalTenantRentStart"'), "Link Tenant Modal must include #modalTenantRentStart");

// Register a tenant with Lease Start = 2026-08-01 (Fit-out) and Rent Start Date = 2026-10-15 (Actual Rent Start)
getEl("tmNameInput").value = "Ananya Deshmukh";
getEl("tmMobileInput").value = "9899776655";
getEl("tmEmailInput").value = "ananya@deshmukhbrands.in";
getEl("tmUnitSelect").value = mallProp.name;
getEl("tmRentInput").value = "150000";
getEl("tmStartDateInput").value = "2026-08-01";
getEl("tmRentStartDateInput").value = "2026-10-15";
getEl("tmEndDateInput").value = "2027-07-31";
getEl("tmIsB2bCheckbox").checked = true;
getEl("tmBusinessNameInput").value = "Deshmukh Fashion Retail Pvt Ltd";
getEl("tmGstinInput").value = "07AAACD5544E1Z8";
getEl("tmB2bPanInput").value = "AAACD5544E";
getEl("tmBillingAddressInput").value = "Unit 202, Select Citywalk, Saket, New Delhi";

tmForm.dispatchEvent({ type: "submit", preventDefault: () => { } });

const rentStartTenant = sandbox.state.tenants.find((t) => t.gstin === "07AAACD5544E1Z8");
assert(rentStartTenant, "Tenant with Rent Start Date must be saved in state.tenants");
assert.strictEqual(rentStartTenant.startDate, "2026-08-01", "Lease Start Date must be 2026-08-01");
assert.strictEqual(rentStartTenant.rentStartDate, "2026-10-15", "Rent Start Date must be 2026-10-15");

// Verify actual rent does not start in Aug/Sep 2026, and starts in Oct 2026
assert.strictEqual(sandbox.isTenantRentStartedByMonth(rentStartTenant, "Aug 2026"), false, "Actual rent must not start in Aug 2026 (before Rent Start Date)");
assert.strictEqual(sandbox.isTenantRentStartedByMonth(rentStartTenant, "Sep 2026"), false, "Actual rent must not start in Sep 2026 (before Rent Start Date)");
assert.strictEqual(sandbox.isTenantRentStartedByMonth(rentStartTenant, "Oct 2026"), true, "Actual rent must start in Oct 2026 (on Rent Start Date)");

// Verify advance invoice was automatically generated from Rent Start Date (15-Oct-2026 to 31-Oct-2026)
const advInvId = "inv_oct_2026_" + rentStartTenant.id;
const advInv = sandbox.state.gstInvoices[advInvId];
assert(advInv, "Advance GST Invoice must be automatically generated for Oct 2026 from Rent Start Date");
assert.strictEqual(advInv.billingMode, "Advance", "Invoice billingMode must be 'Advance'");
assert.strictEqual(advInv.rentStartDate, "2026-10-15", "Invoice must record rentStartDate '2026-10-15'");
assert.strictEqual(advInv.invoiceDate, "15-Oct-2026", "Advance Invoice Date for initial month must start from exact Rent Start Date '15-Oct-2026'");
assert.strictEqual(advInv.billingPeriodRange, "15-Oct-2026 to 31-Oct-2026", "Billing Period for initial month must be '15-Oct-2026 to 31-Oct-2026'");

// Verify proportional rent calculation for the remaining 17 days in October (31 - 15 + 1 = 17 days):
// Proportional rent: Math.round(150000 * 17 / 31) = 82258
assert.strictEqual(advInv.taxableRent, 82258, "Taxable rent must be proportionally calculated for remaining 17 days: ₹82,258");
assert.strictEqual(advInv.isProrated, true, "Advance Invoice must be marked isProrated: true");
assert.strictEqual(advInv.proratedDays, 17, "Invoice must record 17 prorated days");
assert(advInv.prorationNote.includes("Rent calculated for 17 Days"), "Proration note must state 'Rent calculated for 17 Days'");
assert(advInv.escalationSummary.includes("Rent calculated for 17 Days"), "Escalation/Proration summary must state 'Rent calculated for 17 Days'");

// Test opening the GST Invoice Modal to verify modal UI displays proportional calculation and 'Rent calculated for 17 Days'
sandbox.openGstInvoiceModal(advInvId);
const itemDesc = getEl("invItemDescription").textContent;
const itemNote = getEl("invItemPeriodNote").textContent;
const escCond = getEl("invEscalationConditionTag").textContent;
const escSumm = getEl("invEscalationSummaryText").textContent;
assert(itemDesc.includes("Rent calculated for 17 Days"), "Line item description must state 'Rent calculated for 17 Days'");
assert(itemNote.includes("Rent calculated for 17 Days"), "Line item period note must state 'Rent calculated for 17 Days'");
assert(escCond.includes("Rent calculated for 17 Days"), "Escalation condition tag must state 'Rent calculated for 17 Days'");
assert(escSumm.includes("Rent calculated for 17 Days"), "Escalation summary must state 'Rent calculated for 17 Days'");

// Verify Rental Schedule respects Rent Start Date (Aug & Sep = ₹0 Fit-out, Oct is proportional for 17 days)
const rsSched = sandbox.generateTenantRentalSchedule(rentStartTenant);
assert.strictEqual(rsSched.rows[0].billingMonth, "Aug 2026");
assert.strictEqual(rsSched.rows[0].monthlyRent, 0, "Aug 2026 (before Rent Start Date) must have ₹0 rent");
assert.strictEqual(rsSched.rows[1].billingMonth, "Sep 2026");
assert.strictEqual(rsSched.rows[1].monthlyRent, 0, "Sep 2026 (before Rent Start Date) must have ₹0 rent");
assert.strictEqual(rsSched.rows[2].billingMonth, "Oct 2026");
assert.strictEqual(rsSched.rows[2].monthlyRent, 82258, "Oct 2026 (Rent Start month) must bill proportional rent ₹82,258 for 17 days");
assert.strictEqual(rsSched.rows[2].isProrated, true, "Oct 2026 schedule row must be flagged as isProrated: true");
assert.strictEqual(rsSched.rows[2].proratedDays, 17, "Oct 2026 schedule row must record 17 prorated days");
assert.strictEqual(rsSched.rows[2].periodRange, "15-Oct-2026 to 31-Oct-2026", "Oct 2026 schedule row must start on 15-Oct-2026");
assert.strictEqual(rsSched.rows[2].advanceInvoiceDate, "15-Oct-2026", "Oct 2026 Advance Invoice Date must be 15-Oct-2026");

// Verify subsequent month (Nov 2026) bills full standard monthly rent ₹1,50,000
assert.strictEqual(rsSched.rows[3].billingMonth, "Nov 2026");
assert.strictEqual(rsSched.rows[3].monthlyRent, 150000, "Nov 2026 onwards must bill full scheduled rent ₹1,50,000");
assert.strictEqual(rsSched.rows[3].isProrated, false, "Nov 2026 must not be prorated");
console.log("PASS 13: Rent Start Date in Tenant Master & proportional Advance Invoice (17 Days) from Rent Start Date verified.");

// 16. Test Tab 8 Excel Export & One-Page Tenant Master UI view
assert(htmlContent.includes('id="exportRentalSchedulesExcelBtn"'), "Tab 8 must have #exportRentalSchedulesExcelBtn for Excel download");
assert(htmlContent.includes("exportRentalSchedulesExcel("), "Schedule cards must include 1-click exportRentalSchedulesExcel() triggers");

// Test runtime exportRentalSchedulesExcel
assert.strictEqual(typeof sandbox.exportRentalSchedulesExcel, "function", "exportRentalSchedulesExcel function must be exposed");

// Calling exportRentalSchedulesExcel() for all tenants
const fullCsv = sandbox.exportRentalSchedulesExcel();
assert(fullCsv.startsWith("\uFEFF"), "Excel CSV must begin with UTF-8 BOM (\\uFEFF) for seamless Microsoft Excel opening");
assert(fullCsv.includes("TENANT-WISE RENTAL SCHEDULE (LEASE START TO LEASE END)"), "CSV must include main header");
assert(fullCsv.includes("Lessor / Company:"), "CSV must include Lessor details");
assert(fullCsv.includes("Deshmukh Fashion Retail Pvt Ltd") || fullCsv.includes("Singhania Luxury Retail Pvt Ltd"), "CSV must include tenant business names");
assert(fullCsv.includes("Billing Month") && fullCsv.includes("Billing Period (Exact Dates)"), "CSV must include granular column headers");
assert(fullCsv.includes("Rent / Sq.Ft (₹)") && fullCsv.includes("Separate Monthly CAM (₹)"), "CSV must include Sq.Ft and CAM headers");
assert(fullCsv.includes("GST 18% (₹)") && fullCsv.includes("Total Monthly Outflow (₹)"), "CSV must include GST and total outflow");
assert(fullCsv.includes("TOTAL ACROSS ENTIRE LEASE PERIOD"), "CSV must include summary row across entire lease period");

// Calling exportRentalSchedulesExcel(specificTenantId) for a single tenant
const singleTenantCsv = sandbox.exportRentalSchedulesExcel(rentStartTenant.id);
assert(singleTenantCsv.includes("Deshmukh Fashion Retail Pvt Ltd"), "Single tenant export must include that tenant");
assert(singleTenantCsv.includes("Rent Start Date") && singleTenantCsv.includes("15-Oct-2026"), "Single tenant export must record Rent Start Date 15-Oct-2026");

// Verify One-Page Tenant Master layout in HTML
assert(htmlContent.includes("Tenant Master — Register Permanent Tenant Profile"), "Header title must be preserved");
assert(htmlContent.includes('id="tmFormCollapseToggleBtn"'), "Collapse/Expand toggle button must be present");
assert(htmlContent.includes('id="tmNameInput"'), "#tmNameInput must be present");
assert(htmlContent.includes('id="tmRentStartDateInput"'), "#tmRentStartDateInput must be present");
assert(htmlContent.includes('id="tmPanInput"'), "#tmPanInput must be present");
assert(htmlContent.includes('id="tmAadhaarInput"'), "#tmAadhaarInput must be present");
console.log("PASS 14: Tab 8 Excel (.CSV) Export & Ergonomic One-Page Tenant Master UI verified.");

console.log("\n🎉 ALL B2B TENANT & SECURITY TESTS PASSED!");
