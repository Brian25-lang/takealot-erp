/**
 * Software & licences page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, showToast, fmtNum, plotlyLayout, periodAbbr, periodLabel, setEl } from './utils.js';
import { Plotly } from './charts.js';

export var softwareData = null;
export var swActiveCategory = "all";

export function loadSoftware() {
  var period = globalPeriodType;
  
  apiFetch("getSoftwareCostSummary", { fy: globalFY, period: period, category: "all" }).then(function(data) {
    if (!data || !data.success) {
      showToast("Software load error", "error");
      return;
    }
    
    softwareData = data;
    var totals = data.totals;
    
    setEl("sw-kpi-total", "R" + fmtNum(totals.period_cost));
    setEl("sw-kpi-total-period", periodAbbr(period));
    setEl("sw-kpi-annual", "R" + fmtNum(totals.annual_cost));
    setEl("sw-kpi-perseat", "R" + fmtNum(totals.per_seat_monthly));
    setEl("sw-kpi-enterprise", "R" + fmtNum(totals.flat_fee_monthly));
    setEl("sw-kpi-renewals", data.renewal_alerts ? data.renewal_alerts.length : 0);
    setEl("sw-period-banner-text", "Showing licence costs " + periodAbbr(period) + " · Annual total: R" + fmtNum(totals.annual_cost));
    
    renderSoftwareTable(swActiveCategory);
    
    // Chart
    var byCategory = data.by_category || {};
    var sorted = Object.entries(byCategory).sort(function(a, b) { return b[1] - a[1]; });
    var labels = sorted.map(function(d) { return d[0]; });
    var values = sorted.map(function(d) { return 12 * d[1]; });
    var catColors = {
      "CRM / Ticketing": "#0b4d8c",
      "Telephony / CCaaS": "#e8720c",
      "Productivity": "#128a4b",
      "Workforce Management": "#7c3aed",
      "Quality Assurance": "#dc2626",
      "Analytics / BI": "#f59e0b",
      "Security": "#6b7280",
      "Communication": "#3b82f6",
      "Video Conferencing": "#8b5cf6",
      "Project Management": "#14b8a6"
    };
    
    setEl("sw-chart-title", "Cost by Category (Annual)");
    var layout = plotlyLayout(document.documentElement.classList.contains("dark"));
    layout.margin = { t: 10, b: 30, l: 120, r: 10 };
    layout.showlegend = false;
    
    Plotly.react("sw-chart", [{
      type: "bar",
      orientation: "h",
      marker: { color: labels.map(function(l) { return catColors[l] || "#0b4d8c"; }) },
      x: values,
      y: labels
    }], layout, { responsive: true, displaylogo: false });
    
    renderRenewalCalendar(data.renewal_alerts || []);
  }).catch(function(err) {
    showToast("Software error: " + err, "error");
  });
}

export function filterSoftwareCategory(cat) {
  swActiveCategory = cat;
  document.querySelectorAll(".sw-cat-btn").forEach(function(btn) {
    var isActive = btn.dataset.cat === cat;
    btn.classList.toggle("active", isActive);
    btn.classList.toggle("bg-[#0b4d8c]", isActive);
    btn.classList.toggle("text-white", isActive);
    btn.classList.toggle("border-[#0b4d8c]", isActive);
  });
  if (softwareData) renderSoftwareTable(cat);
}

function renderSoftwareTable(category) {
  if (!softwareData) return;
  
  var licences = softwareData.licences || [];
  if ("all" !== category) licences = licences.filter(function(l) { return l.category === category; });
  
  var sorted = licences.slice().sort(function(a, b) {
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    return a.name < b.name ? -1 : 1;
  });
  
  var abbr = periodAbbr(globalPeriodType);
  var rows = sorted.map(function(l) {
    var today = new Date();
    var renewal = new Date(l.contract_renewal);
    var daysUntil = Math.round((renewal - today) / 86400000);
    var daysBadge = daysUntil <= 90 ? "badge-danger" : daysUntil <= 180 ? "badge-warn" : "badge-success";
    var billingBadge = "monthly" === l.billing ? "badge-info" : "badge-warn";
    
    return '<tr class="hover:bg-gray-50 transition-colors">' +
      '<td class="font-semibold text-sm">' + l.name + '</td>' +
      '<td class="text-xs text-gray-500">' + l.category + '</td>' +
      '<td class="text-xs">' + l.vendor + '</td>' +
      '<td><span class="badge ' + billingBadge + '">' + ("monthly" === l.billing ? "Per Seat" : "Enterprise") + '</span></td>' +
      '<td class="num text-xs">' + (l.seats || "—") + '</td>' +
      '<td class="num text-xs">' + (l.cost_per_seat_pm ? "R" + fmtNum(l.cost_per_seat_pm) : "—") + '</td>' +
      '<td class="num font-semibold">R' + fmtNum(l.monthly_cost) + '</td>' +
      '<td class="num text-[#0b4d8c]">R' + fmtNum(l.period_cost) + ' <span class="text-xs text-gray-400">' + abbr + '</span></td>' +
      '<td class="num text-xs">R' + fmtNum(l.annual_cost) + '</td>' +
      '<td><span class="badge ' + daysBadge + '">' + l.contract_renewal + '</span></td>' +
      '<td class="text-xs text-gray-400">' + (l.renewal_in_fy ? "FY27" : "—") + '</td>' +
      '</tr>';
  });
  
  var totalMonthly = sorted.reduce(function(s, l) { return s + l.monthly_cost; }, 0);
  var totalPeriod = sorted.reduce(function(s, l) { return s + l.period_cost; }, 0);
  var totalAnnual = sorted.reduce(function(s, l) { return s + l.annual_cost; }, 0);
  
  rows += '<tr class="bg-[#0b2c52] text-white font-bold">' +
    '<td colspan="6">TOTAL (' + sorted.length + ' licences)</td>' +
    '<td class="num">R' + fmtNum(totalMonthly) + '</td>' +
    '<td class="num">R' + fmtNum(totalPeriod) + '</td>' +
    '<td class="num">R' + fmtNum(totalAnnual) + '</td>' +
    '<td colspan="2"></td></tr>';
  
  setEl("sw-tbody", rows);
  setEl("sw-licence-count", sorted.length + " licences");
}

function renderRenewalCalendar(alerts) {
  if (!alerts || 0 === alerts.length) {
    setEl("sw-renewal-calendar", '<div class="text-center py-8 text-gray-400">No renewals in FY27</div>');
    return;
  }
  
  var today = new Date();
  var urgent = alerts.filter(function(a) {
    return Math.round((new Date(a.renewal_date) - today) / 86400000) <= 90;
  });
  
  var html = "";
  if (urgent.length > 0) {
    html += '<div class="mb-4 p-3 bg-[#fdecec] border border-[#fca5a5] rounded-lg text-sm text-[#b3261e] flex items-center gap-2">' +
      '<span class="material-symbols-outlined text-sm">warning</span>' +
      urgent.length + ' renewal' + (urgent.length > 1 ? "s" : "") + ' within 90 days — review renewals below</div>';
  }
  
  html += '<div class="space-y-2">';
  alerts.slice().sort(function(a, b) { return a.renewal_date < b.renewal_date ? -1 : 1; }).forEach(function(a) {
    var renewalDate = new Date(a.renewal_date);
    var daysUntil = Math.round((renewalDate - today) / 86400000);
    var alertClass = daysUntil <= 90 ? "border-l-4 border-[#b3261e] bg-[#fdecec]" :
      daysUntil <= 180 ? "border-l-4 border-[#f59e0b] bg-[#fef3d6]" :
        "border-l-4 border-[#0d7a4f] bg-[#e6f7ef]";
    
    html += '<div class="flex items-center justify-between p-3 rounded-lg ' + alertClass + '">' +
      '<div><div class="font-semibold text-sm">' + a.name + '</div>' +
      '<div class="text-xs text-gray-500">Renewal: ' + a.renewal_date + ' (' + daysUntil + ' days)</div></div>' +
      '<div class="text-right"><div class="font-mono font-bold text-sm">R' + fmtNum(a.monthly) + '/mo</div>' +
      '<div class="text-xs text-gray-400">R' + fmtNum(12 * a.monthly) + '/yr</div></div></div>';
  });
  html += '</div>';
  
  setEl("sw-renewal-calendar", html);
}

export function exportSoftwareCSV() {
  if (!softwareData) {
    showToast("No data to export", "error");
    return;
  }
  
  var licences = softwareData.licences || [];
  var csv = "Tool,Category,Vendor,Billing,Seats,Cost/Seat/Month,Monthly Cost,Period Cost,Annual Cost,Renewal Date,FY27 Renewal\n";
  licences.forEach(function(l) {
    csv += '"' + l.name + '","' + l.category + '","' + l.vendor + '","' + l.billing + '",' +
      (l.seats || "") + ',"' + (l.cost_per_seat_pm || "") + '",' + l.monthly_cost + ',' + l.period_cost + ',' +
      l.annual_cost + ',"' + l.contract_renewal + '","' + (l.renewal_in_fy || "") + '"\n';
  });
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "Software_Register_" + globalFY + ".csv"); });
  showToast("Software Register exported", "success");
}
