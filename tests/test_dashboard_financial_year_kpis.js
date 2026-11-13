// tests/test_dashboard_financial_year_kpis.js
// Automated verification suite for Financial Year-wise Dashboard KPIs and YoY Matrix

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log("=== Testing Financial Year-wise Dashboard KPIs & YoY Matrix ===");

const html = fs.readFileSync('index.html', 'utf8');

// -------------------------------------------------------------
// Step 1: Verify Required DOM Elements in HTML
// -------------------------------------------------------------
console.log("\n--- Step 1: Checking Required DOM Elements in HTML ---");
const requiredElementIds = [
  "dashFyActiveBadge",
  "dashFyPeriodSubtitle",
  "dashFyBtnGroup",
  "dashToggleFyComparisonBtn",
  "dashFyComparisonChevron",
  "dashFyComparisonCard",
  "dashFyComparisonTableBody",
  "kpiRentRollPeriodBadge",
  "kpiBoxOccupancy",
  "kpiBoxRentRoll",
  "kpiBoxCollected",
  "kpiBoxOverdue",
  "kpiBoxVacancyTax",
  "totalPropertiesDisplay",
  "occupancyRateDisplay",
  "totalExpectedDisplay",
  "grossPotentialDisplay",
  "totalPaidDisplay",
  "collectionEfficiencyBadge",
  "totalPendingDisplay",
  "overdueCountBadge",
  "vacancyLossDisplay",
  "totalMcdPendingDisplay",
  "dashChartTrajectorySubtitle"
];

requiredElementIds.forEach(id => {
  assert.ok(html.includes(`id="${id}"`), `Missing required element id="${id}" in HTML`);
  console.log(`  ✓ #${id} exists in HTML`);
});

// Check FY pill buttons in HTML
assert.ok(html.includes('data-dash-fy="FY 2026-27"'), 'Missing FY 2026-27 button');
assert.ok(html.includes('data-dash-fy="FY 2025-26"'), 'Missing FY 2025-26 button');
assert.ok(html.includes('data-dash-fy="FY 2024-25"'), 'Missing FY 2024-25 button');
assert.ok(html.includes('data-dash-fy="all"'), 'Missing All-Time button');
console.log("  ✓ All 4 Financial Year selector buttons exist in HTML");

// -------------------------------------------------------------
// Step 2: Test Financial Year Engine in VM Sandbox
// -------------------------------------------------------------
console.log("\n--- Step 2: Testing Financial Year Calculation Engine in Sandbox ---");

class MockClassList extends Set {
  add(cls) { super.add(cls); return this; }
  remove(cls) { super.delete(cls); return this; }
  contains(cls) { return super.has(cls); }
}

class MockElement {
  constructor(id, tagName = "div") {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList();
    this.innerHTML = "";
    this.textContent = "";
    this.style = {};
    this.attributes = {};
    this.listeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(fn => fn(event));
    }
  }
  querySelectorAll(sel) {
    if (sel.includes("[data-dash-fy]")) {
      return this.children || [];
    }
    return [];
  }
}

const domElements = {};
requiredElementIds.forEach(id => {
  domElements[id] = new MockElement(id);
});
domElements.dashFyComparisonCard.classList.add("hidden");

// Create mock pill buttons inside dashFyBtnGroup
const fyPillValues = ["FY 2026-27", "FY 2025-26", "FY 2024-25", "all"];
domElements.dashFyBtnGroup.children = fyPillValues.map(fy => {
  const el = new MockElement("btn_" + fy, "button");
  el.setAttribute("data-dash-fy", fy);
  el.textContent = fy;
  return el;
});

const mockDocument = {
  getElementById: (id) => domElements[id] || new MockElement(id),
  addEventListener: () => {}
};

function formatINR(val) {
  val = Math.round(Number(val) || 0);
  return "₹" + val.toLocaleString("en-IN");
}

const sandbox = {
  document: mockDocument,
  formatINR: formatINR,
  state: {
    properties: [
      { id: "prop_1", name: "Flat 101", building: "Sagarpur", rent: 15000 },
      { id: "prop_2", name: "Flat 102", building: "Sagarpur", rent: 18000 },
      { id: "prop_3", name: "Flat 103", building: "Sagarpur", rent: 20000 },
      { id: "prop_4", name: "Flat 104", building: "Green Park", rent: 25000 }
    ],
    tenants: [
      { id: "ten_1", unit: "Flat 101", name: "Manoj Kumar", rent: 15000, osAmount: 0, status: "Active" },
      { id: "ten_2", unit: "Flat 102", name: "Rohan Khanna", rent: 18000, osAmount: 6000, status: "Active" },
      { id: "ten_3", unit: "Flat 104", name: "Priya Patel", rent: 25000, osAmount: 0, status: "Active" }
      // Flat 103 is vacant
    ],
    mcdRecords: [
      { id: "mcd_1", year: "2026-27", tax: 18400, status: "Pending" }
    ],
    dashSelectedFy: "FY 2026-27",
    dashShowFyComparison: false
  },
  renderDashboardCollectionChart: () => {},
  console: console
};

