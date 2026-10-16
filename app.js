/* ==========================================================================
   🇲🇦 MOROCCO PURCHASING PIPELINE - COMPLETE WEB APPLICATION ENGINE
   Bureau Casablanca · Suivi Production & Pipeline Achats
   Tailored to: Suivi_Prod-Team-Casa.xlsx
   ========================================================================== */

// ── 1. CONFIGURATION & CONSTANTS ──────────────────────────────────────────
const BUYERS = [
  "Hamid AIT TAGADIRTE",
  "Marouane CHAHDANE",
  "Raffael BUENOS AIRES"
];

// Prospectors are entered as free-text and dynamically discovered from pipeline entries


const SUPPLIER_TYPES = [
  "Actif",
  "Inactif",
  "Occasionnel",
  "NEW BIZ"
];

const AFFAIRE_STATUSES = [
  "Lot",
  "Prenego",
  "CRV",
  "DD",
  "Closed"
];

const OFFER_STATUSES = [
  "Negociation",
  "Forecast",
  "Negociée + BPA",
  "Negociée en attente BPA",
  "Re-valorisation",
  "Commandé",
  "Closed"
];

const PRODUCT_CATEGORIES = [
  { value: "Lingerie", label: "Lingerie" },
  { value: "Vêtements", label: "Clothing" },
  { value: "Vêtements kids", label: "Kids Clothing" },
  { value: "Chaussures", label: "Shoes" },
  { value: "Chaussures femmes", label: "Women's Shoes" },
  { value: "Bijoux", label: "Jewelry" },
  { value: "Homme / Sport", label: "Men / Sport" },
  { value: "Maroquinerie / Bags", label: "Leather Goods / Bags" },
  { value: "Maison & Déco", label: "Home & Decor" },
  { value: "Textile technique", label: "Technical Textile" },
  { value: "Bazar", label: "Bazaar / General Merch" },
  { value: "PGC", label: "FMCG (PGC)" },
  { value: "Hygiène & DPH", label: "Hygiene & DPH" },
  { value: "Jouets / Toys", label: "Toys" },
  { value: "Général", label: "General" }
];

const PRODUCT_RANGES = PRODUCT_CATEGORIES.map(c => c.value);

function getProductCategoryLabel(val) {
  const found = PRODUCT_CATEGORIES.find(c => c.value === val);
  return found ? found.label : (val || "General");
}

// ── 2. STATE MANAGEMENT ───────────────────────────────────────────────────
let allDeals = [];
let filteredDeals = [];
let supabaseClient = null;
let stageChartInstance = null;
let currentTheme = localStorage.getItem("morocco_app_theme") || "dark";

// Filter State
let filterPeriod = "All Time";
let filterPeriodVal = "";
let filterBuyerVal = "All";
let filterProspectorVal = "All";
let filterCategoryVal = "All";
let filterSearchVal = "";
let filterStaleOnlyVal = false;
let filterOngoingOnlyVal = false;
let filterSupplierTypeVal = "All";
let currentAppView = "dashboard"; // "dashboard" | "buyers" | "database"
let currentSavedView = "all"; // "all" | "overdue" | "forecast" | "dnd"

// Buyers Weekly Activities Trend State (Inspired by Screenshot 1)
let currentTrendMode = "monthly"; // "monthly" (progress per week) | "weekly" (progress day-by-day)
let currentTrendBuyer = "All";
let activityChartDDInstance = null;
let activityChartRealizationInstance = null;
let activityChartNewBizInstance = null;

// Buyers Results Scoreboard State (Inspired by Screenshot 2)
let currentBuyerSubView = "table"; // "table" | "cards"
let currentBuyerFilterYear = "2026";
let currentBuyerFilterWeek = "All";
let currentBuyerFilterMonth = "All";

const BUYER_PROFILES = {
  "Hamid AIT TAGADIRTE": {
    initials: "HA",
    status: "Investment",
    seniority: "6 months",
    target: 240000,
    avatarBg: "linear-gradient(135deg, #3b82f6, #1d4ed8)"
  },
  "Marouane CHAHDANE": {
    initials: "MC",
    status: "Investment",
    seniority: "6 months",
    target: 240000,
    avatarBg: "linear-gradient(135deg, #10b981, #047857)"
  },
  "Raffael BUENOS AIRES": {
    initials: "RB",
    status: "Investment",
    seniority: "4 months",
    target: 180000,
    avatarBg: "linear-gradient(135deg, #f59e0b, #b45309)"
  }
};

// ── 3. INITIALIZATION ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  initLucide();
  initPINLock();
  initDropdowns();
  initModalsAndDrawer();
  initFilters();
  initDashboardInteractions();
  initBuyersWeeklyActivities();
  initBuyersResults();

  initSupabase();
  await loadDeals();
  updateProspectorFilterOptions();

  const initialHash = window.location.hash.replace("#", "").toLowerCase();
  if (initialHash === "database") {
    switchView("database");
  } else if (initialHash === "buyers" || initialHash === "buyer-results") {
    switchView("buyers");
  } else {
    switchView("dashboard");
  }
});

function initLucide() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ── 4. LIGHT / DARK THEME ENGINE ──────────────────────────────────────────
function initTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon();

  const toggleBtn = document.getElementById("btnThemeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", currentTheme);
      localStorage.setItem("morocco_app_theme", currentTheme);
      updateThemeIcon();
      renderStageChart();
      renderActivityCharts();
      showToast("Theme Updated", `Switched to ${currentTheme === "dark" ? "Dark" : "Light"} Mode`);
    });
  }
}

function updateThemeIcon() {
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.setAttribute("data-lucide", currentTheme === "dark" ? "sun" : "moon");
    initLucide();
  }
}

// ── 5. ROLE-BASED ACCESS CONTROL (ADMIN, TEAM LEADER, BUYERS) ─────────────
const DEFAULT_ACCOUNTS = [
  { name: "Toby", role: "Admin", pin: "2309" },
  { name: "Said", role: "Team Leader", pin: "1470" },
  { name: "Hamid AIT TAGADIRTE", role: "Buyer", pin: "1111" },
  { name: "Marouane CHAHDANE", role: "Buyer", pin: "2222" },
  { name: "Raffael BUENOS AIRES", role: "Buyer", pin: "3333" }
];

function getUserAccounts() {
  const saved = localStorage.getItem("morocco_user_accounts");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.some(a => a.name === "Hamid AIT TAGADIRTE")) {
        return parsed;
      }
    } catch(e) {}
  }
  localStorage.setItem("morocco_user_accounts", JSON.stringify(DEFAULT_ACCOUNTS));
  return DEFAULT_ACCOUNTS;
}

function saveUserAccounts(accounts) {
  localStorage.setItem("morocco_user_accounts", JSON.stringify(accounts));
}

let currentUser = sessionStorage.getItem("morocco_pipeline_user") || "Toby";

function getCurrentUserRole() {
  const accounts = getUserAccounts();
  const acc = accounts.find(a => a.name === currentUser);
  if (acc) return acc.role;
  if (currentUser === "Toby") return "Admin";
  if (currentUser === "Said") return "Team Leader";
  return "Buyer";
}

function isAdmin() {
  return getCurrentUserRole() === "Admin" || currentUser === "Toby";
}

function isTeamLeader() {
  const role = getCurrentUserRole();
  return role === "Team Leader" || role === "Manager";
}

function isTeamLeaderOrAdmin() {
  return isAdmin() || isTeamLeader();
}

function isBuyerUser() {
  return !isTeamLeaderOrAdmin();
}

let globalAuditLogs = JSON.parse(localStorage.getItem("morocco_audit_logs") || "[]");

async function recordAuditLog(action, supplier, details, dealId = null) {
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const entry = {
    id: Date.now(),
    dealId: dealId,
    timestamp: timeStr,
    user: currentUser || "Unknown",
    action: action,
    supplier: supplier || "Pipeline",
    details: details || ""
  };

  globalAuditLogs.unshift(entry);
  if (globalAuditLogs.length > 600) globalAuditLogs.pop();
  localStorage.setItem("morocco_audit_logs", JSON.stringify(globalAuditLogs));

  // Sync to Supabase table pipeline_logs if available
  if (supabaseClient) {
    try {
      await supabaseClient.from("pipeline_logs").insert([{
        deal_id: dealId,
        user_name: currentUser || "Unknown",
        action: action,
        supplier: supplier || "Pipeline",
        details: details || ""
      }]);
    } catch (err) {
      console.warn("Supabase log sync warning:", err);
    }
  }
}

function renderGlobalAuditLogs() {
  const container = document.getElementById("globalAuditLogList");
  if (!container) return;

  const authorFilter = document.getElementById("filterAuditAuthor") ? document.getElementById("filterAuditAuthor").value : "All";
  const displayedLogs = authorFilter === "All" ? globalAuditLogs : globalAuditLogs.filter(l => l.user === authorFilter);

  if (!displayedLogs || displayedLogs.length === 0) {
    container.innerHTML = `<div class="comments-log-empty">No activity logs recorded yet.</div>`;
    return;
  }

  container.innerHTML = displayedLogs.map(log => `
    <div class="log-item ${log.dealId ? 'log-item-clickable' : ''}" ${log.dealId ? `onclick="openDealFromLog(${log.dealId})"` : ''} title="${log.dealId ? 'Click to open deal' : ''}">
      <div class="log-item-header">
        <span class="log-author-tag">
          <i data-lucide="${log.user === 'Toby' ? 'crown' : 'user'}"></i>
          <strong>${escapeHtml(log.user)}</strong>
          <span style="font-weight:400; color:var(--text-dim);">· ${escapeHtml(log.action)}</span>
        </span>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          ${log.dealId ? `<span class="badge badge-primary" style="font-size:0.7rem; font-weight:700;"><i data-lucide="external-link" style="width:11px; height:11px;"></i>View Deal</span>` : ''}
          <span class="log-timestamp">${escapeHtml(log.timestamp)}</span>
        </div>
      </div>
      <div class="log-item-text" style="font-size:0.88rem; font-weight:700; color:var(--text-main); margin-bottom:2px;">
        ${escapeHtml(log.supplier)}
      </div>
      <div class="log-item-text" style="color:var(--text-muted); font-size:0.8rem;">
        ${escapeHtml(log.details)}
      </div>
    </div>
  `).join("");
  initLucide();
}

window.openDealFromLog = (dealId) => {
  const auditModal = document.getElementById("auditModal");
  if (auditModal) auditModal.classList.remove("open");
  const deal = allDeals.find(d => d.id === dealId);
  if (deal) openDrawer(deal);
};

function updateAdminUI() {
  const role = getCurrentUserRole();
  const userBadge = document.getElementById("activeUserName");
  if (userBadge) {
    if (role === "Admin") {
      userBadge.textContent = `👑 ${currentUser} (Admin)`;
    } else if (role === "Team Leader") {
      userBadge.textContent = `👔 ${currentUser} (Team Leader)`;
    } else {
      userBadge.textContent = `👤 ${currentUser} (Buyer)`;
    }
  }

  const deleteBtn = document.getElementById("btnDeleteDrawerDeal");
  if (deleteBtn) {
    deleteBtn.style.display = isAdmin() ? "inline-flex" : "none";
  }

  const clearLogsBtn = document.getElementById("btnClearAuditLogs");
  if (clearLogsBtn) {
    clearLogsBtn.style.display = isAdmin() ? "inline-block" : "none";
  }

  const settingsBtn = document.getElementById("btnOpenSettings");
  if (settingsBtn) {
    settingsBtn.style.display = isAdmin() ? "inline-flex" : "none";
    settingsBtn.title = "Cloud Sync & System Settings (Admin)";
  }

  // RBAC for Buyer controls
  const filterBuyer = document.getElementById("filterBuyer");
  const addBuyer = document.getElementById("addBuyer");
  const trendBuyerFilter = document.getElementById("trendBuyerFilter");

  if (isBuyerUser()) {
    if (filterBuyer) {
      filterBuyer.value = currentUser;
      filterBuyer.disabled = true;
      filterBuyer.style.opacity = "0.75";
      filterBuyer.style.cursor = "not-allowed";
    }
    if (addBuyer) {
      addBuyer.value = currentUser;
      addBuyer.disabled = true;
      addBuyer.style.opacity = "0.75";
      addBuyer.style.cursor = "not-allowed";
    }
    if (trendBuyerFilter) {
      trendBuyerFilter.value = currentUser;
      trendBuyerFilter.disabled = true;
      trendBuyerFilter.style.opacity = "0.75";
      trendBuyerFilter.style.cursor = "not-allowed";
    }
  } else {
    if (filterBuyer) {
      filterBuyer.disabled = false;
      filterBuyer.style.opacity = "1";
      filterBuyer.style.cursor = "default";
    }
    if (addBuyer) {
      addBuyer.disabled = false;
      addBuyer.style.opacity = "1";
      addBuyer.style.cursor = "default";
    }
    if (trendBuyerFilter) {
      trendBuyerFilter.disabled = false;
      trendBuyerFilter.style.opacity = "1";
      trendBuyerFilter.style.cursor = "default";
    }
  }
}

function initPINLock() {
  const pinOverlay = document.getElementById("pinOverlay");
  const pinForm = document.getElementById("pinForm");
  const pinInput = document.getElementById("pinInput");
  const pinError = document.getElementById("pinError");
  const btnLockApp = document.getElementById("btnLockApp");

  const isUnlocked = sessionStorage.getItem("morocco_pipeline_unlocked") === "true";
  if (isUnlocked && currentUser) {
    pinOverlay.classList.add("unlocked");
    pinOverlay.style.display = "none";
    updateAdminUI();
  }

  function attemptUnlock() {
    const enteredPin = pinInput.value.trim();
    if (!enteredPin) return;

    const accounts = getUserAccounts();
    const matchedAccount = accounts.find(a => a.pin === enteredPin);

    if (matchedAccount) {
      currentUser = matchedAccount.name;
      sessionStorage.setItem("morocco_pipeline_unlocked", "true");
      sessionStorage.setItem("morocco_pipeline_user", currentUser);
      updateAdminUI();

      pinOverlay.classList.add("unlocked");
      pinOverlay.style.display = "none";
      pinError.style.display = "none";
      pinInput.value = "";
      applyFiltersAndRender();
      showToast("Session Unlocked", `Welcome ${currentUser} (${matchedAccount.role})`);
    } else {
      pinError.textContent = "Incorrect PIN code. Please try again.";
      pinError.style.display = "block";
      pinInput.value = "";
      pinInput.focus();
    }
  }

  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      attemptUnlock();
    }
  });

  pinInput.addEventListener("input", () => {
    if (pinInput.value.trim().length === 4) {
      attemptUnlock();
    }
  });

  pinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    attemptUnlock();
  });

  btnLockApp.addEventListener("click", () => {
    sessionStorage.removeItem("morocco_pipeline_unlocked");
    pinOverlay.classList.remove("unlocked");
    pinOverlay.style.display = "flex";
    pinInput.value = "";
    setTimeout(() => pinInput.focus(), 200);
  });
}

window.selectQuickUser = (name, pin) => {
  const pinInput = document.getElementById("pinInput");
  if (pinInput) {
    pinInput.value = pin;
    const form = document.getElementById("pinForm");
    if (form) form.dispatchEvent(new Event("submit"));
  }
};

// ── 6. SUPABASE CLOUD SYNC & DATA PERSISTENCE ─────────────────────────────
const DEFAULT_SUPABASE_TABLE = "morocco_pipeline";

function initSupabase() {
  const url = localStorage.getItem("morocco_supabase_url");
  const key = localStorage.getItem("morocco_supabase_key");
  const tableName = localStorage.getItem("morocco_supabase_table") || DEFAULT_SUPABASE_TABLE;
  const connStatus = document.getElementById("connectionStatus");

  if (url && key && window.supabase) {
    try {
      supabaseClient = supabase.createClient(url, key);
      if (connStatus) {
        connStatus.className = "connection-status online";
        const txt = connStatus.querySelector(".status-text");
        if (txt) txt.textContent = "Cloud Sync Active";
      }

      // Realtime subscription for deals table
      supabaseClient
        .channel(`public:${tableName}`)
        .on("postgres_changes", { event: "*", schema: "public", table: tableName }, async () => {
          await fetchFromSupabase();
          applyFiltersAndRender();
          showToast("Live Sync", "Database synchronized in real time");
        })
        .subscribe();

      // Realtime subscription for team logs
      supabaseClient
        .channel("public:pipeline_logs")
        .on("postgres_changes", { event: "*", schema: "public", table: "pipeline_logs" }, async () => {
          await fetchLogsFromSupabase();
          renderGlobalAuditLogs();
        })
        .subscribe();

    } catch (err) {
      console.error("Supabase init error:", err);
      if (connStatus) {
        connStatus.className = "connection-status offline";
        const txt = connStatus.querySelector(".status-text");
        if (txt) txt.textContent = "Local Mode";
      }
    }
  } else {
    if (connStatus) {
      connStatus.className = "connection-status offline";
      const txt = connStatus.querySelector(".status-text");
      if (txt) txt.textContent = "Local Mode";
    }
  }
}

const CURRENT_DATABASE_VERSION = "2026-10-15-v5-forecast-aligned";

function reflashLocalDatabase(notify = false) {
  if (typeof window !== "undefined" && window.SEED_DEALS && Array.isArray(window.SEED_DEALS) && window.SEED_DEALS.length > 0) {
    allDeals = JSON.parse(JSON.stringify(window.SEED_DEALS));
    localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));
    localStorage.setItem("morocco_pipeline_db_version", CURRENT_DATABASE_VERSION);
    if (notify) {
      showToast("Database Reflashed", "All deal statuses aligned (DD done before offer, offer before forecast, forecast before order).");
    }
    return true;
  }
  return false;
}

window.reflashDatabase = function(notify = true) {
  reflashLocalDatabase(notify);
  updateProspectorFilterOptions();
  applyFiltersAndRender();
};

async function loadDeals() {
  if (supabaseClient) {
    const success = await fetchFromSupabase();
    if (success) {
      await fetchLogsFromSupabase();
      return;
    }
  }

  // Automatic reflash if database schema/seed version changed
  const storedVersion = localStorage.getItem("morocco_pipeline_db_version");
  if (storedVersion !== CURRENT_DATABASE_VERSION) {
    console.log("Reflashing database with strictly aligned pipeline statuses...");
    if (reflashLocalDatabase(false)) {
      return;
    }
  }

  // Fallback 1: LocalStorage (if non-empty)
  const local = localStorage.getItem("morocco_pipeline_deals");
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allDeals = parsed;
        return;
      }
    } catch (e) {}
  }

  // Fallback 2: Synchronous window.SEED_DEALS (immediate offline & file:/// support)
  if (typeof window !== "undefined" && window.SEED_DEALS && Array.isArray(window.SEED_DEALS) && window.SEED_DEALS.length > 0) {
    allDeals = JSON.parse(JSON.stringify(window.SEED_DEALS));
    localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));
    localStorage.setItem("morocco_pipeline_db_version", CURRENT_DATABASE_VERSION);
    return;
  }

  // Fallback 3: initial_data.json
  try {
    const res = await fetch("initial_data.json");
    if (res.ok) {
      allDeals = await res.json();
      localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));
      localStorage.setItem("morocco_pipeline_db_version", CURRENT_DATABASE_VERSION);
    }
  } catch (err) {
    console.warn("Could not fetch initial_data.json:", err);
    allDeals = [];
  }
}

async function fetchFromSupabase() {
  if (!supabaseClient) return false;
  const tableName = localStorage.getItem("morocco_supabase_table") || DEFAULT_SUPABASE_TABLE;
  try {
    const { data, error } = await supabaseClient
      .from(tableName)
      .select("*")
      .order("id", { ascending: true });
    
    if (error) throw error;
    if (data && data.length > 0) {
      allDeals = data;
      localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));
      updateProspectorFilterOptions();
      return true;
    }
  } catch (e) {
    console.error("Supabase query error:", e);
  }
  return false;
}

async function fetchLogsFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from("pipeline_logs")
      .select("*")
      .order("id", { ascending: false })
      .limit(200);

    if (error) throw error;
    if (data && data.length > 0) {
      globalAuditLogs = data.map(l => ({
        id: l.id,
        dealId: l.deal_id,
        timestamp: l.timestamp.replace("T", " ").substring(0, 16),
        user: l.user_name,
        action: l.action,
        supplier: l.supplier,
        details: l.details
      }));
      localStorage.setItem("morocco_audit_logs", JSON.stringify(globalAuditLogs));
    }
  } catch (e) {
    console.warn("Could not fetch logs from Supabase:", e);
  }
}

async function saveDealRecord(deal) {
  deal.offer_value = parseFloat(deal.offer_value) || 0;
  deal.order_value = parseFloat(deal.order_value) || 0;
  deal.margin_value = parseFloat(deal.margin_value) || 0;
  deal.dd_date = deal.dd_date || null;
  deal.bpa_date = deal.bpa_date || null;
  deal.bpa_received = Boolean(deal.bpa_received);
  
  // Taux de marge (%) = (Marge / VVHT Commande) * 100
  if (deal.order_value > 0 && deal.margin_value > 0) {
    deal.margin_rate = parseFloat(((deal.margin_value / deal.order_value) * 100).toFixed(2));
  } else {
    deal.margin_rate = 0;
  }
  
  const tableName = localStorage.getItem("morocco_supabase_table") || DEFAULT_SUPABASE_TABLE;

  if (deal.id) {
    // Update existing
    const idx = allDeals.findIndex(d => d.id === deal.id);
    if (idx !== -1) {
      allDeals[idx] = { ...allDeals[idx], ...deal };
    }
    
    if (supabaseClient) {
      try {
        await supabaseClient.from(tableName).update(deal).eq("id", deal.id);
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }
  } else {
    // Create new
    const maxId = allDeals.reduce((max, d) => Math.max(max, d.id || 0), 0);
    deal.id = maxId + 1;
    allDeals.push(deal);

    if (supabaseClient) {
      try {
        await supabaseClient.from(tableName).insert([deal]);
      } catch (err) {
        console.error("Supabase insert error:", err);
      }
    }
  }

  localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));
  updateProspectorFilterOptions();
  applyFiltersAndRender();
}

// ── 7. BUSINESS LOGIC (EXCEL WORKFLOW EQUIVALENT FORMULAS - WORKING DAYS) ───
function getWorkingDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  let start, end;
  if (typeof startDate === "string") {
    const parts = startDate.split("-");
    start = parts.length === 3 ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)) : new Date(startDate);
  } else {
    start = new Date(startDate);
  }
  if (typeof endDate === "string") {
    const parts = endDate.split("-");
    end = parts.length === 3 ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)) : new Date(endDate);
  } else {
    end = new Date(endDate);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return 0;

  let workingDays = 0;
  const cur = new Date(start.getTime());
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const d = cur.getDay();
    if (d !== 0 && d !== 6) { // Skip Saturday (6) and Sunday (0)
      workingDays++;
    }
  }
  return workingDays;
}

function getDaysOpen(d) {
  if (d.offer_status === "Commandé" || d.offer_status === "Perdue" || d.offer_status === "Closed" || d.affaire_status === "Rejetée" || d.affaire_status === "Closed") {
    return "Closed";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If Offer Date exists -> delay in working days from Offer Reception Date
  if (d.offer_date) {
    return getWorkingDaysBetween(d.offer_date, today);
  }

  // If Sent Affaire DD -> delay in working days from DD Date (or fallback to Entry Date)
  if (d.affaire_status === "DD") {
    const refDateStr = d.dd_date || d.entry_date;
    if (refDateStr) {
      return getWorkingDaysBetween(refDateStr, today);
    }
  }

  // Fallback: Entry Date in working days
  if (d.entry_date) {
    return getWorkingDaysBetween(d.entry_date, today);
  }

  return 0;
}

function getStaleAlert(d) {
  const days = getDaysOpen(d);
  if (days === "Closed" || days === "") return "";
  if (d.offer_status === "Closed" || d.offer_status === "Perdue" || d.affaire_status === "Closed" || d.affaire_status === "Rejetée") return "";
  if (d.offer_status === "Commandé" || (parseFloat(d.order_value) > 0)) return "";

  const hasOffer = Boolean(
    (d.offer_number && String(d.offer_number).trim() !== "") ||
    (d.offer_date && String(d.offer_date).trim() !== "") ||
    (parseFloat(d.offer_value) > 0) ||
    (d.offer_status && d.offer_status !== "")
  );

  // 1. Offer filled but still in negotiation > 10 working days without order (2 full business weeks)
  if (hasOffer) {
    return (typeof days === "number" && days > 10) ? "⚠ OVERDUE Negociation" : "";
  }

  // 2. Sent Affaire DD: waiting for offer > 5 working days from Date of DD (1 full business week)
  if (d.affaire_status === "DD") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const refDateStr = d.dd_date || d.entry_date;
    const ddDays = refDateStr ? getWorkingDaysBetween(refDateStr, today) : (typeof days === "number" ? days : 0);
    return ddDays > 5 ? "⚠ DD WITHOUT OFFER" : "";
  }

  // 3. Sourcing / Prenego deal without action > 5 working days
  return (typeof days === "number" && days > 5) ? "⚠ OVERDUE DND" : "";
}

function getStageDelayInfo(d) {
  if (!d) return { days: 0, text: "⏱️ 0 days in stage", badgeClass: "badge-gray", label: "0 days", isOverdue: false };
  const days = getDaysOpen(d);
  const isClosed = d.offer_status === "Closed" || d.offer_status === "Perdue" || 
                   d.affaire_status === "Closed" || d.affaire_status === "Rejetée" || 
                   days === "Closed";
  const isOrdered = d.offer_status === "Commandé" || (parseFloat(d.order_value) > 0 && !isClosed);

  if (isOrdered) {
    return {
      days: days,
      text: "🟢 Ordered Won",
      badgeClass: "badge-ordered",
      label: "Ordered Won",
      isOverdue: false
    };
  }

  if (isClosed) {
    return {
      days: "Closed",
      text: "🚫 Closed",
      badgeClass: "badge-gray",
      label: "Closed",
      isOverdue: false
    };
  }

  const numDays = typeof days === "number" ? days : (parseInt(days) || 0);
  const dayText = numDays === 1 ? "1 day in stage" : `${numDays} days in stage`;

  const hasOffer = Boolean(
    (d.offer_number && String(d.offer_number).trim() !== "") ||
    (d.offer_date && String(d.offer_date).trim() !== "") ||
    (parseFloat(d.offer_value) > 0) ||
    (d.offer_status && d.offer_status !== "")
  );

  let badgeClass = "badge-green";
  let isOverdue = false;

  if (hasOffer) {
    // Stage 3 Commercial Negotiation & Forecast threshold: 10 working days
    if (numDays > 10) {
      badgeClass = "badge-rose";
      isOverdue = true;
    } else if (numDays > 5) {
      badgeClass = "badge-amber";
    } else {
      badgeClass = "badge-green";
    }
  } else if (d.affaire_status === "DD") {
    // Stage 1 -> 2 (DD Sent waiting for offer) threshold: 5 working days
    if (numDays > 5) {
      badgeClass = "badge-rose";
      isOverdue = true;
    } else if (numDays >= 3) {
      badgeClass = "badge-amber";
    } else {
      badgeClass = "badge-green";
    }
  } else {
    // Stage 1 Sourcing (Lot / Prenego / CRV) threshold: 5 working days
    if (numDays > 5) {
      badgeClass = "badge-rose";
      isOverdue = true;
    } else if (numDays >= 3) {
      badgeClass = "badge-amber";
    } else {
      badgeClass = "badge-green";
    }
  }

  return {
    days: numDays,
    text: `⏱️ ${dayText}`,
    badgeClass: badgeClass,
    label: dayText,
    isOverdue: isOverdue
  };
}

function isDNDDeal(d) {
  if (!d) return false;
  const isClosed = d.offer_status === "Closed" || d.offer_status === "Perdue" || 
                   d.affaire_status === "Closed" || d.affaire_status === "Rejetée" || 
                   getDaysOpen(d) === "Closed";
  if (isClosed) return false;

  // CRV en cours, Prenego, and Lot are all explicitly DND (Dossier Non Déposé)
  const aff = (d.affaire_status || "").trim();
  if (aff === "CRV" || aff === "CRV en cours" || aff === "Prenego" || aff === "Lot") {
    return true;
  }

  // Sent Affaire DD is NOT DND (DD has already been deposited)
  if (aff === "DD") return false;

  // Any non-DD deal without commercial offer submitted
  const hasOffer = (d.offer_number && String(d.offer_number).trim() !== "") ||
                   (d.offer_status === "Negociation" || d.offer_status === "Forecast" || 
                    d.offer_status === "Negociée + BPA" || d.offer_status === "Negociée en attente BPA" || 
                    d.offer_status === "Commandé");
  return !hasOffer;
}

