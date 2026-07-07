/**
 * Utility functions - formatting, animations, and helpers
 */

// ============================================================
// Global state (shared across modules)
// ============================================================
export var globalFY = "FY27";
export var globalPeriodType = "monthly";
export var globalBrand = "all";
export var globalScenarioIdx = 0;
export var allScenarios = [];
export var forecastData = null;
export var insightsData = null;
export var budgetData = null;
export var salaryData = null;
export var learnershipData = null;
export var workforceData = null;
export var keyDriversData = null;
export var isDarkMode = false;
export var budgetBasis = "forecast";
export var LOADED = {};
export var currentPage = "dashboard";

// ============================================================
// Constants
// ============================================================
export var PERIOD_ABBR = {
  daily: "/day",
  weekly: "/week",
  monthly: "/month",
  quarterly: "/qtr",
  annual: "/year"
};

export var PERIOD_LABEL = {
  daily: "per day",
  weekly: "per week",
  monthly: "per month",
  quarterly: "per quarter",
  annual: "per year"
};

export var PRODUCTIVE_HOURS = {
  daily: 8,
  weekly: 40,
  monthly: 173.2,
  quarterly: 519.6,
  annual: 2078.4
};

export var MRD_DEPARTMENTS = [
  "MRD Order Success",
  "MRD Customer Service",
  "MRD TAL NOW",
  "MRD Groceries",
  "MRD Restaurant Support"
];

export var BRAND_COLORS = {
  TAL: "#0b4d8c",
  MRD: "#e8720c",
  TFS: "#128a4b",
  SUP: "#7c3aed",
  all: "#0b4d8c"
};

export var BRAND_BG = {
  TAL: "#e8f0fb",
  MRD: "#fef3e6",
  TFS: "#e6f7ef",
  SUP: "#f3e8ff"
};

// ============================================================
// Page metadata
// ============================================================
export var PAGE_META = {
  dashboard: { title: "Dashboard", icon: "space_dashboard" },
  forecast: { title: "Forecast & Analytics", icon: "trending_up" },
  workforce: { title: "Workforce Planning", icon: "groups" },
  budget: { title: "Budget Planner", icon: "payments" },
  salary: { title: "Salary Engine", icon: "attach_money" },
  learnership: { title: "Learnership Programme", icon: "school" },
  capex: { title: "CAPEX Planning", icon: "warehouse" },
  software: { title: "Software & Licences", icon: "computer" },
  fixedcosts: { title: "Fixed Costs", icon: "build" },
  financials: { title: "Financial Statement", icon: "account_balance" },
  reports: { title: "Executive Reports", icon: "monitoring" },
  ai: { title: "AI Assistant", icon: "auto_awesome" },
  admin: { title: "Administration", icon: "settings" }
};

// ============================================================
// Toast notifications
// ============================================================
export function showToast(message, type) {
  var a = document.getElementById("appToast");
  if (a) {
    a.textContent = message;
    var n = "fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl font-semibold text-sm shadow-xl transition-all ";
    n += "error" === type ? "bg-red-600 text-white" : "success" === type ? "bg-green-600 text-white" : "bg-[#0b2c52] text-white";
    a.className = n;
    a.style.display = "block";
    setTimeout(function() { a.style.display = "none"; }, 3500);
  }
}

// ============================================================
// Utility functions
// ============================================================
export function periodAbbr(t) {
  return PERIOD_ABBR[t] || "/month";
}

export function periodLabel(t) {
  return PERIOD_LABEL[t] || "per month";
}

export function toPeriod(t, e) {
  return t * ({ daily: 1 / 30.44, weekly: 12 / 52, monthly: 1, quarterly: 3, annual: 12 }[e] || 1);
}

export function getCurrentScenario() {
  return allScenarios && allScenarios.length > 0 && allScenarios[globalScenarioIdx] && allScenarios[globalScenarioIdx].name || "Current";
}

export function setEl(id, content) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = content;
}

export function resizeAllVisuals() {
  window.dispatchEvent(new Event("resize"));
}

// ============================================================
// Number formatting
// ============================================================
export function fmtNum(t) {
  return Math.round(t).toLocaleString("en-ZA");
}

export function fmtR(t) {
  if (t >= 1e6) return "R" + (t / 1e6).toFixed(2) + "M";
  if (t >= 1e3) return "R" + (t / 1e3).toFixed(1) + "k";
  return "R" + Math.round(t).toLocaleString("en-ZA");
}

export function fmtPct(t) {
  return t.toFixed(1) + "%";
}

export function fmtAHT(t) {
  return Math.round(t) + "s";
}