vm.createContext(sandbox);

// Extract getFinancialYearMetrics, renderDashboardFyComparisonTable, and renderDashboardMetrics from index.html
const getFyMetricsCode = html.match(/function getFinancialYearMetrics\([\s\S]*?\n      \}/)[0];
const renderTableCode = html.match(/function renderDashboardFyComparisonTable\(\)[\s\S]*?\n      \}/)[0];
const renderMetricsCode = html.match(/function renderDashboardMetrics\(\)[\s\S]*?\n      \}/)[0];

vm.runInContext(getFyMetricsCode, sandbox);
vm.runInContext(renderTableCode, sandbox);
vm.runInContext(renderMetricsCode, sandbox);

// Test 2.1: Verify getFinancialYearMetrics for FY 2026-27
console.log("\n--- Testing 2.1: Financial Metrics for FY 2026-27 (Current) ---");
const fy26 = sandbox.getFinancialYearMetrics("FY 2026-27");
assert.strictEqual(fy26.fyLabel, "FY 2026-27");
assert.strictEqual(fy26.occupiedCount, 3, "Expected 3 occupied units");
assert.strictEqual(fy26.vacantCount, 1, "Expected 1 vacant unit");
assert.strictEqual(fy26.occupancyRate, "75.0", "Occupancy rate should be 3/4 = 75.0%");
assert.strictEqual(fy26.monthlyRent, 58000, "Monthly contracted rent should be 15k+18k+25k = 58,000");
assert.strictEqual(fy26.annualDemand, 58000 * 12, "Annual demand should be 58k * 12 = 696,000");
assert.strictEqual(fy26.outstandingOverdue, 6000, "Arrears should be ₹6,000");
assert.strictEqual(fy26.defaultersCount, 1, "Expected 1 defaulter");
assert.strictEqual(fy26.mcdTaxPendingAmount, 18400, "MCD tax should be 18,400 pending");
console.log(`  ✓ FY 2026-27 Annual Demand: ${formatINR(fy26.annualDemand)}, Realized: ${formatINR(fy26.realizedCollections)}, O/S: ${formatINR(fy26.outstandingOverdue)}, Rate: ${fy26.collectionEfficiency}%`);

// Test 2.2: Verify getFinancialYearMetrics for FY 2025-26 (No Dummy Data)
console.log("\n--- Testing 2.2: Financial Metrics for FY 2025-26 (No Dummy Data) ---");
const fy25 = sandbox.getFinancialYearMetrics("FY 2025-26");
assert.strictEqual(fy25.fyLabel, "FY 2025-26");
assert.ok(fy25.statusBadge.includes("Audited"), "Status badge should mention Audited");
assert.strictEqual(fy25.mcdTaxPendingAmount, 0, "Prior year MCD tax should be 0");
assert.strictEqual(fy25.annualDemand, 0, "FY 2025-26 dummy demand should be deleted (0)");
assert.strictEqual(fy25.realizedCollections, 0, "FY 2025-26 dummy collections should be deleted (0)");
assert.strictEqual(fy25.outstandingOverdue, 0, "FY 2025-26 dummy overdue should be deleted (0)");
assert.strictEqual(fy25.occupiedCount, 0, "FY 2025-26 dummy occupied count should be deleted (0)");
assert.strictEqual(fy25.collectionEfficiency, "0.0", "Collection efficiency should be 0.0% when no dummy data exists");
console.log(`  ✓ FY 2025-26 Dummy Data Deleted — Demand: ${formatINR(fy25.annualDemand)}, Realized: ${formatINR(fy25.realizedCollections)}, Rate: ${fy25.collectionEfficiency}%`);

