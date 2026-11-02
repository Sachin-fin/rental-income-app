const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Dashboard Month-wise Occupancy & Tenant Roster (Half-Page Layout) ===');

// 1. Check DOM structure for 50/50 responsive split and required right-hand elements
const requiredElements = [
  'dashCollectionChartSection',
  'dashCollectionChartWrapper',
  'dashCollectionChartSvg',
  'dashOccupancyTotalPortfolioBadge',
  'dashRosterAvailableUnits',
  'dashRosterFullUnits',
  'dashRosterVacantUnits',
  'dashRosterTotalTenants',
  'dashOccupancyRosterTable',
  'dashOccupancyRosterTbody',
  'dashRosterCapacityText'
];

requiredElements.forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: Missing DOM element ID: ${id}`);
    process.exit(1);
  }
  console.log(`✓ Found element ID: ${id}`);
});

// Check responsive grid layout class
if (!html.includes('grid-cols-1 lg:grid-cols-2') || !html.includes('lg:divide-x')) {
  console.error('FAIL: Missing 50/50 responsive grid split classes in dashCollectionChartSection');
  process.exit(1);
}
console.log('✓ Section structured with 50/50 split (grid-cols-1 lg:grid-cols-2 lg:divide-x)');

// 2. Setup DOM sandbox
const startIdx = html.indexOf('<script>');
const endIdx = html.lastIndexOf('</script>');
const jsCode = html.substring(startIdx + 8, endIdx);

const elements = new Map();
function createEl(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    children: [],
    appendChild: function(child) { this.children.push(child); return child; },
    setAttribute: function(k, v) { this[k] = v; },
    getAttribute: function(k) { return this[k] || null; },
    listeners: {},
    addEventListener: function(event, cb) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    },
    closest: function() { return this; },
    querySelector: function(sel) { return createEl(); },
    querySelectorAll: function(sel) {
      if (sel.includes('.chart-hover-column') || sel.includes('[data-chart-index]')) {
        const cols = [];
        for (let i = 0; i < 7; i++) {
          const col = createEl('', 'rect');
          col.setAttribute('data-chart-index', i.toString());
          cols.push(col);
        }
        return cols;
      }
      if (sel.includes('[data-month-chip-index]')) {
        const chips = [];
        for (let i = 0; i < 7; i++) {
          const chip = createEl('', 'div');
          chip.setAttribute('data-month-chip-index', i.toString());
          chips.push(chip);
        }
        return chips;
      }
      if (sel.includes('[data-roster-row-index]')) {
        const rows = [];
        for (let i = 0; i < 7; i++) {
          const row = createEl('', 'tr');
          row.setAttribute('data-roster-row-index', i.toString());
          rows.push(row);
        }
        return rows;
      }
      return [];
    },
    focus: function() {},
    select: function() {},
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    style: {}
  };
}

function getOrSetEl(id, tag = 'div') {
  if (!elements.has(id)) {
    elements.set(id, createEl(id, tag));
  }
  return elements.get(id);
}

const documentMock = {
  getElementById: (id) => getOrSetEl(id),
  querySelector: (sel) => getOrSetEl(sel.replace('#', '')),
  querySelectorAll: (sel) => [getOrSetEl('mock')],
  createElement: (tag) => createEl('', tag),
  body: {
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    removeChild: () => {}
  }
};

let domLoadedCb = null;
const windowMock = {
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') domLoadedCb = cb;
  },
  print: () => {},
  confirm: () => true,
  prompt: () => '0',
  open: () => {}
};

const localStorageMock = {
  data: {},
  getItem: function(k) { return this.data[k] || null; },
  setItem: function(k, v) { this.data[k] = v; },
  clear: function() { this.data = {}; }
};

const sandbox = {
  document: documentMock,
  window: windowMock,
  localStorage: localStorageMock,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Math: Math,
  Date: Date,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  Set: Set,
  Map: Map,
  RegExp: RegExp,
  encodeURIComponent: encodeURIComponent
};

vm.createContext(sandbox);
vm.runInContext(jsCode, sandbox);

if (domLoadedCb) domLoadedCb();

const { getMonthlyCollectionTotals, renderDashboardCollectionChart } = sandbox.window;

// 3. Verify occupancy data structure in getMonthlyCollectionTotals()
const data = getMonthlyCollectionTotals();
console.log('Cycles data:', JSON.stringify(data.map(d => ({ cycle: d.cycle, occupied: d.occupied, available: d.available, vacant: d.vacant, tenants: d.tenants }))));
if (!Array.isArray(data) || data.length !== 12) {
  console.error(`FAIL: Expected 12 months in collection totals, got ${data?.length}`);
  process.exit(1);
}

data.forEach((monthData, idx) => {
  const { cycle, available, occupied, vacant, tenants, occRate } = monthData;
  if (typeof available !== 'number' || available !== 24) {
    console.error(`FAIL: Expected 24 available units in ${cycle}, got ${available}`);
    process.exit(1);
  }
  if (typeof occupied !== 'number' || occupied !== 21) {
    console.error(`FAIL: Expected 21 full/occupied units in ${cycle}, got ${occupied}`);
    process.exit(1);
  }
  if (typeof vacant !== 'number' || vacant !== 3) {
    console.error(`FAIL: Expected 3 vacant units in ${cycle}, got ${vacant}`);
    process.exit(1);
  }
  if (typeof tenants !== 'number' || tenants !== 21) {
    console.error(`FAIL: Expected 21 tenants in ${cycle}, got ${tenants}`);
    process.exit(1);
  }
  if (typeof occRate !== 'number' || occRate < 85 || occRate > 90) {
    console.error(`FAIL: Expected ~87.5% occupancy rate in ${cycle}, got ${occRate}`);
    process.exit(1);
  }
});
console.log('✓ All 12 months have verified metrics: available (24), full (21), vacant (3), tenants (21), occRate (87.5%)');

// 4. Test renderDashboardCollectionChart() execution and Right-hand elements update
renderDashboardCollectionChart();

const availEl = getOrSetEl('dashRosterAvailableUnits');
const fullEl = getOrSetEl('dashRosterFullUnits');
const vacEl = getOrSetEl('dashRosterVacantUnits');
const tenantEl = getOrSetEl('dashRosterTotalTenants');
const badgeEl = getOrSetEl('dashOccupancyTotalPortfolioBadge');
const capacityEl = getOrSetEl('dashRosterCapacityText');
const tbodyEl = getOrSetEl('dashOccupancyRosterTbody');

if (availEl.textContent !== '24') {
  console.error(`FAIL: Expected dashRosterAvailableUnits to be 24, got ${availEl.textContent}`);
  process.exit(1);
}
console.log(`✓ dashRosterAvailableUnits displays: ${availEl.textContent}`);

if (fullEl.textContent !== '21') {
  console.error(`FAIL: Expected dashRosterFullUnits to be 21, got ${fullEl.textContent}`);
  process.exit(1);
}
console.log(`✓ dashRosterFullUnits displays: ${fullEl.textContent}`);

if (vacEl.textContent !== '3') {
  console.error(`FAIL: Expected dashRosterVacantUnits to be 3, got ${vacEl.textContent}`);
  process.exit(1);
}
console.log(`✓ dashRosterVacantUnits displays: ${vacEl.textContent}`);

if (tenantEl.textContent !== '21') {
  console.error(`FAIL: Expected dashRosterTotalTenants to be 21, got ${tenantEl.textContent}`);
  process.exit(1);
}
console.log(`✓ dashRosterTotalTenants displays: ${tenantEl.textContent}`);

if (!badgeEl.textContent.includes('24 Units')) {
  console.error(`FAIL: Expected dashOccupancyTotalPortfolioBadge to include '24 Units', got ${badgeEl.textContent}`);
  process.exit(1);
}
console.log(`✓ dashOccupancyTotalPortfolioBadge displays: ${badgeEl.textContent}`);

if (!capacityEl.textContent.includes('87.5% Full (3 Vacant)')) {
  console.error(`FAIL: dashRosterCapacityText mismatch: ${capacityEl.textContent}`);
  process.exit(1);
}
console.log(`✓ dashRosterCapacityText displays: ${capacityEl.textContent}`);

// 5. Verify tbody HTML content contains all 12 month cycles and metrics
const tbodyHtml = tbodyEl.innerHTML;
const months = [
  'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
  'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027'
];
months.forEach((m) => {
  if (!tbodyHtml.includes(m)) {
    console.error(`FAIL: Table missing month row for ${m}`);
    process.exit(1);
  }
});
if (!tbodyHtml.includes('data-roster-row-index')) {
  console.error('FAIL: Table missing data-roster-row-index attribute for chart hover interaction');
  process.exit(1);
}
console.log('✓ Right-side table rendered all 12 month cycles with data-roster-row-index hover rows');

console.log('\n========================================================================');
console.log('ALL MONTH-WISE OCCUPANCY & TENANT ROSTER TESTS PASSED! (Code 0)');
console.log('========================================================================');
