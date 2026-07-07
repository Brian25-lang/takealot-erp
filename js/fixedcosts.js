/**
 * Fixed costs page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, globalBrand, showToast, fmtNum, plotlyLayout, periodAbbr, periodLabel, setEl } from './utils.js';
import { Plotly } from './charts.js';

export var fixedCostsData = null;

export function loadFixedCosts() {
  var period = globalPeriodType;
  
  apiFetch("getFixedCostsSummary", { fy: globalFY, period: period, brand: globalBrand }).then(function(data) {
    if (!data || !data.success) {
      showToast("Fixed Costs load error", "error");
      return;
    }
    
    fixedCostsData = data;
    var totals = data.totals;
    
    setEl("fc-kpi-headcount", totals.total_headcount);
    setEl("fc-kpi-staff", "R" + fmtNum(totals.staff_period));
    setEl("fc-kpi-staff-period", periodAbbr(period));
    setEl("fc-kpi-overhead", "R" + fmtNum(totals.overhead_period));
    setEl("fc-kpi-overhead-period", periodAbbr(period));
    setEl("fc-kpi-total", "R" + fmtNum(totals.total_period));
    setEl("fc-kpi-total-period", periodAbbr(period));
    setEl("fc-period-banner-text", "Showing fixed costs " + periodAbbr(period) + " · Annual total: R" + fmtNum(totals.total_annual));
    
    renderFixedCostsStaff(data.support_staff || []);
    renderFixedCostsOvh(data.overheads || []);
    renderFixedCostsCharts(data);
  }).catch(function(err) {
    showToast("Fixed Costs error: " + err, "error");
  });
}

function renderFixedCostsStaff(staff) {
  var abbr = periodAbbr(globalPeriodType);
  var sorted = staff.slice().sort(function(a, b) {
    if (a.function < b.function) return -1;
    if (a.function > b.function) return 1;
    return a.role < b.role ? -1 : 1;
  });
  
  var html = "";
  var currentFunc = null;
  var funcHC = 0, funcMonthly = 0, funcPeriod = 0, funcAnnual = 0;
  
  sorted.forEach(function(row) {
    if (row.function !== currentFunc) {
      if (null !== currentFunc) {
        html += '<tr class="bg-[#dbeafe] font-bold text-xs">' +
          '<td colspan="2" class="text-[#0b4d8c]">' + currentFunc + ' SUBTOTAL</td>' +
          '<td class="num text-[#0b4d8c]">' + funcHC + '</td>' +
          '<td colspan="2"></td>' +
          '<td class="num text-[#0b4d8c]">R' + fmtNum(funcMonthly) + '</td>' +
          '<td class="num text-[#0b4d8c]">R' + fmtNum(funcPeriod) + '</td>' +
          '<td class="num text-[#0b4d8c]">R' + fmtNum(funcAnnual) + '</td></tr>';
      }
      currentFunc = row.function;
      funcHC = 0; funcMonthly = 0; funcPeriod = 0; funcAnnual = 0;
    }
    
    funcHC += row.headcount;
    funcMonthly += row.monthly_cost;
    funcPeriod += row.period_cost;
    funcAnnual += row.annual_cost;
    
    html += '<tr class="hover:bg-gray-50 transition-colors">' +
      '<td class="font-semibold text-xs text-[#0b4d8c]">' + row.function + '</td>' +
      '<td class="text-sm">' + row.role + '</td>' +
      '<td class="num">' + row.headcount + '</td>' +
      '<td class="num text-xs">R' + fmtNum(row.monthly_salary) + '</td>' +
      '<td class="num font-semibold">R' + fmtNum(row.monthly_cost) + '</td>' +
      '<td class="num text-[#0b4d8c]">R' + fmtNum(row.period_cost) + ' <span class="text-xs text-gray-400">' + abbr + '</span></td>' +
      '<td class="num text-xs">R' + fmtNum(row.annual_cost) + '</td></tr>';
  });
  
  if (null !== currentFunc) {
    html += '<tr class="bg-[#dbeafe] font-bold text-xs">' +
      '<td colspan="2" class="text-[#0b4d8c]">' + currentFunc + ' SUBTOTAL</td>' +
      '<td class="num text-[#0b4d8c]">' + funcHC + '</td>' +
      '<td colspan="2"></td>' +
      '<td class="num text-[#0b4d8c]">R' + fmtNum(funcMonthly) + '</td>' +
      '<td class="num text-[#0b4d8c]">R' + fmtNum(funcPeriod) + '</td>' +
      '<td class="num text-[#0b4d8c]">R' + fmtNum(funcAnnual) + '</td></tr>';
  }
  
  var totalHC = staff.reduce(function(s, r) { return s + r.headcount; }, 0);
  var totalMonthly = staff.reduce(function(s, r) { return s + r.monthly_cost; }, 0);
  var totalPeriod = staff.reduce(function(s, r) { return s + r.period_cost; }, 0);
  var totalAnnual = staff.reduce(function(s, r) { return s + r.annual_cost; }, 0);
  
  html += '<tr class="bg-[#0b2c52] text-white font-bold">' +
    '<td colspan="2">GRAND TOTAL</td>' +
    '<td class="num">' + totalHC + '</td>' +
    '<td colspan="2"></td>' +
    '<td class="num">R' + fmtNum(totalMonthly) + '</td>' +
    '<td class="num">R' + fmtNum(totalPeriod) + '</td>' +
    '<td class="num">R' + fmtNum(totalAnnual) + '</td></tr>';
  
  setEl("fc-staff-tbody", html);
  setEl("fc-staff-count", staff.length + " roles");
}

function renderFixedCostsOvh(overheads) {
  var abbr = periodAbbr(globalPeriodType);
  var sorted = overheads.slice().sort(function(a, b) {
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    return a.description < b.description ? -1 : 1;
  });
  
  var html = "";
  var currentCat = null;
  var catMonthly = 0, catPeriod = 0, catAnnual = 0;
  
  sorted.forEach(function(row) {
    if (row.category !== currentCat) {
      if (null !== currentCat) {
        html += '<tr class="bg-[#fef3d6] font-bold text-xs">' +
          '<td class="text-[#9a6b00]">' + currentCat + ' SUBTOTAL</td>' +
          '<td colspan="2"></td>' +
          '<td class="num text-[#9a6b00]">R' + fmtNum(catMonthly) + '</td>' +
          '<td class="num text-[#9a6b00]">R' + fmtNum(catPeriod) + '</td>' +
          '<td class="num text-[#9a6b00]">R' + fmtNum(catAnnual) + '</td>' +
          '<td></td></tr>';
      }
      currentCat = row.category;
      catMonthly = 0; catPeriod = 0; catAnnual = 0;
    }
    
    catMonthly += row.monthly_cost;
    catPeriod += row.period_cost;
    catAnnual += row.annual_cost;
    
    html += '<tr class="hover:bg-gray-50 transition-colors">' +
      '<td class="font-semibold text-xs text-[#9a6b00]">' + row.category + '</td>' +
      '<td class="text-sm">' + row.description + '</td>' +
      '<td class="num font-semibold">R' + fmtNum(row.monthly_cost) + '</td>' +
      '<td class="num text-[#0b4d8c]">R' + fmtNum(row.period_cost) + ' <span class="text-xs text-gray-400">' + abbr + '</span></td>' +
      '<td class="num text-xs">R' + fmtNum(row.annual_cost) + '</td>' +
      '<td><span class="badge badge-info">' + row.brand + '</span></td></tr>';
  });
  
  if (null !== currentCat) {
    html += '<tr class="bg-[#fef3d6] font-bold text-xs">' +
      '<td class="text-[#9a6b00]">' + currentCat + ' SUBTOTAL</td>' +
      '<td colspan="2"></td>' +
      '<td class="num text-[#9a6b00]">R' + fmtNum(catMonthly) + '</td>' +
      '<td class="num text-[#9a6b00]">R' + fmtNum(catPeriod) + '</td>' +
      '<td class="num text-[#9a6b00]">R' + fmtNum(catAnnual) + '</td>' +
      '<td></td></tr>';
  }
  
  var totalMonthly = overheads.reduce(function(s, r) { return s + r.monthly_cost; }, 0);
  var totalPeriod = overheads.reduce(function(s, r) { return s + r.period_cost; }, 0);
  var totalAnnual = overheads.reduce(function(s, r) { return s + r.annual_cost; }, 0);
  
  html += '<tr class="bg-[#0b2c52] text-white font-bold">' +
    '<td colspan="2">GRAND TOTAL</td>' +
    '<td class="num">R' + fmtNum(totalMonthly) + '</td>' +
    '<td class="num">R' + fmtNum(totalPeriod) + '</td>' +
    '<td class="num">R' + fmtNum(totalAnnual) + '</td>' +
    '<td></td></tr>';
  
  setEl("fc-ovh-tbody", html);
  setEl("fc-ovh-count", overheads.length + " items");
}

function renderFixedCostsCharts(data) {
  var isDark = document.documentElement.classList.contains("dark");
  var layout = plotlyLayout(isDark);
  layout.margin = { t: 10, b: 30, l: 120, r: 10 };
  layout.showlegend = false;
  
  var byFunction = data.by_function || {};
  var sortedFunc = Object.entries(byFunction).sort(function(a, b) { return b[1] - a[1]; });
  var funcLabels = sortedFunc.map(function(d) { return d[0]; });
  var funcValues = sortedFunc.map(function(d) { return 12 * d[1]; });
  var funcColors = ["#0b4d8c", "#e8720c", "#128a4b", "#7c3aed", "#dc2626", "#f59e0b", "#6b7280", "#14b8a6"];
  
  Plotly.react("fc-function-chart", [{
    type: "bar",
    orientation: "h",
    marker: { color: funcLabels.map(function(l, i) { return funcColors[i % funcColors.length]; }) },
    x: funcValues,
    y: funcLabels
  }], layout, { responsive: true, displaylogo: false });
  
  var byOverhead = data.by_overhead_category || {};
  var sortedOvh = Object.entries(byOverhead).sort(function(a, b) { return b[1] - a[1]; });
  var ovhLabels = sortedOvh.map(function(d) { return d[0]; });
  var ovhValues = sortedOvh.map(function(d) { return 12 * d[1]; });
  var ovhColors = ["#f59e0b", "#0b4d8c", "#e8720c", "#128a4b", "#7c3aed"];
  
  var layout2 = plotlyLayout(isDark);
  layout2.margin = { t: 10, b: 30, l: 120, r: 10 };
  layout2.showlegend = false;
  
  Plotly.react("fc-ovh-chart", [{
    type: "bar",
    marker: { color: ovhLabels.map(function(l, i) { return ovhColors[i % ovhColors.length]; }) },
    x: ovhLabels,
    y: ovhValues
  }], layout2, { responsive: true, displaylogo: false });
}

export function exportFixedCostsCSV() {
  if (!fixedCostsData) {
    showToast("No data to export", "error");
    return;
  }
  
  var staff = fixedCostsData.support_staff || [];
  var csv = "Function,Role,Headcount,Monthly Salary,Monthly Cost,Period Cost,Annual Cost,Brand\n";
  staff.forEach(function(r) {
    csv += '"' + r.function + '","' + r.role + '",' + r.headcount + ',"' + r.monthly_salary + '","' +
      r.monthly_cost + '","' + r.period_cost + '","' + r.annual_cost + '","' + r.brand + '"\n';
  });
  
  csv += "\nOverhead Category,Description,Monthly Cost,Period Cost,Annual Cost,Brand\n";
  (fixedCostsData.overheads || []).forEach(function(r) {
    csv += '"' + r.category + '","' + r.description + '",' + r.monthly_cost + ',"' + r.period_cost + '","' +
      r.annual_cost + '","' + r.brand + '"\n';
  });
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "FixedCosts_" + globalFY + ".csv"); });
  showToast("Fixed Costs exported", "success");
}