function getStageCategory(d) {
  // Commandé
  if (d.offer_status === "Commandé") return "ordered";
  // Closed (Perdu / Rejeté)
  if (d.offer_status === "Perdue" || d.offer_status === "Closed" || d.affaire_status === "Rejetée" || d.affaire_status === "Closed") return "closed";
  // Forecast (BPA) - confirmed or awaiting
  if (d.offer_status === "Negociée + BPA" || d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast" || d.bpa_received) return "forecast";
  
  // CRV, Prenego, and Lot are all DND stages (before DD and offer negotiation)
  const aff = (d.affaire_status || "").trim();
  if (aff === "CRV" || aff === "CRV en cours" || aff === "Prenego" || aff === "Lot") {
    return "dnd";
  }

  // Sent Affaire DD
  if (aff === "DD") {
    const hasOffer = (d.offer_number && String(d.offer_number).trim() !== "") ||
                     (d.offer_date && String(d.offer_date).trim() !== "") ||
                     (parseFloat(d.offer_value) > 0) ||
                     (d.offer_status === "Negociation" || d.offer_status === "Re-valorisation");
    if (hasOffer) return "nego";
    return "dd";
  }

  // En Négociation (all other offers in progress)
  const hasOffer = (d.offer_number && String(d.offer_number).trim() !== "") ||
                   (d.offer_date && String(d.offer_date).trim() !== "") ||
                   (parseFloat(d.offer_value) > 0) ||
                   (d.offer_status === "Negociation" || d.offer_status === "Re-valorisation");
  if (hasOffer) return "nego";

  // Default is DND (Lot / Détection)
  return "dnd";
}

function isForecastDeal(d) {
  return getStageCategory(d) === "forecast";
}

function hasBPAReceived(d) {
  return (d.bpa_received === true || d.offer_status === "Negociée + BPA");
}

function getStageLabel(d) {
  if (d.offer_status === "Commandé") return "Commandé 🟢";
  if (d.offer_status === "Perdue" || d.affaire_status === "Rejetée" || d.affaire_status === "Closed" || d.offer_status === "Closed") return "Closed";
  if (d.offer_status === "Negociée + BPA" || (d.bpa_received && (d.offer_status === "Forecast" || d.offer_status === "Negociation"))) return "Forecast (BPA Confirmed)";
  if (d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast") return "Forecast (Awaiting BPA)";
  if (d.affaire_status === "CRV" || d.affaire_status === "CRV en cours") return "CRV en cours";
  if (d.affaire_status === "Prenego") return "Prenego";
  if (d.affaire_status === "Lot") return "Lot / Détection";
  if (d.offer_status === "Negociation") return "En Négociation";
  if (d.offer_status === "Re-valorisation") return "Re-valuation";
  if (d.affaire_status === "DD") return "Sent Affaire DD";
  return "Lot / Détection";
}

function getRecommendedNextAction(d) {
  if (!d) return null;
  const days = getDaysOpen(d);
  if (days === "Closed" || d.offer_status === "Closed" || d.offer_status === "Perdue" || d.affaire_status === "Closed" || d.affaire_status === "Rejetée") {
    return null;
  }

  const isOrdered = d.offer_status === "Commandé" || (parseFloat(d.order_value) > 0 && d.offer_status !== "Closed" && d.offer_status !== "Perdue");
  if (isOrdered) {
    return null;
  }

  const numDays = typeof days === "number" ? days : (parseInt(days) || 0);
  const stageLabel = getStageLabel(d);
  const stageRank = getStageRank(stageLabel);

  const hasOffer = Boolean(
    (d.offer_number && String(d.offer_number).trim() !== "") ||
    (d.offer_date && String(d.offer_date).trim() !== "") ||
    (parseFloat(d.offer_value) > 0) ||
    (d.offer_status && d.offer_status !== "")
  );

  const isForecast = isForecastDeal(d);
  const hasBPA = hasBPAReceived(d);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const refDD = d.dd_date || d.entry_date;
  const ddDays = (d.affaire_status === "DD" && refDD) ? getWorkingDaysBetween(refDD, today) : numDays;

  // P1 · Overdue (Red Badge)
  // Trigger Condition: Any deal exceeding the overdue threshold (>5 days no DD, >5 days no offer, or >10 days in offer)
  const staleAlert = getStaleAlert(d);
  if (staleAlert) {
    return {
      deal: d,
      priority: 1,
      priorityLabel: "P1 · Overdue",
      priorityClass: "action-queue-row-overdue",
      urgencyBadge: `<span class="badge badge-rose font-bold"><i data-lucide="alert-triangle" style="width:11px; height:11px;"></i> Overdue</span>`,
      badgeColor: "red",
      actionText: staleAlert,
      days: numDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  // P2 · Chase BPA (Amber Badge)
  // Trigger Condition: Forecast deal awaiting validation (Stage Forecast or Negociée en attente BPA, BPA not confirmed)
  if (isForecast && !hasBPA) {
    const refBpa = d.bpa_date || d.offer_date || d.entry_date;
    const bpaDays = refBpa ? getWorkingDaysBetween(refBpa, today) : numDays;
    const daysText = `${bpaDays} ${bpaDays === 1 ? 'day' : 'days'}`;
    return {
      deal: d,
      priority: 2,
      priorityLabel: "P2 · Chase BPA",
      priorityClass: "action-queue-row-bpa",
      urgencyBadge: `<span class="badge badge-amber font-bold"><i data-lucide="clock" style="width:11px; height:11px;"></i> Chase BPA</span>`,
      badgeColor: "amber",
      actionText: `Awaiting BPA validation since (${daysText})`,
      days: bpaDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  // P3 · Chase Offer (Teal Badge)
  // Trigger Condition: DD submitted, within delay (≤5 days), awaiting Marketing Team offer
  if (d.affaire_status === "DD" && !hasOffer && ddDays <= 5) {
    const ddText = `${ddDays} ${ddDays === 1 ? 'day' : 'days'}`;
    return {
      deal: d,
      priority: 3,
      priorityLabel: "P3 · Chase Offer",
      priorityClass: "",
      urgencyBadge: `<span class="badge badge-teal font-bold"><i data-lucide="send" style="width:11px; height:11px;"></i> Chase Offer</span>`,
      badgeColor: "teal",
      actionText: `Delayed Offer (${ddText}) : Follow up with CP`,
      days: ddDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  // P4 · DND · Send DD (Gray Badge)
  // Trigger Condition: DND stages (Lot, Prenego, CRV) in sourcing for ≥2 days without DD sent
  if ((d.affaire_status === "Lot" || d.affaire_status === "Prenego" || d.affaire_status === "CRV" || d.affaire_status === "CRV en cours" || isDNDDeal(d)) && !hasOffer && numDays >= 2) {
    const dndStage = (d.affaire_status === "Prenego" ? "Prenego" : (d.affaire_status === "CRV" || d.affaire_status === "CRV en cours" ? "CRV en cours" : "Lot / Détection"));
    const dndText = `${numDays} ${numDays === 1 ? 'day' : 'days'}`;
    return {
      deal: d,
      priority: 4,
      priorityLabel: "P4 · DND · Send DD",
      priorityClass: "",
      urgencyBadge: `<span class="badge badge-gray font-bold"><i data-lucide="file-text" style="width:11px; height:11px;"></i> DND · Send DD</span>`,
      badgeColor: "gray",
      actionText: `DND (${dndStage}) (${dndText})`,
      days: numDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  // P5 · BPA Confirmed (Green Badge)
  // Trigger Condition: Deal negotiated with BPA confirmed (Negociée + BPA), ready for purchase order
  if (hasBPA && !isOrdered) {
    return {
      deal: d,
      priority: 5,
      priorityLabel: "P5 · BPA Confirmed",
      priorityClass: "action-queue-row-bpa-conf",
      urgencyBadge: `<span class="badge badge-green font-bold"><i data-lucide="check-circle" style="width:11px; height:11px;"></i> BPA Confirmed</span>`,
      badgeColor: "green",
      actionText: `BPA Confirmed`,
      days: numDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  // P5 · Active Negotiation (Gray Badge)
  // Trigger Condition: Deal with offer in active negotiation or re-valuation (≤10 days)
  if (hasOffer && !isForecast && numDays <= 10) {
    const actStage = (d.offer_status === "Re-valorisation" ? "Re-valuation" : (d.offer_status || "In Negotiation"));
    const actText = `${numDays} ${numDays === 1 ? 'day' : 'days'}`;
    return {
      deal: d,
      priority: 5,
      priorityLabel: "P5 · Active Negotiation",
      priorityClass: "",
      urgencyBadge: `<span class="badge badge-gray font-bold"><i data-lucide="message-square" style="width:11px; height:11px;"></i> Active Negotiation</span>`,
      badgeColor: "gray",
      actionText: `Active in ${actStage} (${actText}) : Follow up with buyer`,
      days: numDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  // Routine Sourcing (<2 days)
  if (!hasOffer && d.affaire_status !== "DD" && numDays < 2) {
    const dndStage = (d.affaire_status === "Prenego" ? "Prenego" : (d.affaire_status === "CRV" || d.affaire_status === "CRV en cours" ? "CRV en cours" : "Lot / Détection"));
    const dndText = `${numDays} ${numDays === 1 ? 'day' : 'days'}`;
    return {
      deal: d,
      priority: 5,
      priorityLabel: "P5 · Sourcing",
      priorityClass: "",
      urgencyBadge: `<span class="badge badge-gray font-bold"><i data-lucide="file-text" style="width:11px; height:11px;"></i> DND · Sourcing</span>`,
      badgeColor: "gray",
      actionText: `DND (${dndStage}) (${dndText})`,
      days: numDays,
      stageLabel: stageLabel,
      stageRank: stageRank
    };
  }

  return null;
}

// ── 8. DROPDOWNS & FILTER INITIALIZATION ──────────────────────────────────
function initDropdowns() {
  const catFilter = document.getElementById("filterCategory");
  const addCat = document.getElementById("addCategory");
  const editCat = document.getElementById("editCategory");

  PRODUCT_CATEGORIES.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.value;
    opt.textContent = cat.label;
    if (catFilter) catFilter.appendChild(opt);
    if (addCat) addCat.appendChild(opt.cloneNode(true));
    if (editCat) editCat.appendChild(opt.cloneNode(true));
  });
}

function updateProspectorFilterOptions() {
  const prSelect = document.getElementById("filterProspector");
  if (!prSelect) return;

  const currentVal = filterProspectorVal;
  const prospectorCounts = new Map();
  let emptyCount = 0;

  allDeals.forEach(d => {
    const p = (d.prospector || "").trim();
    if (p) {
      prospectorCounts.set(p, (prospectorCounts.get(p) || 0) + 1);
    } else {
      emptyCount++;
    }
  });

  const sortedNames = Array.from(prospectorCounts.keys()).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );

  prSelect.innerHTML = "";

  // 1. All (With and without prospector)
  const optAll = document.createElement("option");
  optAll.value = "All";
  optAll.textContent = `All (With & Without Prospector · ${allDeals.length})`;
  prSelect.appendChild(optAll);

  // 2. Without Prospector (No prospector assigned)
  const optNone = document.createElement("option");
  optNone.value = "__NO_PROSPECTOR__";
  optNone.textContent = `Without Prospector (No Prospector · ${emptyCount})`;
  prSelect.appendChild(optNone);

  // 3. Selection of prospectors per name
  if (sortedNames.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = "── By Prospector Name ──";
    sortedNames.forEach(name => {
      const cnt = prospectorCounts.get(name) || 0;
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${name} (${cnt} deals)`;
      grp.appendChild(opt);
    });
    prSelect.appendChild(grp);
  }

  if (sortedNames.includes(currentVal) || currentVal === "__NO_PROSPECTOR__" || currentVal === "__EMPTY__") {
    prSelect.value = (currentVal === "__EMPTY__") ? "__NO_PROSPECTOR__" : currentVal;
    filterProspectorVal = prSelect.value;
  } else {
    prSelect.value = "All";
    filterProspectorVal = "All";
  }
}

function initFilters() {
  const pType = document.getElementById("filterPeriodType");
  const pVal = document.getElementById("filterPeriodValue");
  const bSelect = document.getElementById("filterBuyer");
  const prSelect = document.getElementById("filterProspector");
  const cSelect = document.getElementById("filterCategory");
  const supTypeSelect = document.getElementById("filterSupplierType");
  const sInput = document.getElementById("searchInput");
  const staleToggle = document.getElementById("filterStaleOnly");
  const ongoingToggle = document.getElementById("filterOngoingOnly");

  if (pType) {
    pType.addEventListener("change", () => {
      const val = pType.value;
      if (val === "All Time") {
        filterPeriod = "All Time";
        filterPeriodVal = "";
        currentTrendMode = "monthly";
        syncBuyersResultsFilters("All", "All");
      } else if (val.startsWith("2026-") || val.match(/^\d{4}-\d{2}$/)) {
        filterPeriod = "Monthly";
        filterPeriodVal = val;
        currentTrendMode = "monthly";
        const m = val.split("-")[1];
        syncBuyersResultsFilters(m, "All");
      } else if (val.startsWith("W") || val.startsWith("S")) {
        filterPeriod = "Weekly";
        filterPeriodVal = val;
        currentTrendMode = "weekly";
        const w = val.startsWith("S") ? val.replace("S", "W") : val;
        syncBuyersResultsFilters("All", w);
      } else if (val === "MODE_MONTHLY" || val === "Monthly") {
        filterPeriod = "Monthly_All";
        filterPeriodVal = "";
        currentTrendMode = "monthly";
        syncBuyersResultsFilters("All", "All");
      } else if (val === "MODE_WEEKLY" || val === "Weekly") {
        filterPeriod = "Weekly_All";
        filterPeriodVal = "";
        currentTrendMode = "weekly";
        syncBuyersResultsFilters("All", "All");
      } else {
        filterPeriod = val;
        filterPeriodVal = "";
      }

      applyFiltersAndRender();
    });
  }

  if (pVal) {
    pVal.addEventListener("change", () => {
      filterPeriodVal = pVal.value;
      applyFiltersAndRender();
    });
  }

  if (bSelect) {
    bSelect.addEventListener("change", () => {
      filterBuyerVal = bSelect.value;
      applyFiltersAndRender();
    });
  }

  if (prSelect) {
    prSelect.addEventListener("change", () => {
      filterProspectorVal = prSelect.value;
      applyFiltersAndRender();
    });
  }

  if (cSelect) {
    cSelect.addEventListener("change", () => {
      filterCategoryVal = cSelect.value;
      applyFiltersAndRender();
    });
  }

  if (supTypeSelect) {
    supTypeSelect.addEventListener("change", () => {
      filterSupplierTypeVal = supTypeSelect.value;
      applyFiltersAndRender();
    });
  }

  if (sInput) {
    sInput.addEventListener("input", (e) => {
      filterSearchVal = e.target.value.toLowerCase().trim();
      applyFiltersAndRender();
    });
  }

  if (staleToggle) {
    staleToggle.addEventListener("change", (e) => {
      filterStaleOnlyVal = e.target.checked;
      applyFiltersAndRender();
    });
  }

  if (ongoingToggle) {
    ongoingToggle.addEventListener("change", (e) => {
      filterOngoingOnlyVal = e.target.checked;
      applyFiltersAndRender();
    });
  }
}

function syncBuyersResultsFilters(monthVal, weekVal) {
  const bMonth = document.getElementById("buyerFilterMonth");
  const bWeek = document.getElementById("buyerFilterWeek");
  if (bMonth && typeof monthVal !== "undefined") {
    bMonth.value = monthVal;
    currentBuyerFilterMonth = monthVal;
  }
  if (bWeek && typeof weekVal !== "undefined") {
    bWeek.value = weekVal;
    currentBuyerFilterWeek = weekVal;
  }
}

function updatePeriodValueOptions() {
  const pVal = document.getElementById("filterPeriodValue");
  if (!pVal) return;
  pVal.innerHTML = "";

  if (filterPeriod === "All Time" || filterPeriod === "Monthly_All" || filterPeriod === "Weekly_All") {
    pVal.classList.add("hidden");
    filterPeriodVal = "";
    return;
  }

  pVal.classList.add("hidden");
}

function getISOWeek(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function applyFiltersAndRender() {
  if (isBuyerUser()) {
    filterBuyerVal = currentUser;
    const bSelect = document.getElementById("filterBuyer");
    if (bSelect) {
      bSelect.value = currentUser;
      bSelect.disabled = true;
    }
  }

  const baseDeals = isBuyerUser() ? allDeals.filter(d => d.buyer === currentUser) : allDeals;
  const ongoingCount = baseDeals.filter(d => getDaysOpen(d) !== "Closed").length;
  const ongoingBadge = document.getElementById("ongoingCountBadge");
  if (ongoingBadge) ongoingBadge.textContent = ongoingCount;

  filteredDeals = baseDeals.filter(d => {
    // Period filter (matches against deal milestone dates: entry, offer, order, dd)
    if (filterPeriod === "Monthly" && filterPeriodVal) {
      const dates = [d.entry_date, d.offer_date, d.order_date, d.dd_date].filter(Boolean);
      const matches = dates.some(dt => dt.startsWith(filterPeriodVal));
      if (!matches) return false;
    } else if (filterPeriod === "Weekly" && filterPeriodVal) {
      const targetW = parseInt(filterPeriodVal.replace(/[^\d]/g, ""), 10);
      const dates = [d.entry_date, d.offer_date, d.order_date, d.dd_date].filter(Boolean);
      const matches = dates.some(dt => {
        const dObj = new Date(dt);
        return !isNaN(dObj.getTime()) && getISOWeek(dObj) === targetW;
      });
      if (!matches) return false;
    }

    // Buyer filter
    if (isBuyerUser()) {
      if (d.buyer !== currentUser) return false;
    } else if (filterBuyerVal !== "All" && d.buyer !== filterBuyerVal) {
      return false;
    }

    // Prospector filter: All / Without Prospector / Selection per name
    if (filterProspectorVal !== "All") {
      if (filterProspectorVal === "__NO_PROSPECTOR__" || filterProspectorVal === "__EMPTY__") {
        if ((d.prospector || "").trim() !== "") return false;
      } else {
        if ((d.prospector || "").trim().toLowerCase() !== filterProspectorVal.toLowerCase()) return false;
      }
    }

    // Category filter
    if (filterCategoryVal !== "All" && d.product_range !== filterCategoryVal) return false;

    // Supplier type filter
    if (filterSupplierTypeVal !== "All" && d.supplier_type !== filterSupplierTypeVal) return false;

    // Search input
    if (filterSearchVal) {
      const match = (
        (d.supplier && d.supplier.toLowerCase().includes(filterSearchVal)) ||
        (d.product && d.product.toLowerCase().includes(filterSearchVal)) ||
        (d.buyer && d.buyer.toLowerCase().includes(filterSearchVal)) ||
        (d.prospector && d.prospector.toLowerCase().includes(filterSearchVal)) ||
        (d.offer_number && String(d.offer_number).includes(filterSearchVal)) ||
        (d.notes && d.notes.toLowerCase().includes(filterSearchVal))
      );
      if (!match) return false;
    }

    // Ongoing only filter
    if (filterOngoingOnlyVal) {
      if (getDaysOpen(d) === "Closed") return false;
    }

    // Stale filter
    if (filterStaleOnlyVal) {
      if (!getStaleAlert(d)) return false;
    }

    // Saved views filter (when in Database view or activated)
    if (currentSavedView === "overdue") {
      if (!getStaleAlert(d)) return false;
    } else if (currentSavedView === "forecast" || currentSavedView === "bpa") {
      if (!isForecastDeal(d)) return false;
    } else if (currentSavedView === "dnd" || currentSavedView === "nodd") {
      if (!isDNDDeal(d)) return false;
    }

    return true;
  });

  renderDashboard();
  renderActionQueue();
  renderActivityCharts();
  renderBuyersResults();
  renderTable();
  renderFilterChips();
  updateSavedViewCounts();
  initLucide();
}

// ── 9. RENDER: EXECUTIVE DASHBOARD & BUYER FUNNEL ──────────────────────────
function renderDashboard() {
  let totalDetections = filteredDeals.length;
  let activeValue = 0;
  let forecastValue = 0;
  let forecastDeals = 0;
  let bpaConfirmedValue = 0;
  let bpaConfirmedCount = 0;
  let bpaWaitingValue = 0;
  let bpaWaitingCount = 0;
  let orderedValue = 0;
  let orderedDeals = 0;
  let staleDealsCount = 0;

  let totalMarginSum = 0;
  let totalOrderedForMargin = 0;
  let totalMarginCount = 0;

  filteredDeals.forEach(d => {
    const days = getDaysOpen(d);
    const offVal = parseFloat(d.offer_value) || 0;
    const fCustVal = parseFloat(d.forecast_value) || 0;
    const effForecastVal = fCustVal > 0 ? fCustVal : offVal;
    const ordVal = parseFloat(d.order_value) || 0;
    const marVal = parseFloat(d.margin_value) || 0;

    const isOrdered = d.offer_status === "Commandé";
    const isClosed = d.offer_status === "Closed" || d.offer_status === "Perdue" || d.affaire_status === "Closed" || d.affaire_status === "Rejetée" || days === "Closed";

    // Active Pipeline (VVHT): only open in-progress deals (strictly exclude ordered and closed)
    if (!isOrdered && !isClosed) {
      activeValue += offVal;
    }

    // Forecast: only active deals in forecast (strictly exclude ordered and closed)
    const isForecast = !isOrdered && !isClosed && (d.offer_status === "Negociée + BPA" || d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast" || d.bpa_received || (d.offer_status === "Negociation" && fCustVal > 0));
    if (isForecast) {
      forecastValue += effForecastVal;
      forecastDeals++;
      if (d.bpa_received || d.offer_status === "Negociée + BPA") {
        bpaConfirmedCount++;
        bpaConfirmedValue += effForecastVal;
      } else {
        bpaWaitingCount++;
        bpaWaitingValue += effForecastVal;
      }
    }

    if (isOrdered) {
      orderedValue += (ordVal > 0 ? ordVal : offVal);
      orderedDeals++;
    }
    if (getStaleAlert(d)) {
      staleDealsCount++;
    }
    if (marVal > 0) {
      totalMarginSum += marVal;
      totalOrderedForMargin += (ordVal > 0 ? ordVal : offVal);
      totalMarginCount++;
    } else if (d.margin_rate > 0 && ordVal > 0) {
      totalMarginSum += (ordVal * (d.margin_rate / 100));
      totalOrderedForMargin += ordVal;
      totalMarginCount++;
    }
  });

  const avgMargin = totalOrderedForMargin > 0
    ? ((totalMarginSum / totalOrderedForMargin) * 100).toFixed(1) + "%"
    : (totalMarginCount > 0 ? (totalMarginSum / totalMarginCount).toFixed(1) + "%" : "0.0%");

  // Update prominent Dashboard & Overview Active Period display
  const pTypeSelect = document.getElementById("filterPeriodType");
  const curPeriodText = pTypeSelect ? (pTypeSelect.options[pTypeSelect.selectedIndex]?.text || pTypeSelect.value) : "All Time";
  const elPeriodDisplay = document.getElementById("dashboardPeriodDisplay");
  if (elPeriodDisplay) elPeriodDisplay.textContent = curPeriodText;

  const elTot = document.getElementById("kpiTotalDetections"); if (elTot) elTot.textContent = totalDetections;
  const elAct = document.getElementById("kpiActiveValue"); if (elAct) elAct.textContent = formatCurrencyEUR(activeValue);

  // Dual Forecast KPI metrics (Confirmed vs Awaiting BPA)
  const elFConfirmedVal = document.getElementById("kpiForecastConfirmedVal");
  if (elFConfirmedVal) elFConfirmedVal.textContent = formatCurrencyEUR(bpaConfirmedValue);

  const elFConfirmedCount = document.getElementById("kpiForecastConfirmedCount");
  if (elFConfirmedCount) elFConfirmedCount.textContent = `${bpaConfirmedCount} confirmed`;

  const elFWaitingVal = document.getElementById("kpiForecastWaitingVal");
  if (elFWaitingVal) elFWaitingVal.textContent = formatCurrencyEUR(bpaWaitingValue);

  const elFWaitingCount = document.getElementById("kpiForecastWaitingCount");
  if (elFWaitingCount) elFWaitingCount.textContent = `${bpaWaitingCount} awaiting`;

  const elFTotalBadge = document.getElementById("kpiForecastTotalBadge");
  if (elFTotalBadge) elFTotalBadge.textContent = `Total: ${formatCurrencyEUR(forecastValue)}`;

  const elFVal = document.getElementById("kpiForecastValue"); if (elFVal) elFVal.textContent = formatCurrencyEUR(forecastValue);
  const elFDeals = document.getElementById("kpiForecastDeals"); if (elFDeals) elFDeals.textContent = `${bpaConfirmedCount} confirmed BPA · ${bpaWaitingCount} awaiting BPA`;
  const elOVal = document.getElementById("kpiOrderedValue"); if (elOVal) elOVal.textContent = formatCurrencyEUR(orderedValue);
  const elODeals = document.getElementById("kpiOrderedDeals"); if (elODeals) elODeals.textContent = `${orderedDeals} order(s) won`;
  const elStale = document.getElementById("kpiStaleDeals"); if (elStale) elStale.textContent = staleDealsCount;
  const elBadge = document.getElementById("staleCountBadge"); if (elBadge) elBadge.textContent = staleDealsCount;
  const elMargin = document.getElementById("kpiAvgMargin"); if (elMargin) elMargin.textContent = avgMargin;

  // Render Buyer Funnel Table for the 3 Buyers (if present in DOM)
  const tbody = document.getElementById("buyerFunnelBody");
  const tfoot = document.getElementById("buyerFunnelFoot");
  if (tbody && tfoot) {
    tbody.innerHTML = "";

    let tTot = 0, tDD = 0, tOff = 0, tNego = 0, tFVal = 0, tOrdCount = 0, tOrdVal = 0, tAVal = 0;

    BUYERS.forEach(buyerName => {
      const bDeals = filteredDeals.filter(d => d.buyer === buyerName);
      const detections = bDeals.length;
      const ddCount = bDeals.filter(d => d.affaire_status === "DD").length;
      const offers = bDeals.filter(d => (d.offer_number && String(d.offer_number).trim() !== "") || (d.offer_date && String(d.offer_date).trim() !== "") || (parseFloat(d.offer_value) > 0)).length;
      const inNego = bDeals.filter(d => d.offer_status === "Negociation" || d.offer_status === "Re-valorisation").length;
      
      const isDealOrdered = (d) => d.offer_status === "Commandé";
      const isDealClosed = (d) => d.offer_status === "Closed" || d.offer_status === "Perdue" || d.affaire_status === "Closed" || d.affaire_status === "Rejetée" || getDaysOpen(d) === "Closed";

      const getDealForecastVal = (d) => (parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : (parseFloat(d.offer_value) || 0));

      const fVal = bDeals.filter(d => !isDealOrdered(d) && !isDealClosed(d) && (d.offer_status === "Negociée + BPA" || d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast" || d.bpa_received || (d.offer_status === "Negociation" && parseFloat(d.forecast_value) > 0)))
        .reduce((sum, d) => sum + getDealForecastVal(d), 0);
      const bFConfirmed = bDeals.filter(d => !isDealOrdered(d) && !isDealClosed(d) && (d.bpa_received || d.offer_status === "Negociée + BPA"))
        .reduce((sum, d) => sum + getDealForecastVal(d), 0);
      const bFWaiting = bDeals.filter(d => !isDealOrdered(d) && !isDealClosed(d) && ((d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast" || (d.offer_status === "Negociation" && parseFloat(d.forecast_value) > 0)) && !d.bpa_received))
        .reduce((sum, d) => sum + getDealForecastVal(d), 0);
      const bFConfirmedCount = bDeals.filter(d => !isDealOrdered(d) && !isDealClosed(d) && (d.bpa_received || d.offer_status === "Negociée + BPA")).length;
      const bFWaitingCount = bDeals.filter(d => !isDealOrdered(d) && !isDealClosed(d) && ((d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast" || (d.offer_status === "Negociation" && parseFloat(d.forecast_value) > 0)) && !d.bpa_received)).length;
      
      const ordDeals = bDeals.filter(d => isDealOrdered(d)).length;
      const ordVal = bDeals.filter(d => isDealOrdered(d))
        .reduce((sum, d) => sum + (parseFloat(d.order_value) || parseFloat(d.offer_value) || 0), 0);
      
      const actVal = bDeals.filter(d => !isDealOrdered(d) && !isDealClosed(d))
        .reduce((sum, d) => sum + (parseFloat(d.offer_value) || 0), 0);
      
      const rate = detections > 0 ? ((ordDeals / detections) * 100).toFixed(1) + "%" : "0.0%";

      let signal = `<span class="badge badge-gray">⚫ No offer</span>`;
      if (offers > 0) {
        if (ordDeals > 0) {
          signal = `<span class="badge badge-ordered">🟢 ${ordDeals} Won</span>`;
        } else if (fVal > 0) {
          signal = `<span class="badge badge-forecast">🔮 Forecast</span>`;
        } else {
          signal = `<span class="badge badge-amber">🟠 ${offers} Offers</span>`;
        }
      }

      tTot += detections;
      tDD += ddCount;
      tOff += offers;
      tNego += inNego;
      tFVal += fVal;
      tOrdCount += ordDeals;
      tOrdVal += ordVal;
      tAVal += actVal;

      const tr = document.createElement("tr");
      tr.className = "funnel-row-clickable";
      tr.title = `Click to filter and view ${escapeHtml(buyerName)}'s deals in Database`;
      tr.addEventListener("click", () => {
        switchView("database", { buyer: buyerName });
      });
      tr.innerHTML = `
        <td><strong>${escapeHtml(buyerName)}</strong></td>
        <td class="text-center font-bold">${detections}</td>
        <td class="text-center font-bold text-teal">${ddCount}</td>
        <td class="text-center font-bold">${offers}</td>
        <td class="text-center">${inNego}</td>
        <td class="text-center text-amber font-bold" title="Confirmed BPA: ${formatCurrencyEUR(bFConfirmed)} (${bFConfirmedCount} deals) · Awaiting BPA: ${formatCurrencyEUR(bFWaiting)} (${bFWaitingCount} deals)">${formatCurrencyEUR(fVal)}</td>
        <td class="text-center font-bold ${ordDeals > 0 ? 'text-green' : ''}">${ordDeals}</td>
        <td class="text-center text-green font-bold">${formatCurrencyEUR(ordVal)}</td>
        <td class="text-center text-teal font-bold">${formatCurrencyEUR(actVal)}</td>
        <td class="text-center font-mono font-bold">${rate}</td>
        <td class="text-center">${signal}</td>
      `;
      tbody.appendChild(tr);
    });

    const totRate = tTot > 0 ? ((tOrdCount / tTot) * 100).toFixed(1) + "%" : "0.0%";
    tfoot.innerHTML = `
      <tr class="funnel-row-clickable" title="Click to view all deals in Database">
        <td>TEAM TOTAL (3 BUYERS)</td>
        <td class="text-center">${tTot}</td>
        <td class="text-center">${tDD}</td>
        <td class="text-center">${tOff}</td>
        <td class="text-center">${tNego}</td>
        <td class="text-center">${formatCurrencyEUR(tFVal)}</td>
        <td class="text-center font-bold text-green">${tOrdCount}</td>
        <td class="text-center font-bold text-green">${formatCurrencyEUR(tOrdVal)}</td>
        <td class="text-center font-bold text-teal">${formatCurrencyEUR(tAVal)}</td>
        <td class="text-center font-mono font-bold">${totRate}</td>
        <td class="text-center"><span class="badge badge-green">Active</span></td>
      </tr>
    `;
  }

  renderStageChart();
}

function renderStageChart() {
  const stageCounts = {
    "DND (Lot / Prenego / CRV)": 0,
    "Sent Affaire DD": 0,
    "In Negotiation": 0,
    "Forecast (BPA)": 0,
    "Commandé 🟢": 0,
    "Closed": 0
  };

  const stageValues = {
    "DND (Lot / Prenego / CRV)": 0,
    "Sent Affaire DD": 0,
    "In Negotiation": 0,
    "Forecast (BPA)": 0,
    "Commandé 🟢": 0,
    "Closed": 0
  };

  filteredDeals.forEach(d => {
    const stage = getStageCategory(d);
    const val = (parseFloat(d.order_value) > 0) ? parseFloat(d.order_value) : (parseFloat(d.offer_value) || 0);

    if (stage === "dnd" || stage === "lot") {
      stageCounts["DND (Lot / Prenego / CRV)"]++;
      stageValues["DND (Lot / Prenego / CRV)"] += val;
    }
    else if (stage === "dd") { stageCounts["Sent Affaire DD"]++; stageValues["Sent Affaire DD"] += val; }
    else if (stage === "nego") { stageCounts["In Negotiation"]++; stageValues["In Negotiation"] += val; }
    else if (stage === "forecast") { stageCounts["Forecast (BPA)"]++; stageValues["Forecast (BPA)"] += val; }
    else if (stage === "ordered") { stageCounts["Commandé 🟢"]++; stageValues["Commandé 🟢"] += val; }
    else { stageCounts["Closed"]++; stageValues["Closed"] += val; }
  });

  const totalDeals = filteredDeals.length;
  const breakdownTbody = document.getElementById("stageBreakdownBody");
  if (breakdownTbody) {
    breakdownTbody.innerHTML = Object.keys(stageCounts).map(st => {
      const cnt = stageCounts[st];
      const val = stageValues[st];
      const pct = totalDeals > 0 ? ((cnt / totalDeals) * 100).toFixed(1) + "%" : "0.0%";
      return `
        <tr class="stage-row-clickable" data-stage-name="${escapeHtml(st)}" title="Click to filter ${escapeHtml(st)} deals in Database">
          <td><strong>${escapeHtml(st)}</strong></td>
          <td class="text-center font-bold">${cnt}</td>
          <td class="text-right font-mono text-green font-bold">${val > 0 ? formatCurrencyEUR(val) : "—"}</td>
          <td class="text-center font-mono">${pct}</td>
        </tr>
      `;
    }).join("");

    breakdownTbody.querySelectorAll(".stage-row-clickable").forEach(tr => {
      tr.addEventListener("click", () => {
        const st = tr.dataset.stageName;
        if (st.includes("Forecast")) {
          switchView("database", { savedView: "forecast" });
        } else if (st.includes("DND") || st.includes("Lot") || st.includes("Prenego") || st.includes("CRV")) {
          switchView("database", { savedView: "dnd" });
        } else if (st.includes("Overdue")) {
          switchView("database", { savedView: "overdue" });
        } else {
          switchView("database", { savedView: "all" });
        }
      });
    });
  }

  // Update progress bar
  if (totalDeals > 0) {
    const pLot = ((stageCounts["DND (Lot / Prenego / CRV)"] / totalDeals) * 100).toFixed(1);
    const pDD = ((stageCounts["Sent Affaire DD"] / totalDeals) * 100).toFixed(1);
    const pNego = ((stageCounts["In Negotiation"] / totalDeals) * 100).toFixed(1);
    const pFore = ((stageCounts["Forecast (BPA)"] / totalDeals) * 100).toFixed(1);
    const pOrd = ((stageCounts["Commandé 🟢"] / totalDeals) * 100).toFixed(1);
    const pClosed = ((stageCounts["Closed"] / totalDeals) * 100).toFixed(1);

    const activeCnt = stageCounts["DND (Lot / Prenego / CRV)"] + stageCounts["Sent Affaire DD"] + stageCounts["In Negotiation"] + stageCounts["Forecast (BPA)"];
    const activePct = (((activeCnt) / totalDeals) * 100).toFixed(1);

    const elLot = document.getElementById("barSegLot");
    if (elLot) {
      elLot.style.width = pLot + "%";
      elLot.title = `DND (Lot / Prenego / CRV): ${stageCounts["DND (Lot / Prenego / CRV)"]} deals (${pLot}%)`;
    }
    const elDD = document.getElementById("barSegDD"); if (elDD) elDD.style.width = pDD + "%";
    const elNego = document.getElementById("barSegNego"); if (elNego) elNego.style.width = pNego + "%";
    const elFore = document.getElementById("barSegBPA"); if (elFore) elFore.style.width = pFore + "%";
    const elOrd = document.getElementById("barSegOrdered"); if (elOrd) elOrd.style.width = pOrd + "%";
    const elLost = document.getElementById("barSegLost"); if (elLost) elLost.style.width = pClosed + "%";

    const elActPct = document.getElementById("activeSharePct"); if (elActPct) elActPct.textContent = `${activePct}% Active (${activeCnt} deals)`;
  }

  // Render Chart.js Canvas
  const canvas = document.getElementById("stageChartCanvas");
  if (canvas && window.Chart) {
    if (stageChartInstance) {
      stageChartInstance.destroy();
    }

    const isDark = currentTheme === "dark";
    const textColor = isDark ? "#CBD5E1" : "#334155";

    stageChartInstance = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: Object.keys(stageCounts),
        datasets: [{
          data: Object.values(stageCounts),
          backgroundColor: [
            "#64748B", // Lot
            "#6366F1", // DD
            "#F59E0B", // Nego
            "#2ABFBF", // Forecast
            "#10B981", // Commandé
            "#6B7280"  // Closed
          ],
          borderWidth: 2,
          borderColor: isDark ? "#111827" : "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || "";
                const val = context.raw || 0;
                return ` ${label}: ${val} deals`;
              }
            }
          }
        },
        cutout: "65%"
      }
    });
  }
}

// ── 9b. BUYERS WEEKLY ACTIVITIES TRENDS (Inspired by Screenshot 1) ────────
function initBuyersWeeklyActivities() {
  const btnMonthly = document.getElementById("btnTrendMonthly");
  const btnWeekly = document.getElementById("btnTrendWeekly");
  const buyerSelect = document.getElementById("trendBuyerFilter");

  if (btnMonthly && btnWeekly) {
    btnMonthly.addEventListener("click", () => {
      currentTrendMode = "monthly";
      btnMonthly.classList.add("active");
      btnWeekly.classList.remove("active");
      renderActivityCharts();
    });

    btnWeekly.addEventListener("click", () => {
      currentTrendMode = "weekly";
      btnWeekly.classList.add("active");
      btnMonthly.classList.remove("active");
      renderActivityCharts();
    });
  }

  if (buyerSelect) {
    buyerSelect.addEventListener("change", () => {
      currentTrendBuyer = buyerSelect.value;
      renderActivityCharts();
    });
  }
}

function createTopTotalPlugin(totalsArray, formatFn, color) {
  return {
    id: "topTotalPlugin_" + Math.random().toString(36).substring(2, 9),
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      const x = scales && scales.x;
      const y = scales && scales.y;
      if (!x || !y) return;

      const meta0 = chart.getDatasetMeta(0);
      const meta1 = chart.getDatasetMeta(1);
      if (!meta0 || !meta0.data || meta0.data.length === 0) return;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = color || ((typeof currentTheme !== "undefined" && currentTheme === "dark") ? "#E2E8F0" : "#1E293B");

      totalsArray.forEach((totalVal, i) => {
        if (totalVal === undefined || totalVal === null || totalVal <= 0) return;

        const el0 = meta0.data[i];
        const el1 = meta1 && meta1.data ? meta1.data[i] : null;
        if (!el0) return;

        const posX = el0.x;
        let topY = el0.y;
        if (el1 && typeof el1.y === "number") {
          topY = Math.min(topY, el1.y);
        }

        const labelText = formatFn ? formatFn(totalVal) : String(totalVal);
        ctx.fillText(labelText, posX, topY - 4);
      });

      ctx.restore();
    }
  };
}

function renderActivityCharts() {
  if (!window.Chart) return;

  const isDark = (typeof currentTheme !== "undefined" && currentTheme === "dark");
  const textColor = isDark ? "#CBD5E1" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";

  const trendSelect = document.getElementById("trendBuyerFilter");
  if (trendSelect && trendSelect.value) {
    currentTrendBuyer = trendSelect.value;
  }

  // Sync trend mode buttons
  const btnMonthly = document.getElementById("btnTrendMonthly");
  const btnWeekly = document.getElementById("btnTrendWeekly");
  if (btnMonthly && btnWeekly) {
    btnMonthly.classList.toggle("active", currentTrendMode === "monthly");
    btnWeekly.classList.toggle("active", currentTrendMode === "weekly");
  }

  // Filter deals for trends: respect filteredDeals (which updates with Period filter)
  let trendDeals = (typeof filteredDeals !== "undefined" && filteredDeals.length >= 0) ? filteredDeals : allDeals;
  if (currentTrendBuyer !== "All") {
    trendDeals = trendDeals.filter(d => d.buyer === currentTrendBuyer);
  }

  let labels = [];
  let ddData = [];
  let ddProsData = [];
  let sansSuiteData = [];
  let ddProsShareData = [];
  let sansSuiteShareData = [];

  let realData = [];
  let realProsData = [];
  let realProsShareData = [];

  let newBizData = [];
  let newBizProsData = [];
  let newBizProsShareData = [];

  const isPros = (d) => (d.supplier_type === "Prospection" || d.supplier_type === "NEW BIZ" || (d.prospector && String(d.prospector).trim() !== ""));
  const isSans = (d) => (d.affaire_status === "Closed" || d.affaire_status === "Rejetée" || d.offer_status === "Closed" || d.offer_status === "Perdue");
  const isOrd = (d) => (d.offer_status === "Commandé");
  const getOrdVal = (d) => (parseFloat(d.order_value) > 0 ? parseFloat(d.order_value) : (parseFloat(d.offer_value) || 0));

  if (currentTrendMode === "weekly") {
    // Weekly View -> Progress Day-by-Day (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = [0, 1, 2, 3, 4, 5, 6].map(() => ({ deals: [] }));

    trendDeals.forEach(d => {
      const dateStr = d.entry_date || d.offer_date || d.order_date;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const dayIdx = (date.getDay() + 6) % 7; // Mon = 0 ... Sun = 6
      buckets[dayIdx].deals.push(d);
    });

    buckets.forEach(b => {
      const deals = b.deals;
      const count = deals.length;
      const pros = deals.filter(isPros).length;
      const sans = deals.filter(isSans).length;
      const prosPct = count > 0 ? Math.round((pros / count) * 100) : 0;
      const sansPct = count > 0 ? Math.round((sans / count) * 100) : 0;

      const realVal = deals.filter(isOrd).reduce((sum, d) => sum + getOrdVal(d), 0);
      const realPros = deals.filter(d => isOrd(d) && isPros(d)).reduce((sum, d) => sum + getOrdVal(d), 0);
      const realProsPct = realVal > 0 ? Math.round((realPros / realVal) * 100) : 0;

      const nb = deals.filter(d => d.supplier_type === "NEW BIZ").length;
      const nbPros = deals.filter(d => d.supplier_type === "NEW BIZ" && isPros(d)).length;
      const nbProsPct = nb > 0 ? Math.round((nbPros / nb) * 100) : 0;

      ddData.push(count);
      ddProsData.push(pros);
      sansSuiteData.push(sans);
      ddProsShareData.push(prosPct);
      sansSuiteShareData.push(sansPct);

      realData.push(realVal);
      realProsData.push(realPros);
      realProsShareData.push(realProsPct);

      newBizData.push(nb);
      newBizProsData.push(nbPros);
      newBizProsShareData.push(nbProsPct);
    });

    const badge = document.getElementById("trendPeriodBadge");
    if (badge) badge.textContent = "Weekly (Progress Day-by-Day)";
    const lblAvg = document.getElementById("lblDDAvg"); if (lblAvg) lblAvg.textContent = "AVG / DAY";
    const lblRAvg = document.getElementById("lblRealAvg"); if (lblRAvg) lblRAvg.textContent = "AVG / DAY";
    const lblNBAvg = document.getElementById("lblNewBizAvg"); if (lblNBAvg) lblNBAvg.textContent = "AVG / DAY";

  } else {
    // Monthly View -> Progress Per Week (e.g. 26-W38, 26-W39, 26-W40, 26-W41, 26-W42, 26-W43)
    const weekMap = new Map();
    trendDeals.forEach(d => {
      const dateStr = d.entry_date || d.offer_date || d.order_date;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      const wNum = getISOWeek(date);
      const wKey = `26-${String(wNum).padStart(2, "0")}`;
      if (!weekMap.has(wKey)) weekMap.set(wKey, []);
      weekMap.get(wKey).push(d);
    });

    // Ensure balanced weekly timeline like screenshot 1
    const baseWeeks = ["26-38", "26-39", "26-40", "26-41", "26-42", "26-43"];
    baseWeeks.forEach(w => {
      if (!weekMap.has(w)) weekMap.set(w, []);
    });

    labels = Array.from(weekMap.keys()).sort();
    labels.forEach(wKey => {
      const deals = weekMap.get(wKey) || [];
      const count = deals.length;
      const pros = deals.filter(isPros).length;
      const sans = deals.filter(isSans).length;
      const prosPct = count > 0 ? Math.round((pros / count) * 100) : 0;
      const sansPct = count > 0 ? Math.round((sans / count) * 100) : 0;

      const realVal = deals.filter(isOrd).reduce((sum, d) => sum + getOrdVal(d), 0);
      const realPros = deals.filter(d => isOrd(d) && isPros(d)).reduce((sum, d) => sum + getOrdVal(d), 0);
      const realProsPct = realVal > 0 ? Math.round((realPros / realVal) * 100) : 0;

      const nb = deals.filter(d => d.supplier_type === "NEW BIZ").length;
      const nbPros = deals.filter(d => d.supplier_type === "NEW BIZ" && isPros(d)).length;
      const nbProsPct = nb > 0 ? Math.round((nbPros / nb) * 100) : 0;

      ddData.push(count);
      ddProsData.push(pros);
      sansSuiteData.push(sans);
      ddProsShareData.push(prosPct);
      sansSuiteShareData.push(sansPct);

      realData.push(realVal);
      realProsData.push(realPros);
      realProsShareData.push(realProsPct);

      newBizData.push(nb);
      newBizProsData.push(nbPros);
      newBizProsShareData.push(nbProsPct);
    });

    const badge = document.getElementById("trendPeriodBadge");
    if (badge) badge.textContent = "Monthly (Progress per Week)";
    const lblAvg = document.getElementById("lblDDAvg"); if (lblAvg) lblAvg.textContent = "AVG / WEEK";
    const lblRAvg = document.getElementById("lblRealAvg"); if (lblRAvg) lblRAvg.textContent = "AVG / WEEK";
    const lblNBAvg = document.getElementById("lblNewBizAvg"); if (lblNBAvg) lblNBAvg.textContent = "AVG / WEEK";
  }

  // Update Side Stat Cards
  // DD Stats
  const totalDD = ddData.reduce((a, b) => a + b, 0);
  const totalDDPros = ddProsData.reduce((a, b) => a + b, 0);
  const totalDDSans = sansSuiteData.reduce((a, b) => a + b, 0);
  const avgDD = labels.length > 0 ? Math.round(totalDD / labels.length) : 0;
  const totDDProsPct = totalDD > 0 ? Math.round((totalDDPros / totalDD) * 100) : 0;
  const totDDSansPct = totalDD > 0 ? Math.round((totalDDSans / totalDD) * 100) : 0;

  const elDDAvg = document.getElementById("statDDAvgVal"); if (elDDAvg) elDDAvg.textContent = avgDD;
  const elDDAvgPros = document.getElementById("statDDAvgProsPct"); if (elDDAvgPros) elDDAvgPros.textContent = `${totDDProsPct}%`;
  const elDDAvgSans = document.getElementById("statDDAvgSansPct"); if (elDDAvgSans) elDDAvgSans.textContent = `${totDDSansPct}%`;
  const elDDTotal = document.getElementById("statDDTotalVal"); if (elDDTotal) elDDTotal.textContent = totalDD;
  const elDDTotalPros = document.getElementById("statDDTotalProsPct"); if (elDDTotalPros) elDDTotalPros.textContent = `${totDDProsPct}%`;
  const elDDTotalSans = document.getElementById("statDDTotalSansPct"); if (elDDTotalSans) elDDTotalSans.textContent = `${totDDSansPct}%`;

  // Realization Stats
  const totalReal = realData.reduce((a, b) => a + b, 0);
  const totalRealPros = realProsData.reduce((a, b) => a + b, 0);
  const avgReal = labels.length > 0 ? Math.round(totalReal / labels.length) : 0;
  const totRealProsPct = totalReal > 0 ? Math.round((totalRealPros / totalReal) * 100) : 0;

  const elRealAvg = document.getElementById("statRealAvgVal"); if (elRealAvg) elRealAvg.textContent = formatCurrencyEUR(avgReal);
  const elRealAvgPros = document.getElementById("statRealAvgProsPct"); if (elRealAvgPros) elRealAvgPros.textContent = `${totRealProsPct}%`;
  const elRealTotal = document.getElementById("statRealTotalVal"); if (elRealTotal) elRealTotal.textContent = formatCurrencyEUR(totalReal);
  const elRealTotalPros = document.getElementById("statRealTotalProsPct"); if (elRealTotalPros) elRealTotalPros.textContent = `${totRealProsPct}%`;

  // NEW BIZ Stats
  const totalNB = newBizData.reduce((a, b) => a + b, 0);
  const totalNBPros = newBizProsData.reduce((a, b) => a + b, 0);
  const avgNB = labels.length > 0 ? Math.round(totalNB / labels.length) : 0;
  const totNBProsPct = totalNB > 0 ? Math.round((totalNBPros / totalNB) * 100) : 0;

  const elNBAvg = document.getElementById("statNewBizAvgVal"); if (elNBAvg) elNBAvg.textContent = avgNB;
  const elNBAvgPros = document.getElementById("statNewBizAvgProsPct"); if (elNBAvgPros) elNBAvgPros.textContent = `${totNBProsPct}%`;
  const elNBTotal = document.getElementById("statNewBizTotalVal"); if (elNBTotal) elNBTotal.textContent = totalNB;
  const elNBTotalPros = document.getElementById("statNewBizTotalProsPct"); if (elNBTotalPros) elNBTotalPros.textContent = `${totNBProsPct}%`;

  // Base Data Segments for 2-Colored Stacked Columns
  const ddBaseData = ddData.map((tot, idx) => Math.max(0, tot - (ddProsData[idx] || 0)));
  const realBaseData = realData.map((tot, idx) => Math.max(0, tot - (realProsData[idx] || 0)));
  const newBizBaseData = newBizData.map((tot, idx) => Math.max(0, tot - (newBizProsData[idx] || 0)));

  const maxDDTotal = Math.max(...ddData, 5);
  const maxRealTotal = Math.max(...realData, 1000);
  const maxNBTotal = Math.max(...newBizData, 5);

  // 1. Chart DD (Single 2-colored stacked column with total on top)
  const canvasDD = document.getElementById("chartActivityDD");
  if (canvasDD) {
    if (activityChartDDInstance) activityChartDDInstance.destroy();
    activityChartDDInstance = new Chart(canvasDD, {
      data: {
        labels: labels,
        datasets: [
          {
            type: "bar",
            label: "DD Standard / Actif",
            data: ddBaseData,
            backgroundColor: "#818cf8",
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
            stack: "ddStack",
            yAxisID: "y"
          },
          {
            type: "bar",
            label: "DD Prospection",
            data: ddProsData,
            backgroundColor: "#3b82f6",
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
            stack: "ddStack",
            yAxisID: "y"
          },
          {
            type: "line",
            label: "DD Prospection Share %",
            data: ddProsShareData,
            borderColor: "#0ea5e9",
            backgroundColor: "#0ea5e9",
            borderWidth: 2.2,
            tension: 0.35,
            pointRadius: 3.5,
            yAxisID: "y1"
          },
          {
            type: "line",
            label: "Sans Suite %",
            data: sansSuiteShareData,
            borderColor: "#ec4899",
            backgroundColor: "#ec4899",
            borderWidth: 2.2,
            tension: 0.35,
            pointRadius: 3.5,
            yAxisID: "y1"
          }
        ]
      },
      plugins: [createTopTotalPlugin(ddData, (val) => String(val), textColor)],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.yAxisID === "y1" ? ` ${ctx.dataset.label}: ${ctx.raw}%` : ` ${ctx.dataset.label}: ${ctx.raw}`,
              footer: (items) => {
                if (!items || items.length === 0) return "";
                const idx = items[0].dataIndex;
                return `Total DD: ${ddData[idx]}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          },
          y: {
            stacked: true,
            position: "left",
            beginAtZero: true,
            suggestedMax: Math.ceil(maxDDTotal * 1.25),
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 }, stepSize: 1 }
          },
          y1: {
            position: "right",
            beginAtZero: true,
            max: 100,
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  // 2. Chart Realization (Single 2-colored stacked column with total on top)
  const canvasReal = document.getElementById("chartActivityRealization");
  if (canvasReal) {
    if (activityChartRealizationInstance) activityChartRealizationInstance.destroy();
    activityChartRealizationInstance = new Chart(canvasReal, {
      data: {
        labels: labels,
        datasets: [
          {
            type: "bar",
            label: "Realization Standard (€)",
            data: realBaseData,
            backgroundColor: "#c084fc",
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
            stack: "realStack",
            yAxisID: "y"
          },
          {
            type: "bar",
            label: "Realization Prospection (€)",
            data: realProsData,
            backgroundColor: "#7c3aed",
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
            stack: "realStack",
            yAxisID: "y"
          },
          {
            type: "line",
            label: "Prospection Share %",
            data: realProsShareData,
            borderColor: "#0d9488",
            backgroundColor: "#0d9488",
            borderWidth: 2.2,
            tension: 0.35,
            pointRadius: 3.5,
            yAxisID: "y1"
          }
        ]
      },
      plugins: [createTopTotalPlugin(realData, (val) => formatCurrencyEUR(val), textColor)],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.yAxisID === "y1" ? ` ${ctx.dataset.label}: ${ctx.raw}%` : ` ${ctx.dataset.label}: ${formatCurrencyEUR(ctx.raw)}`,
              footer: (items) => {
                if (!items || items.length === 0) return "";
                const idx = items[0].dataIndex;
                return `Total Realization: ${formatCurrencyEUR(realData[idx])}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          },
          y: {
            stacked: true,
            position: "left",
            beginAtZero: true,
            suggestedMax: Math.ceil(maxRealTotal * 1.25),
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (val) => `${val} €`
            }
          },
          y1: {
            position: "right",
            beginAtZero: true,
            max: 100,
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  // 3. Chart NEW BIZ (Single 2-colored stacked column with total on top)
  const canvasNB = document.getElementById("chartActivityNewBiz");
  if (canvasNB) {
    if (activityChartNewBizInstance) activityChartNewBizInstance.destroy();
    activityChartNewBizInstance = new Chart(canvasNB, {
      data: {
        labels: labels,
        datasets: [
          {
            type: "bar",
            label: "NEW BIZ Standard",
            data: newBizBaseData,
            backgroundColor: "#38bdf8",
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
            stack: "nbStack",
            yAxisID: "y"
          },
          {
            type: "bar",
            label: "NEW BIZ Prospection",
            data: newBizProsData,
            backgroundColor: "#6366f1",
            borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
            stack: "nbStack",
            yAxisID: "y"
          },
          {
            type: "line",
            label: "NEW BIZ Prospection Share %",
            data: newBizProsShareData,
            borderColor: "#1e40af",
            backgroundColor: "#1e40af",
            borderWidth: 2.2,
            tension: 0.35,
            pointRadius: 3.5,
            yAxisID: "y1"
          }
        ]
      },
      plugins: [createTopTotalPlugin(newBizData, (val) => String(val), textColor)],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.yAxisID === "y1" ? ` ${ctx.dataset.label}: ${ctx.raw}%` : ` ${ctx.dataset.label}: ${ctx.raw}`,
              footer: (items) => {
                if (!items || items.length === 0) return "";
                const idx = items[0].dataIndex;
                return `Total NEW BIZ: ${newBizData[idx]}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } }
          },
          y: {
            stacked: true,
            position: "left",
            beginAtZero: true,
            suggestedMax: Math.ceil(maxNBTotal * 1.25),
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 }, stepSize: 1 }
          },
          y1: {
            position: "right",
            beginAtZero: true,
            max: 100,
            grid: { display: false },
            ticks: {
              color: textColor,
              font: { size: 10 },
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }
}

// ── 9d. BUYERS RESULTS SCOREBOARD (Inspired by Screenshot 2) ──────────────
function initBuyersResults() {
  const btnCards = document.getElementById("btnBuyerCardsView");
  const btnTable = document.getElementById("btnBuyerTableView");
  const tableWrapper = document.getElementById("buyerResultsTableWrapper");
  const cardsWrapper = document.getElementById("buyerResultsCardsWrapper");

  if (btnCards && btnTable) {
    btnCards.addEventListener("click", () => {
      currentBuyerSubView = "cards";
      btnCards.classList.add("active");
      btnTable.classList.remove("active");
      if (tableWrapper) tableWrapper.style.display = "none";
      if (cardsWrapper) cardsWrapper.style.display = "grid";
      renderBuyersResults();
      initLucide();
    });

    btnTable.addEventListener("click", () => {
      currentBuyerSubView = "table";
      btnTable.classList.add("active");
      btnCards.classList.remove("active");
      if (tableWrapper) tableWrapper.style.display = "block";
      if (cardsWrapper) cardsWrapper.style.display = "none";
      renderBuyersResults();
      initLucide();
    });
  }

  const fYear = document.getElementById("buyerFilterYear");
  const fWeek = document.getElementById("buyerFilterWeek");
  const fMonth = document.getElementById("buyerFilterMonth");

  if (fYear) {
    fYear.addEventListener("change", () => {
      currentBuyerFilterYear = fYear.value;
      renderBuyersResults();
    });
  }
  if (fWeek) {
    fWeek.addEventListener("change", () => {
      currentBuyerFilterWeek = fWeek.value;
      renderBuyersResults();
    });
  }
  if (fMonth) {
    fMonth.addEventListener("change", () => {
      currentBuyerFilterMonth = fMonth.value;
      renderBuyersResults();
    });
  }
}

function renderBuyersResults() {
  const tbody = document.getElementById("buyerScoreboardBody");
  const tfoot = document.getElementById("buyerScoreboardFoot");
  const cardsWrapper = document.getElementById("buyerResultsCardsWrapper");
  if (!tbody || !tfoot) return;

  tbody.innerHTML = "";
  if (cardsWrapper) cardsWrapper.innerHTML = "";

  // Filter deals for buyers scoreboard: respect filteredDeals when active, or apply local filters
  const baseDeals = isBuyerUser() ? allDeals.filter(d => d.buyer === currentUser) : allDeals;
  let bDealsSource = baseDeals;
  if (filterPeriod !== "All Time" || filterBuyerVal !== "All" || filterCategoryVal !== "All" || filterSupplierTypeVal !== "All" || filterSearchVal) {
    bDealsSource = filteredDeals;
  } else {
    bDealsSource = baseDeals.filter(d => {
      const dates = [d.entry_date, d.offer_date, d.order_date, d.dd_date].filter(Boolean);
      if (dates.length === 0) return true;

      return dates.some(dt => {
        const dObj = new Date(dt);
        if (isNaN(dObj.getTime())) return true;

        if (currentBuyerFilterYear !== "All") {
          if (String(dObj.getFullYear()) !== currentBuyerFilterYear) return false;
        }
        if (currentBuyerFilterMonth !== "All") {
          const m = String(dObj.getMonth() + 1).padStart(2, "0");
          if (m !== currentBuyerFilterMonth) return false;
        }
        if (currentBuyerFilterWeek !== "All") {
          const w = `W${String(getISOWeek(dObj)).padStart(2, "0")}`;
          if (w !== currentBuyerFilterWeek) return false;
        }
        return true;
      });
    });
  }

  let teamDetections = 0;
  let teamDD = 0;
  let teamOffers = 0;
  let teamInNego = 0;
  let teamForecast = 0;
  let teamOrders = 0;
  let teamOrdVal = 0;
  let teamActiveVal = 0;

  const targetBuyers = isBuyerUser() ? BUYERS.filter(b => b === currentUser) : BUYERS;
  targetBuyers.forEach(buyerName => {
    const profile = BUYER_PROFILES[buyerName] || {
      initials: buyerName.substring(0, 2).toUpperCase(),
      avatarBg: "#3b82f6"
    };

    const bDeals = bDealsSource.filter(d => d.buyer === buyerName);
    const detections = bDeals.length;
    const ddCount = bDeals.filter(d => d.affaire_status === "DD").length;
    const offers = bDeals.filter(d => (d.offer_number && String(d.offer_number).trim() !== "") || (d.offer_date && String(d.offer_date).trim() !== "") || (parseFloat(d.offer_value) > 0)).length;
    const inNego = bDeals.filter(d => d.offer_status === "Negociation" || d.offer_status === "Re-valorisation").length;

    const fVal = bDeals.filter(d => d.offer_status === "Negociée + BPA" || d.offer_status === "Negociée en attente BPA" || d.offer_status === "Forecast")
      .reduce((sum, d) => sum + (parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : (parseFloat(d.offer_value) || 0)), 0);

    const ordDeals = bDeals.filter(d => d.offer_status === "Commandé").length;
    const ordVal = bDeals.filter(d => d.offer_status === "Commandé")
      .reduce((sum, d) => sum + (parseFloat(d.order_value) || parseFloat(d.offer_value) || 0), 0);

    const actVal = bDeals.filter(d => getDaysOpen(d) !== "Closed")
      .reduce((sum, d) => sum + (parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : (parseFloat(d.offer_value) || 0)), 0);

    const rate = detections > 0 ? ((ordDeals / detections) * 100).toFixed(1) + "%" : "0.0%";

    let signal = `<span class="badge badge-gray" title="No offers submitted yet">⚫ No offer</span>`;
    if (offers > 0) {
      if (ordDeals > 0) {
        signal = `<span class="badge badge-ordered" title="${ordDeals} confirmed order(s)">🟢 ${ordDeals} Ordered</span>`;
      } else if (fVal > 0) {
        signal = `<span class="badge badge-forecast" title="Forecast awaiting BPA approval">🔮 Forecast</span>`;
      } else {
        signal = `<span class="badge badge-amber" title="${offers} active offer(s) under review">🟠 Active</span>`;
      }
    }

    teamDetections += detections;
    teamDD += ddCount;
    teamOffers += offers;
    teamInNego += inNego;
    teamForecast += fVal;
    teamOrders += ordDeals;
    teamOrdVal += ordVal;
    teamActiveVal += actVal;

    // 1. Table Row (Original columns: Buyer, Detections, Sent DD, Offers, In Nego, Forecast, Orders, Ordered VVHT, Active Pipeline, Conv. Rate, Signal)
    const tr = document.createElement("tr");
    tr.className = "buyer-scoreboard-row";
    tr.title = `Click to filter and inspect ${escapeHtml(buyerName)}'s deals in Database`;

    tr.innerHTML = `
      <td class="buyer-name-cell" data-filter="buyer">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="buyer-avatar" style="background:${profile.avatarBg}; width:28px; height:28px; font-size:0.75rem;">${profile.initials}</div>
          <strong>${escapeHtml(buyerName)}</strong>
        </div>
      </td>
      <td class="text-center font-bold" data-filter="buyer">${detections}</td>
      <td class="text-center" data-filter="sent_dd">${ddCount}</td>
      <td class="text-center font-bold" data-filter="offers">${offers}</td>
      <td class="text-center" data-filter="nego">${inNego}</td>
      <td class="text-right font-mono font-bold ${fVal > 0 ? 'text-amber' : ''}" data-filter="forecast">${formatCurrencyEUR(fVal)}</td>
      <td class="text-center font-bold ${ordDeals > 0 ? 'text-green' : ''}" data-filter="ordered">${ordDeals}</td>
      <td class="text-right font-mono font-bold ${ordVal > 0 ? 'text-green' : ''}">${formatCurrencyEUR(ordVal)}</td>
      <td class="text-right font-mono font-bold text-teal">${formatCurrencyEUR(actVal)}</td>
      <td class="text-center font-mono font-bold">${rate}</td>
      <td class="text-center">${signal}</td>
    `;

    // Click handling on row & cells
    tr.addEventListener("click", (e) => {
      const cell = e.target.closest("td");
      const fType = cell ? cell.getAttribute("data-filter") : null;
      if (fType === "sent_dd") {
        switchView("database", { buyer: buyerName, stage: "sent_dd" });
      } else if (fType === "nego") {
        switchView("database", { buyer: buyerName, stage: "nego" });
      } else if (fType === "forecast") {
        switchView("database", { buyer: buyerName, stage: "forecast" });
      } else if (fType === "ordered") {
        switchView("database", { buyer: buyerName, stage: "ordered" });
      } else {
        switchView("database", { buyer: buyerName });
      }
    });

    tbody.appendChild(tr);

    // 2. Cards View Card (Original columns)
    if (cardsWrapper) {
      const card = document.createElement("div");
      card.className = "buyer-score-card";
      card.addEventListener("click", () => {
        switchView("database", { buyer: buyerName });
      });

      card.innerHTML = `
        <div class="buyer-card-top">
          <div class="buyer-card-identity">
            <div class="buyer-avatar" style="background:${profile.avatarBg}; width:42px; height:42px; font-size:0.85rem;">${profile.initials}</div>
            <div class="buyer-card-name-group">
              <h4>${escapeHtml(buyerName)}</h4>
              <span style="font-size:0.75rem; color:var(--text-dim);">Iberian Desk · Casablanca</span>
            </div>
          </div>
          <div>${signal}</div>
        </div>

        <div class="buyer-card-metrics-grid">
          <div class="buyer-card-metric">
            <div class="metric-lbl">📁 Detections</div>
            <div class="metric-val">${detections}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">📤 Sent DD</div>
            <div class="metric-val">${ddCount}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">📄 Offers</div>
            <div class="metric-val">${offers}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">💬 In Nego</div>
            <div class="metric-val">${inNego}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">🔮 Forecast</div>
            <div class="metric-val text-amber font-mono" style="font-size:0.95rem;">${formatCurrencyEUR(fVal)}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">🛒 Orders</div>
            <div class="metric-val ${ordDeals > 0 ? 'text-green' : ''}">${ordDeals}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">💰 Ordered VVHT</div>
            <div class="metric-val text-green font-mono" style="font-size:0.95rem;">${formatCurrencyEUR(ordVal)}</div>
          </div>
          <div class="buyer-card-metric">
            <div class="metric-lbl">📈 Active Pipeline</div>
            <div class="metric-val text-teal font-mono" style="font-size:0.95rem;">${formatCurrencyEUR(actVal)}</div>
          </div>
          <div class="buyer-card-metric" style="grid-column: span 2;">
            <div class="metric-lbl">🔄 Conversion Rate</div>
            <div class="metric-val font-mono">${rate}</div>
          </div>
        </div>

        <button type="button" class="buyer-card-action-btn">
          <span>Inspect Buyer Pipeline in Database</span>
          <i data-lucide="arrow-right"></i>
        </button>
      `;
      cardsWrapper.appendChild(card);
    }
  });

  // Team Total row in tfoot (Original table totals)
  if (isBuyerUser()) {
    tfoot.style.display = "none";
    tfoot.innerHTML = "";
  } else {
    tfoot.style.display = "";
    const totRate = teamDetections > 0 ? ((teamOrders / teamDetections) * 100).toFixed(1) + "%" : "0.0%";
    const teamSignal = teamOrders > 0 || teamForecast > 0 ? `<span class="badge badge-green" title="Active pipeline underway">🟢 Active</span>` : `<span class="badge badge-gray">⚫ No offer</span>`;

    tfoot.innerHTML = `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge badge-primary">Iberian Desk</span>
            <strong>TEAM TOTAL (3 BUYERS)</strong>
          </div>
        </td>
        <td class="text-center font-bold">${teamDetections}</td>
        <td class="text-center font-bold">${teamDD}</td>
        <td class="text-center font-bold">${teamOffers}</td>
        <td class="text-center font-bold">${teamInNego}</td>
        <td class="text-right font-mono font-bold text-amber">${formatCurrencyEUR(teamForecast)}</td>
        <td class="text-center font-bold text-green">${teamOrders}</td>
        <td class="text-right font-mono font-bold text-green">${formatCurrencyEUR(teamOrdVal)}</td>
        <td class="text-right font-mono font-bold text-teal">${formatCurrencyEUR(teamActiveVal)}</td>
        <td class="text-center font-mono font-bold">${totRate}</td>
        <td class="text-center">${teamSignal}</td>
      </tr>
    `;
  }
}

function renderMarginRateBadge(deal) {
  const ordVal = parseFloat(deal.order_value) || 0;
  const marVal = parseFloat(deal.margin_value) || 0;
  let rate = 0;

  if (ordVal > 0 && marVal > 0) {
    rate = (marVal / ordVal) * 100;
  } else if (parseFloat(deal.margin_rate) > 0) {
    rate = parseFloat(deal.margin_rate);
  }

  if (rate <= 0) return `<span class="badge badge-gray font-mono">—</span>`;

  const formattedRate = rate.toFixed(1) + "%";
  if (rate >= 25) {
    return `<span class="badge badge-ordered font-mono font-bold" title="Margin: ${formatCurrencyEUR(marVal)} / Order: ${formatCurrencyEUR(ordVal)}">${formattedRate}</span>`;
  } else if (rate >= 15) {
    return `<span class="badge badge-teal font-mono font-bold" title="Margin: ${formatCurrencyEUR(marVal)} / Order: ${formatCurrencyEUR(ordVal)}">${formattedRate}</span>`;
  } else if (rate >= 8) {
    return `<span class="badge badge-amber font-mono font-bold" title="Margin: ${formatCurrencyEUR(marVal)} / Order: ${formatCurrencyEUR(ordVal)}">${formattedRate}</span>`;
  } else {
    return `<span class="badge badge-rose font-mono font-bold" title="Margin: ${formatCurrencyEUR(marVal)} / Order: ${formatCurrencyEUR(ordVal)}">${formattedRate}</span>`;
  }
}

// ── 9b. RENDER: ACTION QUEUE (PRIORITY FOLLOW-UPS) ────────────────────────
let actionQueueSort = {
  column: "stage", // "stage", "deal", "buyer", "days", "urgency"
  direction: "asc" // "asc" (Pipeline Flow: Lot ➔ Forecast), "desc" (Reverse Pipeline Flow)
};

function getStageRank(stageLabel) {
  const s = String(stageLabel || "").toLowerCase();
  if (s.includes("lot") || s.includes("détection") || s.includes("detection")) return 1;
  if (s.includes("prenego")) return 2;
  if (s.includes("crv")) return 3;
  if (s.includes("dd") || s.includes("dossier")) return 4;
  if (s.includes("nego") || s.includes("négociation")) return 5;
  if (s.includes("re-val") || s.includes("revaluation")) return 6;
  if (s.includes("awaiting bpa") || s.includes("attente bpa")) return 7;
  if (s.includes("bpa confirmed") || s.includes("bpa confirm")) return 8;
  if (s.includes("commandé") || s.includes("commande")) return 9;
  if (s.includes("closed") || s.includes("perdue") || s.includes("rejetée")) return 10;
  return 99;
}

function renderActionQueue() {
  const tbody = document.getElementById("actionQueueBody");
  const badge = document.getElementById("actionQueueBadge");
  if (!tbody) return;
  tbody.innerHTML = "";

  const actionItems = [];
  const queueDeals = (filteredDeals && filteredDeals.length >= 0) ? filteredDeals : allDeals;

  queueDeals.forEach(d => {
    const item = getRecommendedNextAction(d);
    if (item) {
      actionItems.push(item);
    }
  });

  // Sort by status in Current Stage by default (Pipeline Flow: Lot ➔ Forecast)
  actionItems.sort((a, b) => {
    if (actionQueueSort.column === "stage") {
      if (a.stageRank !== b.stageRank) {
        return actionQueueSort.direction === "asc" ? a.stageRank - b.stageRank : b.stageRank - a.stageRank;
      }
      if (a.priority !== b.priority) return a.priority - b.priority;
      const daysA = typeof a.days === "number" ? a.days : 0;
      const daysB = typeof b.days === "number" ? b.days : 0;
      return daysB - daysA;
    }
    if (actionQueueSort.column === "days") {
      const daysA = typeof a.days === "number" ? a.days : 0;
      const daysB = typeof b.days === "number" ? b.days : 0;
      const diff = daysB - daysA;
      return actionQueueSort.direction === "asc" ? -diff : diff;
    }
    if (actionQueueSort.column === "deal") {
      const cmp = String(a.deal.supplier || "").localeCompare(String(b.deal.supplier || ""));
      return actionQueueSort.direction === "asc" ? cmp : -cmp;
    }
    if (actionQueueSort.column === "buyer") {
      const cmp = String(a.deal.buyer || "").localeCompare(String(b.deal.buyer || ""));
      return actionQueueSort.direction === "asc" ? cmp : -cmp;
    }
    if (actionQueueSort.column === "urgency") {
      if (a.priority !== b.priority) {
        return actionQueueSort.direction === "asc" ? a.priority - b.priority : b.priority - a.priority;
      }
      const daysA = typeof a.days === "number" ? a.days : 0;
      const daysB = typeof b.days === "number" ? b.days : 0;
      return daysB - daysA;
    }
    return a.stageRank - b.stageRank || a.priority - b.priority || b.days - a.days;
  });

  const sortText = document.getElementById("actionQueueSortText");
  if (sortText) {
    if (actionQueueSort.column === "stage") {
      sortText.textContent = actionQueueSort.direction === "asc"
        ? "Ordered by: Current Stage (Pipeline Flow: Lot ➔ Forecast)"
        : "Ordered by: Current Stage (Reverse Flow: Forecast ➔ Lot)";
    } else if (actionQueueSort.column === "days") {
      sortText.textContent = actionQueueSort.direction === "asc" ? "Ordered by: Days in Stage (Ascending)" : "Ordered by: Days in Stage (Descending)";
    } else if (actionQueueSort.column === "deal") {
      sortText.textContent = actionQueueSort.direction === "asc" ? "Ordered by: Supplier (A ➔ Z)" : "Ordered by: Supplier (Z ➔ A)";
    } else if (actionQueueSort.column === "buyer") {
      sortText.textContent = actionQueueSort.direction === "asc" ? "Ordered by: Buyer (A ➔ Z)" : "Ordered by: Buyer (Z ➔ A)";
    } else {
      sortText.textContent = "Ordered by: Urgency Priority";
    }
  }

  // Update table header sorting states
  document.querySelectorAll("#actionQueueTable th.th-aq-sort").forEach(th => {
    const col = th.dataset.sort;
    const isActive = (col === actionQueueSort.column);
    th.classList.toggle("active-sort", isActive);
    const icon = th.querySelector("i");
    if (icon) {
      if (isActive) {
        icon.setAttribute("data-lucide", actionQueueSort.direction === "asc" ? "arrow-down" : "arrow-up");
        icon.style.opacity = "1";
        icon.style.color = "var(--brand-teal)";
      } else {
        icon.setAttribute("data-lucide", "arrow-up-down");
        icon.style.opacity = "0.5";
        icon.style.color = "";
      }
    }
  });

  if (badge) {
    badge.textContent = `${actionItems.length} to act on`;
    badge.className = actionItems.length > 0 ? "badge badge-amber font-mono" : "badge badge-gray font-mono";
  }

  if (actionItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="action-queue-empty">
          <i data-lucide="check-circle-2" style="width:28px; height:28px; color:var(--brand-green); margin-bottom:4px;"></i>
          <div style="font-weight:700; color:var(--text-main);">All caught up! No deals currently requiring urgent follow-up.</div>
          <div style="font-size:0.74rem;">Every active deal has an offer in progress, recent DD, or confirmed order.</div>
        </td>
      </tr>
    `;
    initLucide();
    return;
  }

  actionItems.forEach(item => {
    const d = item.deal;
    const tr = document.createElement("tr");
    if (item.priorityClass) tr.className = item.priorityClass;

    const stageLabel = getStageLabel(d);

    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(d.supplier || 'Unnamed Supplier')}</strong>
        <div style="font-size:0.7rem; color:var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">
          ${escapeHtml(d.product || d.product_range || 'General Lot')}
        </div>
      </td>
      <td>
        <span class="badge badge-gray">${escapeHtml(d.buyer || 'Hamid')}</span>
      </td>
      <td class="text-center">
        <span class="badge badge-primary font-mono" style="font-size:0.68rem;">${escapeHtml(stageLabel)}</span>
      </td>
      <td class="text-center font-mono font-bold ${item.priority === 1 ? 'text-red' : (item.priority === 2 ? 'text-amber' : (item.badgeColor === 'teal' ? 'text-teal' : (item.badgeColor === 'green' ? 'text-green' : '')))}">
        ${item.days} ${item.days === 1 ? 'day' : 'days'}
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          ${item.urgencyBadge}
          <span style="font-size:0.75rem; color:var(--text-main); font-weight:500;">${escapeHtml(item.actionText)}</span>
        </div>
      </td>
      <td class="text-right">
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:4px;">
          <button type="button" class="btn btn-primary btn-sm btn-action-open" data-deal-id="${d.id}" title="Open deal inspector with active stage open" style="padding:0.2rem 0.55rem; font-size:0.7rem; height:auto;">
            <i data-lucide="external-link" style="width:12px; height:12px;"></i>
            <span>Open</span>
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-action-followup" data-deal-id="${d.id}" title="Log follow-up check today" style="padding:0.2rem 0.5rem; font-size:0.7rem; height:auto;">
            <i data-lucide="check" style="width:12px; height:12px;"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".btn-action-open").forEach(btn => {
    btn.addEventListener("click", () => {
      const dealId = parseInt(btn.dataset.dealId);
      const deal = allDeals.find(x => x.id === dealId);
      if (deal) openDrawer(deal);
    });
  });

  tbody.querySelectorAll(".btn-action-followup").forEach(btn => {
    btn.addEventListener("click", async () => {
      const dealId = parseInt(btn.dataset.dealId);
      const deal = allDeals.find(x => x.id === dealId);
      if (!deal) return;

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().substring(0, 5);
      const logHeader = `[${dateStr} ${timeStr} · ${currentUser}]`;
      const autoNote = `${logHeader}: Follow-up verified via Action Queue`;

      deal.notes = deal.notes ? `${deal.notes.trim()}\n${autoNote}` : autoNote;
      await saveDealRecord(deal);
      recordAuditLog("Follow-up Logged", deal.supplier, `Action Queue follow-up verified by ${currentUser}`, deal.id);
      showToast("Follow-up Recorded", `${deal.supplier} marked as followed up.`);
      applyFiltersAndRender();
    });
  });

  initLucide();
}

// ── 9c. 3-VIEW APP SWITCHING & DEEP-LINKING ──────────────────────────────
function switchView(viewName, filterParams = {}) {
  if (viewName === "buyers" || viewName === "buyer-results") {
    currentAppView = "buyers";
  } else if (viewName === "database") {
    currentAppView = "database";
  } else {
    currentAppView = "dashboard";
  }

  const vDash = document.getElementById("viewDashboard");
  const vBuyers = document.getElementById("viewBuyersResults");
  const vData = document.getElementById("viewDatabase");
  const tabDash = document.getElementById("navTabDashboard");
  const tabBuyers = document.getElementById("navTabBuyers");
  const tabData = document.getElementById("navTabDatabase");

  if (vDash && vData) {
    vDash.style.display = currentAppView === "dashboard" ? "flex" : "none";
    if (vBuyers) vBuyers.style.display = currentAppView === "buyers" ? "block" : "none";
    vData.style.display = currentAppView === "database" ? "flex" : "none";

    if (tabDash) tabDash.classList.toggle("active", currentAppView === "dashboard");
    if (tabBuyers) tabBuyers.classList.toggle("active", currentAppView === "buyers");
    if (tabData) tabData.classList.toggle("active", currentAppView === "database");
  }

  if (filterParams.buyer) {
    const bSelect = document.getElementById("filterBuyer");
    if (bSelect) {
      bSelect.value = filterParams.buyer;
      filterBuyerVal = filterParams.buyer;
    }
  }

  if (filterParams.overdue) {
    const staleToggle = document.getElementById("filterStaleOnly");
    if (staleToggle) {
      staleToggle.checked = true;
      filterStaleOnlyVal = true;
    }
    currentSavedView = "overdue";
  }

  if (filterParams.activeOnly) {
    const ongoingToggle = document.getElementById("filterOngoingOnly");
    if (ongoingToggle) {
      ongoingToggle.checked = true;
      filterOngoingOnlyVal = true;
    }
  }

  if (filterParams.savedView) {
    if (filterParams.savedView === "bpa") currentSavedView = "forecast";
    else if (filterParams.savedView === "nodd") currentSavedView = "dnd";
    else currentSavedView = filterParams.savedView;
  }

  try {
    history.replaceState(null, "", `#${currentAppView}`);
  } catch (e) {}

  applyFiltersAndRender();
}

function updateSavedViewCounts() {
  const cAll = document.getElementById("countSavedAll");
  const cOverdue = document.getElementById("countSavedOverdue");
  const cForecast = document.getElementById("countSavedForecast");
  const cDND = document.getElementById("countSavedDND");
  const navDataCount = document.getElementById("navDatabaseCount");
  const navOverdue = document.getElementById("navOverdueBadge");

  let countOverdue = 0;
  let countForecast = 0;
  let countDND = 0;

  const baseDeals = isBuyerUser() ? allDeals.filter(d => d.buyer === currentUser) : allDeals;

  baseDeals.forEach(d => {
    if (getStaleAlert(d)) countOverdue++;
    if (isForecastDeal(d)) countForecast++;
    if (isDNDDeal(d)) countDND++;
  });

  if (cAll) cAll.textContent = baseDeals.length;
  if (cOverdue) cOverdue.textContent = countOverdue;
  if (cForecast) cForecast.textContent = countForecast;
  if (cDND) cDND.textContent = countDND;
  if (navDataCount) navDataCount.textContent = baseDeals.length;

  if (navOverdue) {
    if (countOverdue > 0) {
      navOverdue.style.display = "inline-flex";
      navOverdue.textContent = countOverdue;
    } else {
      navOverdue.style.display = "none";
    }
  }

  document.querySelectorAll(".saved-view-btn").forEach(btn => {
    if (btn.dataset.savedView === currentSavedView) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function renderFilterChips() {
  const chipsBar = document.getElementById("activeFilterChipsBar");
  const chipsList = document.getElementById("filterChipsList");
  if (!chipsBar || !chipsList) return;

  const chips = [];

  if (filterPeriod !== "All Time") {
    let pLabel = `Period: ${filterPeriod}`;
    if (filterPeriod === "Monthly" && filterPeriodVal) {
      pLabel = filterPeriodVal === "2026-10" ? "Period: October 2026" : (filterPeriodVal === "2026-09" ? "Period: September 2026" : `Period: ${filterPeriodVal}`);
    } else if (filterPeriod === "Weekly" && filterPeriodVal) {
      pLabel = `Period: Week ${filterPeriodVal.replace(/[^\d]/g, "")}`;
    } else if (filterPeriod === "Monthly_All") {
      pLabel = "Period: Monthly View";
    } else if (filterPeriod === "Weekly_All") {
      pLabel = "Period: Weekly View";
    }

    chips.push({
      label: pLabel,
      clear: () => {
        const pType = document.getElementById("filterPeriodType");
        if (pType) pType.value = "All Time";
        filterPeriod = "All Time";
        filterPeriodVal = "";
        syncBuyersResultsFilters("All", "All");
      }
    });
  }

  if (filterBuyerVal && filterBuyerVal !== "All") {
    chips.push({
      label: `Buyer: ${filterBuyerVal}`,
      clear: () => {
        document.getElementById("filterBuyer").value = "All";
        filterBuyerVal = "All";
      }
    });
  }

  if (filterCategoryVal && filterCategoryVal !== "All") {
    chips.push({
      label: `Category: ${filterCategoryVal}`,
      clear: () => {
        document.getElementById("filterCategory").value = "All";
        filterCategoryVal = "All";
      }
    });
  }

  if (filterSupplierTypeVal && filterSupplierTypeVal !== "All") {
    chips.push({
      label: `Type: ${filterSupplierTypeVal}`,
      clear: () => {
        document.getElementById("filterSupplierType").value = "All";
        filterSupplierTypeVal = "All";
      }
    });
  }

  if (filterProspectorVal && filterProspectorVal !== "All") {
    const isNoProspector = (filterProspectorVal === "__NO_PROSPECTOR__" || filterProspectorVal === "__EMPTY__");
    chips.push({
      label: isNoProspector ? "Prospector: Without Prospector" : `Prospector: ${filterProspectorVal}`,
      clear: () => {
        document.getElementById("filterProspector").value = "All";
        filterProspectorVal = "All";
        applyFiltersAndRender();
      }
    });
  }

  if (filterOngoingOnlyVal) {
    chips.push({
      label: `Active Deals Only`,
      clear: () => {
        document.getElementById("filterOngoingOnly").checked = false;
        filterOngoingOnlyVal = false;
      }
    });
  }

  if (filterStaleOnlyVal) {
    chips.push({
      label: `Overdue Deals Only`,
      clear: () => {
        document.getElementById("filterStaleOnly").checked = false;
        filterStaleOnlyVal = false;
      }
    });
  }

  if (currentSavedView !== "all") {
    const viewLabels = {
      overdue: "View: Overdue",
      forecast: "View: Forecast (Green: BPA ✓ | Orange: Awaiting)",
      bpa: "View: Forecast (Green: BPA ✓ | Orange: Awaiting)",
      dnd: "View: DND (Lot / Prenego / CRV)",
      nodd: "View: DND (Lot / Prenego / CRV)"
    };
    chips.push({
      label: viewLabels[currentSavedView] || `View: ${currentSavedView}`,
      clear: () => {
        currentSavedView = "all";
        applyFiltersAndRender();
      }
    });
  }

  if (filterSearchVal) {
    chips.push({
      label: `Search: "${filterSearchVal}"`,
      clear: () => {
        document.getElementById("searchInput").value = "";
        filterSearchVal = "";
      }
    });
  }

  chipsList.innerHTML = "";
  if (chips.length === 0) {
    chipsBar.style.display = "none";
    return;
  }

  chipsBar.style.display = "flex";
  chips.forEach(c => {
    const chipEl = document.createElement("div");
    chipEl.className = "filter-chip";
    chipEl.innerHTML = `
      <span>${escapeHtml(c.label)}</span>
      <span class="filter-chip-remove" title="Remove filter"><i data-lucide="x" style="width:12px; height:12px;"></i></span>
    `;
    chipEl.querySelector(".filter-chip-remove").addEventListener("click", () => {
      c.clear();
      applyFiltersAndRender();
    });
    chipsList.appendChild(chipEl);
  });

  const clearAllBtn = document.getElementById("btnClearAllChips");
  if (clearAllBtn) {
    clearAllBtn.onclick = () => {
      const pType = document.getElementById("filterPeriodType");
      if (pType) pType.value = "All Time";
      filterPeriod = "All Time";
      filterPeriodVal = "";
      syncBuyersResultsFilters("All", "All");

      document.getElementById("filterBuyer").value = "All";
      filterBuyerVal = "All";
      document.getElementById("filterCategory").value = "All";
      filterCategoryVal = "All";
      document.getElementById("filterSupplierType").value = "All";
      filterSupplierTypeVal = "All";
      document.getElementById("filterProspector").value = "All";
      filterProspectorVal = "All";
      document.getElementById("filterOngoingOnly").checked = false;
      filterOngoingOnlyVal = false;
      document.getElementById("filterStaleOnly").checked = false;
      filterStaleOnlyVal = false;
      document.getElementById("searchInput").value = "";
      filterSearchVal = "";
      currentSavedView = "all";
      applyFiltersAndRender();
    };
  }

  initLucide();
}

function initDashboardInteractions() {
  // 1. KPI cards click to database
  document.querySelectorAll(".kpi-clickable").forEach(card => {
    card.addEventListener("click", (e) => {
      const fCol = e.target.closest("[data-kpi-forecast]");
      if (fCol) {
        switchView("database", { savedView: "forecast" });
        return;
      }
      const target = card.dataset.kpiFilter;
      if (target === "overdue") {
        switchView("database", { overdue: true, savedView: "overdue" });
      } else if (target === "active") {
        switchView("database", { activeOnly: true });
      } else if (target === "forecast") {
        switchView("database", { savedView: "forecast" });
      } else if (target === "ordered") {
        switchView("database", { savedView: "all" });
      } else {
        switchView("database", { savedView: "all" });
      }
    });
  });

  // 2. View switcher in navbar
  document.getElementById("navTabDashboard")?.addEventListener("click", () => switchView("dashboard"));
  document.getElementById("navTabBuyers")?.addEventListener("click", () => switchView("buyers"));
  document.getElementById("navTabDatabase")?.addEventListener("click", () => switchView("database"));
  document.getElementById("btnBackToDashboard")?.addEventListener("click", () => switchView("dashboard"));

  // 3. Saved Views Tabs in Database view
  document.querySelectorAll(".saved-view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const clickedView = btn.dataset.savedView || "all";
      if (currentSavedView === clickedView && clickedView !== "all") {
        // Clicking active saved view again deselects it and reverts to "all"!
        currentSavedView = "all";
        document.getElementById("filterStaleOnly").checked = false;
        filterStaleOnlyVal = false;
      } else {
        currentSavedView = clickedView;
        if (currentSavedView === "overdue") {
          document.getElementById("filterStaleOnly").checked = true;
          filterStaleOnlyVal = true;
        } else {
          document.getElementById("filterStaleOnly").checked = false;
          filterStaleOnlyVal = false;
        }
      }
      applyFiltersAndRender();
    });
  });

  // 4. Keyboard Shortcuts: '/' to search, 'Esc' to close drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      e.preventDefault();
      switchView("database");
      const sInput = document.getElementById("searchInput");
      if (sInput) sInput.focus();
    } else if (e.key === "Escape") {
      const drawer = document.getElementById("drawerOverlay");
      if (drawer && drawer.classList.contains("open")) {
        drawer.classList.remove("open");
      }
    }
  });

  // 5. Hash navigation support
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "database") {
      switchView("database");
    } else if (hash === "buyers" || hash === "buyer-results") {
      switchView("buyers");
    } else {
      switchView("dashboard");
    }
  });

  // 6. Action Queue Header Click-to-Sort
  document.querySelectorAll("#actionQueueTable th.th-aq-sort").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (actionQueueSort.column === col) {
        actionQueueSort.direction = (actionQueueSort.direction === "asc") ? "desc" : "asc";
      } else {
        actionQueueSort.column = col;
        actionQueueSort.direction = "asc";
      }
      renderActionQueue();
    });
  });

  // 7. Database Table Header Click-to-Sort
  document.querySelectorAll("#mainPipelineTable th.th-sortable").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (pipelineTableSort.column === col) {
        pipelineTableSort.direction = (pipelineTableSort.direction === "asc") ? "desc" : "asc";
      } else {
        pipelineTableSort.column = col;
        pipelineTableSort.direction = (col === "offer_value" || col === "order_value" || col === "margin_value" || col === "margin_rate" || col === "days") ? "desc" : "asc";
      }
      renderTable();
    });
  });
}

