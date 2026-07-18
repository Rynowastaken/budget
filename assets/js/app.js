const sessionKey = "finance-manager-active-profile-v2";
const persistentSessionKey = "finance-manager-remembered-profile-v1";
const todayISO = () => new Date().toLocaleDateString("en-CA");

const defaults = {
  dailyQuota: 25,
  totalAmount: 500,
  currency: "USD",
  rolloverEnabled: true,
  background: "",
  palette: ["#f0a8c8", "#e8b86d", "#51314a", "#f07178", "#151018"],
  startDate: todayISO(),
  dailyOverrides: {},
  expenses: [],
};

const els = {
  authScreen: document.getElementById("authScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  profileSelect: document.getElementById("profileSelect"),
  profileName: document.getElementById("profileName"),
  profilePin: document.getElementById("profilePin"),
  rememberLogin: document.getElementById("rememberLogin"),
  authLogo: document.getElementById("authLogo"),
  serverLogo: document.getElementById("serverLogo"),
  authMessage: document.getElementById("authMessage"),
  appMessage: document.getElementById("appMessage"),
  todayLabel: document.getElementById("todayLabel"),
  activeProfileLabel: document.getElementById("activeProfileLabel"),
  quotaSummary: document.getElementById("quotaSummary"),
  quotaDetails: document.getElementById("quotaDetails"),
  quotaDetailsSummary: document.getElementById("quotaDetailsSummary"),
  quotaDetailsContent: document.getElementById("quotaDetailsContent"),
  expenseSummary: document.getElementById("expenseSummary"),
  dailyQuota: document.getElementById("dailyQuota"),
  todayQuota: document.getElementById("todayQuota"),
  totalAmount: document.getElementById("totalAmount"),
  currencyCode: document.getElementById("currencyCode"),
  rolloverEnabled: document.getElementById("rolloverEnabled"),
  settingsForm: document.getElementById("settingsForm"),
  overviewTab: document.getElementById("overviewTab"),
  activityTab: document.getElementById("activityTab"),
  overviewPanel: document.getElementById("overviewPanel"),
  activityPanel: document.getElementById("activityPanel"),
  activityLayout: document.getElementById("activityLayout"),
  expenseForm: document.getElementById("expenseForm"),
  expenseFormTitle: document.getElementById("expenseFormTitle"),
  expenseSubmit: document.getElementById("expenseSubmit"),
  cancelExpenseEdit: document.getElementById("cancelExpenseEdit"),
  expenseAmount: document.getElementById("expenseAmount"),
  expenseName: document.getElementById("expenseName"),
  expenseNameSuggestions: document.getElementById("expenseNameSuggestions"),
  expenseDateToggle: document.getElementById("expenseDateToggle"),
  expenseDateLabel: document.getElementById("expenseDateLabel"),
  expenseCalendar: document.getElementById("expenseCalendar"),
  expenseMonthLabel: document.getElementById("expenseMonthLabel"),
  expensePrevMonth: document.getElementById("expensePrevMonth"),
  expenseNextMonth: document.getElementById("expenseNextMonth"),
  expenseCalendarGrid: document.getElementById("expenseCalendarGrid"),
  dailyRemaining: document.getElementById("dailyRemaining"),
  totalRemaining: document.getElementById("totalRemaining"),
  spentToday: document.getElementById("spentToday"),
  rolloverStatus: document.getElementById("rolloverStatus"),
  dailyBar: document.getElementById("dailyBar"),
  totalBar: document.getElementById("totalBar"),
  activityDateToggle: document.getElementById("activityDateToggle"),
  activityPrevDay: document.getElementById("activityPrevDay"),
  activityNextDay: document.getElementById("activityNextDay"),
  activityDateLabel: document.getElementById("activityDateLabel"),
  activityCalendar: document.getElementById("activityCalendar"),
  activityMonthLabel: document.getElementById("activityMonthLabel"),
  activityPrevMonth: document.getElementById("activityPrevMonth"),
  activityNextMonth: document.getElementById("activityNextMonth"),
  activityCalendarGrid: document.getElementById("activityCalendarGrid"),
  expenseList: document.getElementById("expenseList"),
  emptyState: document.getElementById("emptyState"),
  toggleExpenseForm: document.getElementById("toggleExpenseForm"),
  backgroundInput: document.getElementById("backgroundInput"),
  uploadBackground: document.getElementById("uploadBackground"),
  clearBackground: document.getElementById("clearBackground"),
  resetData: document.getElementById("resetData"),
  switchProfile: document.getElementById("switchProfile"),
  changeServer: document.getElementById("changeServer"),
  changeServerAuth: document.getElementById("changeServerAuth"),
  headerMenu: document.getElementById("headerMenu"),
  headerMenuToggle: document.getElementById("headerMenuToggle"),
  headerMenuPanel: document.getElementById("headerMenuPanel"),
  activityHeatmap: document.getElementById("activityHeatmap"),
  activityHeatmapViewport: document.getElementById("activityHeatmapViewport"),
};

let currentUser = null;
let session = loadSession();
let state = { ...defaults };
let selectedActivityDate = todayISO();
let visibleActivityMonth = monthStart(selectedActivityDate);
let selectedExpenseDate = todayISO();
let visibleExpenseMonth = monthStart(selectedExpenseDate);
let editingExpenseId = "";
let animatedExpenseId = "";
let animatedExpenseDate = "";
let animatedSuggestionName = "";
let lastSavedPayload = "";
let stateEtag = "";
let pendingSave = Promise.resolve();
let serverAssets = {};
let quotaDetailsAnimation = null;
let quotaDetailsExpanded = els.quotaDetails.open;
let activityHeatmapZoom = 1;
let activityHeatmapPinch = null;
let activityDateSwipe = null;
let suppressActivityDateClick = false;
let expenseRowSwipe = null;
let suppressExpenseSwipeClick = false;
const assetCacheKey = "finance-manager-assets-v1";
const androidBridge = window.FinanceManagerAndroid;
document.body.classList.toggle("android-webview", Boolean(androidBridge?.changeServer));

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(sessionKey)) || JSON.parse(localStorage.getItem(persistentSessionKey)) || null;
  } catch {
    return null;
  }
}

function saveSession(userId, pin, remember = false) {
  session = { userId, pin, remember };
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  if (remember) {
    localStorage.setItem(persistentSessionKey, JSON.stringify(session));
  } else {
    localStorage.removeItem(persistentSessionKey);
  }
}

function clearSession() {
  session = null;
  sessionStorage.removeItem(sessionKey);
  localStorage.removeItem(persistentSessionKey);
}

