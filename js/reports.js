/**
 * Reports page module
 */
import { showToast } from './utils.js';

export function loadReportsPage() {
  // Reports page content - stub implementation
  // In production, this would load actual report data
  var container = document.getElementById("reportsContent");
  if (container) {
    container.innerHTML = '<div class="stub-card">' +
      '<div class="stub-icon"><span class="material-symbols-outlined">monitoring</span></div>' +
      '<div class="stub-badge"><span class="material-symbols-outlined text-sm">info</span>Coming Soon</div>' +
      '<h2 class="text-xl font-bold text-[#0b2c52] mb-2">Executive Reports</h2>' +
      '<p class="stub-desc text-gray-500">Report generation will be available once the backend is connected.</p></div>';
  }
}