// ── 10. RENDER: FULL PIPELINE DATA GRID (SORTABLE) ──────────────────────────
let pipelineTableSort = {
  column: "id",
  direction: "asc"
};

function renderTable() {
  const tbody = document.getElementById("pipelineTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filteredCountEl = document.getElementById("tableFilteredCount");
  const totalCountEl = document.getElementById("tableTotalCount");
  if (filteredCountEl) filteredCountEl.textContent = filteredDeals.length;
  if (totalCountEl) totalCountEl.textContent = isBuyerUser() ? allDeals.filter(d => d.buyer === currentUser).length : allDeals.length;

  // Update table header sorting states & icons
  document.querySelectorAll("#mainPipelineTable th.th-sortable").forEach(th => {
    const col = th.dataset.sort;
    const isActive = (col === pipelineTableSort.column);
    th.classList.toggle("active-sort", isActive);
    const icon = th.querySelector("i");
    if (icon) {
      if (isActive) {
        icon.setAttribute("data-lucide", pipelineTableSort.direction === "asc" ? "arrow-up" : "arrow-down");
        icon.style.opacity = "1";
        icon.style.color = "var(--brand-teal)";
      } else {
        icon.setAttribute("data-lucide", "arrow-up-down");
        icon.style.opacity = "0.45";
        icon.style.color = "";
      }
    }
  });

  if (filteredDeals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="17" style="text-align:center; padding:2.5rem; color:var(--text-dim);">
          <i data-lucide="inbox" style="width:36px; height:36px; margin-bottom:0.5rem; opacity:0.6;"></i>
          <div>No deals found matching your search criteria.</div>
        </td>
      </tr>
    `;
    initLucide();
    return;
  }

  // Sort display rows according to pipelineTableSort
  const displayDeals = [...filteredDeals].sort((a, b) => {
    const col = pipelineTableSort.column;
    const dir = pipelineTableSort.direction === "asc" ? 1 : -1;

    switch (col) {
      case "id":
        return ((a.id || 0) - (b.id || 0)) * dir;

      case "entry_date": {
        const tA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
        const tB = b.entry_date ? new Date(b.entry_date).getTime() : 0;
        return (tA - tB) * dir;
      }

      case "buyer":
        return String(a.buyer || "").localeCompare(String(b.buyer || "")) * dir;

      case "prospector":
        return String(a.prospector || "").localeCompare(String(b.prospector || "")) * dir;

      case "supplier":
        return String(a.supplier || "").localeCompare(String(b.supplier || "")) * dir;

      case "supplier_type":
        return String(a.supplier_type || "").localeCompare(String(b.supplier_type || "")) * dir;

      case "product":
        return String(a.product || "").localeCompare(String(b.product || "")) * dir;

      case "product_range": {
        const catA = getProductCategoryLabel(a.product_range);
        const catB = getProductCategoryLabel(b.product_range);
        return String(catA).localeCompare(String(catB)) * dir;
      }

      case "affaire_status": {
        const rankA = getStageRank(getStageLabel(a));
        const rankB = getStageRank(getStageLabel(b));
        if (rankA !== rankB) return (rankA - rankB) * dir;
        return String(a.affaire_status || "").localeCompare(String(b.affaire_status || "")) * dir;
      }

      case "offer_number":
        return String(a.offer_number || "").localeCompare(String(b.offer_number || ""), undefined, { numeric: true }) * dir;

      case "offer_value": {
        const vA = parseFloat(a.offer_value) || 0;
        const vB = parseFloat(b.offer_value) || 0;
        return (vA - vB) * dir;
      }

      case "offer_status":
        return String(a.offer_status || "").localeCompare(String(b.offer_status || "")) * dir;

      case "order_value": {
        const vA = parseFloat(a.order_value) || 0;
        const vB = parseFloat(b.order_value) || 0;
        return (vA - vB) * dir;
      }

      case "margin_value": {
        const vA = parseFloat(a.margin_value) || 0;
        const vB = parseFloat(b.margin_value) || 0;
        return (vA - vB) * dir;
      }

      case "margin_rate": {
        const rA = parseFloat(a.margin_rate) || 0;
        const rB = parseFloat(b.margin_rate) || 0;
        return (rA - rB) * dir;
      }

      case "days": {
        const dOpenA = getDaysOpen(a);
        const dOpenB = getDaysOpen(b);
        const vA = typeof dOpenA === "number" ? dOpenA : (dOpenA === "Closed" ? -1 : 0);
        const vB = typeof dOpenB === "number" ? dOpenB : (dOpenB === "Closed" ? -1 : 0);
        return (vA - vB) * dir;
      }

      case "notes":
        return String(a.notes || "").localeCompare(String(b.notes || "")) * dir;

      default:
        return ((a.id || 0) - (b.id || 0)) * dir;
    }
  });

  displayDeals.forEach((deal, idx) => {
    const days = getDaysOpen(deal);
    const stale = getStaleAlert(deal);
    const isClosed = days === "Closed";

    const delayInfo = getStageDelayInfo(deal);
    const delayClass = delayInfo.badgeClass;

    // Affaire badge
    let affBadge = `<span class="badge badge-gray" title="DND: Sourced deal">${escapeHtml(deal.affaire_status || "Lot")}</span>`;
    if (deal.affaire_status === "DD") {
      const ddDateText = deal.dd_date ? `DD (${formatDateFR(deal.dd_date)})` : "DD";
      affBadge = `<span class="badge badge-primary" title="Date of DD: ${deal.dd_date || 'N/A'}">${escapeHtml(ddDateText)}</span>`;
    } else if (deal.affaire_status === "Prenego") {
      affBadge = `<span class="badge badge-amber" title="DND: Prenego">DND · Prenego</span>`;
    } else if (deal.affaire_status === "CRV" || deal.affaire_status === "CRV en cours") {
      affBadge = `<span class="badge badge-purple" title="DND: CRV en cours">DND · CRV</span>`;
    } else if (deal.affaire_status === "Lot") {
      affBadge = `<span class="badge badge-gray" title="DND: Lot / Détection">DND · Lot</span>`;
    } else if (deal.affaire_status === "Closed" || deal.affaire_status === "Rejetée") {
      affBadge = `<span class="badge badge-gray">Closed</span>`;
    } else if (isDNDDeal(deal)) {
      affBadge = `<span class="badge badge-gray" title="DND: Sourcing">DND · ${escapeHtml(deal.affaire_status || "Lot")}</span>`;
    }

    // Check if Forecast Deal and whether BPA received
    const isForecast = isForecastDeal(deal);
    const hasBPA = hasBPAReceived(deal);

    // Offer Status badge
    let offBadge = `<span class="badge badge-gray">—</span>`;
    if (deal.offer_status === "Commandé") {
      offBadge = `<span class="badge badge-ordered">Ordered 🟢</span>`;
    } else if (isForecast && hasBPA) {
      offBadge = `<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#10b981; border:1px solid #10b981; font-weight:700;">Forecast (BPA ✓)</span>`;
    } else if (isForecast && !hasBPA) {
      offBadge = `<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#f59e0b; border:1px solid #f59e0b; font-weight:700;">Forecast (Awaiting BPA)</span>`;
    } else if (deal.offer_status === "Negociation") {
      offBadge = `<span class="badge badge-amber">In Negotiation</span>`;
    } else if (deal.offer_status === "Re-valorisation") {
      offBadge = `<span class="badge badge-purple">Re-valuation</span>`;
    } else if (deal.offer_status === "Closed" || deal.offer_status === "Perdue") {
      offBadge = `<span class="badge badge-rose">Closed ❌</span>`;
    }

    // Supplier Type badge (Strict order: Actif / Inactif / Occasionnel / NEW BIZ)
    let supBadge = `<span class="badge badge-gray">${escapeHtml(deal.supplier_type || "Actif")}</span>`;
    if (deal.supplier_type === "Actif") supBadge = `<span class="badge badge-green">Active</span>`;
    else if (deal.supplier_type === "Inactif") supBadge = `<span class="badge badge-gray">Inactive</span>`;
    else if (deal.supplier_type === "Occasionnel") supBadge = `<span class="badge badge-amber">Occasional</span>`;
    else if (deal.supplier_type === "NEW BIZ") supBadge = `<span class="badge badge-primary">NEW BIZ</span>`;

    const tr = document.createElement("tr");

    // Color lines with Green for with BPA and orange for without BPA
    if (isForecast) {
      if (hasBPA) {
        tr.classList.add("row-forecast-bpa");
      } else {
        tr.classList.add("row-forecast-nobpa");
      }
    }
    tr.innerHTML = `
      <td class="font-mono" style="color:var(--text-dim); font-size:0.75rem;">${idx + 1}</td>
      <td class="font-mono">${escapeHtml(formatDateFR(deal.entry_date))}</td>
      <td class="font-semibold">${escapeHtml(deal.buyer)}</td>
      <td class="text-teal font-semibold">${escapeHtml(deal.prospector || "—")}</td>
      <td class="font-bold">${escapeHtml(deal.supplier)}</td>
      <td>${supBadge}</td>
      <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(deal.product || "—")}</td>
      <td><span class="badge badge-gray">${escapeHtml(getProductCategoryLabel(deal.product_range))}</span></td>
      <td class="text-center">${affBadge}</td>
      <td class="text-center font-mono">${escapeHtml(deal.offer_number || "—")}</td>
      <td class="text-right font-mono font-bold text-green">${deal.offer_value > 0 ? formatCurrencyEUR(deal.offer_value) : "—"}</td>
      <td class="text-center">${offBadge}</td>
      <td class="text-right font-mono font-bold ${deal.order_value > 0 ? 'text-green' : ''}">${deal.order_value > 0 ? formatCurrencyEUR(deal.order_value) : "—"}</td>
      <td class="text-right font-mono font-bold text-green">${deal.margin_value > 0 ? formatCurrencyEUR(deal.margin_value) : "—"}</td>
      <td class="text-center font-mono font-bold">${renderMarginRateBadge(deal)}</td>
      <td class="text-center">${stale ? `<span class="badge badge-stale" title="${days} days (working days, weekends excluded)">${stale}</span>` : `<span class="badge ${delayClass}" title="${days} days (working days, weekends excluded)">${days === "Closed" ? "Closed" : days + " days"}</span>`}</td>
      <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.75rem; color:var(--text-dim);">${escapeHtml(deal.notes || "—")}</td>
    `;
    tr.addEventListener("click", () => openDrawer(deal));
    tbody.appendChild(tr);
  });
}