function normalizeProfileName(name) {
  return name.trim().toLowerCase();
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (session?.userId) headers["X-Profile-Id"] = session.userId;
  if (session?.pin !== undefined) headers["X-Profile-Pin"] = session.pin;

  const response = await fetch(path, { ...options, headers });
  if (response.status === 304) {
    return { notModified: true, _etag: response.headers.get("ETag") || "" };
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  payload._etag = response.headers.get("ETag") || "";
  return payload;
}

function cssUrl(value) {
  return `url("${String(value || "").replace(/"/g, "%22")}")`;
}

async function loadServerAssets() {
  const cached = loadCachedAssets();
  if (cached?.assets) {
    applyServerAssets(cached.assets);
  }
  try {
    const payload = await api("/api/assets", {
      headers: cached?.etag ? { "If-None-Match": cached.etag } : {},
    });
    if (payload.notModified) return;
    serverAssets = payload.assets || {};
    cacheAssets(serverAssets, payload._etag);
    applyServerAssets(serverAssets);
  } catch {
    serverAssets = cached?.assets || {};
  }
}

function loadCachedAssets() {
  try {
    return JSON.parse(localStorage.getItem(assetCacheKey)) || null;
  } catch {
    return null;
  }
}

function cacheAssets(assets, etag) {
  if (!etag) return;
  localStorage.setItem(assetCacheKey, JSON.stringify({ assets, etag }));
}

function applyServerAssets(assets) {
  serverAssets = assets || {};
  if (serverAssets.logo?.url) {
    els.authLogo.src = serverAssets.logo.url;
    els.serverLogo.src = serverAssets.logo.url;
  }
  if (serverAssets.background?.url) {
    document.documentElement.style.setProperty("--server-bg", cssUrl(serverAssets.background.url));
  }
}

async function loadStateFromServer() {
  const payload = await api("/api/state", {
    headers: stateEtag ? { "If-None-Match": stateEtag } : {},
  });
  if (payload.notModified) return;
  applyServerState(payload);
}

function applyServerState(payload) {
  currentUser = payload.user;
  state = { ...defaults, ...payload.state, startDate: payload.state?.startDate || todayISO() };
  stateEtag = payload._etag || stateEtag;
  lastSavedPayload = statePayload(false);
}

async function uploadCustomBackground(image) {
  const payload = await api("/api/background", {
    method: "POST",
    body: JSON.stringify({ image }),
  });
  if (!payload.background?.url) throw new Error("Server did not save the background.");
  return payload.background.url;
}

function statePayload(includeBackground = false, fields = null) {
  const nextState = { ...(fields || state) };
  if (!includeBackground) {
    delete nextState.background;
  }
  return JSON.stringify({ state: nextState });
}

async function saveState(options = {}) {
  if (!currentUser) return;
  const isPartial = Boolean(options.fields);
  const payload = statePayload(Boolean(options.includeBackground), options.fields);
  if (!isPartial && payload === lastSavedPayload) return pendingSave;
  if (!isPartial) lastSavedPayload = payload;
  const queue = pendingSave.catch(() => {});
  pendingSave = queue.then(() => api("/api/state", {
    method: "PUT",
    body: payload,
    headers: { Prefer: "return=minimal" },
  })).then((response) => {
    stateEtag = response?._etag || stateEtag;
    lastSavedPayload = statePayload(false);
    return response;
  }).catch((error) => {
    lastSavedPayload = "";
    throw error;
  });
  return pendingSave;
}

async function addExpense(expense) {
  if (!currentUser) return;
  state.expenses.push(expense);
  lastSavedPayload = statePayload(false);
  const queue = pendingSave.catch(() => {});
  pendingSave = queue.then(() => api("/api/expenses", {
    method: "POST",
    body: JSON.stringify({ expense }),
    headers: { Prefer: "return=minimal" },
  })).then((response) => {
    stateEtag = response?._etag || stateEtag;
    return response;
  }).catch((error) => {
    state.expenses = state.expenses.filter((entry) => entry.id !== expense.id);
    lastSavedPayload = "";
    throw error;
  });
  return pendingSave;
}

async function deleteExpense(id) {
  if (!currentUser) return;
  const previousExpenses = state.expenses;
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  lastSavedPayload = statePayload(false);
  const queue = pendingSave.catch(() => {});
  pendingSave = queue.then(() => api(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  })).then((response) => {
    stateEtag = response?._etag || stateEtag;
    return response;
  }).catch((error) => {
    state.expenses = previousExpenses;
    lastSavedPayload = "";
    throw error;
  });
  return pendingSave;
}

async function updateExpense(expense) {
  if (!currentUser) return;
  const previousExpenses = state.expenses;
  state.expenses = state.expenses.map((entry) => entry.id === expense.id ? expense : entry);
  lastSavedPayload = statePayload(false);
  const queue = pendingSave.catch(() => {});
  pendingSave = queue.then(() => api(`/api/expenses/${encodeURIComponent(expense.id)}`, {
    method: "PUT",
    body: JSON.stringify({ expense }),
    headers: { Prefer: "return=minimal" },
  })).then((response) => {
    stateEtag = response?._etag || stateEtag;
    return response;
  }).catch((error) => {
    state.expenses = previousExpenses;
    lastSavedPayload = "";
    throw error;
  });
  return pendingSave;
}

async function getUsers() {
  try {
    const payload = await api("/api/profiles");
    return payload.users || [];
  } catch {
    return [];
  }
}

function getActiveUser() {
  return currentUser;
}

function showAuth(message = "", clearSaved = true) {
  const previousSession = session;
  currentUser = null;
  state = { ...defaults };
  lastSavedPayload = "";
  stateEtag = "";
  if (clearSaved) {
    clearSession();
  }
  els.authScreen.classList.remove("hidden");
  els.appShell.classList.add("hidden");
  els.appShell.classList.remove("flex");
  els.authMessage.textContent = message;
  els.rememberLogin.checked = Boolean(!clearSaved && previousSession?.remember);
  if (!clearSaved && previousSession?.userId) {
    els.profileName.value = previousSession.userId;
    els.profilePin.value = previousSession.pin || "";
  }
  renderProfileOptions();
  setTheme(defaults.palette);
}

function showApp() {
  els.authScreen.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  els.appShell.classList.add("flex");
  resetExpenseForm();
  setExpenseFormVisible(false);
  render();
}

function showAppMessage(message, tone = "info") {
  els.appMessage.textContent = message;
  els.appMessage.classList.toggle("hidden", !message);
  els.appMessage.style.color = tone === "error" ? "var(--danger)" : "var(--primary)";
}

