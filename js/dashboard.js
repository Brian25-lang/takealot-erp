/**
 * Dashboard page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, globalBrand, showToast, fmtNum, fmtR, fmtAHT, animateNumber, drawSparkline, renderTrendChip, plotlyLayout, calculateFTEClient, PRODUCTIVE_HOURS } from './utils.js';
import { Plotly } from './charts.js';
import { refreshDataStatus } from './shared.js';

export var forecastData = null;
export var insightsData = null;

export function loadDashboard() {
  var clock = document.getElementById("dashboardClock");
  if (clock) {
    var now = new Date();
    clock.textContent = now.toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
  
  var greeting = document.getElementById("dashboardGreeting");
  if (greeting) {
    var hour = new Date().getHours();
    var msg = hour < 12 ? "☀️ Good morning" : hour < 17 ? "👋 Good afternoon" : "🌙 Good evening";
    greeting.textContent = msg + ", Takealot";
  }
  
  var fy = globalFY;
  var period = globalPeriodType;
  var brand = globalBrand;
  
  Promise.all([
    apiFetch("getForecastData", { fy: fy, period: period, brand: brand }),
    apiFetch("getInsights", { fy: fy }),
    apiFetch("getDepartments", { brand: brand })
  ]).then(function(results) {
    var data = results[0];
    var insights = results[1];
    var depts = results[2];
    
    forecastData = data.success ? data.data : [];
    insightsData = insights;
    
    // Populate department filter
    var deptFilter = document.getElementById("dashDeptFilter");
    if (deptFilter) {
      deptFilter.innerHTML = '<option value="all">All Departments</option>';
      (depts.departments || []).forEach(function(d) {
        deptFilter.innerHTML += '<option value="' + d + '">' + d + '</option>';
      });
    }
    
    updateDashboardKPIs(forecastData, insights);
    updateExecutiveSummary(insights);
    renderDashboardCharts(forecastData);
    renderDashboardTable(forecastData);
    refreshDataStatus();
  }).catch(function(err) {
    showToast("Dashboard load error: " + err, "error");
  });
}

function updateDashboardKPIs(data, insights) {
  var periodFTE = {};
  var periodVol = {};
  var totalVol = 0;
  var totalAHTSeconds = 0;
  var ahtCount = 0;
  var deptSet = new Set();
  
  data.forEach(function(row) {
    var vol = row.volume_for_fte || row.forecast_contacts || 0;
    var aht = row.forecast_aht_seconds || 300;
    var fte = calculateFTEClient(vol, aht, 0.05);
    var pk = row.period_key || 'unknown';
    periodFTE[pk] = (periodFTE[pk] || 0) + fte.required_agent_fte;
    periodVol[pk] = (periodVol[pk] || 0) + vol;
    totalVol += vol;
    if (aht > 0) {
      totalAHTSeconds += vol * aht;
      ahtCount += vol;
    }
    deptSet.add(row.service_department);
  });
  
  var periodKeys = Object.keys(periodFTE).sort();
  var fteValues = periodKeys.map(function(k) { return periodFTE[k]; });
  var maxFTE = fteValues.length > 0 ? Math.max.apply(null, fteValues) : 0;
  var volValues = periodKeys.map(function(k) { return periodVol[k]; });
  var avgAHT = ahtCount > 0 ? totalAHTSeconds / ahtCount : 0;
  var accuracy = insights && insights.accuracy ? insights.accuracy : null;
  var totalCost = insights && insights.total_cost ? insights.total_cost : null;
  
  var fteEl = document.getElementById("kpi-fte-value");
  if (fteEl) animateNumber(fteEl, Math.round(maxFTE));
  var fteSpark = document.getElementById("kpi-fte-sparkline");
  if (fteSpark) drawSparkline(fteSpark, fteValues.slice(-12), "#0b4d8c");
  renderTrendChip(document.getElementById("kpi-fte-trend"), null);
  
  var volEl = document.getElementById("kpi-contacts-value");
  if (volEl) animateNumber(volEl, Math.round(totalVol));
  var volSpark = document.getElementById("kpi-contacts-sparkline");
  if (volSpark) drawSparkline(volSpark, volValues.slice(-12), "#e8720c");
  renderTrendChip(document.getElementById("kpi-contacts-trend"), null);
  
  var ahtEl = document.getElementById("kpi-aht-value");
  if (ahtEl) animateNumber(ahtEl, Math.round(avgAHT), "", "s");
  renderTrendChip(document.getElementById("kpi-aht-trend"), null);
  
  var accEl = document.getElementById("kpi-accuracy-value");
  if (accEl) {
    if (null !== accuracy) animateNumber(accEl, accuracy, "", "%", 1);
    else accEl.textContent = "—";
  }
  renderTrendChip(document.getElementById("kpi-accuracy-trend"), null);
  
  var costEl = document.getElementById("kpi-cost-value");
  if (costEl) costEl.textContent = null !== totalCost ? fmtR(totalCost) : "—";
  renderTrendChip(document.getElementById("kpi-cost-trend"), null);
  
  var deptsEl = document.getElementById("kpi-depts-value");
  if (deptsEl) animateNumber(deptsEl, deptSet.size);
  renderTrendChip(document.getElementById("kpi-depts-trend"), null);
}

function updateExecutiveSummary(insights) {
  var findingsEl = document.getElementById("execFindings");
  if (findingsEl && insights && insights.findings) {
    findingsEl.innerHTML = insights.findings.map(function(f) {
      return '<div class="flex items-start gap-2 text-sm text-white/80"><span class="material-symbols-outlined text-sm mt-0.5 flex-shrink-0" style="color:var(--brand-gold);">' + f.icon + '</span><span>' + f.text + '</span></div>';
    }).join("");
  }
  
  var refreshEl = document.getElementById("execRefreshTime");
  if (refreshEl) {
    refreshEl.textContent = "Updated " + new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  
  if (insights) {
    var volEl = document.getElementById("execVolFTE");
    if (volEl && insights.total_headcount) volEl.textContent = fmtNum(insights.total_headcount);
    
    var brandEl = document.getElementById("execFastestBrand");
    if (brandEl) brandEl.textContent = insights.best_brand || "—";
    
    var accEl = document.getElementById("execAccuracy");
    if (accEl) accEl.textContent = null !== insights.accuracy ? insights.accuracy.toFixed(1) + "%" : "—";
    
    var costEl = document.getElementById("execFYCost");
    if (costEl && insights.total_cost) costEl.textContent = fmtR(insights.total_cost);
  }
}

function renderDashboardCharts(data) {
  var byPeriod = {};
  data.forEach(function(row) {
    byPeriod[row.period_key] || (byPeriod[row.period_key] = { label: row.period_label, forecast: 0, actual: 0 });
    byPeriod[row.period_key].forecast += row.forecast_contacts || 0;
    if (null !== row.actual_contacts) byPeriod[row.period_key].actual += row.actual_contacts;
  });
  
  var periodKeys = Object.keys(byPeriod).sort();
  var labels = periodKeys.map(function(k) { return byPeriod[k].label; });
  var forecastVals = periodKeys.map(function(k) { return byPeriod[k].forecast; });
  var actualVals = periodKeys.map(function(k) { return byPeriod[k].actual || 0; });
  
  var isDark = document.documentElement.classList.contains("dark");
  var layout = plotlyLayout(isDark);
  layout.barmode = "group";
  layout.margin = { t: 10, b: 50, l: 50, r: 10 };
  
  var chart1 = document.getElementById("chartActualVsForecast");
  if (chart1) {
    Plotly.newPlot(chart1, [
      { type: "bar", name: "Forecast", marker: { color: "#f2a900", opacity: 0.8 }, x: labels, y: forecastVals },
      { type: "bar", name: "Actual", marker: { color: "#0b4d8c", opacity: 0.8 }, x: labels, y: actualVals }
    ], layout, { responsive: true });
  }
  
  var byDept = {};
  data.forEach(function(row) {
    var dept = row.service_department;
    byDept[dept] || (byDept[dept] = 0);
    byDept[dept] += row.forecast_contacts || 0;
  });
  
  var sortedDepts = Object.entries(byDept).sort(function(a, b) { return b[1] - a[1]; });
  var deptLabels = sortedDepts.map(function(d) { return d[0]; });
  var deptVals = sortedDepts.map(function(d) { return d[1]; });
  var deptColors = deptLabels.map(function(d) {
    if (d.indexOf("MRD") !== -1) return "#e8720c";
    if (d.indexOf("TFS") !== -1) return "#128a4b";
    if (d.indexOf("SUP") !== -1 || d.indexOf("Superbalist") !== -1) return "#7c3aed";
    return "#0b4d8c";
  });
  
  var chart2 = document.getElementById("chartDeptContacts");
  if (chart2) {
    Plotly.newPlot(chart2, [{ type: "bar", orientation: "h", marker: { color: deptColors }, x: deptVals, y: deptLabels }], {
      paper_bgcolor: isDark ? "#1a2744" : "transparent",
      plot_bgcolor: isDark ? "#1a2744" : "transparent",
      font: { family: "Inter", size: 10, color: isDark ? "#e2e8f0" : "#424751" },
      margin: { t: 5, b: 30, l: 120, r: 10 },
      showlegend: false,
      displayModeBar: false
    }, { responsive: true });
  }
}

function renderDashboardTable(data) {
  var tbody = document.getElementById("dashboardTableBody");
  if (!tbody) return;
  
  if (!data || 0 === data.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-400">No data available</td></tr>';
    return;
  }
  
  var filter = document.getElementById("dashDeptFilter");
  var filterVal = filter ? filter.value : "all";
  var filtered = filterVal && "all" !== filterVal ? data.filter(function(r) { return r.service_department === filterVal; }) : data;
  
  tbody.innerHTML = filtered.map(function(row) {
    var fte = calculateFTEClient(row.forecast_contacts || 0, row.forecast_aht_seconds || 300, 0.05);
    var brand = row.brand || "TAL";
    var brandClass = "brand-" + brand;
    var badgeClass = row.is_forecast_only ? "badge-info" : "badge-success";
    var statusLabel = row.is_forecast_only ? "Forecast" : "Actual";
    
    return '<tr class="' + brandClass + ' hover:bg-gray-50 transition-colors">' +
      '<td class="text-xs text-gray-500">' + (row.period_label || row.period_key) + '</td>' +
      '<td class="font-medium text-sm">' + row.service_department + '</td>' +
      '<td><span class="badge badge-info">' + brand + '</span></td>' +
      '<td class="num">' + (null !== row.actual_contacts ? fmtNum(row.actual_contacts) : '<span class="text-gray-300">—</span>') + '</td>' +
      '<td class="num font-semibold text-[#0b4d8c]">' + fmtNum(row.forecast_contacts || 0) + '</td>' +
      '<td class="num">' + fmtAHT(row.forecast_aht_seconds || 300) + '</td>' +
      '<td class="num font-bold">' + Math.round(fte.required_agent_fte) + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>' +
      '</tr>';
  }).join("");
}

export function exportDashboardCSV() {
  if (!forecastData || !forecastData.length) {
    showToast("No data to export", "error");
    return;
  }
  
  var csv = "Period,Department,Brand,Actual,Forecast,AHT (s),Req FTE,Status\n";
  forecastData.forEach(function(row) {
    var fte = calculateFTEClient(row.forecast_contacts || 0, row.forecast_aht_seconds || 300, 0.05);
    csv += '"' + (row.period_label || row.period_key) + '","' + row.service_department + '","' + (row.brand || "TAL") + '",' +
      (null !== row.actual_contacts ? row.actual_contacts : "") + "," + (row.forecast_contacts || 0) + "," +
      (row.forecast_aht_seconds || 300) + "," + Math.round(fte.required_agent_fte) + ',"' +
      (row.is_forecast_only ? "Forecast" : "Actual") + '"\n';
  });
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "Dashboard_" + globalFY + "_" + globalPeriodType + ".csv"); });
  showToast("Dashboard exported", "success");
}
