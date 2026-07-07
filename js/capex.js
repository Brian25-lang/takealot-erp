/**
 * CAPEX planning page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, showToast, fmtNum, plotlyLayout, periodAbbr, periodLabel, setEl } from './utils.js';
import { Plotly } from './charts.js';

export function loadCapex() {
  var period = globalPeriodType;
  
  apiFetch("getCapexDepreciationSchedule", { fy: globalFY, period: period, category: "all" }).then(function(data) {
    if (!data || !data.success) {
      showToast("CAPEX load error", "error");
      return;
    }
    
    var totals = data.totals;
    setEl("capex-kpi-total", "R" + fmtNum(totals.total_capex_spend));
    setEl("capex-kpi-depr", "R" + fmtNum(totals.period_depreciation));
    setEl("capex-kpi-depr-period", periodAbbr(period));
    setEl("capex-kpi-approved", "R" + fmtNum(totals.approved_monthly));
    setEl("capex-kpi-pending", "R" + fmtNum(totals.pending_monthly));
    setEl("capex-period-banner-text", "Showing depreciation " + periodLabel(period) + " · Annual depreciation: R" + fmtNum(totals.annual_depreciation));
    
    var assets = data.assets || [];
    var catColors = { "IT Equipment": "#e8f0fb", "Learnership Equipment": "#fef3d6", "Furniture": "#e6f7ef", "Infrastructure": "#f3e8ff" };
    
    var assetRows = assets.slice().sort(function(a, b) {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.description < b.description ? -1 : 1;
    }).map(function(asset) {
      var bg = catColors[asset.category] || "#ffffff";
      var badge = "Approved" === asset.status ? "badge-success" : "badge-warn";
      return '<tr style="background:' + bg + ';" class="hover:brightness-95 transition-all">' +
        '<td class="font-semibold text-xs">' + asset.category + '</td>' +
        '<td class="font-medium text-sm">' + asset.description + '</td>' +
        '<td class="num">' + asset.quantity + '</td>' +
        '<td class="num">R' + fmtNum(asset.unit_cost) + '</td>' +
        '<td class="num font-semibold">R' + fmtNum(asset.total_cost) + '</td>' +
        '<td class="num text-xs">' + asset.useful_life_years + ' yrs</td>' +
        '<td class="num text-[#9a6b00]">R' + fmtNum(asset.monthly_depreciation) + '</td>' +
        '<td class="num text-[#9a6b00]">R' + fmtNum(asset.annual_depreciation) + '</td>' +
        '<td><span class="badge ' + badge + '">' + asset.status + '</span></td>' +
        '<td class="text-xs text-gray-500">' + asset.procurement_month + '</td>' +
        '</tr>';
    }).join("");
    
    var totalCost = assets.reduce(function(s, a) { return s + a.total_cost; }, 0);
    assetRows += '<tr class="bg-[#0b2c52] text-white font-bold">' +
      '<td colspan="4" class="text-xs">TOTAL</td>' +
      '<td class="num font-bold">R' + fmtNum(totalCost) + '</td>' +
      '<td class="num text-xs">—</td>' +
      '<td class="num">R' + fmtNum(totals.monthly_depreciation) + '</td>' +
      '<td class="num">R' + fmtNum(totals.annual_depreciation) + '</td>' +
      '<td colspan="2"></td></tr>';
    
    setEl("capex-asset-tbody", assetRows);
    setEl("capex-asset-count", assets.length + " assets");
    
    // Schedule table
    var schedule = data.schedule || {};
    var periodKeys = Object.keys(schedule);
    var schedHeader = "<th>Category</th>";
    periodKeys.forEach(function(k) { schedHeader += '<th class="num">' + k + '</th>'; });
    setEl("capex-sched-header", schedHeader);
    
    var byCategory = {};
    assets.forEach(function(a) {
      byCategory[a.category] = byCategory[a.category] || {};
      periodKeys.forEach(function(k) {
        byCategory[a.category][k] = (byCategory[a.category][k] || 0) + a.monthly_depreciation;
      });
    });
    
    var categories = ["IT Equipment", "Learnership Equipment", "Furniture", "Infrastructure"];
    var catBg = { "IT Equipment": "#e8f0fb", "Learnership Equipment": "#fef3d6", "Furniture": "#e6f7ef", "Infrastructure": "#f3e8ff" };
    var catColors2 = { "IT Equipment": "#0b4d8c", "Learnership Equipment": "#e8720c", "Furniture": "#128a4b", "Infrastructure": "#7c3aed" };
    
    var schedRows = categories.map(function(cat) {
      var row = '<tr style="background:' + (catBg[cat] || "#fff") + ';"><td class="font-semibold text-xs">' + cat + '</td>';
      periodKeys.forEach(function(k) {
        row += '<td class="num text-xs">' + fmtNum(byCategory[cat] && byCategory[cat][k] ? byCategory[cat][k] : 0) + '</td>';
      });
      return row + '</tr>';
    }).join("");
    
    var totalRow = '<tr class="bg-[#0b2c52] text-white font-bold"><td>TOTAL</td>';
    periodKeys.forEach(function(k) {
      var total = 0;
      categories.forEach(function(cat) { total += byCategory[cat] && byCategory[cat][k] || 0; });
      totalRow += '<td class="num">R' + fmtNum(total) + '</td>';
    });
    schedRows += totalRow + '</tr>';
    setEl("capex-sched-tbody", schedRows);
    
    // Chart
    setEl("capex-chart-title", periodLabel(period).replace("per ", "Depreciation ").replace(/^./, function(c) { return c.toUpperCase(); }) + " by Category");
    
    var layout = plotlyLayout(document.documentElement.classList.contains("dark"));
    layout.barmode = "stack";
    layout.margin = { t: 10, b: 50, l: 55, r: 10 };
    layout.showlegend = true;
    layout.legend = { orientation: "h", y: 1.1, x: 0.5, xanchor: "center" };
    
    var chartData = categories.map(function(cat) {
      return {
        type: "bar",
        name: cat,
        marker: { color: catColors2[cat] || "#0b4d8c" },
        x: periodKeys,
        y: periodKeys.map(function(k) { return byCategory[cat] && byCategory[cat][k] || 0; })
      };
    });
    
    Plotly.react("capex-chart", chartData, layout, { responsive: true, displaylogo: false });
  }).catch(function(err) {
    showToast("CAPEX error: " + err, "error");
  });
}

export function exportCapexCSV() {
  var tbody = document.getElementById("capex-asset-tbody");
  if (!tbody || !tbody.children.length) {
    showToast("No data to export", "error");
    return;
  }
  
  var csv = "Category,Asset,Qty,Unit Cost,Total Cost,Useful Life (yrs),Monthly Depr,Annual Depr,Status,Procurement Month\n";
  Array.from(tbody.querySelectorAll("tr")).forEach(function(tr) {
    var tds = tr.querySelectorAll("td");
    if (tds.length >= 10 && !tr.className.includes("bg-[#0b2c52")) {
      csv += tds[0].textContent.trim() + ',"' + tds[1].textContent.trim() + '",' +
        tds[2].textContent.trim() + ',' + tds[3].textContent.trim().replace(/[^0-9]/g, "") + ',' +
        tds[4].textContent.trim().replace(/[^0-9]/g, "") + ',' + tds[5].textContent.trim().replace(/[^0-9]/g, "") + ',' +
        tds[6].textContent.trim().replace(/[^0-9]/g, "") + ',' + tds[7].textContent.trim().replace(/[^0-9]/g, "") + ',' +
        '"' + tds[8].textContent.trim() + '","' + tds[9].textContent.trim() + '"\n';
    }
  });
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "CAPEX_Register_" + globalFY + ".csv"); });
  showToast("CAPEX Register exported", "success");
}