async function renderProfileOptions() {
  const users = await getUsers();
  els.profileSelect.innerHTML = `<option value="">New profile</option>${users
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`)
    .join("")}`;
}

async function openProfile(name, pin) {
  const cleanName = name.trim();
  const id = normalizeProfileName(cleanName);
  if (!id) {
    els.authMessage.textContent = "Enter a profile name.";
    return;
  }

  try {
    const payload = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ name: cleanName, pin }),
    });
    applyServerState(payload);
    saveSession(currentUser.id, pin, els.rememberLogin.checked);
    els.profilePin.value = "";
    showApp();
  } catch (error) {
    els.authMessage.textContent = error.message;
  }
}

function numberValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function expensesOn(date) {
  return state.expenses.filter((expense) => expense.date === date);
}

function expenseSuggestions() {
  const byName = new Map();
  for (const expense of [...state.expenses].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))) {
    const name = String(expense.name || "").trim();
    if (!name || byName.has(name.toLowerCase())) continue;
    byName.set(name.toLowerCase(), { name, amount: expense.amount });
  }
  return [...byName.values()].slice(0, 24);
}

function applyExpenseSuggestion() {
  const name = els.expenseName.value.trim().toLowerCase();
  if (!name) return;
  const suggestion = expenseSuggestions().find((entry) => entry.name.toLowerCase() === name);
  if (suggestion && !els.expenseAmount.value) {
    els.expenseAmount.value = suggestion.amount;
  }
}

function totalSpent() {
  return state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function money(value) {
  const currency = state.currency || defaults.currency;
  const zeroDecimalCurrencies = new Set(["TWD", "JPY", "KRW"]);
  const digits = zeroDecimalCurrencies.has(currency) ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function getRolloverCarry() {
  if (!state.rolloverEnabled) return 0;
  let carry = 0;
  for (const date of datesBetween(state.startDate, todayISO())) {
    const spent = expensesOn(date).reduce((sum, expense) => sum + expense.amount, 0);
    carry = quotaForDate(date) + carry - spent;
  }
  return carry;
}

function quotaForDate(date) {
  const override = state.dailyOverrides?.[date];
  return Number.isFinite(override) ? override : state.dailyQuota;
}

function datesBetween(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor < end) {
    dates.push(cursor.toLocaleDateString("en-CA"));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function dateFromISO(date) {
  const [year, month, day] = String(date || todayISO()).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function monthStart(date) {
  const parsed = date instanceof Date ? date : dateFromISO(date);
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateFromISO(date));
}

function renderActivityCalendar() {
  renderCalendar({
    selectedDate: selectedActivityDate,
    visibleMonth: visibleActivityMonth,
    label: els.activityDateLabel,
    monthLabel: els.activityMonthLabel,
    toggle: els.activityDateToggle,
    panel: els.activityCalendar,
    grid: els.activityCalendarGrid,
    dataName: "activity-date",
  });
  els.activityNextDay.disabled = selectedActivityDate >= todayISO();
  els.activityNextMonth.disabled = monthStart(visibleActivityMonth) >= monthStart(todayISO());
}

function renderExpenseCalendar() {
  renderCalendar({
    selectedDate: selectedExpenseDate,
    visibleMonth: visibleExpenseMonth,
    label: els.expenseDateLabel,
    monthLabel: els.expenseMonthLabel,
    toggle: els.expenseDateToggle,
    panel: els.expenseCalendar,
    grid: els.expenseCalendarGrid,
    dataName: "expense-date",
  });
  els.expenseNextMonth.disabled = monthStart(visibleExpenseMonth) >= monthStart(todayISO());
}

function renderCalendar(config) {
  const today = todayISO();
  const month = monthStart(config.visibleMonth);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = month.getDay();
  const start = new Date(year, monthIndex, 1 - firstWeekday);

  config.label.textContent = formatDateLabel(config.selectedDate);
  config.monthLabel.textContent = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(month);
  config.toggle.setAttribute("aria-expanded", String(!config.panel.classList.contains("hidden")));

  config.grid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = date.toLocaleDateString("en-CA");
    const inMonth = date.getMonth() === monthIndex;
    const isFuture = iso > today;
    const classes = [
      "calendar-day",
      "focus-ring",
      "text-sm",
      "font-semibold",
      iso === config.selectedDate ? "is-selected" : "",
      iso === today ? "is-today" : "",
      inMonth ? "" : "is-muted",
      isFuture ? "is-future" : "",
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-${config.dataName}="${iso}" aria-label="${formatDateLabel(iso)}"${isFuture ? ' aria-disabled="true" disabled' : ""}>${date.getDate()}</button>`;
  }).join("");
}

function scrollCalendarIntoView(panel) {
  requestAnimationFrame(() => {
    if (!panel) return;
    const margin = 16;
    const rect = panel.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    let top = 0;
    if (rect.bottom > viewportHeight - margin) {
      top = rect.bottom - viewportHeight + margin;
    } else if (rect.top < margin) {
      top = rect.top - margin;
    }
    if (top) {
      window.scrollBy({ top, behavior: "smooth" });
    }
  });
}

function getMetrics() {
  const today = todayISO();
  const carry = getRolloverCarry();
  const todayQuota = quotaForDate(today);
  const todayAllowance = todayQuota + carry;
  const spent = expensesOn(today).reduce((sum, expense) => sum + expense.amount, 0);
  const dailyRemaining = todayAllowance - spent;
  const totalRemaining = state.totalAmount - totalSpent();
  return { todayQuota, todayAllowance, spent, dailyRemaining, totalRemaining, carry };
}

function setTheme(palette) {
  const [primary, accent, secondary, danger] = palette;
  const root = document.documentElement;
  root.style.setProperty("--primary", primary || "#f0a8c8");
  root.style.setProperty("--accent", accent || "#e8b86d");
  root.style.setProperty("--danger", danger || "#f07178");
  const controlBg = primary || "#f0a8c8";
  const controlHoverBg = accent || secondary || "#e8b86d";
  root.style.setProperty("--control-bg", controlBg);
  root.style.setProperty("--control-border", hexToRgba(controlBg, 0.72));
  root.style.setProperty("--control-text", readableText(controlBg));
  root.style.setProperty("--control-hover-bg", controlHoverBg);
  root.style.setProperty("--control-hover-border", hexToRgba(controlHoverBg, 0.78));
  root.style.setProperty("--control-hover-text", readableText(controlHoverBg));
  root.style.setProperty("--pink-soft", hexToRgba(primary || "#f0a8c8", 0.14));
  root.style.setProperty("--pink-ring", hexToRgba(primary || "#f0a8c8", 0.42));
  root.style.setProperty("--ring", hexToRgba(primary || "#f0a8c8", 0.42));
  root.style.setProperty("--activity-1", hexToRgba(primary || "#f0a8c8", 0.2));
  root.style.setProperty("--activity-2", hexToRgba(primary || "#f0a8c8", 0.4));
  root.style.setProperty("--activity-3", hexToRgba(primary || "#f0a8c8", 0.65));
  root.style.setProperty("--activity-4", primary || "#f0a8c8");

  if (state.background) {
    document.body.classList.add("has-bg");
    document.body.style.setProperty("--custom-bg", cssUrl(state.background));
  } else {
    document.body.classList.remove("has-bg");
    document.body.style.removeProperty("--custom-bg");
  }

  renderIcons();
}

