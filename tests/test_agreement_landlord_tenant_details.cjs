const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("======================================================================");
console.log("🧪 TESTING AGREEMENT LANDLORD & TENANT DETAILS (PAN, AADHAAR, ETC.)");
console.log("======================================================================");

const indexPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(indexPath, 'utf8');

// 1. Static DOM Structure Validations
assert(htmlContent.includes('id="studioLandlordAadhaarInput"'), "Agreement Studio must have #studioLandlordAadhaarInput");
assert(htmlContent.includes('id="studioTenantPanInput"'), "Agreement Studio must have #studioTenantPanInput");
assert(htmlContent.includes('id="studioTenantAadhaarInput"'), "Agreement Studio must have #studioTenantAadhaarInput");

assert(htmlContent.includes('id="previewLessorContainer"'), "Option 1 must have #previewLessorContainer");
assert(htmlContent.includes('id="previewLesseeContainer"'), "Option 1 must have #previewLesseeContainer");
assert(htmlContent.includes('id="preview2OwnerContainer"'), "Option 2 must have #preview2OwnerContainer");
assert(htmlContent.includes('id="preview2TenantContainer"'), "Option 2 must have #preview2TenantContainer");

console.log("  ✔ Static DOM elements for Landlord and Tenant particulars verified.");

// 2. Setup VM Sandbox for Runtime Execution
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

console.log("  ✔ Application initialized in VM successfully.");

// 3. Test Landlord Details in Option 2 & Option 1 Previews
getEl("studioLandlordNameInput").value = "Virender Kumar";
getEl("studioLandlordPanInput").value = "AAAPV1234F";
getEl("studioLandlordAadhaarInput").value = "5544 3322 1100";
getEl("studioLandlordFatherInput").value = "Late Sh. Ram Kumar";
getEl("studioLandlordPhoneInput").value = "+91 9988776655";
getEl("studioLandlordEmailInput").value = "virender@example.com";
getEl("studioLandlordAddressInput").value = "Flat 401, Pocket C, Vasant Kunj, New Delhi - 110070";

// Test Residential Tenant in Option 2
getEl("studioTemplateSelect").value = "opt2";
getEl("studioTenantNameInput").value = "Pooja Verma";
getEl("studioTenantPanInput").value = "BBBPV5678K";
getEl("studioTenantAadhaarInput").value = "9988 7766 5544";
getEl("studioMobileInput").value = "9876543210";
getEl("studioEmailInput").value = "pooja.verma@example.com";
getEl("studioTenantFatherInput").value = "Sh. Mohan Lal Verma";
getEl("studioTenantWorkInput").value = "Tech Lead at Microsoft India, Gurugram";
getEl("studioTenantPermAddressInput").value = "House No. 52, Model Town, Jalandhar, Punjab - 144003";

sandbox.updateLiveAgreementPreview();

// Verify Option 2 Landlord details rendered
const p2OwnerHtml = getEl("preview2OwnerContainer").innerHTML;
assert(p2OwnerHtml.includes("Virender Kumar"), "Option 2 owner container must include Landlord legal name");
assert(p2OwnerHtml.includes("AAAPV1234F"), "Option 2 owner container must include Landlord PAN");
assert(p2OwnerHtml.includes("5544 3322 1100"), "Option 2 owner container must include Landlord Aadhaar");
assert(p2OwnerHtml.includes("Late Sh. Ram Kumar"), "Option 2 owner container must include Landlord Father's name");
assert(p2OwnerHtml.includes("+91 9988776655"), "Option 2 owner container must include Landlord Mobile");
assert(p2OwnerHtml.includes("virender@example.com"), "Option 2 owner container must include Landlord Email");
assert(p2OwnerHtml.includes("Vasant Kunj"), "Option 2 owner container must include Landlord Residential Address");
console.log("  ✔ Option 2: Landlord Legal Name, Father, PAN, Aadhaar, Mobile, Email, and Address rendered accurately.");

// Verify Option 2 Residential Tenant details rendered
const p2TenantHtml = getEl("preview2TenantContainer").innerHTML;
assert(p2TenantHtml.includes("Pooja Verma"), "Option 2 tenant container must include Tenant name");
assert(p2TenantHtml.includes("Sh. Mohan Lal Verma"), "Option 2 tenant container must include Tenant Father's name");
assert(p2TenantHtml.includes("BBBPV5678K"), "Option 2 tenant container must include Tenant PAN");
assert(p2TenantHtml.includes("9988 7766 5544"), "Option 2 tenant container must include Tenant Aadhaar");
assert(p2TenantHtml.includes("9876543210"), "Option 2 tenant container must include Tenant Mobile");
assert(p2TenantHtml.includes("pooja.verma@example.com"), "Option 2 tenant container must include Tenant Email");
assert(p2TenantHtml.includes("Microsoft India"), "Option 2 tenant container must include Tenant Workplace");
assert(p2TenantHtml.includes("Model Town, Jalandhar"), "Option 2 tenant container must include Tenant Permanent Address");
console.log("  ✔ Option 2: Residential Tenant Legal Name, Father, PAN, Aadhaar, Mobile, Email, Workplace, and Permanent Address rendered.");