function updateDrawerMarginDisplay() {
  const ordEl = document.getElementById("editOrderValue");
  const marEl = document.getElementById("editMarginValue");
  const txtBadge = document.getElementById("txtCalculatedMargin");
  const formulaLabel = document.getElementById("formulaCalculatedMargin");

  const ordVal = parseFloat(ordEl ? ordEl.value : 0) || 0;
  const marVal = parseFloat(marEl ? marEl.value : 0) || 0;

  if (ordVal > 0 && marVal > 0) {
    const rate = ((marVal / ordVal) * 100).toFixed(1);
    if (txtBadge) {
      txtBadge.textContent = `${rate}%`;
      txtBadge.style.color = rate >= 20 ? "var(--brand-green)" : rate >= 10 ? "var(--brand-amber)" : "var(--brand-rose)";
    }
    if (formulaLabel) {
      formulaLabel.textContent = `${formatCurrencyEUR(marVal)} / ${formatCurrencyEUR(ordVal)}`;
    }
  } else if (ordVal > 0) {
    if (txtBadge) {
      txtBadge.textContent = "0.0%";
      txtBadge.style.color = "var(--text-dim)";
    }
    if (formulaLabel) {
      formulaLabel.textContent = `0 € / ${formatCurrencyEUR(ordVal)}`;
    }
  } else {
    if (txtBadge) {
      txtBadge.textContent = "—";
      txtBadge.style.color = "var(--text-dim)";
    }
    if (formulaLabel) {
      formulaLabel.textContent = "Enter Order VVHT & Margin";
    }
  }
}