function renderActivityHeatmap() {
  const today = dateFromISO(todayISO());
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - 209);
  const totals = new Map();
  for (const expense of state.expenses) {
    totals.set(expense.date, (totals.get(expense.date) || 0) + Number(expense.amount || 0));
  }
  const dates = Array.from({ length: 210 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = date.toLocaleDateString("en-CA");
    return { date, iso, total: totals.get(iso) || 0 };
  });
  const maxTotal = Math.max(0, ...dates.map((entry) => entry.total));
  els.activityHeatmap.innerHTML = dates.map((entry) => {
    const isFuture = entry.date > today;
    const level = entry.total > 0 && maxTotal > 0
      ? Math.max(1, Math.ceil((entry.total / maxTotal) * 4))
      : 0;
    const label = `${formatDateLabel(entry.iso)}: ${entry.total > 0 ? money(entry.total) : "No expenses"}`;
    const entering = entry.iso === animatedExpenseDate ? " is-entering" : "";
    return `<button class="activity-cell level-${level}${isFuture ? " is-future" : ""}${entering}" type="button" data-heatmap-date="${entry.iso}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${isFuture ? " disabled" : ""}></button>`;
  }).join("");
}

function setActivityHeatmapZoom(nextZoom, anchor = null) {
  const previousZoom = activityHeatmapZoom;
  activityHeatmapZoom = clamp(Math.round(nextZoom * 100) / 100, 1, 3);
  els.activityHeatmap.style.setProperty("--heatmap-mobile-width", `${activityHeatmapZoom * 100}%`);
  els.activityHeatmap.style.setProperty("--heatmap-mobile-cell-max", `${activityHeatmapZoom * 12}px`);

  if (previousZoom === activityHeatmapZoom) return;
  if (anchor) {
    void els.activityHeatmap.offsetWidth;
    els.activityHeatmapViewport.scrollLeft = (anchor.contentX * activityHeatmapZoom) - anchor.viewportX;
  }
}

function heatmapTouchDistance(touches) {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

function heatmapTouchMidpointX(touches) {
  return (touches[0].clientX + touches[1].clientX) / 2;
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function render() {
  const today = todayISO();
  const metrics = getMetrics();
  const activeUser = getActiveUser();
  selectedActivityDate = selectedActivityDate || today;
  els.todayLabel.textContent = "Hi! ";
  els.activeProfileLabel.textContent = activeUser?.name || "";
  els.dailyQuota.value = state.dailyQuota;
  els.todayQuota.value = metrics.todayQuota;
  els.totalAmount.value = state.totalAmount;
  els.currencyCode.value = state.currency || defaults.currency;
  els.rolloverEnabled.checked = state.rolloverEnabled;
  els.quotaSummary.textContent = money(metrics.todayQuota) + " today · " + money(state.dailyQuota) + " daily · " + money(state.totalAmount) + " total";
  els.expenseSummary.textContent = money(metrics.spent) + " spent today · " + state.expenses.length + " entries";
  selectedExpenseDate = selectedExpenseDate || today;
  els.expenseNameSuggestions.innerHTML = expenseSuggestions()
    .map((entry) => `
      <button class="expense-suggestion${entry.name.toLowerCase() === animatedSuggestionName ? " is-entering" : ""} focus-ring rounded-full px-3 py-1 text-sm font-semibold" type="button" data-suggest-expense="${escapeHtml(entry.name)}" data-suggest-amount="${escapeHtml(String(entry.amount))}">
        ${escapeHtml(entry.name)}
      </button>
    `)
    .join("");

  els.dailyRemaining.textContent = money(metrics.dailyRemaining);
  els.totalRemaining.textContent = money(metrics.totalRemaining);
  els.spentToday.textContent = money(metrics.spent);
  els.rolloverStatus.textContent = state.rolloverEnabled
    ? `Rollover: ${money(metrics.carry)}`
    : "Rollover off";

  const dailyPct = metrics.todayAllowance <= 0 ? 0 : clamp(metrics.dailyRemaining / metrics.todayAllowance, 0, 1) * 100;
  const totalPct = state.totalAmount <= 0 ? 0 : clamp(metrics.totalRemaining / state.totalAmount, 0, 1) * 100;
  els.dailyBar.style.width = `${dailyPct}%`;
  els.totalBar.style.width = `${totalPct}%`;
  els.dailyBar.style.background = metrics.dailyRemaining < 0 ? "var(--danger)" : "var(--primary)";
  els.totalBar.style.background = metrics.totalRemaining < 0 ? "var(--danger)" : "var(--accent)";

  const visibleExpenses = expensesOn(selectedActivityDate)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  els.emptyState.textContent = selectedActivityDate === today
    ? "No expenses today."
    : `No expenses on ${selectedActivityDate}.`;
  els.emptyState.classList.toggle("hidden", visibleExpenses.length > 0);
  els.expenseList.innerHTML = visibleExpenses
    .map(
      (expense) => `
        <li class="expense-entry${expense.id === animatedExpenseId ? " is-entering" : ""} relative overflow-hidden rounded-lg border border-black/10 bg-white/70" tabindex="0" aria-expanded="false" aria-label="${escapeHtml(expense.name || "Expense")}, ${escapeHtml(money(expense.amount))}. Swipe left for actions.">
          <div class="expense-swipe-actions" aria-hidden="true" inert>
            <button class="focus-ring icon-control rounded-lg border border-black/10 bg-white" data-edit="${expense.id}" aria-label="Edit expense" title="Edit expense">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
            <button class="focus-ring icon-control rounded-lg border border-black/10 bg-white" data-delete="${expense.id}" aria-label="Delete expense" title="Delete expense">
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
          <div class="expense-entry-main grid grid-cols-[1fr_auto_auto] items-center gap-3 p-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">${escapeHtml(expense.name || "Expense")}</p>
              <p class="mt-1 text-xs font-medium" style="color: var(--muted)">${expense.date}</p>
            </div>
            <p class="expense-entry-amount text-sm font-semibold tabular-nums">${money(expense.amount)}</p>
            <div class="expense-actions-desktop gap-2">
              <button class="focus-ring icon-control rounded-lg border border-black/10 bg-white" data-edit="${expense.id}" aria-label="Edit expense" title="Edit expense">
                <i data-lucide="pencil" aria-hidden="true"></i>
              </button>
              <button class="focus-ring icon-control rounded-lg border border-black/10 bg-white" data-delete="${expense.id}" aria-label="Delete expense" title="Delete expense">
                <i data-lucide="trash-2" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </li>
      `,
    )
    .join("");

  renderActivityHeatmap();
  renderActivityCalendar();
  renderExpenseCalendar();
  setTheme(state.palette);
  animatedExpenseId = "";
  animatedExpenseDate = "";
  animatedSuggestionName = "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function readableText(hex) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 130 ? "#ffffff" : "#15201d";
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function srgbToLinear(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function rgbToOklab(r, g, b) {
  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const lightness = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const labB = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const chroma = Math.hypot(a, labB);
  const hue = (Math.atan2(labB, a) * 180 / Math.PI + 360) % 360;
  return { lightness, a, b: labB, chroma, hue };
}

function colorDistance(first, second) {
  return Math.hypot(
    first.lightness - second.lightness,
    first.a - second.a,
    first.b - second.b,
  );
}

function hueDistance(first, second) {
  const difference = Math.abs(first - second);
  return Math.min(difference, 360 - difference);
}

function mix(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca.r * (1 - amount) + cb.r * amount,
    ca.g * (1 - amount) + cb.g * amount,
    ca.b * (1 - amount) + cb.b * amount,
  );
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showTab(panelId) {
  const isActivity = panelId === "activityPanel";
  els.overviewPanel.classList.toggle("hidden", isActivity);
  els.activityPanel.classList.toggle("hidden", !isActivity);
  els.overviewTab.setAttribute("aria-selected", String(!isActivity));
  els.activityTab.setAttribute("aria-selected", String(isActivity));
  renderIcons();
}

function prepareBackground(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 960;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.68));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function extractPalette(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const size = 96;
      const scale = Math.min(1, size / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const buckets = new Map();
      let sampledPixels = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if (a < 160) continue;
        const key = `${Math.floor(r / 24)},${Math.floor(g / 24)},${Math.floor(b / 24)}`;
        const current = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
        current.r += r;
        current.g += g;
        current.b += b;
        current.count += 1;
        buckets.set(key, current);
        sampledPixels += 1;
      }

      if (!sampledPixels || !buckets.size) {
        resolve([...defaults.palette]);
        return;
      }

      const candidates = [...buckets.values()]
        .map((bucket) => {
          const r = bucket.r / bucket.count;
          const g = bucket.g / bucket.count;
          const b = bucket.b / bucket.count;
          return {
            color: rgbToHex(r, g, b),
            population: bucket.count / sampledPixels,
            ...rgbToOklab(r, g, b),
          };
        })
        .filter((candidate) => candidate.population >= 0.0005)
        .sort((first, second) => second.population - first.population);

      const chromatic = candidates.filter(
        (candidate) => candidate.chroma >= 0.035
          && candidate.lightness >= 0.18
          && candidate.lightness <= 0.93,
      );

      function choose(pool, score, selected = [], minimumDistance = 0.085) {
        return pool
          .filter((candidate) => selected.every((color) => colorDistance(candidate, color) >= minimumDistance))
          .map((candidate) => ({ candidate, score: score(candidate) }))
          .sort((first, second) => second.score - first.score)[0]?.candidate;
      }

      let primary = choose(
        chromatic.filter((candidate) => candidate.lightness >= 0.4 && candidate.lightness <= 0.86),
        (candidate) => {
          const lightnessFit = 1 - Math.min(0.6, Math.abs(candidate.lightness - 0.66));
          return (candidate.chroma ** 1.45) * (candidate.population ** 0.22) * lightnessFit;
        },
      );

      if (!primary) {
        primary = choose(
          candidates.filter((candidate) => candidate.lightness >= 0.3 && candidate.lightness <= 0.88),
          (candidate) => candidate.population * (0.25 + candidate.chroma),
        );
      }

      let accent = primary && choose(
        chromatic.filter((candidate) => candidate.lightness >= 0.3 && candidate.lightness <= 0.9),
        (candidate) => {
          const separation = 0.25 + 1.5 * Math.min(1, hueDistance(candidate.hue, primary.hue) / 90);
          const brightnessFit = 1 - Math.min(0.55, Math.abs(candidate.lightness - 0.7));
          return (candidate.chroma ** 1.15) * (candidate.population ** 0.14) * separation * brightnessFit;
        },
        [primary],
        0.1,
      );

      let secondary = primary && choose(
        chromatic.filter((candidate) => candidate.lightness >= 0.2 && candidate.lightness <= 0.58),
        (candidate) => (
          (0.2 + candidate.chroma)
          * (candidate.population ** 0.38)
          * (1.1 - candidate.lightness)
        ),
        [primary, ...(accent ? [accent] : [])],
        0.075,
      );

      const primaryColor = primary?.color || defaults.palette[0];
      const primaryLab = primary || rgbToOklab(...Object.values(hexToRgb(primaryColor)));

      if (!accent) {
        accent = {
          color: defaults.palette[1],
          ...rgbToOklab(...Object.values(hexToRgb(defaults.palette[1]))),
        };
      }
      if (!secondary) {
        const derived = mix(primaryColor, "#17121b", primaryLab.lightness < 0.52 ? 0.35 : 0.62);
        secondary = { color: derived, ...rgbToOklab(...Object.values(hexToRgb(derived))) };
      }

      const neutral = choose(
        candidates.filter((candidate) => candidate.lightness >= 0.72 && candidate.lightness <= 0.96),
        (candidate) => candidate.population * (1.1 - Math.min(candidate.chroma, 0.3)),
        [primaryLab, accent, secondary],
        0.06,
      );

      resolve([
        primaryColor,
        accent.color,
        secondary.color,
        defaults.palette[3],
        neutral?.color || defaults.palette[4],
      ]);
    };
    image.onerror = () => resolve(defaults.palette);
    image.src = dataUrl;
  });
}

