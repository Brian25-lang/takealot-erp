/**
 * Router module - page navigation and loading
 */
import { PAGE_META, showToast, globalFY, globalPeriodType, globalBrand, budgetBasis, LOADED, currentPage, BRAND_COLORS } from './utils.js';

// Page loaders - imported dynamically
var pageLoaders = {};

/**
 * Initialize page loaders map
 */
export function initRouter(loaders) {
  pageLoaders = loaders;
}

/**
 * Switch to a different page
 */
export function switchPage(page) {
  // Hide all page sections
  document.querySelectorAll(".page-section").forEach(function(el) {
    el.classList.remove("active");
    el.style.display = "none";
  });
  
  // Remove active state from all nav items
  document.querySelectorAll(".nav-item").forEach(function(el) {
    el.classList.remove("active");
  });
  
  // Show target page
  var target = document.getElementById("page-" + page);
  if (target) {
    target.style.display = "block";
    target.classList.add("active");
  }
  
  // Set active nav item
  var navItem = document.querySelector('[data-page="' + page + '"]');
  if (navItem) navItem.classList.add("active");
  
  // Update page title
  var title = document.getElementById("pageTitle");
  if (title && PAGE_META[page]) {
    title.textContent = PAGE_META[page].title;
  }
  
  // Load page content
  if (pageLoaders[page]) {
    pageLoaders[page]();
  }
}

/**
 * Toggle sidebar visibility (mobile)
 */
export function toggleSidebar() {
  var sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("open");
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
  var isDark = document.documentElement.classList.toggle("dark");
  var btn = document.getElementById("darkModeBtn");
  if (btn) {
    var icon = btn.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = isDark ? "light_mode" : "dark_mode";
  }
  var accent = document.getElementById("brandAccentBar");
  if (accent) accent.style.backgroundColor = isDark ? "#f2a900" : "#0b4d8c";
}

/**
 * Handle FY selector change
 */
export function globalFYChanged() {
  var fy = document.getElementById("fySelector").value;
  window.globalFY = fy;
  var active = document.querySelector(".page-section.active");
  if (active) {
    var page = active.id.replace("page-", "");
    if (pageLoaders[page]) pageLoaders[page]();
  }
}

/**
 * Set period type
 */
export function setPeriodType(type) {
  window.globalPeriodType = type;
  document.querySelectorAll(".period-pill").forEach(function(el) {
    el.classList.toggle("active", el.dataset.period === type);
  });
  var active = document.querySelector(".page-section.active");
  if (active) {
    var page = active.id.replace("page-", "");
    if (pageLoaders[page]) pageLoaders[page]();
  }
}

/**
 * Set brand filter
 */
export function setBrand(brand) {
  window.globalBrand = brand;
  document.querySelectorAll(".brand-pill").forEach(function(el) {
    el.classList.toggle("active", el.dataset.brand === brand);
  });
  var accent = document.getElementById("brandAccentBar");
  if (accent) accent.style.backgroundColor = BRAND_COLORS[brand] || "#0b4d8c";
  var active = document.querySelector(".page-section.active");
  if (active) {
    var page = active.id.replace("page-", "");
    if (pageLoaders[page]) pageLoaders[page]();
  }
}

/**
 * Handle escape key to close sidebar
 */
export function initEscapeKeyHandler() {
  document.addEventListener("keydown", function(e) {
    if ("Escape" === e.key) {
      var sidebar = document.getElementById("sidebar");
      if (sidebar) sidebar.classList.remove("open");
    }
  });
}
