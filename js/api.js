/**
 * API Module - All backend fetch calls
 * Replace YOUR_APPS_SCRIPT_WEB_APP_URL_HERE with your actual Apps Script Web App URL
 */
const API_URL = "https://script.google.com/a/macros/takealot.com/s/AKfycbwlM6n1QAGEqORUD8A6uvhIDwYBpKk-KERJ0CroXXU8oTAd5LiSBT7ZDxDJUGwrD9M/exec";

/**
 * Unified fetch wrapper for Apps Script backend
 * @param {string} action - The server-side function name to call
 * @param {object} params - Optional parameters to pass to the function
 * @returns {Promise<object>} - JSON response from the server
 */
export async function apiFetch(action, params = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...params })
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ============================================================
// 18 API actions migrated from google.script.run
// ============================================================

/**
 * Get budget data for FY and scenario
 */
export async function getBudget(params) {
  return apiFetch("getBudget", params);
}

/**
 * Get CAPEX depreciation schedule
 */
export async function getCapexDepreciationSchedule(params) {
  return apiFetch("getCapexDepreciationSchedule", params);
}

/**
 * Get data source status
 */
export async function getDataStatus() {
  return apiFetch("getDataStatus");
}

/**
 * Get list of departments
 */
export async function getDepartments(params) {
  return apiFetch("getDepartments", params);
}

/**
 * Get financial statement data
 */
export async function getFinancialStatement(params) {
  return apiFetch("getFinancialStatement", params);
}

/**
 * Get fixed costs summary
 */
export async function getFixedCostsSummary(params) {
  return apiFetch("getFixedCostsSummary", params);
}

/**
 * Get forecast data
 */
export async function getForecastData(params) {
  return apiFetch("getForecastData", params);
}

/**
 * Get insights summary
 */
export async function getInsights(params) {
  return apiFetch("getInsights", params);
}

/**
 * Get key drivers data
 */
export async function getKeyDrivers(params) {
  return apiFetch("getKeyDrivers", params);
}

/**
 * Get learnership cost summary
 */
export async function getLearnershipCostSummary(params) {
  return apiFetch("getLearnershipCostSummary", params);
}

/**
 * Get salary table data
 */
export async function getSalaryTableData() {
  return apiFetch("getSalaryTableData");
}

/**
 * Get planning scenarios
 */
export async function getScenarios() {
  return apiFetch("getScenarios");
}

/**
 * Get software cost summary
 */
export async function getSoftwareCostSummary(params) {
  return apiFetch("getSoftwareCostSummary", params);
}

/**
 * Get workforce summary
 */
export async function getWorkforceSummary(params) {
  return apiFetch("getWorkforceSummary", params);
}

/**
 * Refresh BigQuery cache
 */
export async function refreshBQCache() {
  return apiFetch("refreshBQCache");
}

/**
 * Ask AI assistant a question
 */
export async function askAIAssistant(question) {
  return apiFetch("askAIAssistant", { question });
}

/**
 * Get AI insights
 */
export async function getAIInsights(params) {
  return apiFetch("getAIInsights", params);
}

/**
 * Get AI recommendations
 */
export async function getAIRecommendations(params) {
  return apiFetch("getAIRecommendations", params);
}
