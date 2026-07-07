/**
 * Budget planner page module
 */
import { apiFetch } from './api.js';
import { globalFY, budgetBasis, showToast, fmtNum, fmtR } from './utils.js';

export var budgetData = null;

export function loadBudgetPage() {
  var scenario = document.getElementById("budgetScenarioSelect") ? document.getElementById("budgetScenarioSelect").value : "Current";
  
  apiFetch("getBudget", { fy: globalFY, scenario: scenario, basis: budgetBasis }).then(function(data) {
    budgetData = data;
    renderBudgetSummary(data);
    renderBudgetTable(data);
  }).catch(function(err) {
    showToast("Budget load error: " + err, "error");
  });
  
  if (0 === window.allScenarios.length) {
    apiFetch("getScenarios").then(function(data) {
      window.allScenarios = data.scenarios || [];
      var select = document.getElementById("budgetScenarioSelect");
      if (select) {
        select.innerHTML = window.allScenarios.map(function(s) {
          return '<option value="' + s.name + '">' + s.name + '</option>';
        }).join("");
      }
    });
  }
}

export function setBudgetBasis(basis) {
  window.budgetBasis = basis;
  var fc = document.getElementById("basis-forecast");
  if (fc) fc.className = "text-xs font-bold px-2 py-1 rounded " + ("forecast" === basis ? "bg-[#0b4d8c] text-white" : "text-[#0b4d8c] hover:bg-blue-50");
  var ac = document.getElementById("basis-actuals");
  if (ac) ac.className = "text-xs font-bold px-2 py-1 rounded " + ("actuals" === basis ? "bg-[#0b4d8c] text-white" : "text-[#0b4d8c] hover:bg-blue-50");
  var banner = document.getElementById("budget-basis");
  if (banner) banner.textContent = basis.charAt(0).toUpperCase() + basis.slice(1);
  var pill = document.getElementById("budgetBasisPill");
  if (pill) pill.textContent = basis.charAt(0).toUpperCase() + basis.slice(1);
  loadBudgetPage();
}

function renderBudgetSummary(data) {
  if (!data || !data.success) return;
  
  var fyTotals = data.fy_totals || {};
  var hc = fyTotals.headcount || {};
  var costs = fyTotals.costs || {};
  
  var avgFTE = document.getElementById("budget-avg-fte");
  if (avgFTE) avgFTE.textContent = fmtNum(hc.total || 0);
  
  var fyCost = document.getElementById("budget-fy-cost");
  if (fyCost) fyCost.textContent = fmtR(costs.total_cost || 0);
  
  var months = data.months || [];
  var headcount = data.headcount || {};
  var peakMonth = "", peakFTE = 0;
  months.forEach(function(m) {
    var f = headcount[m] ? headcount[m].total : 0;
    if (f > peakFTE) { peakFTE = f; peakMonth = m; }
  });
  
  var peakMonthEl = document.getElementById("budget-peak-month");
  if (peakMonthEl) peakMonthEl.textContent = peakMonth || "—";
  var peakFTEEl = document.getElementById("budget-peak-fte");
  if (peakFTEEl) peakFTEEl.textContent = fmtNum(peakFTE) + " FTE";
}

function renderBudgetTable(data) {
  if (!data || !data.success) return;
  
  var months = data.months || [];
  var headcount = data.headcount || {};
  var costs = data.costs || {};
  
  var thead = document.getElementById("budgetTableHead");
  if (thead) {
    thead.innerHTML = '<tr><th class="text-left">Metric</th>' +
      months.map(function(m) { return '<th class="num text-[10px]">' + m.substring(0, 3) + '</th>'; }).join("") +
      '<th class="num text-[10px]">FY Total</th></tr>';
  }
  
  var tbody = document.getElementById("budgetTableBody");
  if (!tbody) return;
  
  var metrics = [
    { label: "Agents", key: "agents", type: "hc" },
    { label: "Team Leaders", key: "team_leaders", type: "hc" },
    { label: "2ICs", key: "ic2", type: "hc" },
    { label: "CSMs", key: "csm", type: "hc" },
    { label: "Grand Total HC", key: "total", type: "hc", bold: true },
    { label: "Agent Cost", key: "agent_cost", type: "cost" },
    { label: "TL Cost", key: "tl_cost", type: "cost" },
    { label: "2IC Cost", key: "ic2_cost", type: "cost" },
    { label: "CSM Cost", key: "csm_cost", type: "cost" },
    { label: "Total Gross", key: "total_gross", type: "cost", bold: true },
    { label: "Total Cost (incl. benefits)", key: "total_cost", type: "cost", bold: true, gold: true }
  ];
  
  var fyTotals = data.fy_totals || {};
  var fyHC = fyTotals.headcount || {};
  var fyCosts = fyTotals.costs || {};
  
  tbody.innerHTML = metrics.map(function(m) {
    var rowClass = "total" === m.key || "total_gross" === m.key || "total_cost" === m.key ? "bg-blue-50 font-bold" : "cost" === m.type ? "bg-gray-50" : "";
    var textClass = m.gold ? "text-[#f2a900]" : "cost" === m.type ? "text-[#0d7a4f]" : "text-[#0b4d8c]";
    var fyVal = "hc" === m.type ? fyHC[m.key] || 0 : fyCosts[m.key] || 0;
    
    return '<tr class="' + rowClass + '">' +
      '<td class="font-medium text-sm ' + textClass + '">' + m.label + '</td>' +
      months.map(function(month) {
        var val = "hc" === m.type ? (headcount[month] ? headcount[month][m.key] : 0) : (costs[month] ? costs[month][m.key] : 0);
        var display = "cost" === m.type ? fmtR(val) : fmtNum(val);
        return '<td class="num text-xs ' + textClass + '">' + display + '</td>';
      }).join("") +
      '<td class="num text-xs font-bold ' + textClass + '">' + ("cost" === m.type ? fmtR(fyVal) : fmtNum(fyVal)) + '</td>' +
      '</tr>';
  }).join("");
}

export function exportBudgetCSV() {
  if (!budgetData || !budgetData.success) {
    showToast("No budget data", "error");
    return;
  }
  
  var months = budgetData.months || [];
  var costs = budgetData.costs || {};
  var headcount = budgetData.headcount || {};
  
  var csv = "Metric," + months.join(",") + ",FY Total\n";
  ["agents", "team_leaders", "ic2", "csm", "total", "agent_cost", "tl_cost", "ic2_cost", "csm_cost", "total_gross", "total_cost"].forEach(function(key) {
    var row = [key];
    months.forEach(function(m) {
      row.push(headcount[m] ? headcount[m][key] : costs[m] ? costs[m][key] : 0);
    });
    var fyVal = budgetData.fy_totals ? (budgetData.fy_totals.headcount ? budgetData.fy_totals.headcount[key] : 0) || (budgetData.fy_totals.costs ? budgetData.fy_totals.costs[key] : 0) : 0;
    row.push(fyVal);
    csv += row.join(",") + "\n";
  });
  
  import('./utils.js').then(function(m) { m.downloadCSV(csv, "Budget_" + globalFY + "_" + budgetBasis + ".csv"); });
  showToast("Budget exported", "success");
}