// ============================================================
// CSV download
// ============================================================
export function downloadCSV(csvContent, filename) {
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var link = document.createElement("a");
  var url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// Animations
// ============================================================
export function animateNumber(el, target, prefix, suffix, decimals) {
  if (!el) return;
  decimals = decimals || 0;
  var current = parseFloat(el.getAttribute("data-value") || "0") || 0;
  var step = (target - current) / 25;
  var count = 0;
  var value = current;
  var timer = setInterval(function() {
    value += step;
    var display = ++count >= 25 ? target : value;
    var text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-ZA");
    el.textContent = (prefix || "") + text + (suffix || "");
    el.setAttribute("data-value", display);
    if (count >= 25) {
      clearInterval(timer);
      el.setAttribute("data-value", target);
    }
  }, 24);
}

// ============================================================
// Sparkline chart
// ============================================================
export function drawSparkline(container, values, color) {
  if (!container || !values || values.length < 2) return;
  var width = container.offsetWidth || 100;
  var height = container.offsetHeight || 32;
  var min = Math.min.apply(null, values);
  var range = Math.max.apply(null, values) - min || 1;
  var points = values.map(function(v, i) {
    var x = (i / (values.length - 1)) * width;
    var y = height - ((v - min) / range) * (height - 4) - 2;
    return x + "," + y;
  });
  var lastX = points[points.length - 1].split(",")[0];
  var lastY = points[points.length - 1].split(",")[1];
  container.innerHTML = '<svg width="100%" height="100%" style="overflow:visible;"><polyline points="' + points.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + lastX + '" cy="' + lastY + '" r="3" fill="' + color + '"/></svg>';
}

// ============================================================
// Trend chip
// ============================================================
export function renderTrendChip(el, value) {
  if (!el || null == value) {
    el.textContent = "—";
    return;
  }
  var abs = Math.abs(value).toFixed(1);
  if (value > 1) {
    el.className = "kpi-trend trend-up";
    el.innerHTML = '<span class="material-symbols-outlined text-[12px]">arrow_upward</span> +' + abs + "%";
  } else if (value < -1) {
    el.className = "kpi-trend trend-down";
    el.innerHTML = '<span class="material-symbols-outlined text-[12px]">arrow_downward</span> ' + abs + "%";
  } else {
    el.className = "kpi-trend trend-flat";
    el.innerHTML = '<span class="material-symbols-outlined text-[12px]">remove</span> ' + abs + "%";
  }
}

// ============================================================
// Google Charts layout helper
// ============================================================
export function plotlyLayout(isDark) {
  var bg = isDark ? "#1a2744" : "transparent";
  var grid = isDark ? "#2d3f5c" : "#f1f5f9";
  return {
    paper_bgcolor: bg,
    plot_bgcolor: bg,
    font: { family: "Inter", size: 11, color: isDark ? "#e2e8f0" : "#424751" },
    margin: { t: 10, b: 40, l: 55, r: 10 },
    xaxis: { gridcolor: grid, linecolor: grid, tickfont: { size: 10 } },
    yaxis: { gridcolor: grid, linecolor: grid, tickfont: { size: 10 } },
    showlegend: false,
    displayModeBar: false
  };
}

// ============================================================
// FTE calculation
// ============================================================
export function calculateFTEClient(volume, aht, deflection) {
  var prodHours = PRODUCTIVE_HOURS[globalPeriodType] || 173.2;
  var shrinkage = parseFloat((document.getElementById("slider-shrinkage") || { value: 19 }).value) / 100 || 0.19;
  var occupancy = parseFloat((document.getElementById("slider-occupancy") || { value: 80 }).value) / 100 || 0.8;
  deflection = parseFloat((document.getElementById("slider-deflection") || { value: 5 }).value) / 100 || 0.05;
  var ahtMultiplier = parseFloat((document.getElementById("slider-aht") || { value: 100 }).value) / 100 || 1;
  var growth = parseFloat((document.getElementById("slider-growth") || { value: 0 }).value) / 100 || 0;
  
  var adjustedContacts = volume * (1 + growth);
  var humanContacts = adjustedContacts * (1 - deflection);
  var botContacts = adjustedContacts - humanContacts;
  var adjustedAHT = aht * ahtMultiplier;
  var workloadHours = (humanContacts * adjustedAHT) / 3600;
  var productiveHours = prodHours * occupancy * (1 - shrinkage);
  var requiredFTE = productiveHours > 0 ? Math.ceil(workloadHours / productiveHours) : 0;
  var teamLeaders = Math.ceil(requiredFTE / 15);
  var ic2 = Math.ceil(requiredFTE / 15);
  var csm = Math.ceil(requiredFTE / 55);
  
  return {
    adjusted_contacts: Math.ceil(adjustedContacts),
    human_contacts: Math.ceil(humanContacts),
    bot_contacts: Math.ceil(botContacts),
    adjusted_aht: Math.ceil(adjustedAHT),
    workload_hours: Math.round(100 * workloadHours) / 100,
    productive_hours: Math.round(100 * productiveHours) / 100,
    required_agent_fte: requiredFTE,
    leadership: {
      team_leaders: teamLeaders,
      "2ic": ic2,
      csm: csm
    },
    grand_total_headcount: requiredFTE + teamLeaders + ic2 + csm
  };
}

// ============================================================
// MRD Flexi split calculation
// ============================================================
export function calculateMRDFlexiSplitClient(agentFTE) {
  var permanent = Math.ceil(0.65 * agentFTE);
  var flexi = Math.ceil(0.35 * agentFTE);
  return {
    permanent: permanent,
    flexi: flexi,
    peak_buffer: Math.ceil(0.1 * flexi),
    weekend_available: Math.ceil(0.7 * flexi)
  };
}
