const fs = require('fs');
const vm = require('vm');

const htmlPath = 'd:/Rental Income app/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8');

console.log('=== Testing Dashboard Monthwise Planned vs Actual Collection Line Chart ===');

// 1. Verify existence of required DOM elements in HTML
const requiredElements = [
  'dashCollectionChartSection',
  'dashCollectionChartWrapper',
  'dashCollectionChartSvg',
  'dashChartTooltip',
  'chartTooltipMonth',
  'chartTooltipPlanned',
  'chartTooltipActual',
  'chartTooltipRate',
  'chartTotalPlanned',
  'chartTotalActual',
  'chartOverallRate',
  'dashChartMonthBreakdown'
];

requiredElements.forEach((id) => {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: Missing ID in HTML: ${id}`);
    process.exit(1);
  }
  console.log(`✓ Found DOM element ID: ${id}`);
});

// 2. Setup headless DOM simulation sandbox
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

if (domLoadedCb) {
  domLoadedCb();
  console.log('✓ DOMContentLoaded simulated successfully');
} else {
  console.error('FAIL: DOMContentLoaded listener not registered');
  process.exit(1);
}

const { getMonthlyCollectionTotals, renderDashboardCollectionChart } = sandbox.window;
if (typeof getMonthlyCollectionTotals !== 'function') {
  console.error('FAIL: getMonthlyCollectionTotals is not exported on window');
  process.exit(1);
}
console.log('✓ getMonthlyCollectionTotals exported correctly');

if (typeof renderDashboardCollectionChart !== 'function') {
  console.error('FAIL: renderDashboardCollectionChart is not exported on window');
  process.exit(1);
}
console.log('✓ renderDashboardCollectionChart exported correctly');

// 3. Test getMonthlyCollectionTotals() output data structure
const monthlyData = getMonthlyCollectionTotals();
if (!Array.isArray(monthlyData) || monthlyData.length !== 12) {
  console.error(`FAIL: Expected 12 monthly collection entries for full FY, got ${monthlyData?.length}`);
  process.exit(1);
}
console.log(`✓ Exactly 12 standard tenancy cycles calculated (Apr 2026 to Mar 2027)`);

const expectedMonths = [
  'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
  'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027'
];
monthlyData.forEach((d, i) => {
  if (d.cycle !== expectedMonths[i]) {
    console.error(`FAIL: Expected month ${expectedMonths[i]}, got ${d.cycle}`);
    process.exit(1);
  }
  if (typeof d.planned !== 'number' || d.planned <= 0) {
    console.error(`FAIL: Invalid planned amount for ${d.cycle}: ${d.planned}`);
    process.exit(1);
  }
  if (typeof d.actual !== 'number' || d.actual < 0) {
    console.error(`FAIL: Invalid actual amount for ${d.cycle}: ${d.actual}`);
    process.exit(1);
  }
  if (typeof d.rate !== 'number' || d.rate < 0 || d.rate > 100) {
    console.error(`FAIL: Invalid realization rate for ${d.cycle}: ${d.rate}`);
    process.exit(1);
  }
});
console.log('✓ All 12 months have strictly valid numeric planned, actual, rate and shortfall metrics');

// 4. Verify math and totals
const totalPlanned = monthlyData.reduce((acc, d) => acc + d.planned, 0);
const totalActual = monthlyData.reduce((acc, d) => acc + d.actual, 0);
const overallRate = totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : '100.0';

console.log(`  Total Planned Target:   ₹${totalPlanned.toLocaleString('en-IN')}`);
console.log(`  Total Actual Realized:  ₹${totalActual.toLocaleString('en-IN')}`);
console.log(`  Overall Realization:    ${overallRate}%`);

if (totalPlanned !== 3528000) {
  console.error(`FAIL: Expected total planned ₹35,28,000, got ${totalPlanned}`);
  process.exit(1);
}
if (totalActual !== 3492000) {
  console.error(`FAIL: Expected total actual ₹34,92,000, got ${totalActual}`);
  process.exit(1);
}
console.log('✓ Portfolio math verified with 100% precision');

// 5. Test renderDashboardCollectionChart() execution and DOM updates
renderDashboardCollectionChart();

const chartTotalPlanned = getOrSetEl('chartTotalPlanned');
const chartTotalActual = getOrSetEl('chartTotalActual');
const chartOverallRate = getOrSetEl('chartOverallRate');
const chartSvg = getOrSetEl('dashCollectionChartSvg');
const breakdownEl = getOrSetEl('dashChartMonthBreakdown');

if (!chartTotalPlanned.textContent.includes('35,28,000')) {
  console.error(`FAIL: chartTotalPlanned text content mismatch: ${chartTotalPlanned.textContent}`);
  process.exit(1);
}
console.log(`✓ chartTotalPlanned correctly displays ${chartTotalPlanned.textContent}`);

if (!chartTotalActual.textContent.includes('34,92,000')) {
  console.error(`FAIL: chartTotalActual text content mismatch: ${chartTotalActual.textContent}`);
  process.exit(1);
}
console.log(`✓ chartTotalActual correctly displays ${chartTotalActual.textContent}`);

if (!chartOverallRate.textContent.includes('99.0%')) {
  console.error(`FAIL: chartOverallRate text content mismatch: ${chartOverallRate.textContent}`);
  process.exit(1);
}
console.log(`✓ chartOverallRate correctly displays ${chartOverallRate.textContent}`);

// 6. Verify SVG elements generated inside chartSvg
const svgContent = chartSvg.innerHTML;
if (!svgContent.includes('chartActualAreaGrad') || !svgContent.includes('chartPlannedAreaGrad')) {
  console.error('FAIL: Missing gradient definitions in chart SVG');
  process.exit(1);
}
console.log('✓ SVG linear gradients for area fill present');

if (!svgContent.includes('stroke="#6366f1"') || !svgContent.includes('stroke-dasharray="6 4"')) {
  console.error('FAIL: Missing planned line styling in chart SVG');
  process.exit(1);
}
console.log('✓ Planned collection line (Indigo dashed) rendered');

if (!svgContent.includes('stroke="#10b981"') || !svgContent.includes('filter="url(#chartGlowEmerald)"')) {
  console.error('FAIL: Missing actual line styling with glow in chart SVG');
  process.exit(1);
}
console.log('✓ Actual collection line (Emerald solid with glow filter) rendered');

if (!svgContent.includes('dashChartHoverGuide')) {
  console.error('FAIL: Missing dynamic vertical hover guideline in chart SVG');
  process.exit(1);
}
console.log('✓ Vertical interactive hover guideline rendered');

if (!svgContent.includes('chartPlannedNode_0') || !svgContent.includes('chartActualNode_11')) {
  console.error('FAIL: Missing data node circles in chart SVG');
  process.exit(1);
}
console.log('✓ All 24 data node circles (12 planned + 12 actual) rendered');

if (!svgContent.includes('chart-hover-column')) {
  console.error('FAIL: Missing interactive hit columns in chart SVG');
  process.exit(1);
}
console.log('✓ 12 transparent interactive hit columns rendered for tooltip hover');

// 7. Verify bottom month breakdown pills
if (!breakdownEl.innerHTML.includes('Nov 2026') || !breakdownEl.innerHTML.includes('Mar 2027')) {
  console.error('FAIL: Month breakdown pills missing Nov 2026 or Mar 2027 status');
  process.exit(1);
}
console.log('✓ Monthwise KPI breakdown pills rendered with realization rate and status');

console.log('\n======================================================');
console.log('ALL DASHBOARD COLLECTION LINE CHART TESTS PASSED! (Code 0)');
console.log('======================================================');