// ── 11. SPLIT 2-COLUMN DEAL DRAWER & COMMENTS ─────────────────────────────
let currentDrawerDeal = null;
let adminForceUnlock = false;
let currentTimelineFilter = "all";

function updateDrawerDelayDisplay(deal) {
  const badge = document.getElementById("drawerDelayBadge");
  if (!badge || !deal) return;

  const isOfferRcv = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
  const affStatus = document.getElementById("editAffaireStatus")?.value || deal.affaire_status;
  const offStatus = document.getElementById("editOfferStatus")?.value || deal.offer_status;
  const ordChecked = Boolean(document.getElementById("editCheckOrdered")?.checked);
  const lostChecked = Boolean(document.getElementById("editCheckLost")?.checked);

  // Transient representation of the deal reflecting current drawer form state
  const transientDeal = {
    ...deal,
    affaire_status: affStatus,
    offer_status: ordChecked ? "Commandé" : (lostChecked ? "Closed" : (offStatus || (isOfferRcv ? "Negociation" : ""))),
    offer_date: isOfferRcv ? (document.getElementById("editOfferDate")?.value || deal.offer_date) : null,
    dd_date: document.getElementById("editDateDD")?.value || deal.dd_date,
    entry_date: document.getElementById("editEntryDate")?.value || deal.entry_date
  };

  const delayInfo = getStageDelayInfo(transientDeal);
  badge.textContent = delayInfo.text;
  badge.className = `badge ${delayInfo.badgeClass}`;
  const threshold = (isOfferRcv || transientDeal.offer_date || (transientDeal.offer_status && transientDeal.offer_status !== "")) ? 10 : 5;
  badge.title = `${delayInfo.label} (Threshold: ${threshold} working days)`;
}

function updateDrawerLockingState(deal, forceUnlock = false) {
  if (!deal) return;
  updateDrawerDelayDisplay(deal);
  const hasOffer = Boolean(
    (deal.offer_number && String(deal.offer_number).trim() !== "") ||
    (deal.offer_date && String(deal.offer_date).trim() !== "") ||
    (parseFloat(deal.offer_value) > 0) ||
    (document.getElementById("editCheckOfferReceived")?.checked)
  );

  const isOrdered = deal.offer_status === "Commandé" || document.getElementById("editCheckOrdered")?.checked;
  const isLost = deal.offer_status === "Closed" || deal.offer_status === "Perdue" || document.getElementById("editCheckLost")?.checked;
  const isNegotiated = hasOffer && !isOrdered && !isLost && (
    deal.offer_status === "Negociation" || deal.offer_status === "Forecast" ||
    deal.offer_status === "Negociée + BPA" || deal.offer_status === "Negociée en attente BPA" ||
    deal.offer_status === "Re-valorisation"
  );

  const sourcingInputs = [
    "editAffaireStatus", "editDateDD", "editEntryDate", "editBuyer",
    "editProspector", "editSupplierType", "editSupplier", "editCategory", "editProduct"
  ];
  const offerInputs = [
    "editCheckOfferReceived", "editOfferDate", "editOfferNumber", "editOfferValue"
  ];
  const negoInputs = [
    "editOfferStatus", "editForecastValue", "editBPAReceived", "editBPADate"
  ];
  const outcomeInputs = [
    "editCheckOrdered", "editCheckLost"
  ];

  const setFieldLocked = (id, locked) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.disabled = locked;
    if (locked) {
      el.classList.add("field-locked");
    } else {
      el.classList.remove("field-locked");
    }
  };

  const lockNoticeSourcing = document.getElementById("lockNoticeSourcing");
  const lockNoticeOffer = document.getElementById("lockNoticeOffer");
  const lockNoticeNego = document.getElementById("lockNoticeNego");
  const lockNoticeOutcome = document.getElementById("lockNoticeOutcome");
  const txtUnlockBtn = document.getElementById("txtAdminUnlockBtn");
  const isOwner = isTeamLeaderOrAdmin() || (deal.buyer === currentUser);
  const saveBtn = document.getElementById("btnSaveDrawer");
  if (saveBtn) {
    saveBtn.style.display = isOwner ? "inline-flex" : "none";
  }

  if (!isOwner) {
    sourcingInputs.forEach(id => setFieldLocked(id, true));
    offerInputs.forEach(id => setFieldLocked(id, true));
    negoInputs.forEach(id => setFieldLocked(id, true));
    outcomeInputs.forEach(id => setFieldLocked(id, true));
    if (lockNoticeSourcing) lockNoticeSourcing.style.display = "flex";
    if (lockNoticeOffer) lockNoticeOffer.style.display = "flex";
    if (lockNoticeNego) lockNoticeNego.style.display = "flex";
    if (lockNoticeOutcome) lockNoticeOutcome.style.display = "flex";
    return;
  }

  if (forceUnlock) {
    sourcingInputs.forEach(id => setFieldLocked(id, false));
    offerInputs.forEach(id => setFieldLocked(id, false));
    negoInputs.forEach(id => setFieldLocked(id, false));
    outcomeInputs.forEach(id => setFieldLocked(id, false));

    if (lockNoticeSourcing) lockNoticeSourcing.style.display = "none";
    if (lockNoticeOffer) lockNoticeOffer.style.display = "none";
    if (lockNoticeNego) lockNoticeNego.style.display = "none";
    if (lockNoticeOutcome) lockNoticeOutcome.style.display = "none";
    if (txtUnlockBtn) txtUnlockBtn.textContent = "Re-Lock";
    if (txtUnlockStatus) txtUnlockStatus.textContent = "Admin: Fields Unlocked (Editable)";
    return;
  }

  if (txtUnlockBtn) txtUnlockBtn.textContent = "Unlock All";
  if (txtUnlockStatus) txtUnlockStatus.textContent = "Admin: Previous stages locked";

  // Stage 1: Once there is an offer, lock previous information (Sourcing & Supplier)
  if (hasOffer) {
    sourcingInputs.forEach(id => setFieldLocked(id, true));
    if (lockNoticeSourcing) lockNoticeSourcing.style.display = "flex";
    const bSourcing = document.getElementById("badgeGroupSourcing");
    if (bSourcing) {
      bSourcing.className = "badge badge-gray font-mono";
      bSourcing.innerHTML = `🔒 Locked (${deal.affaire_status || 'Prenego'})`;
    }
  } else {
    sourcingInputs.forEach(id => setFieldLocked(id, false));
    if (lockNoticeSourcing) lockNoticeSourcing.style.display = "none";
    const bSourcing = document.getElementById("badgeGroupSourcing");
    if (bSourcing) {
      const affVal = document.getElementById("editAffaireStatus")?.value || deal.affaire_status || "Prenego";
      bSourcing.className = (affVal === "DD") ? "badge badge-primary font-mono" : "badge badge-primary";
      bSourcing.textContent = affVal;
    }
  }

  // Stage 2: Once in negotiation / forecast / revaluation
  if (isNegotiated) {
    sourcingInputs.forEach(id => setFieldLocked(id, true));
    setFieldLocked("editCheckOfferReceived", true);
    setFieldLocked("editOfferDate", true);
    setFieldLocked("editOfferNumber", true);
    setFieldLocked("editOfferValue", false);
    if (lockNoticeOffer) lockNoticeOffer.style.display = "flex";

    negoInputs.forEach(id => setFieldLocked(id, false));
    outcomeInputs.forEach(id => setFieldLocked(id, false));
    if (lockNoticeNego) lockNoticeNego.style.display = "none";
    if (lockNoticeOutcome) lockNoticeOutcome.style.display = "none";
  } else if (!hasOffer) {
    setFieldLocked("editCheckOfferReceived", false);
    setFieldLocked("editOfferDate", false);
    setFieldLocked("editOfferNumber", false);
    setFieldLocked("editOfferValue", false);
    if (lockNoticeOffer) lockNoticeOffer.style.display = "none";
    if (lockNoticeNego) lockNoticeNego.style.display = "none";
    if (lockNoticeOutcome) lockNoticeOutcome.style.display = "none";
  }

  // Stage 3: Once Ordered or Lost (Terminal Outcome)
  if (isOrdered || isLost) {
    sourcingInputs.forEach(id => setFieldLocked(id, true));
    offerInputs.forEach(id => setFieldLocked(id, true));
    negoInputs.forEach(id => setFieldLocked(id, true));
    outcomeInputs.forEach(id => setFieldLocked(id, true));

    if (lockNoticeSourcing) lockNoticeSourcing.style.display = "flex";
    if (lockNoticeOffer) lockNoticeOffer.style.display = "flex";
    if (lockNoticeNego) lockNoticeNego.style.display = "flex";
    if (lockNoticeOutcome) lockNoticeOutcome.style.display = "flex";
  }

  // If user is a buyer, they can never reassign a deal to another buyer
  if (isBuyerUser()) {
    setFieldLocked("editBuyer", true);
  }
}

// ── SMART STAGE ACCORDION FOCUS: KEEP LOCKED GROUPS CLOSED ────────────────
function applyAccordionStageFocus(deal, forceUnlock = false) {
  const g1 = document.getElementById("groupSourcingSupplier");
  const g2 = document.getElementById("groupOfferDetails");
  const g3 = document.getElementById("groupNegotiationForecast") || document.getElementById("groupNegoForecast");
  const g4 = document.getElementById("groupOutcomeOrder");

  // Close all 4 groups initially
  [g1, g2, g3, g4].forEach(g => { if (g) g.classList.remove("open"); });

  if (forceUnlock) {
    // If admin emergency unlocked, open all groups for editing
    [g1, g2, g3, g4].forEach(g => { if (g) g.classList.add("open"); });
    return;
  }

  const hasOffer = Boolean(
    (deal.offer_number && String(deal.offer_number).trim() !== "") ||
    (deal.offer_date && String(deal.offer_date).trim() !== "") ||
    (parseFloat(deal.offer_value) > 0) ||
    (deal.offer_status && deal.offer_status !== "")
  );

  const isOrdered = deal.offer_status === "Commandé" || (deal.order_value > 0 && deal.offer_status !== "Closed" && deal.offer_status !== "Perdue");
  const isLost = deal.offer_status === "Closed" || deal.offer_status === "Perdue" || deal.affaire_status === "Closed" || deal.affaire_status === "Rejetée";

  if (isOrdered || isLost) {
    // Terminal outcome: previous stages 1, 2, 3 locked -> keep CLOSED. Group 4 (Outcome & Order Details) is OPEN!
    if (g4) g4.classList.add("open");
  } else if (hasOffer) {
    // Offer exists and in Negotiation / Forecast:
    // Group 1 (Sourcing) locked -> keep CLOSED.
    // Group 2 (Offer) locked -> keep CLOSED.
    // Group 3 (Negotiation & Forecast) is CURRENT ACTIVE STAGE -> OPEN it to fill/adjust!
    if (g3) g3.classList.add("open");
  } else if (deal.affaire_status === "DD") {
    // ONCE DD IS SENT AND UNTIL OFFER IS RECEIVED:
    // All 4 groups stay cleanly closed, exactly matching the user screenshot!
    [g1, g2, g3, g4].forEach(g => { if (g) g.classList.remove("open"); });
  } else {
    // Sourcing in Lot / Prenego / CRV: open group 1 to fill sourcing info
    if (g1) g1.classList.add("open");
  }
}

function updateBPACounterDisplay() {
  const bpaDateInput = document.getElementById("editBPADate");
  const badgeCounter = document.getElementById("badgeBPADaysCounter");
  const editBPAReceivedCheckbox = document.getElementById("editBPAReceived");
  if (!badgeCounter) return;

  const dateVal = bpaDateInput?.value;
  if (!dateVal) {
    badgeCounter.className = "badge badge-gray font-mono";
    badgeCounter.style.fontSize = "0.75rem";
    badgeCounter.style.padding = "2px 8px";
    badgeCounter.textContent = "⏱️ No date";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = getWorkingDaysBetween(dateVal, today);
  const daysText = `${days} ${days === 1 ? 'day' : 'days'}`;

  const isConfirmed = Boolean(editBPAReceivedCheckbox?.checked);
  if (isConfirmed) {
    badgeCounter.className = "badge badge-teal font-mono";
    badgeCounter.style.fontSize = "0.75rem";
    badgeCounter.style.padding = "2px 8px";
    badgeCounter.textContent = `🟢 Confirmed (${daysText})`;
  } else {
    const badgeClass = (days > 5) ? "badge badge-rose font-mono" : "badge badge-amber font-mono";
    badgeCounter.className = badgeClass;
    badgeCounter.style.fontSize = "0.75rem";
    badgeCounter.style.padding = "2px 8px";
    badgeCounter.textContent = `⏱️ ${daysText} in BPA`;
  }
}

function updateBPAPillStates(isBPA, isForecastActive) {
  // Update header bpa pills visibility
  const bpaHdr = document.getElementById("btnGroupBPAHeader");
  if (bpaHdr) {
    bpaHdr.style.display = isForecastActive ? "inline-flex" : "none";
  }

  // Update header bpa buttons
  document.querySelectorAll(".bpa-pill-group .stage-btn-pill, #btnGroupBPAPills .stage-btn-pill").forEach(btn => {
    const isConfBtn = btn.dataset.bpa === "true" || btn.dataset.bpa === "1";
    const isWaitBtn = btn.dataset.bpa === "false" || btn.dataset.bpa === "0";
    if (isConfBtn) btn.classList.toggle("active", Boolean(isBPA && isForecastActive));
    if (isWaitBtn) btn.classList.toggle("active", Boolean(!isBPA && isForecastActive));
  });

  const editOfferStatusSelect = document.getElementById("editOfferStatus");
  const badgeGroupNego = document.getElementById("badgeGroupNego");
  if (badgeGroupNego && editOfferStatusSelect?.value === "Forecast") {
    badgeGroupNego.className = "badge badge-forecast";
    badgeGroupNego.textContent = isBPA ? "Forecast (BPA ✓)" : "Forecast (Awaiting BPA)";
  }

  updateBPACounterDisplay();
  initLucide();
}

function openDrawer(deal) {
  currentDrawerDeal = deal;
  adminForceUnlock = false;
  document.getElementById("editDealId").value = deal.id;
  document.getElementById("drawerSupplierTitle").textContent = deal.supplier || `Deal #${deal.id}`;
  document.getElementById("drawerBuyerBadge").textContent = `👤 ${deal.buyer}`;
  document.getElementById("drawerProspectorBadge").textContent = `🔍 ${deal.prospector || "No Prospector"}`;
  document.getElementById("drawerCategoryBadge").textContent = `🏷️ ${getProductCategoryLabel(deal.product_range)}`;

  updateDrawerDelayDisplay(deal);
  document.getElementById("drawerStatusBadge").textContent = getStageLabel(deal);

  // Author labels
  const authorBadge = document.getElementById("commentAuthorBadge");
  if (authorBadge) authorBadge.textContent = currentUser;
  const authorLabel = document.getElementById("currentCommentAuthorLabel");
  if (authorLabel) authorLabel.textContent = currentUser;

  // Group 1: Sourcing & Supplier fields
  let affStatus = deal.affaire_status || "Prenego";
  if (affStatus === "Rejetée") affStatus = "Closed";
  document.getElementById("editAffaireStatus").value = affStatus;

  // Stage 1 Header Buttons & Notice
  document.querySelectorAll("#btnGroupAffaireStatus .stage-btn-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.aff === affStatus);
  });
  const boxDD = document.getElementById("boxDDDateNotice");
  if (boxDD) boxDD.style.display = (affStatus === "DD") ? "block" : "none";

  const dateDDEl = document.getElementById("editDateDD");
  if (dateDDEl) {
    dateDDEl.value = deal.dd_date || (deal.affaire_status === "DD" ? deal.entry_date : "") || "";
  }

  document.getElementById("editEntryDate").value = deal.entry_date || "";
  document.getElementById("editBuyer").value = deal.buyer || "Hamid AIT TAGADIRTE";
  document.getElementById("editProspector").value = deal.prospector || "";
  document.getElementById("editSupplierType").value = deal.supplier_type || "Actif";
  document.getElementById("editSupplier").value = deal.supplier || "";
  document.getElementById("editCategory").value = deal.product_range || "Lingerie";
  document.getElementById("editProduct").value = deal.product || "";

  // Group 2: Offer fields
  const hasOffer = Boolean(
    (deal.offer_number && String(deal.offer_number).trim() !== "") ||
    (deal.offer_date && String(deal.offer_date).trim() !== "") ||
    (parseFloat(deal.offer_value) > 0) ||
    (deal.offer_status && deal.offer_status !== "")
  );

  const checkOfferReceived = document.getElementById("editCheckOfferReceived");
  const badgeOfferReceived = document.getElementById("badgeOfferReceivedState");
  const badgeOfferReceivedInline = document.getElementById("badgeOfferReceivedInline");
  const offerFieldsContainer = document.getElementById("offerFieldsContainer");

  if (checkOfferReceived) checkOfferReceived.checked = hasOffer;
  const offerText = hasOffer ? "Offer Received ✓" : "No offer";
  const offerClass = hasOffer ? "badge badge-primary" : "badge badge-gray";
  if (badgeOfferReceived) {
    badgeOfferReceived.className = offerClass;
    badgeOfferReceived.textContent = offerText;
  }
  if (badgeOfferReceivedInline) {
    badgeOfferReceivedInline.className = offerClass;
    badgeOfferReceivedInline.textContent = offerText;
  }
  if (offerFieldsContainer) {
    offerFieldsContainer.style.display = hasOffer ? "block" : "none";
  }

  // Stage 2 Header: Waiting Offer badge with working days calculation & Offer Received pill checkbox
  const todayStr = new Date().toISOString().split("T")[0];
  const refDateDD = deal.dd_date || (affStatus === "DD" ? deal.entry_date : "") || deal.entry_date;
  const ddWaitDays = refDateDD ? getWorkingDaysBetween(refDateDD, todayStr) : 0;
  const txtStage2Days = document.getElementById("txtStage2Days");
  if (txtStage2Days) txtStage2Days.textContent = ddWaitDays;

  const badgeStage2Waiting = document.getElementById("badgeStage2Waiting");
  if (badgeStage2Waiting) {
    badgeStage2Waiting.style.display = (affStatus === "DD" && !hasOffer) ? "inline-flex" : "none";
  }

  const lblOfferHeader = document.getElementById("lblOfferReceivedHeader");
  if (lblOfferHeader) lblOfferHeader.classList.toggle("active", hasOffer);

  document.getElementById("editOfferDate").value = deal.offer_date || "";
  document.getElementById("editOfferNumber").value = deal.offer_number || "";
  document.getElementById("editOfferValue").value = deal.offer_value || "";

  // Group 3: Negotiation & Forecast
  const isOrdered = deal.offer_status === "Commandé" || (deal.order_value > 0 && deal.offer_status !== "Closed" && deal.offer_status !== "Perdue");
  const isLost = deal.offer_status === "Closed" || deal.offer_status === "Perdue";
  const isForecast = deal.offer_status === "Negociée + BPA" || deal.offer_status === "Negociée en attente BPA" || deal.offer_status === "Forecast" || Boolean(deal.bpa_received && !isOrdered && !isLost);

  const editOfferStatusSelect = document.getElementById("editOfferStatus");
  const editForecastValInput = document.getElementById("editForecastValue");
  const bpaCheck = document.getElementById("editBPAReceived");
  const editBPADate = document.getElementById("editBPADate");

  if (bpaCheck) {
    bpaCheck.checked = Boolean(deal.bpa_received || deal.offer_status === "Negociée + BPA");
  }

  if (editBPADate) {
    editBPADate.value = deal.bpa_date || (isForecast ? (deal.offer_date || todayStr) : "") || "";
  }

  if (editForecastValInput) {
    const fv = parseFloat(deal.forecast_value);
    editForecastValInput.value = (fv > 0) ? deal.forecast_value : (deal.offer_value || "");
  }

  if (editOfferStatusSelect) {
    if (!hasOffer) {
      editOfferStatusSelect.value = "";
    } else if (isOrdered) {
      editOfferStatusSelect.value = "Commandé";
    } else if (isLost) {
      editOfferStatusSelect.value = "Closed";
    } else if (isForecast) {
      editOfferStatusSelect.value = "Forecast";
    } else if (deal.offer_status === "Re-valorisation") {
      editOfferStatusSelect.value = "Re-valorisation";
    } else if (deal.offer_status === "Negociation") {
      editOfferStatusSelect.value = "Negociation";
    } else {
      editOfferStatusSelect.value = "Negociation";
    }
  }

  const badgeGroupNego = document.getElementById("badgeGroupNego");
  if (badgeGroupNego) {
    if (!hasOffer) {
      badgeGroupNego.className = "badge badge-gray";
      badgeGroupNego.textContent = "—";
    } else if (isOrdered) {
      badgeGroupNego.className = "badge badge-ordered";
      badgeGroupNego.textContent = "Ordered Won 🟢";
    } else if (isLost) {
      badgeGroupNego.className = "badge badge-rose";
      badgeGroupNego.textContent = "Closed ❌";
    } else if (isForecast) {
      badgeGroupNego.className = "badge badge-forecast";
      badgeGroupNego.textContent = bpaCheck?.checked ? "Forecast (BPA ✓)" : "Forecast (Awaiting BPA)";
    } else if (deal.offer_status === "Negociation") {
      badgeGroupNego.className = "badge badge-amber";
      badgeGroupNego.textContent = "In Negotiation";
    } else if (deal.offer_status === "Re-valorisation") {
      badgeGroupNego.className = "badge badge-purple";
      badgeGroupNego.textContent = "Re-valuation";
    } else {
      badgeGroupNego.className = "badge badge-gray";
      badgeGroupNego.textContent = "In Negotiation";
    }
  }

  // Stage 3 Header Buttons & BPA Pill Group
  const pillGroupNego = document.getElementById("btnGroupOfferStatusPills");
  if (pillGroupNego) {
    pillGroupNego.classList.toggle("is-disabled", !hasOffer);
  }

  document.querySelectorAll("#btnGroupOfferStatusPills .stage-btn-pill").forEach(btn => {
    const ost = btn.dataset.offerStatus;
    if (!hasOffer) {
      btn.classList.remove("active");
    } else if (ost === "In Negotiation" || ost === "Negociation") {
      btn.classList.toggle("active", deal.offer_status === "Negociation" || (!deal.offer_status && hasOffer));
    } else if (ost === "Forecast") {
      btn.classList.toggle("active", isForecast);
    } else if (ost === "Re-val" || ost === "Re-valorisation") {
      btn.classList.toggle("active", deal.offer_status === "Re-valorisation");
    }
  });

  const hasBPA = Boolean(deal.bpa_received || deal.offer_status === "Negociée + BPA");
  updateBPAPillStates(hasBPA, hasOffer && isForecast);

  // Group 4: Outcome & Order
  const checkOrdered = document.getElementById("editCheckOrdered");
  const checkLost = document.getElementById("editCheckLost");
  const orderFieldsContainer = document.getElementById("orderFieldsContainer");

  if (checkOrdered) checkOrdered.checked = hasOffer && isOrdered;
  if (checkLost) checkLost.checked = hasOffer && isLost;
  if (orderFieldsContainer) orderFieldsContainer.style.display = (hasOffer && isOrdered) ? "block" : "none";

  const ordValEl = document.getElementById("editOrderValue");
  if (ordValEl) {
    if (deal.order_value && parseFloat(deal.order_value) > 0) {
      ordValEl.value = deal.order_value;
    } else if (hasOffer && isOrdered) {
      const fVal = (deal.forecast_value && parseFloat(deal.forecast_value) > 0) ? deal.forecast_value : (deal.offer_value || "");
      ordValEl.value = fVal || "";
    } else {
      ordValEl.value = "";
    }
    ordValEl.disabled = false;
    ordValEl.classList.remove("field-locked");
  }
  document.getElementById("editMarginValue").value = deal.margin_value || "";
  document.getElementById("editOrderDate").value = deal.order_date || "";
  updateDrawerMarginDisplay();

  const badgeGroupOutcome = document.getElementById("badgeGroupOutcome");
  if (badgeGroupOutcome) {
    if (!hasOffer) {
      badgeGroupOutcome.className = "badge badge-gray";
      badgeGroupOutcome.textContent = "In Progress";
    } else if (isOrdered) {
      badgeGroupOutcome.className = "badge badge-ordered";
      badgeGroupOutcome.textContent = "🟢 Ordered Won";
    } else if (isLost) {
      badgeGroupOutcome.className = "badge badge-rose";
      badgeGroupOutcome.textContent = "❌ Lost / Closed";
    } else {
      badgeGroupOutcome.className = "badge badge-gray";
      badgeGroupOutcome.textContent = "In Progress";
    }
  }

  // Stage 4 Header Outcome Buttons
  const pillGroupOutcome = document.getElementById("btnGroupOutcomePills");
  if (pillGroupOutcome) {
    pillGroupOutcome.classList.toggle("is-disabled", !hasOffer);
  }

  document.querySelectorAll("#btnGroupOutcomePills .stage-btn-pill").forEach(btn => {
    if (!hasOffer) {
      btn.classList.remove("active");
    } else {
      if (btn.dataset.outcome === "won") btn.classList.toggle("active", isOrdered);
      if (btn.dataset.outcome === "lost") btn.classList.toggle("active", isLost);
    }
  });

  // Render comments
  renderCommentLogs(deal.notes);
  updateAdminUI();

  // Admin emergency unlock visibility
  const adminUnlockBox = document.getElementById("drawerAdminUnlockBox");
  if (adminUnlockBox) {
    adminUnlockBox.style.display = isAdmin() ? "flex" : "none";
  }

  // Apply Progressive Stage Locking
  updateDrawerLockingState(deal, false);

  // Smart Stage Focus: keep locked groups closed, open only current active stage!
  applyAccordionStageFocus(deal, adminForceUnlock);

  document.getElementById("drawerOverlay").classList.add("open");
  initLucide();
}

