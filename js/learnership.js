/**
 * Learnership programme page module
 */
import { apiFetch } from './api.js';
import { showToast, fmtR } from './utils.js';

export var learnershipData = null;

export function loadLearnershipPage() {
  apiFetch("getLearnershipCostSummary", { fy: "fy27" }).then(function(data) {
    learnershipData = data;
    renderLearnershipSummary(data);
    renderLearnershipTable(data);
  }).catch(function(err) {
    showToast("Learnership load error: " + err, "error");
  });
}

function renderLearnershipSummary(data) {
  if (!data || !data.success) return;
  
  var summary = data.summary || {};
  var netCostPM = summary.net_cost_per_learner_pm || 0;
  var totalAnnual = summary.total_annual_cost || 0;
  var setaFunding = summary.seta_total_funding || 0;
  var netCost = totalAnnual - setaFunding;
  var absorptions = summary.expected_absorptions || 0;
  
  var el = document.getElementById("lr-net-cost-pm");
  if (el) el.textContent = "R" + netCostPM.toLocaleString("en-ZA");
  var annEl = document.getElementById("lr-total-annual");
  if (annEl) annEl.textContent = fmtR(totalAnnual);
  var setaEl = document.getElementById("lr-seta-funding");
  if (setaEl) setaEl.textContent = fmtR(setaFunding);
  var netEl = document.getElementById("lr-net-cost");
  if (netEl) netEl.textContent = fmtR(netCost);
  var absEl = document.getElementById("lr-absorptions");
  if (absEl) absEl.textContent = absorptions;
}

function renderLearnershipTable(data) {
  var tbody = document.getElementById("learnershipTableBody");
  if (!tbody) return;
  
  if (!data || !data.success) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-400">No data</td></tr>';
    return;
  }
  
  var timeline = data.timeline || [];
  tbody.innerHTML = timeline.map(function(row) {
    var rowClass = row.note.indexOf("Intake") !== -1 ? " bg-blue-50" : row.note.indexOf("Graduation") !== -1 ? " bg-green-50" : "";
    return '<tr class="hover:bg-gray-50' + rowClass + '">' +
      '<td class="font-medium text-sm">' + row.month + '</td>' +
      '<td class="num font-mono text-xs">' + row.headcount + '</td>' +
      '<td class="num font-mono text-xs">' + fmtR(row.stipend_gross) + '</td>' +
      '<td class="num font-mono text-xs text-[#128a4b]">-' + fmtR(row.seta_reimbursement) + '</td>' +
      '<td class="num font-mono text-xs text-[#0b4d8c]">' + fmtR(row.net_stipend) + '</td>' +
      '<td class="num font-mono text-xs">' + fmtR(row.software_cost) + '</td>' +
      '<td class="num font-mono text-xs">' + fmtR(row.training_cost) + '</td>' +
      '<td class="num font-mono text-xs' + (row.laptop_cost > 0 ? " text-[#e8720c] font-bold" : "") + '">' +
      (row.laptop_cost > 0 ? fmtR(row.laptop_cost) : "—") + '</td>' +
      '<td class="num font-mono text-xs font-bold text-[#0b4d8c]">' + fmtR(row.total_monthly) + '</td>' +
      '</tr>';
  }).join("");
}