// Test 2.3: Verify getFinancialYearMetrics for FY 2024-25 (No Dummy Data)
console.log("\n--- Testing 2.3: Financial Metrics for FY 2024-25 (No Dummy Data) ---");
const fy24 = sandbox.getFinancialYearMetrics("FY 2024-25");
assert.strictEqual(fy24.fyLabel, "FY 2024-25");
assert.ok(fy24.statusBadge.includes("Archived"), "Status badge should mention Archived");
assert.strictEqual(fy24.annualDemand, 0, "FY 2024-25 dummy demand should be deleted (0)");
assert.strictEqual(fy24.realizedCollections, 0, "FY 2024-25 dummy collections should be deleted (0)");
assert.strictEqual(fy24.outstandingOverdue, 0, "FY 2024-25 dummy overdue should be deleted (0)");
assert.strictEqual(fy24.occupiedCount, 0, "FY 2024-25 dummy occupied count should be deleted (0)");
console.log(`  ✓ FY 2024-25 Dummy Data Deleted — Demand: ${formatINR(fy24.annualDemand)}, Realized: ${formatINR(fy24.realizedCollections)}, Rate: ${fy24.collectionEfficiency}%`);

// Test 2.4: Verify Cumulative All-Time Metrics
console.log("\n--- Testing 2.4: Financial Metrics for All-Time (Cumulative) ---");
const fyAll = sandbox.getFinancialYearMetrics("all");
assert.strictEqual(fyAll.fyLabel, "All-Time");
assert.strictEqual(fyAll.annualDemand, fy26.annualDemand + fy25.annualDemand + fy24.annualDemand, "Cumulative demand must sum across all 3 years");
assert.strictEqual(fyAll.realizedCollections, fy26.realizedCollections + fy25.realizedCollections + fy24.realizedCollections, "Cumulative collections must sum across all 3 years");
console.log(`  ✓ All-Time 3-Year Cumulative Demand: ${formatINR(fyAll.annualDemand)}, Realized: ${formatINR(fyAll.realizedCollections)}`);

// Test 2.5: Test renderDashboardMetrics() DOM updates for selected FY
console.log("\n--- Testing 2.5: Dashboard KPI Cards Rendering & Live Switching ---");
// Render default (FY 2026-27)
sandbox.renderDashboardMetrics();
assert.ok(domElements.dashFyActiveBadge.textContent.includes("FY 2026-27"), "Header badge should show FY 2026-27");
assert.strictEqual(domElements.kpiRentRollPeriodBadge.textContent, "FY 2026-27 Demand");
assert.strictEqual(domElements.totalExpectedDisplay.textContent, formatINR(fy26.annualDemand));
assert.strictEqual(domElements.totalPendingDisplay.textContent, formatINR(6000));
console.log("  ✓ Rendered FY 2026-27 cards successfully");

// Switch to FY 2025-26
sandbox.state.dashSelectedFy = "FY 2025-26";
sandbox.renderDashboardMetrics();
assert.ok(domElements.dashFyActiveBadge.textContent.includes("FY 2025-26"), "Header badge should update to FY 2025-26");
assert.strictEqual(domElements.kpiRentRollPeriodBadge.textContent, "FY 2025-26 Demand");
assert.strictEqual(domElements.totalExpectedDisplay.textContent, formatINR(fy25.annualDemand));
assert.strictEqual(domElements.totalPaidDisplay.textContent, formatINR(fy25.realizedCollections));
assert.strictEqual(domElements.totalPendingDisplay.textContent, formatINR(fy25.outstandingOverdue));
console.log("  ✓ Switching to FY 2025-26 updated all KPI cards cleanly!");

// Test 2.6: Test renderDashboardFyComparisonTable() YoY Matrix Rows
console.log("\n--- Testing 2.6: Year-on-Year Comparison Table Generation ---");
sandbox.renderDashboardFyComparisonTable();
assert.ok(domElements.dashFyComparisonTableBody.innerHTML.includes("FY 2026-27"), "YoY Table should contain FY 2026-27");
assert.ok(domElements.dashFyComparisonTableBody.innerHTML.includes("FY 2025-26"), "YoY Table should contain FY 2025-26");
assert.ok(domElements.dashFyComparisonTableBody.innerHTML.includes("FY 2024-25"), "YoY Table should contain FY 2024-25");
assert.ok(domElements.dashFyComparisonTableBody.innerHTML.includes("✓ Active"), "Active FY row should be highlighted");
console.log("  ✓ Year-on-Year Comparison Table rows generated with 3-year performance audit!");

console.log("\n=======================================================");
console.log("🎉 ALL FINANCIAL YEAR-WISE KPI & YOY MATRIX TESTS PASSED 100%!");
console.log("=======================================================\n");