function renderCommentLogs(notes, filter = currentTimelineFilter) {
  currentTimelineFilter = filter;
  const container = document.getElementById("commentsLogList");
  if (!container) return;
  container.innerHTML = "";

  const rawLines = notes ? notes.split("\n").map(l => l.trim()).filter(Boolean) : [];
  
  const parsedItems = rawLines.map(line => {
    const match = line.match(/^\[(.*?)\s*·\s*(.*?)\]:\s*(.*)$/);
    if (match) {
      const timeStr = match[1];
      const author = match[2];
      const text = match[3];

      const isStatusUpdate = text.startsWith("🔄") ||
        text.toLowerCase().includes("status:") ||
        text.toLowerCase().includes("statut:") ||
        text.toLowerCase().includes("stage:") ||
        text.toLowerCase().includes("étape:") ||
        text.toLowerCase().includes("deal created") ||
        text.toLowerCase().includes("création") ||
        text.toLowerCase().includes("bpa received:") ||
        text.includes("➔");

      return {
        isStructured: true,
        type: isStatusUpdate ? "status" : "comment",
        timeStr,
        author,
        text,
        raw: line
      };
    } else {
      const isStatusUpdate = line.toLowerCase().includes("status:") ||
        line.toLowerCase().includes("statut:") ||
        line.startsWith("🔄") ||
        line.includes("➔");

      return {
        isStructured: false,
        type: isStatusUpdate ? "status" : "comment",
        timeStr: "",
        author: "System",
        text: line,
        raw: line
      };
    }
  });

  // Calculate counts
  const countAll = parsedItems.length;
  const countStatus = parsedItems.filter(i => i.type === "status").length;
  const countComments = parsedItems.filter(i => i.type === "comment").length;

  // Update badge counters
  const cAllEl = document.getElementById("countFilterAll");
  const cStatusEl = document.getElementById("countFilterStatus");
  const cCommentsEl = document.getElementById("countFilterComments");
  if (cAllEl) cAllEl.textContent = countAll;
  if (cStatusEl) cStatusEl.textContent = countStatus;
  if (cCommentsEl) cCommentsEl.textContent = countComments;

  // Populate Pinned Follow-up Reminder Card (inspired by screenshot)
  const pinnedCard = document.getElementById("pinnedFollowupCard");
  const txtFollowupDateBadge = document.getElementById("txtFollowupDateBadge");
  const txtFollowupDesc = document.getElementById("txtFollowupDesc");
  if (pinnedCard && txtFollowupDateBadge && txtFollowupDesc) {
    const reminderItem = parsedItems.find(item => 
      item.type === "comment" && (
        item.text.toLowerCase().includes("relance") ||
        item.text.toLowerCase().includes("follow-up") ||
        item.text.toLowerCase().includes("rappel") ||
        item.text.toLowerCase().includes("attente") ||
        item.text.toLowerCase().includes("scheduled") ||
        item.text.toLowerCase().includes("bpa")
      )
    ) || parsedItems.find(item => item.type === "comment");

    if (reminderItem) {
      pinnedCard.style.display = "flex";
      txtFollowupDateBadge.textContent = reminderItem.timeStr ? reminderItem.timeStr.split(" ")[0] : "ACTIVE";
      txtFollowupDesc.textContent = reminderItem.text;
    } else {
      pinnedCard.style.display = "none";
    }
  }

  // Update active state on filter buttons
  document.querySelectorAll(".timeline-filter-btn").forEach(btn => {
    if (btn.dataset.timelineFilter === currentTimelineFilter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Filter items
  const filteredItems = parsedItems.filter(item => {
    if (currentTimelineFilter === "status") return item.type === "status";
    if (currentTimelineFilter === "comments") return item.type === "comment";
    return true; // 'all'
  });

  if (filteredItems.length === 0) {
    if (currentTimelineFilter === "status") {
      container.innerHTML = `
        <div class="comments-log-empty">
          <i data-lucide="refresh-cw" style="width:22px; height:22px; opacity:0.4; margin-bottom:6px;"></i>
          <div>No status changes recorded for this deal.</div>
        </div>`;
    } else if (currentTimelineFilter === "comments") {
      container.innerHTML = `
        <div class="comments-log-empty">
          <i data-lucide="message-square" style="width:22px; height:22px; opacity:0.4; margin-bottom:6px;"></i>
          <div>No comments or notes added yet.</div>
          <div style="font-size:0.72rem; color:var(--text-dim); margin-top:3px;">Write a note below to start the conversation.</div>
        </div>`;
    } else {
      container.innerHTML = `
        <div class="comments-log-empty">
          <i data-lucide="inbox" style="width:22px; height:22px; opacity:0.4; margin-bottom:6px;"></i>
          <div>No activity or notes recorded yet.</div>
        </div>`;
    }
    initLucide();
    return;
  }

  filteredItems.forEach(item => {
    const el = document.createElement("div");
    el.className = "log-item";

    if (item.type === "status") {
      el.classList.add("log-item-status-change");
      let contentHtml = escapeHtml(item.text);
      if (item.text.startsWith("🔄")) {
        const detail = item.text.replace(/^🔄\s*/, "");
        const parts = detail.split(" | ");
        const formattedParts = parts.map(p => {
          if (p.includes("➔")) {
            const [k, v] = p.split(/:\s*/);
            return `<div style="margin:2px 0;"><span style="color:var(--text-dim); font-weight:600;">${escapeHtml(k || '')}:</span> <span style="font-weight:700; color:var(--primary); font-family:var(--font-mono, monospace);">${escapeHtml(v || '')}</span></div>`;
          }
          return `<div style="margin:2px 0;">${escapeHtml(p)}</div>`;
        }).join("");
        contentHtml = formattedParts || escapeHtml(detail);
      }

      el.innerHTML = `
        <div class="log-item-header">
          <span class="log-author-tag log-author-system">
            <i data-lucide="refresh-cw" style="width:12px; height:12px;"></i>
            <span>${escapeHtml(item.author)} (Status Change)</span>
          </span>
          <span class="log-timestamp">${escapeHtml(item.timeStr)}</span>
        </div>
        <div class="log-item-text" style="font-size:0.74rem; color:var(--text-main); margin-top:2px;">${contentHtml}</div>
      `;
    } else {
      el.classList.add("log-item-comment");
      el.innerHTML = `
        <div class="log-item-header">
          <span class="log-author-tag" style="color:var(--brand-teal);">
            <i data-lucide="${item.author === 'Toby' ? 'crown' : 'message-square'}" style="width:12px; height:12px;"></i>
            <span>${escapeHtml(item.author)}</span>
          </span>
          <span class="log-timestamp">${escapeHtml(item.timeStr)}</span>
        </div>
        <div class="log-item-text" style="font-size:0.77rem; line-height:1.4; color:var(--text-main); margin-top:2px; white-space:pre-wrap;">${escapeHtml(item.text)}</div>
      `;
    }

    container.appendChild(el);
  });

  initLucide();
}

// ── 12. MODALS & DRAWER INTERACTIONS ──────────────────────────────────────
function initModalsAndDrawer() {
  const addModal = document.getElementById("addDetectionModal");
  const addForm = document.getElementById("addDetectionForm");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const settingsModal = document.getElementById("settingsModal");

  // 1. Open Add Detection Modal
  const btnOpenAdd = document.getElementById("btnOpenAddModal");
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener("click", () => {
      addForm.reset();
      document.getElementById("addEntryDate").value = new Date().toISOString().split("T")[0];
      const addBuyerEl = document.getElementById("addBuyer");
      if (addBuyerEl) {
        if (isBuyerUser()) {
          addBuyerEl.value = currentUser;
          addBuyerEl.disabled = true;
          addBuyerEl.style.opacity = "0.75";
          addBuyerEl.style.cursor = "not-allowed";
        } else {
          addBuyerEl.disabled = false;
          addBuyerEl.style.opacity = "1";
          addBuyerEl.style.cursor = "default";
        }
      }
      addModal.classList.add("open");
      initLucide();
    });
  }

  const btnCloseAdd = document.getElementById("btnCloseAddModal");
  if (btnCloseAdd) btnCloseAdd.addEventListener("click", () => addModal.classList.remove("open"));
  const btnCancelAdd = document.getElementById("btnCancelAddModal");
  if (btnCancelAdd) btnCancelAdd.addEventListener("click", () => addModal.classList.remove("open"));

  // Submit Add Form
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newDeal = {
        id: null,
        entry_date: document.getElementById("addEntryDate").value,
        buyer: isBuyerUser() ? currentUser : document.getElementById("addBuyer").value,
        prospector: document.getElementById("addProspector").value.trim(),
        supplier: document.getElementById("addSupplier").value.trim(),
        supplier_type: document.getElementById("addSupplierType").value,
        product: document.getElementById("addProduct").value.trim(),
        product_range: document.getElementById("addCategory").value,
        affaire_status: "Prenego",
        dd_date: null,
        offer_date: null,
        offer_number: null,
        offer_value: 0,
        forecast_value: 0,
        offer_status: "",
        bpa_received: false,
        order_value: 0,
        margin_value: 0,
        margin_rate: 0,
        order_date: null,
        notes: `[${new Date().toISOString().split("T")[0]} ${new Date().toTimeString().substring(0, 5)} · ${currentUser}]: ${document.getElementById("addNotes").value.trim() || 'Deal created'}`,
        team: "Morocco"
      };

      await saveDealRecord(newDeal);
      recordAuditLog("Deal Sourced", newDeal.supplier, `New deal sourced · Buyer: ${newDeal.buyer} · Entered by ${currentUser}`, newDeal.id);
      addModal.classList.remove("open");
      showToast("Deal Saved", `${newDeal.supplier} added to pipeline.`);
    });
  }

  const editAffaireSelect = document.getElementById("editAffaireStatus");
  const editDateDDInput = document.getElementById("editDateDD");
  if (editAffaireSelect && editDateDDInput) {
    editAffaireSelect.addEventListener("change", () => {
      const affVal = editAffaireSelect.value;
      if (affVal === "DD" && !editDateDDInput.value) {
        editDateDDInput.value = new Date().toISOString().split("T")[0];
      }
      document.querySelectorAll("#btnGroupAffaireStatus .stage-btn-pill").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.aff === affVal);
      });
      const boxDD = document.getElementById("boxDDDateNotice");
      if (boxDD) boxDD.style.display = (affVal === "DD") ? "block" : "none";

      const hasOffer = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
      const badgeWait = document.getElementById("badgeStage2Waiting");
      if (badgeWait) {
        badgeWait.style.display = (affVal === "DD" && !hasOffer) ? "inline-flex" : "none";
        if (affVal === "DD" && !hasOffer) {
          const todayStr = new Date().toISOString().split("T")[0];
          const refDateDD = editDateDDInput.value || todayStr;
          const ddWaitDays = getWorkingDaysBetween(refDateDD, todayStr);
          const txtStage2Days = document.getElementById("txtStage2Days");
          if (txtStage2Days) txtStage2Days.textContent = ddWaitDays;
        }
      }

      const bSourcing = document.getElementById("badgeGroupSourcing");
      if (bSourcing && !hasOffer) {
        bSourcing.className = (affVal === "DD") ? "badge badge-primary font-mono" : "badge badge-primary";
        bSourcing.textContent = affVal;
      }

      if (currentDrawerDeal) {
        updateDrawerDelayDisplay(currentDrawerDeal);
      }
    });
  }

  // Offer Received Toggle, BPA, Ordered & Lost Action Listeners
  const editCheckOfferReceived = document.getElementById("editCheckOfferReceived");
  const badgeOfferReceivedState = document.getElementById("badgeOfferReceivedState");
  const offerFieldsContainer = document.getElementById("offerFieldsContainer");
  const editOfferStatusSelect = document.getElementById("editOfferStatus");
  const boxBPAReceived = document.getElementById("boxBPAReceived");
  const editBPAReceivedCheckbox = document.getElementById("editBPAReceived");
  const editCheckOrdered = document.getElementById("editCheckOrdered");
  const editCheckLost = document.getElementById("editCheckLost");
  const orderFieldsContainer = document.getElementById("orderFieldsContainer");

  function updateOutcomePillStates() {
    const isWon = Boolean(document.getElementById("editCheckOrdered")?.checked);
    const isLost = Boolean(document.getElementById("editCheckLost")?.checked);
    document.querySelectorAll("#btnGroupOutcomePills .stage-btn-pill").forEach(btn => {
      if (btn.dataset.outcome === "won") btn.classList.toggle("active", isWon);
      if (btn.dataset.outcome === "lost") btn.classList.toggle("active", isLost);
    });
  }

  // 1. Offer Received Toggle Listener
  if (editCheckOfferReceived) {
    editCheckOfferReceived.addEventListener("change", () => {
      const isRcv = editCheckOfferReceived.checked;
      if (offerFieldsContainer) offerFieldsContainer.style.display = isRcv ? "block" : "none";
      
      const badgeText = isRcv ? "Offer Received ✓" : "No offer";
      const badgeClass = isRcv ? "badge badge-primary" : "badge badge-gray";
      if (badgeOfferReceivedState) {
        badgeOfferReceivedState.className = badgeClass;
        badgeOfferReceivedState.textContent = badgeText;
      }
      const inlineBadge = document.getElementById("badgeOfferReceivedInline");
      if (inlineBadge) {
        inlineBadge.className = badgeClass;
        inlineBadge.textContent = badgeText;
      }

      // Sync Stage 2 Header controls
      const lblOfferHeader = document.getElementById("lblOfferReceivedHeader");
      if (lblOfferHeader) lblOfferHeader.classList.toggle("active", isRcv);

      const affVal = document.getElementById("editAffaireStatus")?.value;
      const badgeWait = document.getElementById("badgeStage2Waiting");
      if (badgeWait) badgeWait.style.display = (affVal === "DD" && !isRcv) ? "inline-flex" : "none";

      const pillGroupNego = document.getElementById("btnGroupOfferStatusPills");
      const pillGroupOutcome = document.getElementById("btnGroupOutcomePills");

      if (isRcv) {
        // Unlock Stage 3 & 4 pill groups
        if (pillGroupNego) pillGroupNego.classList.remove("is-disabled");
        if (pillGroupOutcome) pillGroupOutcome.classList.remove("is-disabled");

        // RULE 1: If offer received, DD MUST be done!
        const editAffSelect = document.getElementById("editAffaireStatus");
        if (editAffSelect && editAffSelect.value !== "DD") {
          editAffSelect.value = "DD";
          editAffSelect.dispatchEvent(new Event("change"));
          showToast("Progression Rule", "Deal Sourcing Stage automatically set to 'Sent Affaire DD' (DD done).");
        }
        const dateDDInput = document.getElementById("editDateDD");
        if (dateDDInput && !dateDDInput.value) {
          const entryDate = document.getElementById("editEntryDate")?.value;
          dateDDInput.value = entryDate || new Date().toISOString().split("T")[0];
        }

        const dateInput = document.getElementById("editOfferDate");
        if (dateInput && !dateInput.value) {
          dateInput.value = new Date().toISOString().split("T")[0];
        }
        if (editOfferStatusSelect && !editOfferStatusSelect.value) {
          editOfferStatusSelect.value = "Negociation";
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        } else if (editOfferStatusSelect && editOfferStatusSelect.value) {
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }
        const offVal = document.getElementById("editOfferValue")?.value;
        const fInput = document.getElementById("editForecastValue");
        if (fInput && (!fInput.value || parseFloat(fInput.value) <= 0) && offVal) {
          fInput.value = offVal;
        }

        // Auto open Stage 2 and Stage 3
        const g2 = document.getElementById("groupOfferDetails");
        if (g2) g2.classList.add("open");
        const g3 = document.getElementById("groupNegotiationForecast") || document.getElementById("groupNegoForecast");
        if (g3) g3.classList.add("open");
      } else {
        // If unchecking offer received: disable Stage 3 & 4, clear forecast/order
        if (pillGroupNego) pillGroupNego.classList.add("is-disabled");
        if (pillGroupOutcome) pillGroupOutcome.classList.add("is-disabled");
        document.querySelectorAll("#btnGroupOfferStatusPills .stage-btn-pill, #btnGroupOutcomePills .stage-btn-pill").forEach(p => p.classList.remove("active"));

        const badgeGroupNego = document.getElementById("badgeGroupNego");
        if (badgeGroupNego) {
          badgeGroupNego.className = "badge badge-gray";
          badgeGroupNego.textContent = "—";
        }
        const badgeGroupOutcome = document.getElementById("badgeGroupOutcome");
        if (badgeGroupOutcome) {
          badgeGroupOutcome.className = "badge badge-gray";
          badgeGroupOutcome.textContent = "In Progress";
        }

        if (editCheckOrdered) editCheckOrdered.checked = false;
        if (editCheckLost) editCheckLost.checked = false;
        if (orderFieldsContainer) orderFieldsContainer.style.display = "none";
        if (editOfferStatusSelect) {
          editOfferStatusSelect.value = "";
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }
        const fInput = document.getElementById("editForecastValue");
        if (fInput) fInput.value = "";
        if (editBPAReceivedCheckbox) {
          editBPAReceivedCheckbox.checked = false;
          editBPAReceivedCheckbox.dispatchEvent(new Event("change"));
        }

        // If DD, all 4 groups closed
        if (affVal === "DD") {
          const g1 = document.getElementById("groupSourcingSupplier");
          const g2 = document.getElementById("groupOfferDetails");
          const g3 = document.getElementById("groupNegotiationForecast") || document.getElementById("groupNegoForecast");
          const g4 = document.getElementById("groupOutcomeOrder");
          [g1, g2, g3, g4].forEach(g => { if (g) g.classList.remove("open"); });
        }
      }

      if (currentDrawerDeal) {
        updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
      }
      initLucide();
    });
  }

  // 2. Offer Status Change Listener
  if (editOfferStatusSelect) {
    editOfferStatusSelect.addEventListener("change", () => {
      const val = editOfferStatusSelect.value;
      const isOfferRcv = Boolean(document.getElementById("editCheckOfferReceived")?.checked);

      // RULE 2: No forecast without offer reception!
      if ((val === "Forecast" || val === "Negociée + BPA" || val === "Negociée en attente BPA") && !isOfferRcv) {
        showToast("Progression Rule", "No Forecast without Offer Reception. Please check 'Offer Received' and enter the offer details first.", "warning");
        editOfferStatusSelect.value = "";
        return;
      }

      if (val === "Forecast" || val === "Negociation") {
        const offVal = document.getElementById("editOfferValue")?.value;
        const fInput = document.getElementById("editForecastValue");
        if (fInput && (!fInput.value || parseFloat(fInput.value) <= 0) && offVal) {
          fInput.value = offVal;
        }
      }

      if (val === "Negociation" || val === "Re-valorisation") {
        if (editCheckOrdered) editCheckOrdered.checked = false;
        if (editCheckLost) editCheckLost.checked = false;
        if (orderFieldsContainer) orderFieldsContainer.style.display = "none";
      }

      const badgeGroupNego = document.getElementById("badgeGroupNego");
      if (badgeGroupNego) {
        if (val === "Negociation") {
          badgeGroupNego.className = "badge badge-amber";
          badgeGroupNego.textContent = "In Negotiation";
        } else if (val === "Forecast") {
          badgeGroupNego.className = "badge badge-forecast";
          badgeGroupNego.textContent = editBPAReceivedCheckbox?.checked ? "Forecast (BPA ✓)" : "Forecast (Awaiting BPA)";
        } else if (val === "Re-valorisation") {
          badgeGroupNego.className = "badge badge-purple";
          badgeGroupNego.textContent = "Re-valuation";
        } else {
          badgeGroupNego.className = "badge badge-gray";
          badgeGroupNego.textContent = "—";
        }
      }

      // Sync Stage 3 Header pills & BPA visibility
      document.querySelectorAll("#btnGroupOfferStatusPills .stage-btn-pill").forEach(btn => {
        const ost = btn.dataset.offerStatus;
        if (ost === "In Negotiation" || ost === "Negociation") btn.classList.toggle("active", val === "Negociation");
        else if (ost === "Forecast") btn.classList.toggle("active", val === "Forecast" || val.includes("BPA"));
        else if (ost === "Re-val" || ost === "Re-valorisation") btn.classList.toggle("active", val === "Re-valorisation");
      });

      const isForecastVal = (val === "Forecast" || val.includes("BPA"));
      const isBPA = Boolean(editBPAReceivedCheckbox?.checked);
      updateBPAPillStates(isBPA, isForecastVal);

      if (currentDrawerDeal) {
        updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
      }
      initLucide();
    });
  }

  // BPA Received Checkbox Listener
  if (editBPAReceivedCheckbox) {
    editBPAReceivedCheckbox.addEventListener("change", () => {
      const isBPA = Boolean(editBPAReceivedCheckbox.checked);
      const isForecastVal = (editOfferStatusSelect?.value === "Forecast" || editOfferStatusSelect?.value?.includes("BPA"));
      updateBPAPillStates(isBPA, isForecastVal);
    });
  }

  // 3. Ordered (Won) Action Checkbox Listener
  if (editCheckOrdered) {
    editCheckOrdered.addEventListener("change", () => {
      if (editCheckOrdered.checked) {
        const isOfferRcv = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
        // RULE 3: No order without offer and forecast!
        if (!isOfferRcv) {
          showToast("Progression Rule", "No Order without Offer Reception and Forecast. Please complete DD and Offer Reception first.", "warning");
          editCheckOrdered.checked = false;
          return;
        }

        // Validate or ensure Forecast / BPA is completed before order
        if (editBPAReceivedCheckbox) {
          editBPAReceivedCheckbox.checked = true;
          editBPAReceivedCheckbox.dispatchEvent(new Event("change"));
        }
        const fCastInput = document.getElementById("editForecastValue");
        const offValInput = document.getElementById("editOfferValue");
        if (fCastInput && (!fCastInput.value || parseFloat(fCastInput.value) <= 0)) {
          fCastInput.value = offValInput?.value || "0";
        }

        if (editCheckLost) editCheckLost.checked = false;
        if (orderFieldsContainer) orderFieldsContainer.style.display = "block";
        if (editOfferStatusSelect) {
          editOfferStatusSelect.value = "Commandé";
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }

        const ordDateInput = document.getElementById("editOrderDate");
        if (ordDateInput && !ordDateInput.value) {
          ordDateInput.value = new Date().toISOString().split("T")[0];
        }

        const ordValInput = document.getElementById("editOrderValue");
        const fVal = (fCastInput && parseFloat(fCastInput.value) > 0) ? fCastInput.value : (currentDrawerDeal?.forecast_value ? String(currentDrawerDeal.forecast_value) : "");
        const offVal = (offValInput && parseFloat(offValInput.value) > 0) ? offValInput.value : (currentDrawerDeal?.offer_value ? String(currentDrawerDeal.offer_value) : "");

        if (ordValInput) {
          if (!ordValInput.value || parseFloat(ordValInput.value) <= 0) {
            ordValInput.value = fVal || offVal || "";
          }
          ordValInput.disabled = false;
          ordValInput.classList.remove("field-locked");
        }
        updateDrawerMarginDisplay();
      } else {
        if (orderFieldsContainer) orderFieldsContainer.style.display = "none";
        if (editOfferStatusSelect && editOfferStatusSelect.value === "Commandé") {
          editOfferStatusSelect.value = "Forecast";
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }
      }

      const badgeGroupOutcome = document.getElementById("badgeGroupOutcome");
      if (badgeGroupOutcome) {
        badgeGroupOutcome.className = editCheckOrdered.checked ? "badge badge-ordered" : "badge badge-gray";
        badgeGroupOutcome.textContent = editCheckOrdered.checked ? "🟢 Ordered Won" : "In Progress";
      }

      updateOutcomePillStates();

      if (currentDrawerDeal) {
        updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
      }
      initLucide();
    });
  }

  // 4. Lost / Closed Action Checkbox Listener
  if (editCheckLost) {
    editCheckLost.addEventListener("change", () => {
      if (editCheckLost.checked) {
        if (editCheckOrdered) editCheckOrdered.checked = false;
        if (orderFieldsContainer) orderFieldsContainer.style.display = "none";
        if (editOfferStatusSelect) {
          editOfferStatusSelect.value = "Closed";
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }
      } else {
        if (editOfferStatusSelect && editOfferStatusSelect.value === "Closed") {
          editOfferStatusSelect.value = "Negociation";
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }
      }

      const badgeGroupOutcome = document.getElementById("badgeGroupOutcome");
      if (badgeGroupOutcome) {
        badgeGroupOutcome.className = editCheckLost.checked ? "badge badge-rose" : "badge badge-gray";
        badgeGroupOutcome.textContent = editCheckLost.checked ? "❌ Lost / Closed" : "In Progress";
      }

      updateOutcomePillStates();

      if (currentDrawerDeal) {
        updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
      }
      initLucide();
    });
  }

  // ── INTERACTIVE STAGE HEADER BUTTON PILL LISTENERS ─────────────────────────
  // Stage 1 Header Buttons (Lot, Prenego, CRV, DD)
  document.querySelectorAll("#btnGroupAffaireStatus .stage-btn-pill").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const aff = btn.dataset.aff;
      const isAlreadyActive = btn.classList.contains("active");

      if (isAlreadyActive) {
        // Clicking an active Stage 1 choice deselects it!
        btn.classList.remove("active");
        let newAff = "Prenego";
        if (aff === "DD") {
          newAff = "Prenego";
          const dateDDEl = document.getElementById("editDateDD");
          if (dateDDEl) dateDDEl.value = "";
          const boxDD = document.getElementById("boxDDDateNotice");
          if (boxDD) boxDD.style.display = "none";
          const badgeWait = document.getElementById("badgeStage2Waiting");
          if (badgeWait) badgeWait.style.display = "none";
        } else if (aff === "CRV") {
          newAff = "Prenego";
        } else if (aff === "Prenego") {
          newAff = "Lot";
        } else if (aff === "Lot") {
          newAff = "Prenego";
        }
        if (editAffaireSelect) {
          editAffaireSelect.value = newAff;
          editAffaireSelect.dispatchEvent(new Event("change"));
        }
        const g1 = document.getElementById("groupSourcingSupplier");
        if (g1) g1.classList.add("open");
        if (currentDrawerDeal) {
          updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
          updateDrawerDelayDisplay(currentDrawerDeal);
        }
        return;
      }

      if (editAffaireSelect) {
        editAffaireSelect.value = aff;
        editAffaireSelect.dispatchEvent(new Event("change"));
      }
      const hasOfferNow = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
      const g1 = document.getElementById("groupSourcingSupplier");
      const g2 = document.getElementById("groupOfferDetails");
      const g3 = document.getElementById("groupNegotiationForecast") || document.getElementById("groupNegoForecast");
      const g4 = document.getElementById("groupOutcomeOrder");

      if (aff === "DD" && !hasOfferNow) {
        // ONCE DD IS SENT AND UNTIL OFFER IS RECEIVED:
        // All 4 groups stay cleanly closed, exactly matching user screenshot!
        [g1, g2, g3, g4].forEach(g => { if (g) g.classList.remove("open"); });

        // Ensure Stage 3 & 4 buttons are disabled
        const pillGroupNego = document.getElementById("btnGroupOfferStatusPills");
        if (pillGroupNego) pillGroupNego.classList.add("is-disabled");
        const pillGroupOutcome = document.getElementById("btnGroupOutcomePills");
        if (pillGroupOutcome) pillGroupOutcome.classList.add("is-disabled");
        document.querySelectorAll("#btnGroupOfferStatusPills .stage-btn-pill, #btnGroupOutcomePills .stage-btn-pill").forEach(p => p.classList.remove("active"));

        const bSourcing = document.getElementById("badgeGroupSourcing");
        if (bSourcing) {
          bSourcing.className = "badge badge-primary font-mono";
          bSourcing.textContent = "DD";
        }
        const bNego = document.getElementById("badgeGroupNego");
        if (bNego) {
          bNego.className = "badge badge-gray";
          bNego.textContent = "—";
        }
        const bOutcome = document.getElementById("badgeGroupOutcome");
        if (bOutcome) {
          bOutcome.className = "badge badge-gray";
          bOutcome.textContent = "In Progress";
        }
      } else if (aff !== "DD" && !hasOfferNow) {
        // Lot / Prenego / CRV: open group 1 to allow editing sourcing info
        if (g1) g1.classList.add("open");
        [g2, g3, g4].forEach(g => { if (g) g.classList.remove("open"); });
      }
    });
  });

  // Stage 2 Header Offer Received Checkbox & Label
  const lblOfferHeader = document.getElementById("lblOfferReceivedHeader");
  if (lblOfferHeader) {
    lblOfferHeader.addEventListener("click", (e) => e.stopPropagation());
  }

  // Stage 3 Header Negotiation / Forecast / Re-val Buttons
  document.querySelectorAll("#btnGroupOfferStatusPills .stage-btn-pill").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const st = btn.dataset.offerStatus;
      const isOfferRcv = Boolean(document.getElementById("editCheckOfferReceived")?.checked);

      if (!isOfferRcv) {
        if (st === "Negociation" || st === "In Negotiation") {
          // Auto-check Offer Received, satisfying Rule 1 (DD done) and opening Stage 2 & 3
          const chkOffer = document.getElementById("editCheckOfferReceived");
          if (chkOffer) {
            chkOffer.checked = true;
            chkOffer.dispatchEvent(new Event("change"));
          }
          return;
        } else {
          showToast("Progression Rule", "No Forecast or Re-valuation without Offer Reception. Please check 'Offer Received' and enter offer details first.", "warning");
          return;
        }
      }

      const isAlreadyActive = btn.classList.contains("active");
      if (isAlreadyActive) {
        // Clicking active Stage 3 choice deselects it!
        btn.classList.remove("active");
        if (editOfferStatusSelect) {
          if (st === "Forecast" || st === "Re-val" || st === "Re-valorisation") {
            // Deselect Forecast or Re-val -> revert to In Negotiation
            editOfferStatusSelect.value = "Negociation";
          } else {
            // Deselect In Negotiation -> clear offer status
            editOfferStatusSelect.value = "";
          }
          editOfferStatusSelect.dispatchEvent(new Event("change"));
        }
        if (currentDrawerDeal) {
          updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
          updateDrawerDelayDisplay(currentDrawerDeal);
        }
        return;
      }

      if (editOfferStatusSelect) {
        if (st === "In Negotiation" || st === "Negociation") editOfferStatusSelect.value = "Negociation";
        else if (st === "Forecast") editOfferStatusSelect.value = "Forecast";
        else if (st === "Re-val" || st === "Re-valorisation") editOfferStatusSelect.value = "Re-valorisation";
        editOfferStatusSelect.dispatchEvent(new Event("change"));
      }
    });
  });

  // Stage 3 BPA Buttons (Header)
  document.querySelectorAll(".bpa-pill-group .stage-btn-pill, #btnGroupBPAPills .stage-btn-pill").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOfferRcv = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
      if (!isOfferRcv) {
        showToast("Progression Rule", "BPA status is only available for deals with an Offer Received and in Forecast.", "warning");
        return;
      }

      const isAlreadyActive = btn.classList.contains("active");
      const targetIsBPA = (btn.dataset.bpa === "true" || btn.dataset.bpa === "1");
      const editBPADateInput = document.getElementById("editBPADate");
      const todayIso = new Date().toISOString().split("T")[0];

      if (isAlreadyActive) {
        // Clicking active BPA choice deselects it!
        btn.classList.remove("active");
        if (targetIsBPA) {
          // Deselected BPA Confirmed -> revert to Awaiting BPA
          if (editBPAReceivedCheckbox) {
            editBPAReceivedCheckbox.checked = false;
            editBPAReceivedCheckbox.dispatchEvent(new Event("change"));
          }
        } else {
          // Deselected Awaiting BPA -> revert deal to In Negotiation
          if (editOfferStatusSelect) {
            editOfferStatusSelect.value = "Negociation";
            editOfferStatusSelect.dispatchEvent(new Event("change"));
          }
        }
        updateBPACounterDisplay();
        return;
      }

      // If deal is not yet marked as Forecast, ensure Forecast is selected
      if (editOfferStatusSelect && editOfferStatusSelect.value !== "Forecast") {
        editOfferStatusSelect.value = "Forecast";
        editOfferStatusSelect.dispatchEvent(new Event("change"));
      }

      // Auto-set BPA start date to today if empty
      if (editBPADateInput && !editBPADateInput.value) {
        editBPADateInput.value = todayIso;
      }

      if (editBPAReceivedCheckbox) {
        editBPAReceivedCheckbox.checked = targetIsBPA;
        editBPAReceivedCheckbox.dispatchEvent(new Event("change"));
      }

      updateBPACounterDisplay();
    });
  });

  // BPA Date input live counter listeners
  const editBPADateInput = document.getElementById("editBPADate");
  if (editBPADateInput) {
    editBPADateInput.addEventListener("input", updateBPACounterDisplay);
    editBPADateInput.addEventListener("change", updateBPACounterDisplay);
  }

  // Stage 4 Header Outcome Buttons (Commandé Won / Lost)
  document.querySelectorAll("#btnGroupOutcomePills .stage-btn-pill").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const outcome = btn.dataset.outcome;
      const isAlreadyActive = btn.classList.contains("active");

      if (isAlreadyActive) {
        // Clicking active outcome choice deselects it!
        btn.classList.remove("active");
        if (outcome === "won") {
          if (editCheckOrdered) {
            editCheckOrdered.checked = false;
            editCheckOrdered.dispatchEvent(new Event("change"));
          }
        } else if (outcome === "lost") {
          if (editCheckLost) {
            editCheckLost.checked = false;
            editCheckLost.dispatchEvent(new Event("change"));
          }
        }
        updateOutcomePillStates();
        if (currentDrawerDeal) {
          updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
          updateDrawerDelayDisplay(currentDrawerDeal);
        }
        return;
      }

      if (outcome === "won") {
        const isOfferRcv = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
        if (!isOfferRcv) {
          showToast("Progression Rule", "No Order without Offer Reception and Forecast. Please complete DD and Offer Reception first.", "warning");
          return;
        }
        if (editCheckOrdered) {
          editCheckOrdered.checked = true;
          editCheckOrdered.dispatchEvent(new Event("change"));
        }
        const g4 = document.getElementById("groupOutcomeOrder");
        if (g4) g4.classList.add("open");
      } else if (outcome === "lost") {
        if (editCheckLost) {
          editCheckLost.checked = true;
          editCheckLost.dispatchEvent(new Event("change"));
        }
      }
      updateOutcomePillStates();
    });
  });

  // Prevent collapsible group accordion toggle when clicking center button groups
  document.querySelectorAll(".group-header-center").forEach(el => {
    el.addEventListener("click", (e) => e.stopPropagation());
  });

  // Header Quick Actions: PDF, Share, Duplicate, Supplier Name Edit
  const btnExportPDF = document.getElementById("btnDrawerExportPDF");
  if (btnExportPDF) {
    btnExportPDF.addEventListener("click", () => window.print());
  }

  const btnShareLink = document.getElementById("btnDrawerShare");
  if (btnShareLink) {
    btnShareLink.addEventListener("click", () => {
      if (!currentDrawerDeal) return;
      const url = new URL(window.location.href);
      url.searchParams.set("deal", currentDrawerDeal.id);
      navigator.clipboard.writeText(url.toString()).then(() => {
        showToast("Shareable Link", "Deal link copied to clipboard!");
      }).catch(() => {
        prompt("Copy deal link:", url.toString());
      });
    });
  }

  const btnDuplicateDeal = document.getElementById("btnDrawerDuplicate");
  if (btnDuplicateDeal) {
    btnDuplicateDeal.addEventListener("click", () => {
      if (!currentDrawerDeal) return;
      const d = currentDrawerDeal;
      drawerOverlay.classList.remove("open");
      if (addModal) {
        addModal.classList.add("open");
        document.getElementById("addEntryDate").value = new Date().toISOString().split("T")[0];
        const addBuyerEl = document.getElementById("addBuyer");
        if (addBuyerEl) {
          addBuyerEl.value = isBuyerUser() ? currentUser : (d.buyer || "Hamid AIT TAGADIRTE");
          addBuyerEl.disabled = isBuyerUser();
          addBuyerEl.style.opacity = isBuyerUser() ? "0.75" : "1";
          addBuyerEl.style.cursor = isBuyerUser() ? "not-allowed" : "default";
        }
        document.getElementById("addProspector").value = d.prospector || "";
        document.getElementById("addSupplier").value = (d.supplier || "") + " (Copy)";
        document.getElementById("addCategory").value = d.product_range || "Lingerie";
        document.getElementById("addProduct").value = d.product || "";
        document.getElementById("addNotes").value = `Duplicated from Deal #${d.id} (${d.supplier})`;
      }
    });
  }

  const btnEditSupplierTitle = document.getElementById("btnEditSupplierNameTitle");
  if (btnEditSupplierTitle) {
    btnEditSupplierTitle.addEventListener("click", () => {
      const currentName = currentDrawerDeal?.supplier || "";
      const newName = prompt("Edit Supplier Name:", currentName);
      if (newName && newName.trim() && newName.trim() !== currentName) {
        const cleanName = newName.trim();
        document.getElementById("editSupplier").value = cleanName;
        document.getElementById("drawerSupplierTitle").textContent = cleanName;
        if (currentDrawerDeal) currentDrawerDeal.supplier = cleanName;
        showToast("Supplier Updated", `Name updated to "${cleanName}". Don't forget to save.`);
      }
    });
  }

  // 5. Sync Offer VVHT with Forecasted VVHT
  const editOfferValInput = document.getElementById("editOfferValue");
  const editForecastValInput = document.getElementById("editForecastValue");
  if (editOfferValInput && editForecastValInput) {
    editOfferValInput.addEventListener("input", () => {
      if (!editForecastValInput.value || parseFloat(editForecastValInput.value) <= 0) {
        editForecastValInput.value = editOfferValInput.value;
      }
    });
  }

  // 6. Collapsible Group Header Toggling
  document.querySelectorAll(".collapsible-group-header").forEach(header => {
    header.addEventListener("click", () => {
      const targetId = header.dataset.toggleGroup;
      const groupEl = document.getElementById(targetId);
      if (groupEl) {
        groupEl.classList.toggle("open");
        initLucide();
      }
    });
  });
  document.querySelectorAll(".group-header-center").forEach(center => {
    center.addEventListener("click", (e) => e.stopPropagation());
  });

  // 7. Admin Emergency Stage Unlock Toggle
  const btnAdminToggleUnlock = document.getElementById("btnAdminToggleUnlock");
  if (btnAdminToggleUnlock) {
    btnAdminToggleUnlock.addEventListener("click", () => {
      if (!isAdmin()) {
        showToast("Unauthorized", "Only Toby (Admin) can override stage locks.");
        return;
      }
      adminForceUnlock = !adminForceUnlock;
      if (currentDrawerDeal) {
        updateDrawerLockingState(currentDrawerDeal, adminForceUnlock);
        applyAccordionStageFocus(currentDrawerDeal, adminForceUnlock);
      }
      initLucide();
    });
  }

  // 8. Drawer Close
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", () => drawerOverlay.classList.remove("open"));
  const btnCancelDrawer = document.getElementById("btnCancelDrawer");
  if (btnCancelDrawer) btnCancelDrawer.addEventListener("click", () => drawerOverlay.classList.remove("open"));

  // Drawer Margin Live Calculation Listeners
  const editOrderValInput = document.getElementById("editOrderValue");
  const editMarginValInput = document.getElementById("editMarginValue");
  if (editOrderValInput) editOrderValInput.addEventListener("input", updateDrawerMarginDisplay);
  if (editMarginValInput) editMarginValInput.addEventListener("input", updateDrawerMarginDisplay);

  // Timeline Filter Bar Buttons (All / Status Changes / Comments)
  document.querySelectorAll(".timeline-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.timelineFilter || "all";
      const targetFilter = (currentTimelineFilter === filter && filter !== "all") ? "all" : filter;
      if (currentDrawerDeal) {
        renderCommentLogs(currentDrawerDeal.notes, targetFilter);
      }
    });
  });

  // Adding comments
  const btnAddComment = document.getElementById("btnAddComment");
  const newCommentInput = document.getElementById("newCommentInput");
  if (btnAddComment && newCommentInput) {
    btnAddComment.addEventListener("click", () => {
      const text = newCommentInput.value.trim();
      if (!text || !currentDrawerDeal) return;

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().substring(0, 5);
      const logHeader = `[${dateStr} ${timeStr} · ${currentUser}]`;
      const newEntry = `${logHeader}: ${text}`;

      if (currentDrawerDeal.notes && currentDrawerDeal.notes.trim()) {
        currentDrawerDeal.notes = `${currentDrawerDeal.notes.trim()}\n${newEntry}`;
      } else {
        currentDrawerDeal.notes = newEntry;
      }

      newCommentInput.value = "";
      // If currently filtering status changes only, switch to comments tab so user sees their new post
      if (currentTimelineFilter === "status") {
        currentTimelineFilter = "comments";
      }
      renderCommentLogs(currentDrawerDeal.notes, currentTimelineFilter);
      recordAuditLog("Note Added", currentDrawerDeal.supplier, `Note: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`, currentDrawerDeal.id);
      showToast("Note Saved", `Added by ${currentUser}`);
    });
  }

  // Save Drawer edits
  const btnSaveDrawer = document.getElementById("btnSaveDrawer");
  if (btnSaveDrawer) {
    btnSaveDrawer.addEventListener("click", async () => {
      const id = parseInt(document.getElementById("editDealId").value);
      const deal = allDeals.find(d => d.id === id);
      if (!deal) return;

      // Ownership enforcement: Buyers can only modify their own pipeline
      if (isBuyerUser() && deal.buyer !== currentUser) {
        showToast("Access Denied", "You can only modify deals belonging to your pipeline.", "error");
        return;
      }

      // Mandatory validation if Offer Received is checked
      const isOfferReceived = Boolean(document.getElementById("editCheckOfferReceived")?.checked);
      if (isOfferReceived) {
        const offerNum = document.getElementById("editOfferNumber")?.value.trim();
        const offerVal = parseFloat(document.getElementById("editOfferValue")?.value) || 0;

        if (!offerNum) {
          showToast("Mandatory Field", "Please provide an Offer # (Numéro d'offre).", "warning");
          const offerGroup = document.getElementById("groupOfferDetails");
          if (offerGroup) offerGroup.classList.add("open");
          document.getElementById("editOfferNumber")?.focus();
          return;
        }
        if (offerVal <= 0) {
          showToast("Mandatory Field", "Please enter a valid Offer VVHT (€) greater than 0.", "warning");
          const offerGroup = document.getElementById("groupOfferDetails");
          if (offerGroup) offerGroup.classList.add("open");
          document.getElementById("editOfferValue")?.focus();
          return;
        }
      }

      const oldStageLabel = getStageLabel(deal);
      const oldOfferValue = parseFloat(deal.offer_value) || 0;
      const oldForecastValue = parseFloat(deal.forecast_value) || 0;
      const oldOfferStatus = deal.offer_status || "";
      const oldAffaireStatus = deal.affaire_status || "";
      const oldDDDate = deal.dd_date || null;
      const oldBPA = Boolean(deal.bpa_received);
      const oldBPADate = deal.bpa_date || null;
      const oldOrderValue = parseFloat(deal.order_value) || 0;
      const oldMarginValue = parseFloat(deal.margin_value) || 0;

      // Read sourcing fields safely (preserve existing if disabled)
      deal.entry_date = document.getElementById("editEntryDate").value || deal.entry_date;
      deal.buyer = isBuyerUser() ? currentUser : (document.getElementById("editBuyer").value || deal.buyer);
      deal.prospector = document.getElementById("editProspector").value.trim() || deal.prospector;
      deal.supplier_type = document.getElementById("editSupplierType").value || deal.supplier_type;
      deal.supplier = document.getElementById("editSupplier").value.trim() || deal.supplier;
      deal.product_range = document.getElementById("editCategory").value || deal.product_range;
      deal.product = document.getElementById("editProduct").value.trim() || deal.product;

      deal.affaire_status = document.getElementById("editAffaireStatus").value || deal.affaire_status;
      deal.dd_date = document.getElementById("editDateDD") ? (document.getElementById("editDateDD").value || deal.dd_date || null) : deal.dd_date;

      // Process Offer & Order Fields
      if (isOfferReceived) {
        // RULE 1: If offer received, DD was done!
        deal.affaire_status = "DD";
        if (!deal.dd_date) {
          deal.dd_date = document.getElementById("editDateDD")?.value || deal.offer_date || deal.entry_date || new Date().toISOString().split("T")[0];
        }

        const isOrderedChecked = Boolean(document.getElementById("editCheckOrdered")?.checked);
        const isLostChecked = Boolean(document.getElementById("editCheckLost")?.checked);
        const statusSel = document.getElementById("editOfferStatus")?.value;
        const bpaChecked = Boolean(document.getElementById("editBPAReceived")?.checked);

        let finalOfferStatus = "Negociation";
        let bpaReceived = false;

        if (isOrderedChecked) {
          // RULE 3: No order without forecast!
          finalOfferStatus = "Commandé";
          bpaReceived = true; // Passed through BPA approval
        } else if (isLostChecked) {
          finalOfferStatus = "Closed";
          bpaReceived = false;
        } else if (statusSel === "Forecast") {
          finalOfferStatus = bpaChecked ? "Negociée + BPA" : "Negociée en attente BPA";
          bpaReceived = bpaChecked;
        } else if (statusSel === "Re-valorisation") {
          finalOfferStatus = "Re-valorisation";
          bpaReceived = false;
        } else {
          finalOfferStatus = statusSel || "Negociation";
          bpaReceived = false;
        }

        deal.offer_date = document.getElementById("editOfferDate").value || null;
        deal.offer_number = document.getElementById("editOfferNumber").value.trim() || null;
        deal.offer_value = parseFloat(document.getElementById("editOfferValue").value) || 0;
        
        const fvInput = parseFloat(document.getElementById("editForecastValue")?.value);
        deal.forecast_value = (!isNaN(fvInput) && fvInput > 0) ? fvInput : (isOrderedChecked ? (deal.order_value || deal.offer_value || 0) : (finalOfferStatus.includes("BPA") ? deal.offer_value : 0));

        deal.offer_status = finalOfferStatus;
        deal.bpa_received = bpaReceived;
        if (finalOfferStatus.includes("BPA") || bpaReceived || statusSel === "Forecast") {
          deal.bpa_date = document.getElementById("editBPADate")?.value || deal.bpa_date || new Date().toISOString().split("T")[0];
        } else {
          deal.bpa_date = null;
        }

        if (isOrderedChecked) {
          deal.order_value = parseFloat(document.getElementById("editOrderValue").value) || (deal.forecast_value || deal.offer_value || 0);
          deal.margin_value = parseFloat(document.getElementById("editMarginValue").value) || 0;
          if (deal.order_value > 0 && deal.margin_value > 0) {
            deal.margin_rate = parseFloat(((deal.margin_value / deal.order_value) * 100).toFixed(2));
          } else {
            deal.margin_rate = 0;
          }
          deal.order_date = document.getElementById("editOrderDate").value || new Date().toISOString().split("T")[0];
        } else {
          deal.order_value = 0;
          deal.margin_value = 0;
          deal.margin_rate = 0;
          deal.order_date = null;
        }
      } else {
        // Offer NOT received: clear offer and order data
        deal.offer_date = null;
        deal.offer_number = null;
        deal.offer_value = 0;
        deal.forecast_value = 0;
        deal.offer_status = "";
        deal.bpa_received = false;
        deal.bpa_date = null;
        deal.order_value = 0;
        deal.margin_value = 0;
        deal.margin_rate = 0;
        deal.order_date = null;
      }

      // Track changes for automated audit trail
      const newStageLabel = getStageLabel(deal);
      const newOfferValue = parseFloat(deal.offer_value) || 0;
      const newForecastValue = parseFloat(deal.forecast_value) || 0;
      const newOfferStatus = deal.offer_status || "";
      const newAffaireStatus = deal.affaire_status || "";

      const changes = [];
      if (oldAffaireStatus !== newAffaireStatus) {
        changes.push(`Deal Status: "${oldAffaireStatus}" ➔ "${newAffaireStatus}"`);
      }
      if (oldDDDate !== deal.dd_date && deal.dd_date) {
        changes.push(`DD Date: "${oldDDDate || 'None'}" ➔ "${deal.dd_date}"`);
      }
      if (oldOfferStatus !== newOfferStatus && newOfferStatus) {
        changes.push(`Offer Status: "${oldOfferStatus || 'N/A'}" ➔ "${newOfferStatus}"`);
      }
      if (oldBPA !== deal.bpa_received) {
        changes.push(`BPA Received: ${deal.bpa_received ? 'Yes ✓' : 'No'}`);
      }
      if (oldBPADate !== deal.bpa_date && deal.bpa_date) {
        changes.push(`BPA Date: "${oldBPADate || 'None'}" ➔ "${deal.bpa_date}"`);
      }
      if (oldOfferValue !== newOfferValue && newOfferValue > 0) {
        changes.push(`Offer Value: ${formatCurrencyEUR(oldOfferValue)} ➔ ${formatCurrencyEUR(newOfferValue)}`);
      }
      if (oldForecastValue !== newForecastValue && newForecastValue > 0) {
        changes.push(`Forecasted VVHT: ${formatCurrencyEUR(oldForecastValue)} ➔ ${formatCurrencyEUR(newForecastValue)}`);
      }
      if (oldOrderValue !== deal.order_value && deal.order_value > 0) {
        changes.push(`Order: ${formatCurrencyEUR(oldOrderValue)} ➔ ${formatCurrencyEUR(deal.order_value)}`);
      }
      if (oldMarginValue !== deal.margin_value && deal.margin_value > 0) {
        changes.push(`Margin: ${formatCurrencyEUR(oldMarginValue)} ➔ ${formatCurrencyEUR(deal.margin_value)} (${deal.margin_rate}%)`);
      }

      if (changes.length > 0) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toTimeString().substring(0, 5);
        const autoLog = `[${dateStr} ${timeStr} · ${currentUser}]: 🔄 ${changes.join(" | ")}`;
        deal.notes = deal.notes ? `${deal.notes.trim()}\n${autoLog}` : autoLog;
      }

      await saveDealRecord(deal);
      recordAuditLog("Deal Updated", deal.supplier, `Stage: ${newStageLabel} · Offer: ${formatCurrencyEUR(deal.offer_value)} by ${currentUser}`, deal.id);
      drawerOverlay.classList.remove("open");
      applyFiltersAndRender();
      showToast("Changes Saved", `${deal.supplier} updated successfully.`);
    });
  }

  // Admin Delete deal
  const btnDeleteDrawer = document.getElementById("btnDeleteDrawerDeal");
  if (btnDeleteDrawer) {
    btnDeleteDrawer.addEventListener("click", async () => {
      if (!isAdmin()) {
        showToast("Unauthorized", "Only Toby (Admin) can delete deals.");
        return;
      }
      const id = parseInt(document.getElementById("editDealId").value);
      const deal = allDeals.find(d => d.id === id);
      if (!deal) return;

      if (confirm(`Are you sure you want to permanently delete "${deal.supplier}" from the pipeline?`)) {
        const supplierName = deal.supplier;
        allDeals = allDeals.filter(d => d.id !== id);
        localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));

        if (supabaseClient) {
          try {
            const tbl = localStorage.getItem("morocco_supabase_table") || DEFAULT_SUPABASE_TABLE;
            await supabaseClient.from(tbl).delete().eq("id", id);
          } catch (err) {
            console.error("Supabase delete error:", err);
          }
        }

        recordAuditLog("Deal Deleted", supplierName, `Deal #${id} deleted by Admin (${currentUser}).`);
        drawerOverlay.classList.remove("open");
        applyFiltersAndRender();
        showToast("Deal Deleted", `"${supplierName}" has been removed from the pipeline.`);
      }
    });
  }

  // 3. Settings Modal (Admin Only)
  const btnOpenSettings = document.getElementById("btnOpenSettings");
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => {
      if (!isAdmin()) {
        showToast("Access Restricted", "System settings are reserved for Toby (Administrator).");
        return;
      }
      const urlEl = document.getElementById("cfgSupabaseUrl");
      const keyEl = document.getElementById("cfgSupabaseKey");
      const tblEl = document.getElementById("cfgSupabaseTable");
      if (urlEl) urlEl.value = localStorage.getItem("morocco_supabase_url") || "";
      if (keyEl) keyEl.value = localStorage.getItem("morocco_supabase_key") || "";
      if (tblEl) tblEl.value = localStorage.getItem("morocco_supabase_table") || DEFAULT_SUPABASE_TABLE;
      settingsModal.classList.add("open");
      initLucide();
    });
  }

  const btnCloseSettings = document.getElementById("btnCloseSettings");
  if (btnCloseSettings) btnCloseSettings.addEventListener("click", () => settingsModal.classList.remove("open"));

  const btnSaveSettings = document.getElementById("btnSaveSettings");
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener("click", () => {
      const url = document.getElementById("cfgSupabaseUrl").value.trim();
      const key = document.getElementById("cfgSupabaseKey").value.trim();
      const table = document.getElementById("cfgSupabaseTable").value.trim() || DEFAULT_SUPABASE_TABLE;

      localStorage.setItem("morocco_supabase_url", url);
      localStorage.setItem("morocco_supabase_key", key);
      localStorage.setItem("morocco_supabase_table", table);

      initSupabase();
      recordAuditLog("Supabase Settings", "Cloud DB", `Supabase configuration updated by ${currentUser}.`);
      settingsModal.classList.remove("open");
      showToast("Settings Saved", "Supabase connection configured.");
    });
  }

  const btnTestSupabase = document.getElementById("btnTestSupabase");
  if (btnTestSupabase) {
    btnTestSupabase.addEventListener("click", async () => {
      const url = document.getElementById("cfgSupabaseUrl").value.trim();
      const key = document.getElementById("cfgSupabaseKey").value.trim();
      const tbl = document.getElementById("cfgSupabaseTable").value.trim() || DEFAULT_SUPABASE_TABLE;

      if (!url || !key) {
        alert("Please enter both the Supabase URL and Key before testing.");
        return;
      }

      try {
        const testClient = supabase.createClient(url, key);
        const { data, error } = await testClient.from(tbl).select("id").limit(1);
        if (error) throw error;
        showToast("Connection Successful", `Table "${tbl}" accessed successfully!`);
      } catch (err) {
        alert(`Supabase connection failed:\n${err.message || err}`);
      }
    });
  }

  // 4. Audit Modal
  const btnOpenAudit = document.getElementById("btnOpenAuditLogs");
  const auditModal = document.getElementById("auditModal");
  if (btnOpenAudit && auditModal) {
    btnOpenAudit.addEventListener("click", () => {
      renderGlobalAuditLogs();
      auditModal.classList.add("open");
      initLucide();
    });
  }

  const btnCloseAudit = document.getElementById("btnCloseAuditModal");
  if (btnCloseAudit) btnCloseAudit.addEventListener("click", () => auditModal.classList.remove("open"));

  const filterAuditAuthor = document.getElementById("filterAuditAuthor");
  if (filterAuditAuthor) {
    filterAuditAuthor.addEventListener("change", renderGlobalAuditLogs);
  }

  const btnClearAudit = document.getElementById("btnClearAuditLogs");
  if (btnClearAudit) {
    btnClearAudit.addEventListener("click", () => {
      if (!isAdmin()) return;
      if (confirm("Clear all activity modification logs?")) {
        globalAuditLogs = [];
        localStorage.removeItem("morocco_audit_logs");
        renderGlobalAuditLogs();
        showToast("Logs Cleared", "Audit log reset.");
      }
    });
  }

  // 5. Manage Accounts Modal
  const manageAccountsModal = document.getElementById("manageAccountsModal");
  const btnOpenManageAccounts = document.getElementById("btnOpenManageAccounts");
  if (btnOpenManageAccounts && manageAccountsModal) {
    btnOpenManageAccounts.addEventListener("click", () => {
      renderUserAccountsTable();
      document.getElementById("accountFormBox").style.display = "none";
      manageAccountsModal.classList.add("open");
      initLucide();
    });
  }

  const btnCloseAccounts = document.getElementById("btnCloseAccountsModal");
  if (btnCloseAccounts) btnCloseAccounts.addEventListener("click", () => manageAccountsModal.classList.remove("open"));

  const btnOpenAddAccount = document.getElementById("btnOpenAddAccount");
  if (btnOpenAddAccount) {
    btnOpenAddAccount.addEventListener("click", () => {
      document.getElementById("accountFormTitle").textContent = "Add Account";
      document.getElementById("editAccountOriginalName").value = "";
      document.getElementById("accName").value = "";
      document.getElementById("accRole").value = "Team Member";
      document.getElementById("accPin").value = "";
      document.getElementById("accountFormBox").style.display = "block";
    });
  }

  const btnCancelAccountForm = document.getElementById("btnCancelAccountForm");
  if (btnCancelAccountForm) {
    btnCancelAccountForm.addEventListener("click", () => {
      document.getElementById("accountFormBox").style.display = "none";
    });
  }

  const btnSaveAccount = document.getElementById("btnSaveAccount");
  if (btnSaveAccount) {
    btnSaveAccount.addEventListener("click", () => {
      const origName = document.getElementById("editAccountOriginalName").value;
      const name = document.getElementById("accName").value.trim();
      const role = document.getElementById("accRole").value;
      const pin = document.getElementById("accPin").value.trim();

      if (!name || !pin || pin.length !== 4) {
        alert("Please enter a name and a 4-digit PIN code.");
        return;
      }

      let accounts = getUserAccounts();

      if (origName) {
        const idx = accounts.findIndex(a => a.name === origName);
        if (idx !== -1) {
          accounts[idx] = { name, role, pin };
        }
        recordAuditLog("Account Updated", "Security", `Account "${name}" (${role}) updated.`);
      } else {
        if (accounts.some(a => a.name.toLowerCase() === name.toLowerCase())) {
          alert(`An account named "${name}" already exists.`);
          return;
        }
        accounts.push({ name, role, pin });
        recordAuditLog("Account Created", "Security", `New account "${name}" (${role}) added.`);
      }

      saveUserAccounts(accounts);
      renderUserAccountsTable();
      document.getElementById("accountFormBox").style.display = "none";
      showToast("Account Saved", `User "${name}" saved.`);
    });
  }

  // 6. Reset Database Confirmation
  const resetDBModal = document.getElementById("resetDatabaseModal");
  const btnOpenResetDBModal = document.getElementById("btnOpenResetDBModal");
  const btnCloseResetDBModal = document.getElementById("btnCloseResetDBModal");
  const btnCancelResetDB = document.getElementById("btnCancelResetDB");
  const btnExecuteResetDB = document.getElementById("btnExecuteResetDB");
  const inputConfirmResetCode = document.getElementById("inputConfirmResetCode");

  if (btnOpenResetDBModal) {
    btnOpenResetDBModal.addEventListener("click", () => {
      if (!isAdmin()) {
        showToast("Unauthorized", "Only Toby (Admin) can reset the database.");
        return;
      }
      inputConfirmResetCode.value = "";
      btnExecuteResetDB.disabled = true;
      resetDBModal.classList.add("open");
      setTimeout(() => inputConfirmResetCode.focus(), 150);
      initLucide();
    });
  }

  if (btnCloseResetDBModal) btnCloseResetDBModal.addEventListener("click", () => resetDBModal.classList.remove("open"));
  if (btnCancelResetDB) btnCancelResetDB.addEventListener("click", () => resetDBModal.classList.remove("open"));

  if (inputConfirmResetCode) {
    inputConfirmResetCode.addEventListener("input", () => {
      btnExecuteResetDB.disabled = (inputConfirmResetCode.value.trim().toUpperCase() !== "RESET");
    });
  }

  if (btnExecuteResetDB) {
    btnExecuteResetDB.addEventListener("click", async () => {
      if (inputConfirmResetCode.value.trim().toUpperCase() !== "RESET") return;

      localStorage.removeItem("morocco_pipeline_deals");

      try {
        const res = await fetch("initial_data.json");
        if (res.ok) allDeals = await res.json();
      } catch (e) {
        allDeals = [];
      }

      localStorage.setItem("morocco_pipeline_deals", JSON.stringify(allDeals));

      if (supabaseClient) {
        try {
          const tbl = localStorage.getItem("morocco_supabase_table") || DEFAULT_SUPABASE_TABLE;
          await supabaseClient.from(tbl).delete().neq("id", 0);
          if (allDeals.length > 0) {
            await supabaseClient.from(tbl).insert(allDeals);
          }
        } catch (err) {
          console.warn("Supabase re-seed warning:", err);
        }
      }

      recordAuditLog("Factory Reset", "System", `Pipeline reset to default data by ${currentUser}.`);
      resetDBModal.classList.remove("open");
      settingsModal.classList.remove("open");
      updateProspectorFilterOptions();
      applyFiltersAndRender();
      showToast("Database Reset", "Default data from Suivi_Prod-Team-Casa.xlsx reloaded.");
    });
  }

  // 7. Excel / CSV Exports & Database Reflash
  const btnExport = document.getElementById("btnExportCSV");
  if (btnExport) btnExport.addEventListener("click", exportExcel);
  const btnExportTable = document.getElementById("btnExportTableCSV");
  if (btnExportTable) btnExportTable.addEventListener("click", exportExcel);

  const btnReflash = document.getElementById("btnReflashDatabase");
  if (btnReflash) {
    btnReflash.addEventListener("click", () => {
      window.reflashDatabase(true);
    });
  }
}