function resetExpenseForm() {
  els.expenseAmount.value = "";
  els.expenseName.value = "";
  editingExpenseId = "";
  els.expenseFormTitle.textContent = "New expense";
  els.expenseSubmit.setAttribute("aria-label", "Add expense");
  els.expenseSubmit.title = "Add expense";
  els.expenseSubmit.innerHTML = '<i data-lucide="plus" aria-hidden="true"></i>';
  els.cancelExpenseEdit.classList.add("hidden");
  els.expenseCalendar.classList.add("hidden");
  renderExpenseCalendar();
  renderIcons();
}

function setExpenseFormVisible(isVisible) {
  els.expenseForm.classList.toggle("hidden", !isVisible);
  els.activityLayout.classList.toggle("is-form-open", isVisible);
  els.toggleExpenseForm.classList.toggle("hidden", isVisible);
  els.cancelExpenseEdit.classList.toggle("hidden", !isVisible);
  els.toggleExpenseForm.setAttribute("aria-expanded", String(isVisible));
  els.toggleExpenseForm.setAttribute("aria-label", "Add expense");
  els.toggleExpenseForm.title = "Add expense";
  els.toggleExpenseForm.innerHTML = '<i data-lucide="plus" aria-hidden="true"></i>';
  renderIcons();
}

function selectSharedDate(date) {
  const today = todayISO();
  const requestedDate = date || today;
  const nextDate = requestedDate > today ? today : requestedDate;
  selectedActivityDate = nextDate;
  selectedExpenseDate = nextDate;
  visibleActivityMonth = monthStart(nextDate);
  visibleExpenseMonth = monthStart(nextDate);
}