// 4. Test Option 1 (11-Month Tenancy Agreement)
getEl("studioTemplateSelect").value = "opt1";
sandbox.updateLiveAgreementPreview();

const p1LessorHtml = getEl("previewLessorContainer").innerHTML;
assert(p1LessorHtml.includes("Virender Kumar"), "Option 1 lessor container must include Landlord legal name");
assert(p1LessorHtml.includes("AAAPV1234F"), "Option 1 lessor container must include Landlord PAN");
assert(p1LessorHtml.includes("5544 3322 1100"), "Option 1 lessor container must include Landlord Aadhaar");
assert(p1LessorHtml.includes("Late Sh. Ram Kumar"), "Option 1 lessor container must include Landlord Father");
assert(p1LessorHtml.includes("+91 9988776655"), "Option 1 lessor container must include Landlord Mobile");
assert(p1LessorHtml.includes("virender@example.com"), "Option 1 lessor container must include Landlord Email");
console.log("  ✔ Option 1: Lessor Legal Name, Father, PAN, Aadhaar, Mobile, and Email rendered.");

const p1LesseeHtml = getEl("previewLesseeContainer").innerHTML;
assert(p1LesseeHtml.includes("Pooja Verma"), "Option 1 lessee container must include Tenant name");
assert(p1LesseeHtml.includes("BBBPV5678K"), "Option 1 lessee container must include Tenant PAN");
assert(p1LesseeHtml.includes("9988 7766 5544"), "Option 1 lessee container must include Tenant Aadhaar");
assert(p1LesseeHtml.includes("9876543210"), "Option 1 lessee container must include Tenant Mobile");
console.log("  ✔ Option 1: Lessee Legal Name, Father, PAN, Aadhaar, and Mobile rendered.");

// 5. Test B2B Commercial Tenant Particulars & Zero Duplicate Clauses
const b2bTenant = {
  id: "t_b2b_corp_test",
  name: "Rajiv Malhotra",
  fatherName: "Sh. H.P. Malhotra",
  isB2B: true,
  businessName: "Nexus Digital Innovations Pvt Ltd",
  b2bLogo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==",
  gstin: "07AAACN1234M1Z8",
  pan: "AAACN1234M",
  aadhaar: "8877 6655 4433",
  billingAddress: "Tower B, 12th Floor, Cyber City Phase 2, Gurugram, HR - 122002",
  mobile: "9911223344",
  email: "legal@nexusdigital.com",
  rent: 150000,
  areaSqFt: 1500,
  rentPerSqFt: 100,
  camAmount: 15000,
  camRatePerSqFt: 10,
  leasePeriod: "3 Years (36 Months)",
  lockInPeriod: "1 Year (12 Months)",
  incrementPct: 10,
  incrementPeriod: "Every Year",
  customClauses: [
    "B2B COMMERCIAL LEASE & ESCALATION CLAUSE: 10% Every Year", // duplicate of core
    "The Lessee shall maintain fire insurance covering interior fit-outs and trade stock.",
    "The Lessee shall maintain fire insurance covering interior fit-outs and trade stock.", // exact duplicate
    "The Lessee shall be permitted 24x7 server room operation and biometric access."
  ]
};

sandbox.state.tenants.push(b2bTenant);
getEl("studioTenantSelect").value = b2bTenant.id;
sandbox.populateAgreementStudioFromTenant(b2bTenant.id);

// Check that inputs got populated
assert.strictEqual(getEl("studioTenantNameInput").value, "Rajiv Malhotra");
assert.strictEqual(getEl("studioTenantPanInput").value, "AAACN1234M");
assert.strictEqual(getEl("studioTenantAadhaarInput").value, "8877 6655 4433");

// Test Option 2 with B2B Tenant
getEl("studioTemplateSelect").value = "opt2";
sandbox.updateLiveAgreementPreview();

