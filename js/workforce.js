/**
 * Workforce planning page module
 */
import { apiFetch } from './api.js';
import { globalFY, globalPeriodType, globalBrand, showToast, fmtNum, PRODUCTIVE_HOURS, calculateFTEClient, calculateMRDFlexiSplitClient } from './utils.js';

export var workforceData = null;

export function loadWorkforcePage() {
  var fy = document.getElementById("wpFYSelect") ? document.getElementById("wpFYSelect").value : "FY27";
  
  Promise.all([
    apiFetch("getScenarios"),
    apiFetch("getWorkforceSummary", { fy: fy }),
    apiFetch("getDepartments", { brand: "all" })
  ]).then(function(results) {
    var scenarios = results[0];
    var summary = results[1];
    var depts = results[2];
    
    window.allScenarios = scenarios.scenarios || [];
    workforceData = summary;
    
    renderScenarioCards(window.allScenarios);
    renderWorkforceTable(summary);
    updateWorkforceDisplay();
    
    var deptSelect = document.getElementById("wpDeptSelect");
    if (deptSelect) {
      deptSelect.innerHTML = '<option value="all">All Departments</option>';
      (depts.departments || []).forEach(function(d) {
        deptSelect.innerHTML += '<option value="' + d + '">' + d + '</option>';
      });
    }
  }).catch(function(err) {
    showToast("Workforce page error: " + err, "error");
  });
}

export function renderScenarioCards(scenarios) {
  var container = document.getElementById("scenarioCards");
  if (!container || !scenarios.length) return;
  
  container.innerHTML = scenarios.map(function(s, i) {
    return '<div onclick="selectScenario(' + i + ')" class="scenario-card' + (i === window.globalScenarioIdx ? " active" : "") + '">' +
      '<div class="font-bold text-[11px] text-[#0b4d8c] mb-2">' + s.name + '</div>' +
      '<div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500">' +
      '<span>Shrinkage</span><span class="text-right font-semibold text-gray-700">' + Math.round(100 * s.shrinkage) + '%</span>' +
      '<span>Occupancy</span><span class="text-right font-semibold text-gray-700">' + Math.round(100 * s.occupancy) + '%</span>' +
      '<span>Deflection</span><span class="text-right font-semibold text-gray-700">' + Math.round(100 * s.deflection) + '%</span>' +
      '<span>AHT×</span><span class="text-right font-semibold text-gray-700">' + s.aht_multiplier.toFixed(2) + '</span>' +
      '<span>Growth</span><span class="text-right font-semibold text-gray-700">' + Math.round(100 * s.growth) + '%</span>' +
      '</div></div>';
  }).join("");
}