function startExpenseEdit(expense) {
  setExpenseFormVisible(true);
  editingExpenseId = expense.id;
  els.expenseAmount.value = expense.amount;
  els.expenseName.value = expense.name || "";
  selectSharedDate(expense.date);
  els.expenseFormTitle.textContent = "Edit expense";
  els.expenseSubmit.setAttribute("aria-label", "Save expense");
  els.expenseSubmit.title = "Save expense";
  els.expenseSubmit.innerHTML = '<i data-lucide="save" aria-hidden="true"></i>';
  els.cancelExpenseEdit.classList.remove("hidden");
  renderActivityCalendar();
  renderExpenseCalendar();
  renderIcons();
}

els.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const nextDailyQuota = numberValue(els.dailyQuota.value);
  const nextRolloverEnabled = els.rolloverEnabled.checked;
  const quotaChanged = nextDailyQuota !== state.dailyQuota;
  const rolloverTurnedOn = nextRolloverEnabled && !state.rolloverEnabled;
  if (quotaChanged || rolloverTurnedOn) {
    state.startDate = todayISO();
  }
  state.dailyQuota = nextDailyQuota;
  state.dailyOverrides = state.dailyOverrides || {};
  state.dailyOverrides[todayISO()] = numberValue(els.todayQuota.value);
  state.totalAmount = numberValue(els.totalAmount.value);
  state.currency = els.currencyCode.value;
  state.rolloverEnabled = nextRolloverEnabled;
  await saveState({
    fields: {
      dailyQuota: state.dailyQuota,
      dailyOverrides: state.dailyOverrides,
      totalAmount: state.totalAmount,
      currency: state.currency,
      rolloverEnabled: state.rolloverEnabled,
      startDate: state.startDate,
    },
  });
  render();
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await openProfile(els.profileName.value, els.profilePin.value);
});

els.profileSelect.addEventListener("change", async () => {
  const users = await getUsers();
  const selected = users.find((user) => user.id === els.profileSelect.value);
  els.profileName.value = selected?.name || "";
  els.authMessage.textContent = "";
});

els.overviewTab.addEventListener("click", () => {
  showTab("overviewPanel");
});

els.activityTab.addEventListener("click", () => {
  showTab("activityPanel");
  if (!els.expenseForm.classList.contains("hidden") && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    requestAnimationFrame(() => els.expenseAmount.focus());
  }
});

els.toggleExpenseForm.addEventListener("click", () => {
  const willOpen = els.expenseForm.classList.contains("hidden");
  resetExpenseForm();
  setExpenseFormVisible(willOpen);
  if (willOpen && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    requestAnimationFrame(() => els.expenseAmount.focus());
  }
});

els.expenseName.addEventListener("change", applyExpenseSuggestion);
els.expenseName.addEventListener("blur", applyExpenseSuggestion);
els.expenseNameSuggestions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-suggest-expense]");
  if (!button) return;
  if (!els.expenseName.value.trim()) {
    els.expenseName.value = button.dataset.suggestExpense || "";
  }
  if (!els.expenseAmount.value.trim()) {
    els.expenseAmount.value = button.dataset.suggestAmount || "";
  }
  els.expenseAmount.focus();
});

els.expenseDateToggle.addEventListener("click", () => {
  const isOpening = els.expenseCalendar.classList.contains("hidden");
  els.expenseCalendar.classList.toggle("hidden");
  visibleExpenseMonth = monthStart(selectedExpenseDate);
  renderExpenseCalendar();
  if (isOpening) scrollCalendarIntoView(els.expenseCalendar);
});

els.expensePrevMonth.addEventListener("click", () => {
  visibleExpenseMonth = new Date(visibleExpenseMonth.getFullYear(), visibleExpenseMonth.getMonth() - 1, 1);
  renderExpenseCalendar();
});

els.expenseNextMonth.addEventListener("click", () => {
  visibleExpenseMonth = new Date(visibleExpenseMonth.getFullYear(), visibleExpenseMonth.getMonth() + 1, 1);
  renderExpenseCalendar();
});

els.expenseCalendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-expense-date]");
  if (!button) return;
  selectSharedDate(button.dataset.expenseDate);
  els.expenseCalendar.classList.add("hidden");
  renderActivityCalendar();
  renderExpenseCalendar();
});

els.expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const amount = numberValue(els.expenseAmount.value);
  if (amount <= 0) return;

  const existingExpense = state.expenses.find((expense) => expense.id === editingExpenseId);
  const expense = {
    id: existingExpense?.id || makeId(),
    amount,
    name: els.expenseName.value.trim() || "Expense",
    date: selectedExpenseDate || todayISO(),
    createdAt: existingExpense?.createdAt || Date.now(),
  };
  if (existingExpense) {
    await updateExpense(expense);
  } else {
    animatedExpenseId = expense.id;
    animatedExpenseDate = expense.date;
    animatedSuggestionName = expense.name.toLowerCase();
    await addExpense(expense);
  }
  selectSharedDate(expense.date);
  resetExpenseForm();
  setExpenseFormVisible(false);
  render();
});

els.expenseList.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    closeExpenseActionMenus();
    const expense = state.expenses.find((entry) => entry.id === editButton.dataset.edit);
    if (expense) startExpenseEdit(expense);
    return;
  }
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  if (button.dataset.delete === editingExpenseId) {
    resetExpenseForm();
    setExpenseFormVisible(false);
  }
  await deleteExpense(button.dataset.delete);
  render();
});

els.cancelExpenseEdit.addEventListener("click", () => {
  resetExpenseForm();
  setExpenseFormVisible(false);
});

function setExpenseRowSwiped(row, isOpen) {
  if (!row) return;
  if (isOpen) closeExpenseActionMenus(row);
  row.classList.toggle("is-swiped", isOpen);
  row.setAttribute("aria-expanded", String(isOpen));
  const actions = row.querySelector(".expense-swipe-actions");
  actions?.setAttribute("aria-hidden", String(!isOpen));
  if (isOpen) {
    actions?.removeAttribute("inert");
  } else {
    actions?.setAttribute("inert", "");
  }
}

function closeExpenseActionMenus(except = null) {
  for (const row of els.expenseList.querySelectorAll(".expense-entry.is-swiped")) {
    if (row === except) continue;
    row.classList.remove("is-swiped");
    row.setAttribute("aria-expanded", "false");
    const actions = row.querySelector(".expense-swipe-actions");
    actions?.setAttribute("aria-hidden", "true");
    actions?.setAttribute("inert", "");
  }
}

els.expenseList.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1 || !window.matchMedia("(max-width: 639px)").matches) return;
  if (event.target.closest(".expense-swipe-actions")) return;
  const row = event.target.closest(".expense-entry");
  if (!row) return;
  closeExpenseActionMenus(row);
  const touch = event.touches[0];
  expenseRowSwipe = {
    row,
    wasOpen: row.classList.contains("is-swiped"),
    startX: touch.clientX,
    startY: touch.clientY,
    lastX: touch.clientX,
    lastY: touch.clientY,
  };
}, { passive: true });

