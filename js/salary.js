/**
 * Salary engine page module
 */
import { apiFetch } from './api.js';
import { showToast, fmtR } from './utils.js';

export var salaryData = null;

export function loadSalaryPage() {
  apiFetch("getSalaryTableData").then(function(data) {
    salaryData = data;
    renderSalaryTable(data);
    renderSalarySummary(data);
  }).catch(function(err) {
    showToast("Salary load error: " + err, "error");
  });
}

function renderSalaryTable(data) {
  var tbody = document.getElementById("salaryTableBody");
  if (!tbody) return;
  
  if (!data || !data.success) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-400">No data</td></tr>';
    return;
  }
  
  var brandFilter = document.getElementById("salaryBrandFilter") ? document.getElementById("salaryBrandFilter").value : "all";
  var roleFilter = document.getElementById("salaryRoleFilter") ? document.getElementById("salaryRoleFilter").value : "all";
  var rows = data.rows || [];
  
  if ("all" !== brandFilter) rows = rows.filter(function(r) { return r.brand === brandFilter; });
  if ("all" !== roleFilter) rows = rows.filter(function(r) { return r.role === roleFilter; });
  
  var lastUpdated = document.getElementById("salaryLastUpdated");
  if (lastUpdated) lastUpdated.textContent = "Last updated: April 2026";
  
  tbody.innerHTML = rows.map(function(row) {
    return '<tr class="brand-' + row.brand + ' hover:bg-gray-50 transition-colors">' +
      '<td class="font-medium text-sm">' + row.dept + '</td>' +
      '<td><span class="badge badge-info">' + row.brand + '</span></td>' +
      '<td class="text-xs capitalize">' + row.role + '</td>' +
      '<td class="num font-mono text-xs">R' + (row.monthly_gross || 0).toLocaleString("en-ZA") + '</td>' +
      '<td class="num font-mono text-xs">R' + (row.annual_gross || 0).toLocaleString("en-ZA") + '</td>' +
      '<td class="num font-mono text-xs text-[#0d7a4f]">R' + (row.uif || 0).toLocaleString("en-ZA") + '</td>' +
      '<td class="num font-mono text-xs text-[#0d7a4f]">R' + (row.sdl || 0).toLocaleString("en-ZA") + '</td>' +
      '<td class="num font-mono text-xs font-bold text-[#0b4d8c]">R' + (row.total_cost_monthly || 0).toLocaleString("en-ZA") + '</td>' +
      '<td class="num font-mono text-xs font-bold text-[#0b4d8c]">R' + (row.total_cost_annual || 0).toLocaleString("en-ZA") + '</td>' +
      '</tr>';
  }).join("");
}

function renderSalarySummary(data) {
  if (!data || !data.success) return;
  
  var rows = data.rows || [];
  var agents = rows.filter(function(r) { return "agent" === r.role; });
  var totalAgentPay = agents.reduce(function(s, r) { return s + (r.monthly_gross || 0); }, 0);
  var avgAgent = agents.length > 0 ? totalAgentPay / agents.length : 0;
  
  var byDept = {};
  agents.forEach(function(r) { byDept[r.dept] = r.monthly_gross; });
  var highest = Object.entries(byDept).sort(function(a, b) { return b[1] - a[1]; })[0];
  
  var totalAnnual = rows.reduce(function(s, r) { return s + (r.total_cost_annual || 0); }, 0);
  
  var el = document.getElementById("sal-total-agent-pay");
  if (el) el.textContent = fmtR(totalAgentPay);
  var avgEl = document.getElementById("sal-avg-agent");
  if (avgEl) avgEl.textContent = fmtR(Math.round(avgAgent));
  var highEl = document.getElementById("sal-highest-dept");
  if (highEl) highEl.textContent = highest ? highest[0].substring(0, 18) : "—";
  var annEl = document.getElementById("sal-total-annual");
  if (annEl) annEl.textContent = fmtR(totalAnnual);
}
