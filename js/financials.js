/**
 * Financial statement page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, budgetBasis, showToast, fmtNum, plotlyLayout, periodAbbr, periodLabel, setEl, getCurrentScenario } from './utils.js';
import { Plotly } from './charts.js';

export var financialsData = null;

export function loadFinancials() {
  var fy = globalFY;
  var period = globalPeriodType;
  var scenario = getCurrentScenario();
  
  apiFetch("getFinancialStatement", { fy: fy, period: period, scenario: scenario, basis: budgetBasis }).then(function(data) {
    if (!data || !data.success) {
      showToast("Financials load error", "error");
      return;
    }
    
    financialsData = data;
    
    setEl("fin-grand-total", "R" + fmtNum(data.grand_total_period));
    setEl("fin-grand-total-period", periodAbbr(period));
    setEl("fin-grand-annual", "R" + fmtNum(data.grand_total_annual));
    setEl("fin-workforce-pct", data.workforce_pct + "%");
    
    renderFinancialsTable(data);
    renderFinancialsCharts(data);
    
    // Metrics
    var n = data.grand_total_annual;
    var pnl = data.pnl_lines || [];
    var workforceCost = pnl[0] ? pnl[0].annual : 0;
    var fixedCost = 0;
    pnl.forEach(function(line) {
      if (["D", "E"].indexOf(line.section) !== -1) fixedCost += line.annual;
    });
    
    setEl("fin-metric-cpc", "R" + fmtNum(Math.round(n / 12 / 820 / 12)));
    setEl("fin-metric-cpfte", "R" + fmtNum(Math.round(n / 12 / 350)));
    setEl("fin-metric-wf-ratio", (workforceCost / n * 100).toFixed(1) + "%");
    setEl("fin-metric-fixed-ratio", (fixedCost / n * 100).toFixed(1) + "%");
  }).catch(function(err) {
    showToast("Financials error: " + err, "error");
  });
}

export function setFinBasis(basis) {
  window.budgetBasis = basis;
  var fc = document.getElementById("fin-basis-forecast");
  if (fc) fc.className = "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all " +
    ("forecast" === basis ? "border-[#0b4d8c] text-[#0b4d8c] bg-[#e8f0fb]" : "border-gray-200 text-gray-500");
  var bc = document.getElementById("fin-basis-budget");
  if (bc) bc.className = "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all " +
    ("budget" === basis ? "border-[#0b4d8c] text-[#0b4d8c] bg-[#e8f0fb]" : "border-gray-200 text-gray-500");
  loadFinancials();
}

function renderFinancialsTable(data) {
  var lines = data.pnl_lines || [];
  var periodKeys = data.period_keys || [];
  var period = globalPeriodType;
  
  var sectionColors = { A: "#0b4d8c", B: "#e8720c", C: "#128a4b", D: "#7c3aed", E: "#f2a900" };
  var sectionBg = { A: "#e8f0fb", B: "#fef3e6", C: "#e6f7ef", D: "#f3e8ff", E: "#fef9e7" };
  
  var header = "<th>Section</th><th>Description</th>";
  periodKeys.forEach(function(k) { header += '<th class="num">' + k.label + '</th>'; });
  setEl("fin-pnl-header", header + '<th class="num">% of Total</th>');
  
  var rows = lines.map(function(line) {
    var bg = sectionBg[line.section] || "#f9f9f9";
    var color = sectionColors[line.section] || "#0b4d8c";
    var schedule = line.period_schedule || {};
    var row = '<tr style="background:' + bg + ';" class="hover:brightness-95 transition-all">' +
      '<td><span class="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs text-white" style="background:' + color + ';">' + line.section + '</span></td>' +
      '<td><div class="font-semibold text-sm">' + line.label + '</div><div class="text-xs text-gray-500">' + line.description + '</div></td>';
    
    periodKeys.forEach(function(k) {
      row += '<td class="num font-mono text-xs">R' + fmtNum(schedule[k.key] || 0) + '</td>';
    });
    
    return row + '<td class="num font-bold text-xs">' + line.pct_of_total + '%</td></tr>';
  }).join("");
  
  var totalSchedule = data.total_schedule || {};
  rows += '<tr class="bg-[#0b2c52] text-white font-bold">' +
    '<td><span class="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs bg-[#f2a900] text-[#0b2c52]">T</span></td>' +
    '<td><div class="font-semibold">TOTAL COST OF OPERATIONS</div></td>';
  
  periodKeys.forEach(function(k) {
    rows += '<td class="num font-mono">R' + fmtNum(totalSchedule[k.key] || 0) + '</td>';
  });
  
  setEl("fin-pnl-tbody", rows + '<td class="num">100.0%</td></tr>');
  setEl("fin-waterfall-title", "Cost of Operations — " + periodLabel(period).replace(/^./, function(c) { return c.toUpperCase(); }));
}

function renderFinancialsCharts(data) {
  var isDark = document.documentElement.classList.contains("dark");
  var layout = plotlyLayout(isDark);
  layout.barmode = "stack";
  layout.margin = { t: 10, b: 50, l: 55, r: 10 };
  layout.showlegend = true;
  layout.legend = { orientation: "h", y: 1.1, x: 0.5, xanchor: "center" };
  
  var lines = data.pnl_lines || [];
  var periodKeys = data.period_keys || [];
  var sectionColors = { A: "#0b4d8c", B: "#e8720c", C: "#128a4b", D: "#7c3aed", E: "#f2a900" };
  
  var chartData = lines.map(function(line) {
    var schedule = line.period_schedule || {};
    return {
      type: "bar",
      name: line.section + ". " + line.label,
      marker: { color: sectionColors[line.section] || "#0b4d8c" },
      x: periodKeys.map(function(k) { return k.label; }),
      y: periodKeys.map(function(k) { return schedule[k.key] || 0; })
    };
  });
  
  Plotly.react("fin-waterfall-chart", chartData, layout, { responsive: true, displaylogo: false });
  
  var layout2 = plotlyLayout(isDark);
  layout2.showlegend = true;
  layout2.margin = { t: 10, b: 10, l: 10, r: 10 };
  
  var pieData = [{
    type: "pie",
    values: lines.map(function(l) { return l.annual; }),
    labels: lines.map(function(l) { return l.section + ". " + l.label + " (" + l.pct_of_total + "%)"; }),
    hole: 0.45,
    marker: { colors: lines.map(function(l) { return sectionColors[l.section] || "#0b4d8c"; }) },
    textinfo: "label+percent",
    textfont: { size: 10 }
  }];
  
  Plotly.react("fin-donut-chart", pieData, layout2, { responsive: true, displaylogo: false });
}

export function exportFinancialsCSV() {
  if (!financialsData) {
    showToast("No data to export", "error");
    return;
  }
  
  var lines = financialsData.pnl_lines || [];
  var periodKeys = financialsData.period_keys || [];
  var csv = "Section,Description," + periodKeys.map(function(k) { return k.label; }).join(",") + ",Annual,% of Total\n";
  
  lines.forEach(function(line) {
    var schedule = line.period_schedule || {};
    csv += line.section + ',"' + line.label + '",' +
      periodKeys.map(function(k) { return schedule[k.key] || 0; }).join(",") + "," +
      line.annual + "," + line.pct_of_total + "%\n";
  });
  
  var totalSchedule = financialsData.total_schedule || {};
  csv += "TOTAL,," + periodKeys.map(function(k) { return totalSchedule[k.key] || 0; }).join(",") + "," +
    financialsData.grand_total_annual + ",100%\n";
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "FinancialStatement_" + globalFY + "_" + globalPeriodType + ".csv"); });
  showToast("Financial Statement exported", "success");
}
