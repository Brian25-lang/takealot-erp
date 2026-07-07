/**
 * Forecast page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, globalBrand, showToast, fmtNum, plotlyLayout } from './utils.js';
import { Plotly } from './charts.js';

export var keyDriversData = null;

export function loadForecastPage() {
  var fy = globalFY;
  var period = globalPeriodType;
  var brand = globalBrand;
  var periodFilter = document.getElementById("forecastPeriodSelect") ? document.getElementById("forecastPeriodSelect").value : "";
  var deptFilter = document.getElementById("forecastDeptSelect") ? document.getElementById("forecastDeptSelect").value : "all";
  
  Promise.all([
    apiFetch("getForecastData", { fy: fy, period: period, brand: brand, dept: deptFilter }),
    apiFetch("getKeyDrivers", { dept: deptFilter }),
    apiFetch("getDepartments", { brand: brand })
  ]).then(function(results) {
    var data = results[0];
    var drivers = results[1];
    var depts = results[2];
    
    window.forecastData = data.success ? data.data : [];
    keyDriversData = drivers.success ? drivers.rows : [];
    
    // Populate period select
    var periodSelect = document.getElementById("forecastPeriodSelect");
    if (periodSelect && window.forecastData.length) {
      var seen = {};
      periodSelect.innerHTML = '<option value="">All Periods</option>';
      window.forecastData.forEach(function(row) {
        if (!seen[row.period_key]) {
          seen[row.period_key] = 1;
          periodSelect.innerHTML += '<option value="' + row.period_key + '">' + (row.period_label || row.period_key) + '</option>';
        }
      });
    }
    
    // Populate dept select
    var deptSelect = document.getElementById("forecastDeptSelect");
    if (deptSelect) {
      deptSelect.innerHTML = '<option value="all">All Departments</option>';
      (depts.departments || []).forEach(function(d) {
        deptSelect.innerHTML += '<option value="' + d + '">' + d + '</option>';
      });
    }
    
    // Calculate metrics
    var filtered = periodFilter && "" !== periodFilter ? window.forecastData.filter(function(r) { return r.period_key === periodFilter; }) : window.forecastData;
    var mapeSum = 0, mapeCount = 0, biasSum = 0, biasCount = 0;
    filtered.forEach(function(row) {
      if (row.forecast_contacts > 0 && null !== row.actual_contacts) {
        var err = Math.abs(row.actual_contacts - row.forecast_contacts) / row.actual_contacts;
        mapeSum += err;
        mapeCount++;
        var b = (row.forecast_contacts - row.actual_contacts) / row.actual_contacts;
        biasSum += b;
        biasCount++;
      }
    });
    
    var mape = mapeCount > 0 ? (mapeSum / mapeCount * 100).toFixed(1) : "—";
    var accuracy = mapeCount > 0 ? Math.max(0, 100 - mapeSum / mapeCount * 100).toFixed(1) : "—";
    var bias = biasCount > 0 ? (biasSum / biasCount * 100).toFixed(1) : "—";
    
    var mapeEl = document.getElementById("fc-mape");
    if (mapeEl) mapeEl.textContent = "—" !== mape ? mape + "%" : "—";
    
    var accEl = document.getElementById("fc-accuracy");
    if (accEl) accEl.textContent = "—" !== accuracy ? accuracy + "%" : "—";
    
    var biasEl = document.getElementById("fc-bias");
    if (biasEl) {
      if ("—" !== bias) {
        var biasNum = parseFloat(bias);
        biasEl.textContent = (biasNum >= 0 ? "+" : "") + bias + "%";
        biasEl.style.color = biasNum > 0 ? "#e8720c" : biasNum < 0 ? "#0d7a4f" : "";
      } else {
        biasEl.textContent = "—";
      }
    }
    
    loadKeyDrivers();
  }).catch(function(err) {
    showToast("Forecast page error: " + err, "error");
  });
}

export function loadKeyDrivers() {
  var dept = document.getElementById("kdDeptFilter") ? document.getElementById("kdDeptFilter").value : "all";
  apiFetch("getKeyDrivers", { dept: dept }).then(function(data) {
    keyDriversData = data.rows || [];
    renderKeyDriversChart(keyDriversData);
    renderKeyDriversTable(keyDriversData);
    
    var filter = document.getElementById("kdDeptFilter");
    if (filter && filter.options.length <= 1) {
      apiFetch("getDepartments", { brand: "all" }).then(function(d) {
        filter.innerHTML = '<option value="all">All Departments</option>';
        (d.departments || []).forEach(function(dept) {
          filter.innerHTML += '<option value="' + dept + '">' + dept + '</option>';
        });
      });
    }
  }).catch(function(err) {
    showToast("Key drivers error: " + err, "error");
  });
}

function renderKeyDriversChart(data) {
  var isDark = document.documentElement.classList.contains("dark");
  var container = document.getElementById("chartKeyDrivers");
  if (!container) return;
  
  var byDept = {};
  data.forEach(function(row) {
    var dept = row.service_department || "Other";
    byDept[dept] || (byDept[dept] = 0);
    byDept[dept] += row.forecast_volume || 0;
  });
  
  var sorted = Object.entries(byDept).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 8);
  var labels = sorted.map(function(d) { return d[0]; });
  var values = sorted.map(function(d) { return d[1]; });
  var colors = labels.map(function(d) {
    if (d.indexOf("MRD") !== -1) return "#e8720c";
    if (d.indexOf("TFS") !== -1) return "#128a4b";
    if (d.indexOf("SUP") !== -1) return "#7c3aed";
    return "#0b4d8c";
  });
  
  Plotly.newPlot(container, [{ type: "bar", orientation: "h", marker: { color: colors }, x: values, y: labels }], {
    paper_bgcolor: isDark ? "#1a2744" : "transparent",
    plot_bgcolor: isDark ? "#1a2744" : "transparent",
    font: { family: "Inter", size: 10, color: isDark ? "#e2e8f0" : "#424751" },
    margin: { t: 5, b: 30, l: 120, r: 10 },
    showlegend: false,
    displayModeBar: false
  }, { responsive: true });
}

function renderKeyDriversTable(data) {
  var tbody = document.getElementById("keyDriversTableBody");
  if (!tbody) return;
  
  if (!data || 0 === data.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-gray-400">No key drivers data available</td></tr>';
    return;
  }
  
  var byDept = {};
  data.forEach(function(row) {
    var dept = row.service_department || "Other";
    byDept[dept] || (byDept[dept] = []);
    byDept[dept].push(row);
  });
  
  var rows = [];
  Object.keys(byDept).forEach(function(dept) {
    byDept[dept].slice(0, 3).forEach(function(row) { rows.push(row); });
  });
  
  tbody.innerHTML = rows.slice(0, 20).map(function(row, i) {
    var pct = row.prop_of_total ? (100 * row.prop_of_total).toFixed(1) : "—";
    var confClass = row.low_confidence ? "badge-warn" : "badge-success";
    var confLabel = row.low_confidence ? "Low" : "High";
    return '<tr class="hover:bg-gray-50">' +
      '<td class="num text-gray-400">' + (i + 1) + '</td>' +
      '<td class="font-medium">' + (row.service_department || "—") + '</td>' +
      '<td class="num font-semibold text-[#0b4d8c]">' + pct + '%</td>' +
      '<td class="num">' + fmtNum(row.forecast_volume || 0) + '</td>' +
      '<td class="text-xs text-gray-500">' + (row.model_stage || "—") + '</td>' +
      '<td><span class="badge ' + confClass + '">' + confLabel + '</span></td>' +
      '</tr>';
  }).join("");
}

export function exportKeyDriversCSV() {
  if (!keyDriversData || !keyDriversData.length) {
    showToast("No key drivers data", "error");
    return;
  }
  
  var csv = "Department,Rank,% of Total,Forecast Vol,Actual Vol,Model,Low Confidence\n";
  keyDriversData.forEach(function(row) {
    csv += '"' + (row.service_department || "") + '",' + (row.driver_rank || "") + ',"' + (row.prop_of_total || "") + '",' +
      (row.forecast_volume || "") + ',' + (row.actual_volume || "") + ',"' + (row.model_stage || "") + '",' + (row.low_confidence || false) + '\n';
  });
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "KeyDrivers_" + globalFY + ".csv"); });
  showToast("Key drivers exported", "success");
}