export function selectScenario(idx) {
  window.globalScenarioIdx = idx;
  document.querySelectorAll(".scenario-card").forEach(function(card, i) {
    card.classList.toggle("active", i === idx);
  });
  
  var scenario = window.allScenarios[idx];
  if (scenario) {
    var setVal = function(id, val) {
      var el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("slider-shrinkage", Math.round(100 * scenario.shrinkage));
    setVal("slider-occupancy", Math.round(100 * scenario.occupancy));
    setVal("slider-deflection", Math.round(100 * scenario.deflection));
    setVal("slider-aht", Math.round(100 * scenario.aht_multiplier));
    setVal("slider-growth", Math.round(100 * scenario.growth));
    onSliderChange();
  }
}

export function onSliderChange() {
  var shrinkage = parseFloat((document.getElementById("slider-shrinkage") || { value: 19 }).value);
  var occupancy = parseFloat((document.getElementById("slider-occupancy") || { value: 80 }).value);
  var deflection = parseFloat((document.getElementById("slider-deflection") || { value: 5 }).value);
  var ahtMult = parseFloat((document.getElementById("slider-aht") || { value: 100 }).value);
  var growth = parseFloat((document.getElementById("slider-growth") || { value: 0 }).value);
  
  document.getElementById("slider-shrinkage-val").textContent = shrinkage + "%";
  document.getElementById("slider-occupancy-val").textContent = occupancy + "%";
  document.getElementById("slider-deflection-val").textContent = deflection + "%";
  document.getElementById("slider-aht-val").textContent = (ahtMult / 100).toFixed(2);
  document.getElementById("slider-growth-val").textContent = (growth >= 0 ? "+" : "") + growth + "%";
  
  var prodHours = PRODUCTIVE_HOURS[globalPeriodType] || 173.2;
  var effectiveProd = prodHours * (occupancy / 100) * (1 - shrinkage / 100);
  var prodEl = document.getElementById("wp-prod-hrs");
  if (prodEl) prodEl.textContent = prodHours.toFixed(1) + " hrs × " + occupancy + "% × " + Math.round(100 * (1 - shrinkage / 100)) + "% = " + effectiveProd.toFixed(1) + " hrs";
  
  updateWorkforceDisplay();
}

export function updateWorkforceDisplay() {
  if (!window.forecastData || !window.forecastData.length) return;
  
  var byPeriod = {};
  window.forecastData.forEach(function(row) {
    var pk = row.period_key || 'all';
    byPeriod[pk] = byPeriod[pk] || { vol: 0, aht: 0, count: 0 };
    byPeriod[pk].vol += row.forecast_contacts || 0;
    byPeriod[pk].aht += row.forecast_aht_seconds || 300;
    byPeriod[pk].count++;
  });
  
  var bestPk = null, bestVol = 0;
  Object.keys(byPeriod).forEach(function(k) {
    if (byPeriod[k].vol > bestVol) { bestVol = byPeriod[k].vol; bestPk = k; }
  });
  
  var vol = bestPk ? byPeriod[bestPk].vol : 0;
  var count = bestPk ? byPeriod[bestPk].count : 1;
  var aht = bestPk ? byPeriod[bestPk].aht : 300;
  var fte = calculateFTEClient(vol, count > 0 ? aht / count : 300, 0.05);
  
  var setVal = function(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = "number" === typeof val ? fmtNum(val) : val;
  };
  
  setVal("wf-adj-contacts", fte.adjusted_contacts);
  setVal("wf-bot-deflected", fte.bot_contacts);
  setVal("wf-human-contacts", fte.human_contacts);
  setVal("wf-workload-hrs", fte.workload_hours.toFixed(0) + "h");
  setVal("wf-prod-hrs2", fte.productive_hours.toFixed(0) + "h");
  setVal("wf-req-fte", fte.required_agent_fte);
  setVal("org-agents", fte.required_agent_fte);
  setVal("org-tl", fte.leadership.team_leaders);
  setVal("org-2ic", fte.leadership["2ic"]);
  setVal("org-csm", fte.leadership.csm);
  setVal("org-grand-total", fte.grand_total_headcount);
  
  var mrdPanel = document.getElementById("mrdFlexiPanel");
  var deptFilter = document.getElementById("wpDeptSelect");
  var dept = deptFilter ? deptFilter.value : "all";
  var isMRD = window.MRD_DEPARTMENTS && window.MRD_DEPARTMENTS.indexOf(dept) !== -1;
  
  if (mrdPanel) {
    if (isMRD || "all" === dept) {
      mrdPanel.classList.remove("hidden");
      var flexi = calculateMRDFlexiSplitClient(fte.required_agent_fte);
      setVal("mrd-perm", flexi.permanent);
      setVal("mrd-flexi", flexi.flexi);
      setVal("mrd-peak", flexi.peak_buffer);
      setVal("mrd-weekend", flexi.weekend_available);
    } else {
      mrdPanel.classList.add("hidden");
    }
  }
}

export function renderWorkforceTable(data) {
  var tbody = document.getElementById("workforceTableBody");
  if (!tbody) return;
  
  if (!data || !data.success) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">No data</td></tr>';
    return;
  }
  
  var summary = data.summary || {};
  var depts = Object.keys(summary).sort();
  
  tbody.innerHTML = depts.map(function(dept) {
    var d = summary[dept];
    return d ? '<tr class="hover:bg-gray-50">' +
      '<td class="font-medium text-sm">' + dept + '</td>' +
      '<td class="num font-semibold text-[#0b4d8c]">' + fmtNum(d.totals.agents) + '</td>' +
      '<td class="num">' + fmtNum(d.totals.tl) + '</td>' +
      '<td class="num">' + fmtNum(d.totals.ic2) + '</td>' +
      '<td class="num">' + fmtNum(d.totals.csm) + '</td>' +
      '<td class="num font-bold">' + fmtNum(d.totals.total) + '</td>' +
      '</tr>' : '';
  }).join("");
}