els.expenseList.addEventListener("touchmove", (event) => {
  if (!expenseRowSwipe || event.touches.length !== 1) return;
  const touch = event.touches[0];
  expenseRowSwipe.lastX = touch.clientX;
  expenseRowSwipe.lastY = touch.clientY;
  const deltaX = touch.clientX - expenseRowSwipe.startX;
  const deltaY = touch.clientY - expenseRowSwipe.startY;
  if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 6) return;
  event.preventDefault();
  const startOffset = expenseRowSwipe.wasOpen ? -92 : 0;
  const offset = clamp(startOffset + deltaX, -92, 0);
  const progress = Math.abs(offset) / 92;
  const actions = expenseRowSwipe.row.querySelector(".expense-swipe-actions");
  expenseRowSwipe.row.classList.add("is-swipe-dragging");
  expenseRowSwipe.row.style.setProperty("--expense-swipe-x", `${offset}px`);
  if (actions) {
    actions.style.opacity = String(progress);
    actions.style.transform = `translateX(${18 * (1 - progress)}px)`;
  }
}, { passive: false });

function finishExpenseRowSwipe(event, cancelled = false) {
  if (!expenseRowSwipe) return;
  const { row, wasOpen, startX, startY, lastX, lastY } = expenseRowSwipe;
  const touch = event.changedTouches?.[0];
  const endX = touch?.clientX ?? lastX;
  const endY = touch?.clientY ?? lastY;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const startOffset = wasOpen ? -92 : 0;
  const offset = clamp(startOffset + deltaX, -92, 0);
  const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
  const shouldOpen = cancelled || !isHorizontal ? wasOpen : offset <= -46;
  const actions = row.querySelector(".expense-swipe-actions");

  expenseRowSwipe = null;
  row.classList.remove("is-swipe-dragging");
  row.style.removeProperty("--expense-swipe-x");
  actions?.style.removeProperty("opacity");
  actions?.style.removeProperty("transform");
  setExpenseRowSwiped(row, shouldOpen);

  if (!cancelled && isHorizontal && Math.abs(deltaX) >= 12) {
    suppressExpenseSwipeClick = true;
    setTimeout(() => {
      suppressExpenseSwipeClick = false;
    }, 360);
  }
}

els.expenseList.addEventListener("touchend", (event) => finishExpenseRowSwipe(event));
els.expenseList.addEventListener("touchcancel", (event) => finishExpenseRowSwipe(event, true));

document.addEventListener("click", (event) => {
  if (event.target.closest(".expense-swipe-actions")) return;
  if (suppressExpenseSwipeClick && event.target.closest(".expense-entry")) return;
  closeExpenseActionMenus();
});

document.addEventListener("keydown", (event) => {
  const row = event.target.closest?.(".expense-entry");
  const isMobile = window.matchMedia("(max-width: 639px)").matches;
  if (row && isMobile && event.key === "ArrowLeft") {
    event.preventDefault();
    setExpenseRowSwiped(row, true);
    return;
  }
  if (row && isMobile && event.key === "ArrowRight") {
    event.preventDefault();
    setExpenseRowSwiped(row, false);
    return;
  }
  if (event.key === "Escape") {
    closeExpenseActionMenus();
    if (row && isMobile) row.focus();
  }
});

els.activityDateToggle.addEventListener("click", () => {
  if (suppressActivityDateClick) return;
  const isOpening = els.activityCalendar.classList.contains("hidden");
  els.activityCalendar.classList.toggle("hidden");
  visibleActivityMonth = monthStart(selectedActivityDate);
  render();
  if (isOpening) scrollCalendarIntoView(els.activityCalendar);
});

els.activityDateToggle.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1 || !window.matchMedia("(max-width: 639px)").matches) return;
  const touch = event.touches[0];
  activityDateSwipe = {
    startX: touch.clientX,
    startY: touch.clientY,
    lastX: touch.clientX,
    lastY: touch.clientY,
  };
}, { passive: true });

els.activityDateToggle.addEventListener("touchmove", (event) => {
  if (!activityDateSwipe || event.touches.length !== 1) return;
  const touch = event.touches[0];
  activityDateSwipe.lastX = touch.clientX;
  activityDateSwipe.lastY = touch.clientY;
  const deltaX = touch.clientX - activityDateSwipe.startX;
  const deltaY = touch.clientY - activityDateSwipe.startY;
  if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 6) return;
  event.preventDefault();
  const offset = clamp(deltaX * 0.35, -36, 36);
  els.activityDateToggle.classList.add("is-date-swiping");
  els.activityDateToggle.style.transform = `translateX(${offset}px)`;
  els.activityDateToggle.style.opacity = String(1 - Math.min(Math.abs(offset) / 180, 0.18));
}, { passive: false });

function finishActivityDateSwipe(event, cancelled = false) {
  if (!activityDateSwipe) return;
  const touch = event.changedTouches?.[0];
  const endX = touch?.clientX ?? activityDateSwipe.lastX;
  const endY = touch?.clientY ?? activityDateSwipe.lastY;
  const deltaX = endX - activityDateSwipe.startX;
  const deltaY = endY - activityDateSwipe.startY;
  const offset = clamp(deltaX * 0.35, -36, 36);
  const isSwipe = !cancelled && Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
  activityDateSwipe = null;
  els.activityDateToggle.classList.remove("is-date-swiping");
  els.activityDateToggle.style.removeProperty("transform");
  els.activityDateToggle.style.removeProperty("opacity");

  if (isSwipe) {
    suppressActivityDateClick = true;
    shiftActivityDate(deltaX < 0 ? 1 : -1);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.activityDateToggle.animate(
        [
          { transform: `translateX(${deltaX < 0 ? 12 : -12}px)`, opacity: 0.55 },
          { transform: "translateX(0)", opacity: 1 },
        ],
        { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
    setTimeout(() => {
      suppressActivityDateClick = false;
    }, 360);
    return;
  }

  if (Math.abs(offset) > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.activityDateToggle.animate(
      [
        { transform: `translateX(${offset}px)`, opacity: 0.9 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: 160, easing: "ease-out" },
    );
  }
}

els.activityDateToggle.addEventListener("touchend", (event) => finishActivityDateSwipe(event));
els.activityDateToggle.addEventListener("touchcancel", (event) => finishActivityDateSwipe(event, true));

function shiftActivityDate(days) {
  const date = dateFromISO(selectedActivityDate);
  date.setDate(date.getDate() + days);
  selectSharedDate(date.toLocaleDateString("en-CA"));
  els.activityCalendar.classList.add("hidden");
  els.expenseCalendar.classList.add("hidden");
  render();
}

els.activityPrevDay.addEventListener("click", () => shiftActivityDate(-1));
els.activityNextDay.addEventListener("click", () => shiftActivityDate(1));

els.activityPrevMonth.addEventListener("click", () => {
  visibleActivityMonth = new Date(visibleActivityMonth.getFullYear(), visibleActivityMonth.getMonth() - 1, 1);
  renderActivityCalendar();
});

els.activityNextMonth.addEventListener("click", () => {
  visibleActivityMonth = new Date(visibleActivityMonth.getFullYear(), visibleActivityMonth.getMonth() + 1, 1);
  renderActivityCalendar();
});

els.activityCalendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-activity-date]");
  if (!button) return;
  selectSharedDate(button.dataset.activityDate);
  els.activityCalendar.classList.add("hidden");
  render();
});