const exportCSV = exportExcel;
window.exportCSV = exportExcel;
window.exportExcel = exportExcel;

function renderUserAccountsTable() {
  const tbody = document.getElementById("userAccountsTableBody");
  if (!tbody) return;
  const accounts = getUserAccounts();
  tbody.innerHTML = "";

  accounts.forEach(acc => {
    const tr = document.createElement("tr");
    const isMainAdmin = acc.name === "Toby";
    tr.innerHTML = `
      <td><strong>${escapeHtml(acc.name)}</strong> ${isMainAdmin ? '<span class="badge badge-amber" style="font-size:0.65rem; margin-left:4px;">Primary</span>' : ''}</td>
      <td class="text-center"><span class="badge ${acc.role === 'Admin' ? 'badge-primary' : 'badge-teal'}">${escapeHtml(acc.role)}</span></td>
      <td class="text-center font-mono" style="letter-spacing:0.2em;">••••</td>
      <td class="text-right">
        <button class="btn btn-secondary btn-sm" onclick="editAccount('${escapeHtml(acc.name)}')"><i data-lucide="edit-3" style="width:13px; height:13px;"></i> Edit</button>
        ${!isMainAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteAccount('${escapeHtml(acc.name)}')"><i data-lucide="trash-2" style="width:13px; height:13px;"></i></button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
  initLucide();
}

window.editAccount = (name) => {
  const accounts = getUserAccounts();
  const acc = accounts.find(a => a.name === name);
  if (!acc) return;
  document.getElementById("accountFormTitle").textContent = `Edit Account: ${name}`;
  document.getElementById("editAccountOriginalName").value = name;
  document.getElementById("accName").value = acc.name;
  document.getElementById("accRole").value = acc.role;
  document.getElementById("accPin").value = acc.pin;
  document.getElementById("accountFormBox").style.display = "block";
};

window.deleteAccount = (name) => {
  if (confirm(`Delete the account for "${name}"?`)) {
    let accounts = getUserAccounts().filter(a => a.name !== name);
    saveUserAccounts(accounts);
    recordAuditLog("Account Deleted", "Security", `Account "${name}" deleted by ${currentUser}.`);
    renderUserAccountsTable();
    showToast("Account Deleted", `User "${name}" removed.`);
  }
};

// ── 13. STYLED EXCEL WORKBOOK EXPORT (EXCELJS WITH MULTI-TAB & COLOR PALETTE) ──
async function exportExcel() {
  // Enforce user requirement: In the exported excel, the period is the ONLY active filter
  const pType = document.getElementById("filterPeriodType");
  const activePeriodText = pType ? (pType.options[pType.selectedIndex]?.text || pType.value) : "All Time";
  const periodVal = pType ? pType.value : "All Time";

  let dealsToExport = allDeals;
  if (periodVal === "All Time" || periodVal === "MODE_MONTHLY" || periodVal === "MODE_WEEKLY") {
    dealsToExport = allDeals;
  } else if (periodVal.startsWith("2026-") || periodVal.match(/^\d{4}-\d{2}$/)) {
    dealsToExport = allDeals.filter(d => {
      // User requirement: Keep the data of the Forecast the same (confirmed and not confirmed BPA)
      if (isForecastDeal(d)) return true;
      const dates = [d.entry_date, d.offer_date, d.order_date, d.dd_date].filter(Boolean);
      return dates.some(dt => dt.startsWith(periodVal));
    });
  } else if (periodVal.startsWith("W") || periodVal.startsWith("S")) {
    const targetW = parseInt(periodVal.replace(/[^\d]/g, ""), 10);
    dealsToExport = allDeals.filter(d => {
      // User requirement: Keep the data of the Forecast the same (confirmed and not confirmed BPA)
      if (isForecastDeal(d)) return true;
      const dates = [d.entry_date, d.offer_date, d.order_date, d.dd_date].filter(Boolean);
      return dates.some(dt => {
        const dObj = new Date(dt);
        return !isNaN(dObj.getTime()) && getISOWeek(dObj) === targetW;
      });
    });
  }

  if (!dealsToExport || dealsToExport.length === 0) {
    alert("No data to export for selected period.");
    return;
  }

  // Fallback to CSV if ExcelJS is not loaded
  if (typeof ExcelJS === "undefined") {
    exportCSVFallback(dealsToExport);
    return;
  }

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Antigravity Executive Analytics";
    wb.lastModifiedBy = currentUser || "Iberian Desk Casablanca";
    wb.created = new Date();
    wb.modified = new Date();

    const C_NAVY = "0F172A";
    const C_HEADER_BLUE = "1E3A8A";
    const C_BRAND_BLUE = "2563EB";
    const C_SOFT_BLUE = "EFF6FF";
    const C_GREEN_DARK = "065F46";
    const C_GREEN_FILL = "D1FAE5";
    const C_GREEN_BORDER = "10B981";
    const C_AMBER_DARK = "92400E";
    const C_AMBER_FILL = "FEF3C7";
    const C_AMBER_BORDER = "F59E0B";
    const C_RED_DARK = "991B1B";
    const C_RED_FILL = "FEE2E2";
    const C_RED_BORDER = "EF4444";
    const C_GRAY_DARK = "334155";
    const C_GRAY_FILL = "F8FAFC";
    const C_TEAL_DARK = "0F766E";
    const C_TEAL_FILL = "CCFBF1";

    // ── SHEET 1: DASHBOARD & OVERVIEW ───────────────────────────────────────
    const wsDash = wb.addWorksheet("Dashboard & Overview", {
      views: [{ showGridLines: true }],
      properties: { tabColor: { argb: "2563EB" } }
    });

    wsDash.mergeCells("A1:K1");
    const heroCell = wsDash.getCell("A1");
    heroCell.value = "🇲🇦 MOROCCO PURCHASING PIPELINE · IBERIAN DESK CASABLANCA";
    heroCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFF" } };
    heroCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_NAVY } };
    heroCell.alignment = { vertical: "middle", horizontal: "center" };
    wsDash.getRow(1).height = 36;

    wsDash.mergeCells("A2:K2");
    const subCell = wsDash.getCell("A2");
    subCell.value = `Suivi Production & Pipeline Achats · Active Period: ${activePeriodText} (Only Filter Active) · Generated: ${new Date().toISOString().split("T")[0]} · User: ${currentUser}`;
    subCell.font = { name: "Segoe UI", size: 9, italic: true, color: { argb: "E2E8F0" } };
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
    subCell.alignment = { vertical: "middle", horizontal: "center" };
    wsDash.getRow(2).height = 20;

    wsDash.getRow(3).height = 10;

    // KPI Header showing period
    wsDash.mergeCells("A4:K4");
    const kpiHeader = wsDash.getCell("A4");
    kpiHeader.value = `EXECUTIVE KPI SUMMARY · PERIOD: ${activePeriodText.toUpperCase()}`;
    kpiHeader.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: C_BRAND_BLUE } };
    kpiHeader.alignment = { vertical: "middle", horizontal: "left" };
    wsDash.getRow(4).height = 22;

    // Calculate KPIs
    let activeVal = 0, forecastConf = 0, forecastAtt = 0, ordValSum = 0, ordCount = 0, overdueCnt = 0, totalMar = 0;
    dealsToExport.forEach(d => {
      const isOrd = d.offer_status === "Commandé";
      const isCls = d.offer_status === "Closed" || d.offer_status === "Perdue" || d.affaire_status === "Closed" || d.affaire_status === "Rejetée" || getDaysOpen(d) === "Closed";
      const ov = parseFloat(d.order_value) || 0;
      const offv = parseFloat(d.offer_value) || 0;
      const fv = parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : offv;
      const mv = parseFloat(d.margin_value) || 0;

      if (!isCls) {
        if (isForecastDeal(d)) activeVal += fv;
        else if (!isOrd) activeVal += offv;
      }
      if (isForecastDeal(d)) {
        if (hasBPAReceived(d)) forecastConf += fv;
        else forecastAtt += fv;
      }
      if (isOrd) {
        ordCount++;
        ordValSum += (ov > 0 ? ov : offv);
        totalMar += mv;
      }
      if (getStaleAlert(d)) overdueCnt++;
    });

    const avgMarRate = ordValSum > 0 ? (totalMar / ordValSum) : 0;
    const fConfCount = dealsToExport.filter(d => isForecastDeal(d) && hasBPAReceived(d)).length;
    const fAttCount = dealsToExport.filter(d => isForecastDeal(d) && !hasBPAReceived(d)).length;

    const kpiCards = [
      { cell: "A5:B5", title: "Lot / Détection (Sourced)", val: dealsToExport.length, fmt: "#,##0", sub: `${dealsToExport.length} lines sourced` },
      { cell: "C5:D5", title: "Active Pipeline (VVHT)", val: activeVal, fmt: "#,##0 €", sub: "Deals in negotiation" },
      { cell: "E5:F5", title: "Forecast (Total)", val: forecastConf + forecastAtt, fmt: "#,##0 €", sub: `🟢 Confirmed: ${forecastConf.toLocaleString()} € (${fConfCount}) | 🟠 Awaiting BPA: ${forecastAtt.toLocaleString()} € (${fAttCount})` },
      { cell: "G5:H5", title: "Orders (VVHT)", val: ordValSum, fmt: "#,##0 €", sub: `${ordCount} order(s) won` },
      { cell: "I5:J5", title: "Overdue Deals", val: overdueCnt, fmt: "#,##0", sub: ">5 days no DD / >10 days offer" },
      { cell: "K5", title: "Average Margin", val: avgMarRate, fmt: "0.0%", sub: "On orders won" }
    ];

    kpiCards.forEach(k => {
      if (k.cell.includes(":")) wsDash.mergeCells(k.cell);
      const c = wsDash.getCell(k.cell.split(":")[0]);
      c.value = k.title.toUpperCase();
      c.font = { name: "Segoe UI", size: 8, bold: true, color: { argb: "64748B" } };
      c.alignment = { vertical: "middle", horizontal: "center" };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_SOFT_BLUE } };
    });
    wsDash.getRow(5).height = 18;

    kpiCards.forEach(k => {
      const cKey = k.cell.split(":")[0];
      const valCellKey = cKey.replace("5", "6");
      const mergeTarget = k.cell.replace(/5/g, "6");
      if (mergeTarget.includes(":")) wsDash.mergeCells(mergeTarget);
      const vc = wsDash.getCell(valCellKey);
      vc.value = k.val;
      vc.numFmt = k.fmt;
      vc.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: k.title.includes("Overdue") && overdueCnt > 0 ? C_RED_DARK : C_NAVY } };
      vc.alignment = { vertical: "middle", horizontal: "center" };
      vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_SOFT_BLUE } };
    });
    wsDash.getRow(6).height = 28;

    // KPI Subtext Row 7 (Dual Forecast breakdown: Confirmed vs Awaiting BPA)
    kpiCards.forEach(k => {
      const cKey = k.cell.split(":")[0];
      const subCellKey = cKey.replace("5", "7");
      const mergeTarget = k.cell.replace(/5/g, "7");
      if (mergeTarget.includes(":")) wsDash.mergeCells(mergeTarget);
      const sc = wsDash.getCell(subCellKey);
      sc.value = k.sub;
      sc.font = { name: "Segoe UI", size: 7.5, bold: k.title.includes("Forecast"), color: { argb: k.title.includes("Forecast") ? "1E3A8A" : "64748B" } };
      sc.alignment = { vertical: "middle", horizontal: "center" };
      sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_SOFT_BLUE } };
    });
    wsDash.getRow(7).height = 18;

    // Buyer Performance Funnel Header & Table
    wsDash.mergeCells("A8:K8");
    const funnelHeader = wsDash.getCell("A8");
    funnelHeader.value = "BUYER PERFORMANCE FUNNEL · CASABLANCA IBERIAN DESK";
    funnelHeader.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: C_BRAND_BLUE } };
    funnelHeader.alignment = { vertical: "middle", horizontal: "left" };
    wsDash.getRow(8).height = 24;

    const funnelCols = ["Buyer", "Detections", "Sent DD", "Offers", "In Nego", "Forecast (€)", "Orders", "Ordered VVHT", "Active Pipeline", "Conv. Rate", "Signal"];
    const colLetter = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

    funnelCols.forEach((colName, idx) => {
      const c = wsDash.getCell(`${colLetter[idx]}9`);
      c.value = colName;
      c.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_HEADER_BLUE } };
      c.alignment = { vertical: "middle", horizontal: idx === 0 ? "left" : "center" };
    });
    wsDash.getRow(9).height = 24;

    const BUYERS_LIST = ["Hamid AIT TAGADIRTE", "Marouane CHAHDANE", "Raffael BUENOS AIRES"];
    let curRow = 10;
    let sumDet = 0, sumDD = 0, sumOff = 0, sumNego = 0, sumFVal = 0, sumOrd = 0, sumOrdVal = 0, sumActVal = 0;

    BUYERS_LIST.forEach(bName => {
      const bDeals = dealsToExport.filter(d => d.buyer === bName);
      const detections = bDeals.length;
      const ddCount = bDeals.filter(d => d.affaire_status === "DD").length;
      const offers = bDeals.filter(d => (d.offer_number && String(d.offer_number).trim() !== "") || (d.offer_date && String(d.offer_date).trim() !== "") || (parseFloat(d.offer_value) > 0)).length;
      const inNego = bDeals.filter(d => d.offer_status === "Negociation" || d.offer_status === "Re-valorisation").length;
      const fVal = bDeals.filter(d => isForecastDeal(d)).reduce((sum, d) => sum + (parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : (parseFloat(d.offer_value) || 0)), 0);
      const ordDeals = bDeals.filter(d => d.offer_status === "Commandé").length;
      const ordVal = bDeals.filter(d => d.offer_status === "Commandé").reduce((sum, d) => sum + (parseFloat(d.order_value) || parseFloat(d.offer_value) || 0), 0);
      const actVal = bDeals.filter(d => getDaysOpen(d) !== "Closed").reduce((sum, d) => sum + (parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : (parseFloat(d.offer_value) || 0)), 0);
      const rate = detections > 0 ? (ordDeals / detections) : 0;

      let signalText = "No offer";
      if (offers > 0) {
        if (ordDeals > 0) signalText = `${ordDeals} Ordered`;
        else if (fVal > 0) signalText = "Forecast";
        else signalText = `${offers} Offers`;
      }

      sumDet += detections;
      sumDD += ddCount;
      sumOff += offers;
      sumNego += inNego;
      sumFVal += fVal;
      sumOrd += ordDeals;
      sumOrdVal += ordVal;
      sumActVal += actVal;

      const rowValues = [bName, detections, ddCount, offers, inNego, fVal, ordDeals, ordVal, actVal, rate, signalText];
      const r = wsDash.getRow(curRow);
      r.height = 22;

      rowValues.forEach((val, idx) => {
        const c = wsDash.getCell(`${colLetter[idx]}${curRow}`);
        c.value = val;
        c.font = { name: "Segoe UI", size: 9, bold: idx === 0 || idx === 1 };
        c.alignment = { vertical: "middle", horizontal: idx === 0 ? "left" : (idx === 5 || idx === 7 || idx === 8 ? "right" : "center") };
        if (idx === 5 || idx === 7 || idx === 8) c.numFmt = "#,##0 €";
        if (idx === 9) c.numFmt = "0.0%";

        if (idx === 10) {
          c.font = { name: "Segoe UI", size: 9, bold: true };
          if (val.includes("Forecast")) {
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_AMBER_FILL } };
            c.font.color = { argb: C_AMBER_DARK };
          } else if (val.includes("Ordered")) {
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_GREEN_FILL } };
            c.font.color = { argb: C_GREEN_DARK };
          } else {
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_GRAY_FILL } };
            c.font.color = { argb: C_GRAY_DARK };
          }
        } else {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: curRow % 2 === 0 ? "FFFFFF" : "F8FAFC" } };
        }
      });
      curRow++;
    });

    // Team Total Row
    const totRate = sumDet > 0 ? (sumOrd / sumDet) : 0;
    const totalRowValues = ["TEAM TOTAL (3 BUYERS)", sumDet, sumDD, sumOff, sumNego, sumFVal, sumOrd, sumOrdVal, sumActVal, totRate, "Active"];
    const totRow = wsDash.getRow(curRow);
    totRow.height = 24;

    totalRowValues.forEach((val, idx) => {
      const c = wsDash.getCell(`${colLetter[idx]}${curRow}`);
      c.value = val;
      c.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: C_NAVY } };
      c.alignment = { vertical: "middle", horizontal: idx === 0 ? "left" : (idx === 5 || idx === 7 || idx === 8 ? "right" : "center") };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };
      if (idx === 5 || idx === 7 || idx === 8) c.numFmt = "#,##0 €";
      if (idx === 9) c.numFmt = "0.0%";
      if (idx === 10) {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_GREEN_FILL } };
        c.font.color = { argb: C_GREEN_DARK };
      }
    });

    const dashWidths = [26, 14, 12, 12, 12, 18, 12, 18, 18, 14, 16];
    dashWidths.forEach((w, i) => { wsDash.getColumn(i + 1).width = w; });

    // ── SHEET 2: PIPELINE DATABASE (COLOR HIGHLIGHTED) ───────────────────────
    const wsData = wb.addWorksheet("Pipeline Database", {
      views: [{ state: "frozen", ySplit: 4, showGridLines: true }],
      properties: { tabColor: { argb: "10B981" } }
    });

    wsData.mergeCells("A1:U1");
    const dataHero = wsData.getCell("A1");
    dataHero.value = "PORTFOLIO TRACKING TABLE · COMPLETE DATABASE";
    dataHero.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
    dataHero.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_NAVY } };
    dataHero.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsData.getRow(1).height = 28;

    wsData.mergeCells("A2:U2");
    const dataSub = wsData.getCell("A2");
    dataSub.value = `Active Period: ${activePeriodText} (Only Filter Active) | 🟢 Green = Forecast + BPA Confirmed (${forecastConf.toLocaleString()} € · ${fConfCount} deals) | 🟠 Orange = Forecast Awaiting BPA / Not Confirmed (${forecastAtt.toLocaleString()} € · ${fAttCount} deal) | 🔴 Red = Overdue`;
    dataSub.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: C_NAVY } };
    dataSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2E8F0" } };
    dataSub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsData.getRow(2).height = 20;

    wsData.getRow(3).height = 6;

    const dbHeaders = [
      { name: "ID", width: 8, align: "center" },
      { name: "Entry Date", width: 13, align: "center" },
      { name: "Buyer", width: 24, align: "left" },
      { name: "Prospector", width: 16, align: "left" },
      { name: "Supplier", width: 28, align: "left" },
      { name: "Supplier Type", width: 15, align: "center" },
      { name: "Product Lot Description", width: 34, align: "left" },
      { name: "Product Category", width: 20, align: "left" },
      { name: "Affaire Status", width: 14, align: "center" },
      { name: "DD Date", width: 13, align: "center" },
      { name: "Offer Date", width: 13, align: "center" },
      { name: "Offer Number", width: 16, align: "center" },
      { name: "Offer VVHT (€)", width: 16, align: "right", fmt: "#,##0 €" },
      { name: "Forecast (€)", width: 16, align: "right", fmt: "#,##0 €" },
      { name: "Offer Status", width: 22, align: "center" },
      { name: "BPA Received", width: 16, align: "center" },
      { name: "Order VVHT (€)", width: 16, align: "right", fmt: "#,##0 €" },
      { name: "Margin (€)", width: 15, align: "right", fmt: "#,##0 €" },
      { name: "Margin %", width: 12, align: "center", fmt: "0.0%" },
      { name: "Days in Stage", width: 14, align: "center" },
      { name: "Overdue Alert", width: 24, align: "left" }
    ];

    dbHeaders.forEach((h, idx) => {
      const colNumber = idx + 1;
      const cell = wsData.getCell(4, colNumber);
      cell.value = h.name;
      cell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_HEADER_BLUE } };
      cell.alignment = { vertical: "middle", horizontal: h.align, wrapText: true };
      wsData.getColumn(colNumber).width = h.width;
    });
    wsData.getRow(4).height = 26;

    let dRowIdx = 5;
    dealsToExport.forEach(deal => {
      const isForecast = isForecastDeal(deal);
      const hasBPA = hasBPAReceived(deal);
      const staleAlert = getStaleAlert(deal);
      const days = getDaysOpen(deal);

      const ordVal = parseFloat(deal.order_value) || 0;
      const marVal = parseFloat(deal.margin_value) || 0;
      const rate = ordVal > 0 && marVal > 0 ? (marVal / ordVal) : ((parseFloat(deal.margin_rate) || 0) / 100);
      const offVal = parseFloat(deal.offer_value) || 0;
      const forecastVal = parseFloat(deal.forecast_value) > 0 ? parseFloat(deal.forecast_value) : offVal;

      const rowData = [
        deal.id,
        deal.entry_date || "—",
        deal.buyer || "—",
        deal.prospector || "—",
        deal.supplier || "—",
        deal.supplier_type || "Actif",
        deal.product || "—",
        getProductCategoryLabel(deal.product_range),
        deal.affaire_status || "Prenego",
        deal.dd_date || "—",
        deal.offer_date || "—",
        deal.offer_number || "—",
        offVal,
        isForecast ? forecastVal : 0,
        deal.offer_status || "—",
        hasBPA ? "YES (Confirmed)" : (isForecast ? "NO (Awaiting)" : "—"),
        ordVal,
        marVal,
        rate,
        days === "Closed" ? "Closed" : `${days} days`,
        staleAlert || "Normal"
      ];

      const r = wsData.getRow(dRowIdx);
      r.height = 20;

      let rowBg = dRowIdx % 2 === 0 ? "FFFFFF" : "F8FAFC";
      let leftBorderColor = "CBD5E1";
      let leftBorderStyle = "thin";

      // Color lines with Green for with BPA and orange for without BPA
      if (isForecast && hasBPA) {
        rowBg = C_GREEN_FILL;
        leftBorderColor = C_GREEN_BORDER;
        leftBorderStyle = "medium";
      } else if (isForecast && !hasBPA) {
        rowBg = C_AMBER_FILL;
        leftBorderColor = C_AMBER_BORDER;
        leftBorderStyle = "medium";
      } else if (staleAlert) {
        rowBg = "FFF1F2";
        leftBorderColor = C_RED_BORDER;
        leftBorderStyle = "medium";
      }

      rowData.forEach((val, cIdx) => {
        const colNum = cIdx + 1;
        const c = wsData.getCell(dRowIdx, colNum);
        c.value = val;
        c.font = { name: "Segoe UI", size: 9 };
        c.alignment = { vertical: "middle", horizontal: dbHeaders[cIdx].align };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
        if (dbHeaders[cIdx].fmt) c.numFmt = dbHeaders[cIdx].fmt;

        if (cIdx === 0 || cIdx === 2 || cIdx === 4) c.font.bold = true;
        if (cIdx === 15) {
          c.font.bold = true;
          if (hasBPA) c.font.color = { argb: C_GREEN_DARK };
          else if (isForecast) c.font.color = { argb: C_AMBER_DARK };
        }
        if (cIdx === 20 && staleAlert) {
          c.font.bold = true;
          c.font.color = { argb: C_RED_DARK };
        }

        c.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: cIdx === 0 ? leftBorderStyle : "thin", color: { argb: cIdx === 0 ? leftBorderColor : "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } }
        };
      });

      dRowIdx++;
    });

    wsData.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: dRowIdx - 1, column: dbHeaders.length }
    };

    // ── SHEET 3: ACTION QUEUE ───────────────────────────────────────────────
    const wsAction = wb.addWorksheet("Action Queue", {
      views: [{ showGridLines: true }],
      properties: { tabColor: { argb: "EF4444" } }
    });

    wsAction.mergeCells("A1:G1");
    const actHero = wsAction.getCell("A1");
    actHero.value = "ACTION QUEUE · PRIORITIZED PROCUREMENT FOLLOW-UPS";
    actHero.font = { name: "Segoe UI", size: 12, bold: true, color: { argb: "FFFFFF" } };
    actHero.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "991B1B" } };
    actHero.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsAction.getRow(1).height = 28;

    wsAction.mergeCells("A2:G2");
    const actSub = wsAction.getCell("A2");
    actSub.value = `Active Period: ${activePeriodText} · Ordered by status in Current Stage: Lot / Détection > Prenego > Sent Affaire DD > En Négociation > Forecast (BPA)`;
    actSub.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: C_NAVY } };
    actSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
    actSub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    wsAction.getRow(2).height = 20;

    wsAction.getRow(3).height = 8;

    const actCols = [
      { name: "Priority", width: 14, align: "center" },
      { name: "Supplier / Lot", width: 30, align: "left" },
      { name: "Product Category", width: 22, align: "left" },
      { name: "Buyer Responsible", width: 24, align: "left" },
      { name: "Days in Stage", width: 15, align: "center" },
      { name: "Recommended Next Action", width: 36, align: "left" },
      { name: "Current Stage", width: 22, align: "center" }
    ];

    actCols.forEach((col, idx) => {
      const colNum = idx + 1;
      const c = wsAction.getCell(4, colNum);
      c.value = col.name;
      c.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E293B" } };
      c.alignment = { vertical: "middle", horizontal: col.align };
      wsAction.getColumn(colNum).width = col.width;
    });
    wsAction.getRow(4).height = 24;

    let actRowIdx = 5;
    const sortedActionDeals = [...dealsToExport].sort((a, b) => {
      const recA = getRecommendedNextAction(a);
      const recB = getRecommendedNextAction(b);
      const priA = recA ? recA.priority : 99;
      const priB = recB ? recB.priority : 99;
      if (priA !== priB) return priA - priB;
      const sA = getStageRank(getStageLabel(a));
      const sB = getStageRank(getStageLabel(b));
      if (sA !== sB) return sA - sB;
      const daysA = typeof getDaysOpen(a) === "number" ? getDaysOpen(a) : 0;
      const daysB = typeof getDaysOpen(b) === "number" ? getDaysOpen(b) : 0;
      return daysB - daysA;
    });

    sortedActionDeals.forEach(deal => {
      const days = getDaysOpen(deal);
      const rec = getRecommendedNextAction(deal);

      let priLabel = rec ? rec.priorityLabel : "P5 · Sourcing";
      let actionText = rec ? rec.actionText : (deal.notes || "—");
      let priColor = C_GRAY_DARK;
      let priFill = C_GRAY_FILL;

      if (rec) {
        if (rec.priority === 1) {
          priColor = C_RED_DARK;
          priFill = C_RED_FILL;
        } else if (rec.priority === 2) {
          priColor = C_AMBER_DARK;
          priFill = C_AMBER_FILL;
        } else if (rec.priority === 3 || rec.badgeColor === "teal") {
          priColor = C_TEAL_DARK;
          priFill = C_TEAL_FILL;
        } else if (rec.badgeColor === "green") {
          priColor = C_GREEN_DARK;
          priFill = C_GREEN_FILL;
        } else {
          priColor = C_GRAY_DARK;
          priFill = C_GRAY_FILL;
        }
      }

      const rowData = [
        priLabel,
        deal.supplier || `Deal #${deal.id}`,
        getProductCategoryLabel(deal.product_range),
        deal.buyer,
        days === "Closed" ? "Closed" : `${days} days`,
        actionText,
        deal.offer_status || deal.affaire_status || "Prenego"
      ];

      const r = wsAction.getRow(actRowIdx);
      r.height = 20;

      rowData.forEach((val, cIdx) => {
        const colNum = cIdx + 1;
        const c = wsAction.getCell(actRowIdx, colNum);
        c.value = val;
        c.font = { name: "Segoe UI", size: 9 };
        c.alignment = { vertical: "middle", horizontal: actCols[cIdx].align };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: actRowIdx % 2 === 0 ? "FFFFFF" : "F8FAFC" } };

        if (cIdx === 0) {
          c.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: priColor } };
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: priFill } };
        }
        if (cIdx === 1) c.font.bold = true;

        c.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } }
        };
      });

      actRowIdx++;
    });

    // Write to Excel buffer and trigger download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Morocco_Purchasing_Pipeline_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Excel Export Completed", "Styled workbook exported with 3 formatted sheets.");
  } catch (err) {
    console.error("ExcelJS export error, falling back to CSV:", err);
    exportCSVFallback(dealsToExport);
  }
}