const b2bOpt2Html = getEl("preview2TenantContainer").innerHTML;
assert(b2bOpt2Html.includes("Nexus Digital Innovations Pvt Ltd"), "Option 2 must feature Company Business Name");
assert(b2bOpt2Html.includes("07AAACN1234M1Z8"), "Option 2 must feature GSTIN");
assert(b2bOpt2Html.includes("AAACN1234M"), "Option 2 must feature Entity PAN");
assert(b2bOpt2Html.includes("Tower B, 12th Floor, Cyber City"), "Option 2 must feature Registered Billing Address");
assert(b2bOpt2Html.includes("Rajiv Malhotra"), "Option 2 must feature Authorized Signatory Name");
assert(b2bOpt2Html.includes("Sh. H.P. Malhotra"), "Option 2 must feature Signatory Father");
assert(b2bOpt2Html.includes("8877 6655 4433"), "Option 2 must feature Signatory Aadhaar");
assert(b2bOpt2Html.includes("data:image/svg+xml"), "Option 2 must display B2B Brand Logo");
console.log("  ✔ Option 2: B2B Commercial Entity Name, GSTIN, Entity PAN, Logo, Billing Address, and Authorized Signatory particulars rendered.");

// Test Option 1 with B2B Tenant
getEl("studioTemplateSelect").value = "opt1";
sandbox.updateLiveAgreementPreview();

const b2bOpt1Html = getEl("previewLesseeContainer").innerHTML;
assert(b2bOpt1Html.includes("Nexus Digital Innovations Pvt Ltd"), "Option 1 must feature Company Business Name");
assert(b2bOpt1Html.includes("07AAACN1234M1Z8"), "Option 1 must feature GSTIN");
assert(b2bOpt1Html.includes("AAACN1234M"), "Option 1 must feature Entity PAN");
assert(b2bOpt1Html.includes("8877 6655 4433"), "Option 1 must feature Signatory Aadhaar");
assert(b2bOpt1Html.includes("data:image/svg+xml"), "Option 1 must display B2B Brand Logo");
console.log("  ✔ Option 1: B2B Commercial Lessee Entity Name, GSTIN, Entity PAN, Logo, and Signatory particulars rendered.");

// 6. Test Deduplication (Zero Duplicate Clauses)
const testClauses = [
  "Clause A: The Lessee shall maintain the premises in good tenable condition.",
  "Clause A: The Lessee shall maintain the premises in good tenable condition.", // exact duplicate
  "CLAUSE A: The Lessee shall maintain the premises in good tenable condition. ", // case/whitespace duplicate
  "Clause B: No structural modifications without prior written consent.",
  "B2B COMMERCIAL LEASE & ESCALATION CLAUSE: 10% annual escalation", // redundant B2B preset
  "RENTAL INCREMENT CLAUSE: 10% yearly" // redundant B2B preset
];

const dedupedRes = sandbox.deduplicateClauses(testClauses, { removeB2bPresets: true });
assert.strictEqual(dedupedRes.length, 2, "Deduplication must reduce test clauses to exactly 2 non-duplicate, non-redundant clauses");
assert.strictEqual(dedupedRes[0], "Clause A: The Lessee shall maintain the premises in good tenable condition.");
assert.strictEqual(dedupedRes[1], "Clause B: No structural modifications without prior written consent.");
console.log("  ✔ Zero duplicate clauses: deduplicateClauses correctly removes duplicates and redundant core B2B preset clauses.");

// 7. Test Studio Landlord Aadhaar and Tenant PAN/Aadhaar sync via Property selection
const testProp = {
  id: "prop_sync_test",
  name: "Flat 901",
  address: "901 Golf Course Road, Gurugram",
  type: "3 BHK Luxury Apartment",
  rent: 85000,
  deposit: 170000,
  meterNo: "DHBVN-998877"
};
const linkedTenant = {
  id: "t_linked_901",
  name: "Devendra Singhania",
  unit: "Flat 901",
  pan: "DEVPK9901S",
  aadhaar: "1234 4321 9876",
  mobile: "9818001122",
  fatherName: "Late Sh. K. Singhania",
  permAddress: "Singhania Villa, Civil Lines, Kanpur"
};
sandbox.state.properties.push(testProp);
sandbox.state.tenants.push(linkedTenant);

sandbox.populateAgreementStudioFromProperty(testProp.id);
assert.strictEqual(getEl("studioTenantNameInput").value, "Devendra Singhania");
assert.strictEqual(getEl("studioTenantPanInput").value, "DEVPK9901S");
assert.strictEqual(getEl("studioTenantAadhaarInput").value, "1234 4321 9876");
console.log("  ✔ populateAgreementStudioFromProperty correctly auto-fills Tenant PAN and Aadhaar from linked unit.");

console.log("======================================================================");
console.log("🎉 ALL AGREEMENT LANDLORD & TENANT DETAILS TESTS PASSED (100%)");
console.log("======================================================================");
