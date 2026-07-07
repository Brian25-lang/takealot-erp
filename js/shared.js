/**
 * Shared functions used across multiple pages
 */
import { apiFetch } from './api.js';
import { showToast } from './utils.js';

export async function refreshDataStatus() {
  try {
    const data = await apiFetch('getDataStatus');
    var badge = document.getElementById("dataSourceBadge");
    if (badge) {
      var isBQ = "bigquery" === data.source || "cache" === data.source;
      badge.innerHTML = isBQ
        ? '<span style="color:#4ade80;">●</span> BigQuery · ' + (data.rows || 0).toLocaleString() + " rows"
        : '<span style="color:#fbbf24;">●</span> ' + (data.source || "unknown") + " · " + (data.rows || 0) + " rows";
    }
    
    var pill = document.getElementById("dataSourcePill");
    if (pill) pill.textContent = (data.source || "") + " · " + (data.rows || 0) + " rows";
    
    var adminBadge = document.getElementById("adminDataSourceBadge");
    var adminSource = document.getElementById("adminDataSource");
    if (adminBadge && adminSource) {
      adminBadge.textContent = data.source || "unknown";
      adminBadge.className = "badge " + (isBQ ? "badge-success" : "badge-warn");
      adminSource.textContent = (data.rows || 0) + " rows · " + (data.departments || 0) + " depts · " + (data.periods || 0) + " periods";
    }
  } catch(e) {
    // API not connected yet — show offline badge silently
    var badge = document.getElementById("dataSourceBadge");
    if (badge) badge.innerHTML = '<span style="color:#fbbf24;">●</span> API not connected';
  }
}

export function refreshCache() {
  showToast("Refreshing BQ cache...", "info");
  apiFetch("refreshBQCache").then(function(data) {
    showToast("Cache refreshed: " + data.rows + " rows from " + data.source, "success");
    refreshDataStatus();
  }).catch(function(err) {
    showToast("Cache refresh failed: " + err, "error");
  });
}

export function loadAdminPage() {
  refreshDataStatus();
}
