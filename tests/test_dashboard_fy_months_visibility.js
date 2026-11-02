const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Dashboard FY 2026-27 Months Visibility (Nov 26 to Mar 27) ===');

// 1. Verify required DOM elements
const requiredElements = [
  'dashCollectionChartSection',
  'dashCollectionChartSvg',
  'dashChartMonthBreakdown',
  'dashOccupancyRosterTable',
  'dashOccupancyRosterTbody',
  'dashMonthBreakdownTitle'
];

requiredElements.forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: Missing DOM element ID: ${id}`);
    process.exit(1);
  }
  console.log(`✓ Found element ID: ${id}`);
});

// Check that the roster table does NOT have restrictive max-h-[268px]
if (html.includes('max-h-[268px]')) {
  console.error('FAIL: Found restrictive max-h-[268px] in HTML which cuts off future months');
  process.exit(1);
}
console.log('✓ No restrictive max-h-[268px] cutting off roster table rows');

// 2. Setup DOM simulation sandbox
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
    querySelector: function() { return createEl(); },
    querySelectorAll: function(sel) {
      if (sel.includes('.chart-hover-column')) {
        const cols = [];
        for (let i = 0; i < 12; i++) {
          const col = createEl('', 'rect');
          col.setAttribute('data-chart-index', i.toString());
          cols.push(col);
        }
        return cols;
      }
      if (sel.includes('[data-month-chip-index]')) {
        const chips = [];
        for (let i = 0; i < 12; i++) {
          const chip = createEl('', 'div');
          chip.setAttribute('data-month-chip-index', i.toString());
          chips.push(chip);
        }
        return chips;
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
  querySelectorAll: () => [getOrSetEl('mock')],
  createElement: (tag) => createEl('', tag),
  body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, removeChild: () => {} }
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

const { state, getMonthlyCollectionTotals, renderDashboardCollectionChart } = sandbox.window;

// 3. Test FY 2026-27 months visibility
state.dashSelectedFy = "FY 2026-27";
renderDashboardCollectionChart();

const breakdown26 = getOrSetEl('dashChartMonthBreakdown').innerHTML;
const roster26 = getOrSetEl('dashOccupancyRosterTbody').innerHTML;
const svg26 = getOrSetEl('dashCollectionChartSvg').innerHTML;

const required26Months = [
  'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
  'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027'
];

required26Months.forEach((m) => {
  if (!breakdown26.includes(m)) {
    console.error(`FAIL: Month breakdown missing ${m} for FY 2026-27`);
    process.exit(1);
  }
  if (!roster26.includes(m)) {
    console.error(`FAIL: Roster table missing ${m} for FY 2026-27`);
    process.exit(1);
  }
  const shortM = m.split(' ')[0];
  if (!svg26.includes(shortM)) {
    console.error(`FAIL: SVG chart missing ${shortM} for FY 2026-27`);
    process.exit(1);
  }
});
console.log('✓ All 12 months (Apr 2026 through Mar 2027, including Nov 2026, Dec 2026, Jan 2027, Feb 2027, Mar 2027) verified in Breakdown, Roster Table & SVG Chart');

// 4. Test Dynamic Switch to FY 2025-26
state.dashSelectedFy = "FY 2025-26";
renderDashboardCollectionChart();

const breakdown25 = getOrSetEl('dashChartMonthBreakdown').innerHTML;
const roster25 = getOrSetEl('dashOccupancyRosterTbody').innerHTML;

const required25Months = [
  'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025',
  'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'
];

required25Months.forEach((m) => {
  if (!breakdown25.includes(m)) {
    console.error(`FAIL: Month breakdown missing ${m} for FY 2025-26`);
    process.exit(1);
  }
  if (!roster25.includes(m)) {
    console.error(`FAIL: Roster table missing ${m} for FY 2025-26`);
    process.exit(1);
  }
});
console.log('✓ FY 2025-26 dynamically switched all 12 months (Apr 2025 to Mar 2026)');

// 5. Test Dynamic Switch to FY 2024-25
state.dashSelectedFy = "FY 2024-25";
renderDashboardCollectionChart();

const breakdown24 = getOrSetEl('dashChartMonthBreakdown').innerHTML;
const roster24 = getOrSetEl('dashOccupancyRosterTbody').innerHTML;

const required24Months = [
  'Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024',
  'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'
];

required24Months.forEach((m) => {
  if (!breakdown24.includes(m)) {
    console.error(`FAIL: Month breakdown missing ${m} for FY 2024-25`);
    process.exit(1);
  }
  if (!roster24.includes(m)) {
    console.error(`FAIL: Roster table missing ${m} for FY 2024-25`);
    process.exit(1);
  }
});
console.log('✓ FY 2024-25 dynamically switched all 12 months (Apr 2024 to Mar 2025)');

console.log('\n========================================================================');
console.log('ALL DASHBOARD FY MONTHS VISIBILITY & SWITCHING TESTS PASSED! (Code 0)');
console.log('========================================================================');