els.activityHeatmap.addEventListener("click", (event) => {
  const button = event.target.closest("[data-heatmap-date]");
  if (!button || button.disabled) return;
  selectSharedDate(button.dataset.heatmapDate);
  render();
});

els.activityHeatmapViewport.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 2 || !window.matchMedia("(max-width: 639px)").matches) return;
  event.preventDefault();
  const rect = els.activityHeatmapViewport.getBoundingClientRect();
  const viewportX = heatmapTouchMidpointX(event.touches) - rect.left;
  activityHeatmapPinch = {
    startDistance: heatmapTouchDistance(event.touches),
    startZoom: activityHeatmapZoom,
    anchor: {
      viewportX,
      contentX: (els.activityHeatmapViewport.scrollLeft + viewportX) / activityHeatmapZoom,
    },
  };
  els.activityHeatmapViewport.classList.add("is-pinching");
}, { passive: false });

els.activityHeatmapViewport.addEventListener("touchmove", (event) => {
  if (!activityHeatmapPinch || event.touches.length < 2) return;
  event.preventDefault();
  const distance = heatmapTouchDistance(event.touches);
  if (!activityHeatmapPinch.startDistance) return;
  setActivityHeatmapZoom(
    activityHeatmapPinch.startZoom * (distance / activityHeatmapPinch.startDistance),
    activityHeatmapPinch.anchor,
  );
}, { passive: false });

function endActivityHeatmapPinch(event) {
  if (!activityHeatmapPinch || event.touches.length >= 2) return;
  activityHeatmapPinch = null;
  els.activityHeatmapViewport.classList.remove("is-pinching");
}

els.activityHeatmapViewport.addEventListener("touchend", endActivityHeatmapPinch);
els.activityHeatmapViewport.addEventListener("touchcancel", endActivityHeatmapPinch);

els.uploadBackground.addEventListener("click", () => {
  setHeaderMenuOpen(false);
  els.backgroundInput.click();
});

els.backgroundInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      showAppMessage("Processing background...");
      const background = await prepareBackground(reader.result);
      state.palette = await extractPalette(background);
      state.background = await uploadCustomBackground(background);
      await saveState({ fields: { background: state.background, palette: state.palette }, includeBackground: true });
      showAppMessage("Background updated.");
      render();
    } catch (error) {
      showAppMessage("Background upload failed: " + error.message, "error");
    } finally {
      els.backgroundInput.value = "";
    }
  };
  reader.onerror = () => {
    showAppMessage("Background upload failed: Could not read the selected file.", "error");
    els.backgroundInput.value = "";
  };
  reader.readAsDataURL(file);
});

els.clearBackground.addEventListener("click", async () => {
  setHeaderMenuOpen(false);
  state.background = "";
  state.palette = defaults.palette;
  await saveState({ fields: { background: state.background, palette: state.palette }, includeBackground: true });
  render();
});

els.resetData.addEventListener("click", async () => {
  setHeaderMenuOpen(false);
  if (!confirm("Reset budget, expenses, and theme?")) return;
  state = { ...defaults, expenses: [] };
  await saveState({ includeBackground: true });
  render();
});

els.switchProfile.addEventListener("click", () => {
  setHeaderMenuOpen(false);
  showAuth("Logged out.");
});

function changeAndroidServer() {
  if (!androidBridge?.changeServer) return;
  setHeaderMenuOpen(false);
  androidBridge.changeServer();
}

els.changeServer?.addEventListener("click", changeAndroidServer);
els.changeServerAuth?.addEventListener("click", changeAndroidServer);

function setHeaderMenuOpen(isOpen) {
  els.headerMenu.classList.toggle("is-open", isOpen);
  els.headerMenuToggle.setAttribute("aria-expanded", String(isOpen));
  els.headerMenuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  els.headerMenuToggle.title = isOpen ? "Close menu" : "Open menu";
  els.headerMenuPanel.setAttribute("aria-hidden", String(!isOpen));
}

function setQuotaDetailsOpen(isOpen) {
  quotaDetailsExpanded = isOpen;
  els.quotaDetailsSummary.setAttribute("aria-expanded", String(isOpen));
  els.quotaDetails.classList.toggle("is-closing", !isOpen);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const currentHeight = els.quotaDetails.open
    ? els.quotaDetailsContent.getBoundingClientRect().height
    : 0;

  quotaDetailsAnimation?.cancel();
  quotaDetailsAnimation = null;

  if (reduceMotion) {
    els.quotaDetails.open = isOpen;
    els.quotaDetails.classList.remove("is-closing");
    return;
  }

  if (isOpen) {
    els.quotaDetails.open = true;
  }

  const endHeight = isOpen ? els.quotaDetailsContent.scrollHeight : 0;
  quotaDetailsAnimation = els.quotaDetailsContent.animate(
    [
      {
        height: `${currentHeight}px`,
        opacity: isOpen ? 0.35 : 1,
        transform: isOpen ? "translateY(-6px) scaleY(0.985)" : "translateY(0) scaleY(1)",
      },
      {
        height: `${endHeight}px`,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0) scaleY(1)" : "translateY(-6px) scaleY(0.985)",
      },
    ],
    {
      duration: isOpen ? 320 : 240,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  );

  const activeAnimation = quotaDetailsAnimation;
  activeAnimation.finished
    .then(() => {
      if (quotaDetailsAnimation !== activeAnimation) return;
      if (!quotaDetailsExpanded) els.quotaDetails.open = false;
      activeAnimation.cancel();
      els.quotaDetails.classList.remove("is-closing");
      quotaDetailsAnimation = null;
    })
    .catch(() => {});
}

els.quotaDetailsSummary.addEventListener("click", (event) => {
  event.preventDefault();
  setQuotaDetailsOpen(!quotaDetailsExpanded);
});

els.headerMenuToggle.addEventListener("click", () => {
  setHeaderMenuOpen(!els.headerMenu.classList.contains("is-open"));
});

document.addEventListener("click", (event) => {
  if (!els.headerMenu.classList.contains("is-open") || els.headerMenu.contains(event.target)) return;
  setHeaderMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !els.headerMenu.classList.contains("is-open")) return;
  setHeaderMenuOpen(false);
  els.headerMenuToggle.focus();
});

async function init() {
  await loadServerAssets();
  renderIcons();
  if (!session?.userId) {
    showAuth("");
    return;
  }

  try {
    await loadStateFromServer();
    showApp();
  } catch {
    showAuth("Could not open remembered profile.", false);
  }
}

init();