function exportCSVFallback(dealsToExport) {
  const headers = [
    "ID", "Entry Date", "Buyer", "Prospector", "Supplier", "Supplier Type",
    "Lot Description", "Product Category", "Deal Status", "DD Date", "Offer Date", "Offer Number",
    "Offer VVHT (€)", "Forecasted VVHT (€)", "Offer Status", "BPA Received", "Order VVHT (€)", "Margin (€)", "Margin Rate (%)", "Order Date",
    "Notes", "Days Open", "Overdue Alert"
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    return `"${str}"`;
  };

  const rows = dealsToExport.map(d => {
    const ordVal = parseFloat(d.order_value) || 0;
    const marVal = parseFloat(d.margin_value) || 0;
    const rate = (ordVal > 0 && marVal > 0) ? parseFloat(((marVal / ordVal) * 100).toFixed(2)) : (parseFloat(d.margin_rate) || 0);
    const days = getDaysOpen(d);
    const forecastVal = parseFloat(d.forecast_value) > 0 ? parseFloat(d.forecast_value) : (parseFloat(d.offer_value) || 0);

    return [
      d.id || "",
      d.entry_date || "",
      escapeCSV(d.buyer),
      escapeCSV(d.prospector),
      escapeCSV(d.supplier),
      escapeCSV(d.supplier_type),
      escapeCSV(d.product),
      escapeCSV(getProductCategoryLabel(d.product_range)),
      escapeCSV(d.affaire_status),
      d.dd_date || "",
      d.offer_date || "",
      escapeCSV(d.offer_number),
      parseFloat(d.offer_value) || 0,
      forecastVal,
      escapeCSV(d.offer_status),
      d.bpa_received ? "Yes" : "No",
      ordVal,
      marVal,
      rate,
      d.order_date || "",
      escapeCSV(d.notes),
      escapeCSV(days === "Closed" ? "Closed" : `${days} days`),
      escapeCSV(getStaleAlert(d))
    ];
  });

  const csvRows = [headers.join(";")];
  rows.forEach(r => csvRows.push(r.join(";")));
  const csvString = "\uFEFF" + csvRows.join("\r\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Morocco_Pipeline_Tracking_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast("Export Completed", `${dealsToExport.length} deals exported to CSV format.`);
}

// ── 14. FORMATTING & UI HELPERS ───────────────────────────────────────────
function formatCurrencyEUR(num) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(num || 0);
}

function formatDateFR(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(title, message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  const icon = (type === "error" || type === "warning") ? "alert-circle" : "check-circle-2";
  const iconColor = type === "error" ? "var(--brand-red)" : (type === "warning" ? "var(--brand-amber)" : "var(--brand-green)");
  toast.innerHTML = `<i data-lucide="${icon}" style="color:${iconColor}; width:18px; height:18px;"></i> <div><strong>${escapeHtml(title)}</strong> : ${escapeHtml(message)}</div>`;
  initLucide();
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}
