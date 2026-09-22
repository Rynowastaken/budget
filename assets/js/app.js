const sessionKey = "finance-manager-active-profile-v2";
const persistentSessionKey = "finance-manager-remembered-profile-v1";
const debugDateOffsetKey = "finance-manager-debug-date-offset-v1";

const realTodayISO = () => new Date().toLocaleDateString("en-CA");

function loadDebugDateOffset() {
  const value = Number.parseInt(localStorage.getItem(debugDateOffsetKey) || "0", 10);
  return Number.isFinite(value) ? Math.min(3650, Math.max(-3650, value)) : 0;
}

let debugDateOffset = loadDebugDateOffset();

const todayISO = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + debugDateOffset);
  return date.toLocaleDateString("en-CA");
};

const defaults = {
  dailyQuota: 25,
  totalAmount: 500,
  currency: "USD",
  rolloverEnabled: true,
  splitTotalIntoDailyQuota: false,
  splitBudgetDays: 30,
  budgetResetEnabled: false,
  budgetResetDay: 1,
  resetRolloverOnBudgetReset: false,
  lastBudgetResetAt: 0,
  lastBudgetResetDate: "",
  lastRolloverResetAt: 0,
  lastRolloverResetDate: "",
  background: "",
  palette: ["#f0a8c8", "#e8b86d", "#51314a", "#f07178", "#151018"],
  colorScheme: "tonalSpot",
  themeColorfulness: 1,
  themeBrightness: 1,
  startDate: todayISO(),
  dailyOverrides: {},
  budgetAdjustments: [],
  expenses: [],
};

const colorSchemes = {
  content: { name: "Content", chroma: 1, hueOffsets: [0, 0, 0] },
  expressive: { name: "Expressive", chroma: 1.15, hueOffsets: [0, 75, 35] },
  fidelity: { name: "Fidelity", chroma: 1.05, hueOffsets: [0, 0, 0] },
  monochrome: { name: "Monochrome", chroma: 0, hueOffsets: [0, 0, 0] },
  neutral: { name: "Neutral", chroma: 0.16, hueOffsets: [0, 0, 0], chromaLimit: 0.035 },
  tonalSpot: { name: "Tonal Spot", chroma: 0.72, hueOffsets: [0, 0, 0], chromaLimit: 0.14 },
  vibrant: { name: "Vibrant", chroma: 1.5, hueOffsets: [0, 0, 0], chromaFloor: 0.12 },
  rainbow: { name: "Rainbow", chroma: 1.2, hueOffsets: [0, 110, 220], chromaFloor: 0.1 },
  fruitSalad: { name: "Fruit Salad", chroma: 1.25, hueOffsets: [-50, 50, 0], chromaFloor: 0.09 },
};

const els = {
  authScreen: document.getElementById("authScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  profileSelect: document.getElementById("profileSelect"),
  profilePicker: document.getElementById("profilePicker"),
  profilePickerToggle: document.getElementById("profilePickerToggle"),
  profilePickerValue: document.getElementById("profilePickerValue"),
  profilePickerMenu: document.getElementById("profilePickerMenu"),
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
  quotaAdvancedStatus: document.getElementById("quotaAdvancedStatus"),
  expenseSummary: document.getElementById("expenseSummary"),
  dailyQuota: document.getElementById("dailyQuota"),
  todayQuota: document.getElementById("todayQuota"),
  totalAmount: document.getElementById("totalAmount"),
  totalAmountLabel: document.getElementById("totalAmountLabel"),
  currencyCode: document.getElementById("currencyCode"),
  currencyPicker: document.getElementById("currencyPicker"),
  currencyToggle: document.getElementById("currencyToggle"),
  currencyValue: document.getElementById("currencyValue"),
  currencyMenu: document.getElementById("currencyMenu"),
  rolloverEnabled: document.getElementById("rolloverEnabled"),
  splitTotalIntoDailyQuota: document.getElementById("splitTotalIntoDailyQuota"),
  splitBudgetOptions: document.getElementById("splitBudgetOptions"),
  splitBudgetDays: document.getElementById("splitBudgetDays"),
  splitBudgetSummary: document.getElementById("splitBudgetSummary"),
  restoreManualQuotas: document.getElementById("restoreManualQuotas"),
  budgetResetEnabled: document.getElementById("budgetResetEnabled"),
  budgetResetOptions: document.getElementById("budgetResetOptions"),
  budgetResetDay: document.getElementById("budgetResetDay"),
  resetRolloverOnBudgetReset: document.getElementById("resetRolloverOnBudgetReset"),
  budgetResetSummary: document.getElementById("budgetResetSummary"),
  budgetTopUpAmount: document.getElementById("budgetTopUpAmount"),
  budgetTopUpSummary: document.getElementById("budgetTopUpSummary"),
  addBudget: document.getElementById("addBudget"),
  manualBudgetReset: document.getElementById("manualBudgetReset"),
  settingsForm: document.getElementById("settingsForm"),
  overviewTab: document.getElementById("overviewTab"),
  activityTab: document.getElementById("activityTab"),
  overviewPanel: document.getElementById("overviewPanel"),
  activityPanel: document.getElementById("activityPanel"),
  activityLayout: document.getElementById("activityLayout"),
  activitySelectedMeta: document.getElementById("activitySelectedMeta"),
  activitySelectedTotal: document.getElementById("activitySelectedTotal"),
  activityExpenseCount: document.getElementById("activityExpenseCount"),
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
  todayRemainingLabel: document.getElementById("todayRemainingLabel"),
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
  openSettings: document.getElementById("openSettings"),
  settingsDialog: document.getElementById("settingsDialog"),
  settingsDialogClose: document.getElementById("settingsDialogClose"),
  colorSchemeOptions: document.getElementById("colorSchemeOptions"),
  colorSchemePreview: document.getElementById("colorSchemePreview"),
  themeColorfulness: document.getElementById("themeColorfulness"),
  themeColorfulnessValue: document.getElementById("themeColorfulnessValue"),
  themeBrightness: document.getElementById("themeBrightness"),
  themeBrightnessValue: document.getElementById("themeBrightnessValue"),
  debugDatePicker: document.getElementById("debugDatePicker"),
  debugDateOffsetLabel: document.getElementById("debugDateOffsetLabel"),
  debugPrevDay: document.getElementById("debugPrevDay"),
  debugResetDate: document.getElementById("debugResetDate"),
  debugNextDay: document.getElementById("debugNextDay"),
  applyColorScheme: document.getElementById("applyColorScheme"),
  uploadBackground: document.getElementById("uploadBackground"),
  backgroundUploadDialog: document.getElementById("backgroundUploadDialog"),
  backgroundUploadClose: document.getElementById("backgroundUploadClose"),
  backgroundDropzone: document.getElementById("backgroundDropzone"),
  backgroundChooseFile: document.getElementById("backgroundChooseFile"),
  backgroundUploadPreview: document.getElementById("backgroundUploadPreview"),
  backgroundUploadPreviewImage: document.getElementById("backgroundUploadPreviewImage"),
  backgroundUploadPreviewName: document.getElementById("backgroundUploadPreviewName"),
  backgroundUploadPreviewSource: document.getElementById("backgroundUploadPreviewSource"),
  backgroundUploadStatus: document.getElementById("backgroundUploadStatus"),
  backgroundUploadCancel: document.getElementById("backgroundUploadCancel"),
  backgroundUploadApply: document.getElementById("backgroundUploadApply"),
  clearBackground: document.getElementById("clearBackground"),
  clearBackgroundConfirmDialog: document.getElementById("clearBackgroundConfirmDialog"),
  clearBackgroundConfirmCancel: document.getElementById("clearBackgroundConfirmCancel"),
  clearBackgroundConfirmSubmit: document.getElementById("clearBackgroundConfirmSubmit"),
  resetData: document.getElementById("resetData"),
  resetConfirmDialog: document.getElementById("resetConfirmDialog"),
  resetConfirmCancel: document.getElementById("resetConfirmCancel"),
  resetConfirmSubmit: document.getElementById("resetConfirmSubmit"),
  logoutConfirmDialog: document.getElementById("logoutConfirmDialog"),
  logoutConfirmCancel: document.getElementById("logoutConfirmCancel"),
  logoutConfirmSubmit: document.getElementById("logoutConfirmSubmit"),
  switchProfile: document.getElementById("switchProfile"),
  changeServer: document.getElementById("changeServer"),
  changeServerAuth: document.getElementById("changeServerAuth"),
  headerMenu: document.getElementById("headerMenu"),
  headerMenuToggle: document.getElementById("headerMenuToggle"),
  headerMenuPanel: document.getElementById("headerMenuPanel"),
  activityHeatmap: document.getElementById("activityHeatmap"),
  activityHeatmapMonth: document.getElementById("activityHeatmapMonth"),
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
let activityHeatmapPan = null;
let activityHeatmapBaseCellSize = 0;
let suppressActivityHeatmapClick = false;
let activityDateSwipe = null;
let suppressActivityDateClick = false;
let expenseRowSwipe = null;
let suppressExpenseSwipeClick = false;
let pendingColorScheme = defaults.colorScheme;
let pendingThemeColorfulness = defaults.themeColorfulness;
let pendingThemeBrightness = defaults.themeBrightness;
let settingsDialogAnimation = null;
let pendingBackgroundImage = "";
let pendingBackgroundImageName = "";
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
  state.splitTotalIntoDailyQuota = Boolean(state.splitTotalIntoDailyQuota);
  state.splitBudgetDays = normalizeSplitBudgetDays(state.splitBudgetDays);
  state.budgetAdjustments = Array.isArray(state.budgetAdjustments) ? state.budgetAdjustments : [];
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

function setProfilePickerOpen(isOpen, focusSelected = false) {
  els.profilePicker.classList.toggle("is-open", isOpen);
  els.profilePickerMenu.classList.toggle("hidden", !isOpen);
  els.profilePickerToggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen && focusSelected) {
    requestAnimationFrame(() => {
      (els.profilePickerMenu.querySelector('[aria-selected="true"]')
        || els.profilePickerMenu.querySelector("[data-profile-id]"))?.focus();
    });
  }
}

function syncProfilePicker() {
  const selectedValue = els.profileSelect.value || "";
  const selectedOption = els.profilePickerMenu.querySelector(
    `[data-profile-id="${CSS.escape(selectedValue)}"]`,
  );
  els.profilePickerMenu.querySelectorAll("[data-profile-id]").forEach((option) => {
    option.setAttribute("aria-selected", String(option.dataset.profileId === selectedValue));
  });

  const nativeOption = [...els.profileSelect.options].find((option) => option.value === selectedValue);
  els.profilePickerValue.textContent = nativeOption?.textContent || "New profile";

  const icon = els.profilePickerToggle.querySelector(".profile-picker-value-icon");
  if (icon) {
    icon.innerHTML = selectedValue
      ? '<i data-lucide="user-round" aria-hidden="true"></i>'
      : '<i data-lucide="user-round-plus" aria-hidden="true"></i>';
    renderIcons();
  }

  return selectedOption;
}

function chooseProfile(profileId) {
  const nextValue = profileId || "";
  els.profileSelect.value = nextValue;
  const nativeOption = [...els.profileSelect.options].find((option) => option.value === nextValue);
  els.profileName.value = nextValue ? (nativeOption?.textContent || "") : "";
  els.profilePin.value = "";
  els.authMessage.textContent = "";
  syncProfilePicker();
  setProfilePickerOpen(false);
  els.profilePickerToggle.focus();
}

async function renderProfileOptions() {
  const users = await getUsers();
  const previousValue = els.profileSelect.value || "";
  els.profileSelect.innerHTML = `<option value="">New profile</option>${users
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`)
    .join("")}`;

  const hasPrevious = [...els.profileSelect.options].some((option) => option.value === previousValue);
  els.profileSelect.value = hasPrevious ? previousValue : "";

  els.profilePickerMenu.innerHTML = [
    `
      <button class="profile-picker-option focus-ring" type="button" role="option" data-profile-id="">
        <span class="profile-picker-option-main">
          <span class="profile-picker-option-icon" aria-hidden="true">
            <i data-lucide="user-round-plus"></i>
          </span>
          <span class="profile-picker-option-copy">
            <strong>New profile</strong>
            <small>Create another local profile</small>
          </span>
        </span>
        <i class="profile-picker-option-check" data-lucide="check" aria-hidden="true"></i>
      </button>
    `,
    ...users.map((user) => `
      <button class="profile-picker-option focus-ring" type="button" role="option" data-profile-id="${escapeHtml(user.id)}">
        <span class="profile-picker-option-main">
          <span class="profile-picker-option-icon" aria-hidden="true">
            <i data-lucide="user-round"></i>
          </span>
          <span class="profile-picker-option-copy">
            <strong>${escapeHtml(user.name)}</strong>
            <small>Saved profile</small>
          </span>
        </span>
        <i class="profile-picker-option-check" data-lucide="check" aria-hidden="true"></i>
      </button>
    `),
  ].join("");

  syncProfilePicker();
  renderIcons();
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
  return state.expenses
    .filter((expense) => expenseOccursAfterBoundary(expense, currentBudgetBoundary()))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function budgetAdded() {
  const boundary = currentBudgetBoundary();
  return state.budgetAdjustments
    .filter((adjustment) => expenseOccursAfterBoundary(adjustment, boundary))
    .reduce((sum, adjustment) => sum + Number(adjustment.amount || 0), 0);
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
  if (!state.rolloverEnabled || state.splitTotalIntoDailyQuota) return 0;
  const boundary = currentRolloverBoundary();
  let carry = 0;
  for (const date of datesBetween(boundary.date, todayISO())) {
    const spent = expensesOn(date)
      .filter((expense) => expenseOccursAfterBoundary(expense, boundary))
      .reduce((sum, expense) => sum + expense.amount, 0);
    carry = quotaForDate(date) + carry - spent;
  }
  return carry;
}

function quotaForDate(date) {
  const override = state.dailyOverrides?.[date];
  return Number.isFinite(override) ? override : state.dailyQuota;
}

function normalizeSplitBudgetDays(value = state.splitBudgetDays) {
  return clamp(Math.round(Number(value) || defaults.splitBudgetDays), 1, 3650);
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

function isoDayNumber(date) {
  const parsed = dateFromISO(date);
  return Math.round(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) / 86400000);
}

function syncDebugDateControls() {
  if (!els.debugDatePicker) return;
  const simulatedToday = todayISO();
  const offset = debugDateOffset;
  els.debugDatePicker.value = simulatedToday;
  els.debugDateOffsetLabel.textContent = offset === 0
    ? `Using the real device date (${formatDateLabel(realTodayISO())}).`
    : `${Math.abs(offset)} day${Math.abs(offset) === 1 ? "" : "s"} ${offset > 0 ? "ahead of" : "behind"} the real date · Real today: ${formatDateLabel(realTodayISO())}.`;
  els.debugResetDate.disabled = offset === 0;
}

function setDebugDateOffset(nextOffset) {
  debugDateOffset = clamp(Math.round(Number(nextOffset) || 0), -3650, 3650);
  if (debugDateOffset === 0) {
    localStorage.removeItem(debugDateOffsetKey);
  } else {
    localStorage.setItem(debugDateOffsetKey, String(debugDateOffset));
  }
  selectSharedDate(todayISO());
  syncDebugDateControls();
  render();
}

function setDebugDate(date) {
  if (!date) return;
  setDebugDateOffset(isoDayNumber(date) - isoDayNumber(realTodayISO()));
}

function normalizeBudgetResetDay(value = state.budgetResetDay) {
  return clamp(Math.round(Number(value) || 1), 1, 31);
}

function resetDateForMonth(year, monthIndex, resetDay = state.budgetResetDay) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(normalizeBudgetResetDay(resetDay), lastDay));
}

function budgetCycleStartISO(date = todayISO(), resetDay = state.budgetResetDay) {
  const target = dateFromISO(date);
  let reset = resetDateForMonth(target.getFullYear(), target.getMonth(), resetDay);
  if (target < reset) {
    reset = resetDateForMonth(target.getFullYear(), target.getMonth() - 1, resetDay);
  }
  return reset.toLocaleDateString("en-CA");
}

function nextBudgetResetISO(date = todayISO(), resetDay = state.budgetResetDay) {
  const target = dateFromISO(date);
  let reset = resetDateForMonth(target.getFullYear(), target.getMonth(), resetDay);
  if (target >= reset) {
    reset = resetDateForMonth(target.getFullYear(), target.getMonth() + 1, resetDay);
  }
  return reset.toLocaleDateString("en-CA");
}

function laterResetBoundary(first, second) {
  if (!first?.date) return second || { date: "", at: 0 };
  if (!second?.date) return first;
  if (first.date !== second.date) return first.date > second.date ? first : second;
  return Number(first.at || 0) >= Number(second.at || 0) ? first : second;
}

function currentBudgetBoundary() {
  const scheduled = state.budgetResetEnabled
    ? { date: budgetCycleStartISO(), at: 0 }
    : { date: "", at: 0 };
  const manual = {
    date: String(state.lastBudgetResetDate || ""),
    at: Number(state.lastBudgetResetAt || 0),
  };
  return laterResetBoundary(scheduled, manual);
}

function currentRolloverBoundary() {
  let boundary = { date: state.startDate || todayISO(), at: 0 };
  if (state.budgetResetEnabled && state.resetRolloverOnBudgetReset) {
    boundary = laterResetBoundary(boundary, { date: budgetCycleStartISO(), at: 0 });
  }
  boundary = laterResetBoundary(boundary, {
    date: String(state.lastRolloverResetDate || ""),
    at: Number(state.lastRolloverResetAt || 0),
  });
  return boundary;
}

function expenseOccursAfterBoundary(expense, boundary) {
  if (!boundary?.date) return true;
  if (expense.date !== boundary.date) return expense.date > boundary.date;
  if (!boundary.at) return true;
  return Number(expense.createdAt || 0) > boundary.at;
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
  const rolloverBoundary = state.rolloverEnabled ? currentRolloverBoundary() : null;
  const spent = expensesOn(today)
    .filter((expense) => !rolloverBoundary || expenseOccursAfterBoundary(expense, rolloverBoundary))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const addedBudget = budgetAdded();
  const totalBudget = state.totalAmount + addedBudget;
  const totalRemaining = totalBudget - totalSpent();
  const splitBudgetDays = normalizeSplitBudgetDays();
  const splitDailyQuota = totalRemaining / splitBudgetDays;
  const carry = getRolloverCarry();
  const todayQuota = state.splitTotalIntoDailyQuota ? splitDailyQuota : quotaForDate(today);
  const todayAllowance = state.splitTotalIntoDailyQuota ? splitDailyQuota : todayQuota + carry;
  const dailyRemaining = state.splitTotalIntoDailyQuota ? splitDailyQuota : todayAllowance - spent;
  return { todayQuota, todayAllowance, spent, dailyRemaining, totalRemaining, totalBudget, addedBudget, carry, splitBudgetDays };
}

function normalizeColorScheme(scheme) {
  if (Object.hasOwn(colorSchemes, scheme)) return scheme;
  if (["automatic", "rose", "ocean", "forest", "violet", "ember"].includes(scheme)) return "content";
  return defaults.colorScheme;
}

function normalizeThemeFactor(value) {
  return clamp(Number(value) || 1, 0.5, 1.5);
}

function paletteForScheme(
  scheme,
  colorfulness = state.themeColorfulness,
  brightness = state.themeBrightness,
) {
  const normalized = normalizeColorScheme(scheme);
  const mode = colorSchemes[normalized];
  const source = Array.isArray(state.palette) && state.palette.length >= 5
    ? state.palette
    : defaults.palette;
  const chromaFactor = normalizeThemeFactor(colorfulness);
  const lightnessOffset = (normalizeThemeFactor(brightness) - 1) * 0.18;

  const generated = source.map((color, index) => {
    if (index === 3) return color;
    const { r, g, b } = hexToRgb(color);
    const lab = rgbToOklab(r, g, b);
    const roleIndex = Math.min(index, 2);
    const hue = (lab.hue + mode.hueOffsets[roleIndex] + 360) % 360;
    let chroma = lab.chroma * mode.chroma * chromaFactor;
    if (mode.chromaFloor && lab.chroma >= 0.025) {
      chroma = Math.max(chroma, mode.chromaFloor * chromaFactor);
    }
    if (mode.chromaLimit !== undefined) {
      chroma = Math.min(chroma, mode.chromaLimit * chromaFactor);
    }
    if (index === 4) chroma *= 0.55;
    return oklchToHex(
      clamp(lab.lightness + lightnessOffset, 0.2, 0.94),
      chroma,
      hue,
    );
  });

  generated[0] = ensureColorContrast(generated[0], "#1a141f", 4.5);
  generated[1] = ensureColorContrast(generated[1]);
  return generated;
}

function renderColorSchemeOptions(selectedScheme = normalizeColorScheme(state.colorScheme)) {
  els.colorSchemeOptions.innerHTML = Object.entries(colorSchemes)
    .map(([id, scheme]) => {
      const checked = id === selectedScheme;
      return `
        <label class="color-scheme-option${checked ? " is-selected" : ""}">
          <input class="scheme-radio sr-only" type="radio" name="colorScheme" value="${id}"${checked ? " checked" : ""}>
          <span>${scheme.name}</span>
        </label>
      `;
    })
    .join("");
}

function formatThemeFactor(value) {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function renderColorSchemePreview(palette) {
  els.colorSchemePreview.innerHTML = palette
    .map((color) => `<span style="background: ${color}"></span>`)
    .join("");
}

function syncThemeAdjustmentControls() {
  els.themeColorfulness.value = pendingThemeColorfulness;
  els.themeBrightness.value = pendingThemeBrightness;
  els.themeColorfulnessValue.value = formatThemeFactor(pendingThemeColorfulness);
  els.themeBrightnessValue.value = formatThemeFactor(pendingThemeBrightness);
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
  const start = monthStart(selectedActivityDate);
  const year = start.getFullYear();
  const month = start.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const totals = new Map();
  for (const expense of state.expenses) {
    if (!expense.date?.startsWith(monthPrefix)) continue;
    totals.set(expense.date, (totals.get(expense.date) || 0) + Number(expense.amount || 0));
  }
  const dates = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const iso = date.toLocaleDateString("en-CA");
    return { date, iso, total: totals.get(iso) || 0 };
  });
  const weeks = Math.ceil((start.getDay() + daysInMonth) / 7);
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(start);
  const maxTotal = Math.max(0, ...dates.map((entry) => entry.total));
  els.activityHeatmap.style.setProperty("--activity-month-weeks", weeks);
  els.activityHeatmap.setAttribute("aria-label", `Expense activity for ${monthLabel}`);
  els.activityHeatmapMonth.textContent = monthLabel;
  const leadingCells = Array.from(
    { length: start.getDay() },
    () => '<span class="activity-cell-placeholder" aria-hidden="true"></span>',
  ).join("");
  els.activityHeatmap.innerHTML = leadingCells + dates.map((entry) => {
    const isFuture = entry.date > today;
    const level = entry.total > 0 && maxTotal > 0
      ? Math.max(1, Math.ceil((entry.total / maxTotal) * 4))
      : 0;
    const label = `${formatDateLabel(entry.iso)}: ${entry.total > 0 ? money(entry.total) : "No expenses"}`;
    const entering = entry.iso === animatedExpenseDate ? " is-entering" : "";
    const selected = entry.iso === selectedActivityDate ? " is-selected" : "";
    const current = entry.iso === todayISO() ? " is-today" : "";
    return `<button class="activity-cell level-${level}${isFuture ? " is-future" : ""}${selected}${current}${entering}" type="button" data-heatmap-date="${entry.iso}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${selected ? ' aria-current="date"' : ""}${isFuture ? " disabled" : ""}></button>`;
  }).join("");
}

function getActivityHeatmapBaseCellSize() {
  if (activityHeatmapBaseCellSize > 0) return activityHeatmapBaseCellSize;
  const cell = els.activityHeatmap.querySelector(".activity-cell, .activity-cell-placeholder");
  const measured = cell ? Number.parseFloat(getComputedStyle(cell).width) : 0;
  activityHeatmapBaseCellSize = measured > 0
    ? measured / Math.max(activityHeatmapZoom, 1)
    : 22;
  return activityHeatmapBaseCellSize;
}

function setActivityHeatmapZoom(nextZoom, anchor = null) {
  const previousZoom = activityHeatmapZoom;
  const previousWidth = els.activityHeatmap.scrollWidth || 1;
  activityHeatmapZoom = clamp(Math.round(nextZoom * 100) / 100, 1, 3);
  const baseCellSize = getActivityHeatmapBaseCellSize();
  els.activityHeatmap.style.setProperty(
    "--heatmap-mobile-cell-size",
    `${Math.round(baseCellSize * activityHeatmapZoom * 100) / 100}px`,
  );

  if (previousZoom === activityHeatmapZoom) return;
  if (anchor) {
    void els.activityHeatmap.offsetWidth;
    const scaleRatio = els.activityHeatmap.scrollWidth / previousWidth;
    els.activityHeatmapViewport.scrollLeft = ((els.activityHeatmapViewport.scrollLeft + anchor.viewportX) * scaleRatio) - anchor.viewportX;
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

function syncBudgetResetEditor() {
  const enabled = els.budgetResetEnabled.checked;
  const resetDay = normalizeBudgetResetDay(els.budgetResetDay.value || state.budgetResetDay);
  els.budgetResetOptions.classList.toggle("hidden", !enabled);
  els.totalAmountLabel.textContent = enabled ? "Amount per reset" : "Total amount";
  els.budgetResetSummary.textContent = `Next reset: ${formatDateLabel(nextBudgetResetISO(todayISO(), resetDay))}${resetDay === 31 ? " · Uses the last day in shorter months" : ""}`;
}

function syncSplitBudgetEditor(metrics = getMetrics()) {
  const enabled = els.splitTotalIntoDailyQuota.checked;
  const days = normalizeSplitBudgetDays(els.splitBudgetDays.value || state.splitBudgetDays);
  const draftTotalRemaining = numberValue(els.totalAmount.value) + metrics.addedBudget - totalSpent();
  const calculatedQuota = draftTotalRemaining / days;
  els.splitBudgetOptions.classList.toggle("hidden", !enabled);
  els.dailyQuota.disabled = enabled;
  els.todayQuota.disabled = enabled;
  els.rolloverEnabled.disabled = enabled;
  if (enabled) {
    els.dailyQuota.value = roundedInputValue(calculatedQuota);
    els.todayQuota.value = roundedInputValue(calculatedQuota);
  } else {
    els.dailyQuota.value = state.dailyQuota;
    els.todayQuota.value = quotaForDate(todayISO());
  }
  els.splitBudgetSummary.textContent = `${money(draftTotalRemaining)} remaining ÷ ${days} days = ${money(calculatedQuota)} per day.`;
}

function roundedInputValue(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function syncCurrencyPicker() {
  if (!els.currencyMenu) return;
  const value = els.currencyCode.value || defaults.currency;
  els.currencyValue.textContent = value;
  els.currencyMenu.querySelectorAll("[data-currency]").forEach((option) => {
    const selected = option.dataset.currency === value;
    option.setAttribute("aria-selected", String(selected));
  });
}

function setCurrencyPickerOpen(isOpen, focusSelected = false) {
  if (!els.currencyPicker || !els.currencyMenu) return;
  els.currencyPicker.classList.toggle("is-open", isOpen);
  els.currencyMenu.classList.toggle("hidden", !isOpen);
  els.currencyToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen && focusSelected) {
    requestAnimationFrame(() => {
      (els.currencyMenu.querySelector('[aria-selected="true"]') || els.currencyMenu.querySelector("[data-currency]"))?.focus();
    });
  }
}

function chooseCurrency(value) {
  if (!els.currencyCode.querySelector(`option[value="${value}"]`)) return;
  els.currencyCode.value = value;
  syncCurrencyPicker();
  setCurrencyPickerOpen(false);
  els.currencyToggle.focus();
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
  syncCurrencyPicker();
  els.rolloverEnabled.checked = state.rolloverEnabled;
  els.splitTotalIntoDailyQuota.checked = Boolean(state.splitTotalIntoDailyQuota);
  els.splitBudgetDays.value = normalizeSplitBudgetDays(state.splitBudgetDays);
  els.budgetResetEnabled.checked = Boolean(state.budgetResetEnabled);
  els.budgetResetDay.value = normalizeBudgetResetDay(state.budgetResetDay);
  els.resetRolloverOnBudgetReset.checked = Boolean(state.resetRolloverOnBudgetReset);
  const advancedEnabledCount = [
    state.splitTotalIntoDailyQuota,
    state.budgetResetEnabled,
    state.resetRolloverOnBudgetReset,
  ].filter(Boolean).length;
  if (els.quotaAdvancedStatus) {
    els.quotaAdvancedStatus.textContent = advancedEnabledCount ? `${advancedEnabledCount} active` : "Optional";
    els.quotaAdvancedStatus.classList.toggle("is-active", advancedEnabledCount > 0);
  }
  els.budgetTopUpSummary.textContent = `Added this cycle: ${money(metrics.addedBudget)}`;
  syncBudgetResetEditor();
  syncSplitBudgetEditor(metrics);
  const resetSummary = state.budgetResetEnabled
    ? ` · ${money(state.totalAmount)} each reset${metrics.addedBudget > 0 ? ` · ${money(metrics.addedBudget)} added` : ""}`
    : ` · ${money(metrics.totalBudget)} total`;
  els.quotaSummary.textContent = state.splitTotalIntoDailyQuota
    ? money(metrics.todayQuota) + ` daily from ${money(metrics.totalRemaining)} remaining ÷ ${metrics.splitBudgetDays} days` + resetSummary
    : money(metrics.todayQuota) + " today · " + money(state.dailyQuota) + " daily" + resetSummary;
  els.expenseSummary.textContent = money(metrics.spent) + " spent today · " + state.expenses.length + " entries";
  selectedExpenseDate = selectedExpenseDate || today;
  els.expenseNameSuggestions.innerHTML = expenseSuggestions()
    .map((entry) => `
      <button class="expense-suggestion${entry.name.toLowerCase() === animatedSuggestionName ? " is-entering" : ""} focus-ring rounded-full px-3 py-1 text-sm font-semibold" type="button" data-suggest-expense="${escapeHtml(entry.name)}" data-suggest-amount="${escapeHtml(String(entry.amount))}">
        ${escapeHtml(entry.name)}
      </button>
    `)
    .join("");

  els.todayRemainingLabel.textContent = "Today left";
  els.dailyRemaining.textContent = money(metrics.dailyRemaining);
  els.totalRemaining.textContent = money(metrics.totalRemaining);
  els.spentToday.textContent = money(metrics.spent);
  els.rolloverStatus.textContent = state.rolloverEnabled
    ? `Rollover: ${money(metrics.carry)}`
    : "Rollover off";

  const dailyPct = metrics.todayAllowance <= 0 ? 0 : clamp(metrics.dailyRemaining / metrics.todayAllowance, 0, 1) * 100;
  const totalPct = metrics.totalBudget <= 0 ? 0 : clamp(metrics.totalRemaining / metrics.totalBudget, 0, 1) * 100;
  els.dailyBar.style.width = `${state.splitTotalIntoDailyQuota ? totalPct : dailyPct}%`;
  els.totalBar.style.width = `${totalPct}%`;
  els.dailyBar.style.background = metrics.dailyRemaining < 0
    ? "var(--danger)"
    : state.splitTotalIntoDailyQuota ? "var(--accent)" : "var(--primary)";
  els.totalBar.style.background = metrics.totalRemaining < 0 ? "var(--danger)" : "var(--accent)";

  const visibleExpenses = expensesOn(selectedActivityDate)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const selectedDaySpent = visibleExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const selectedDayCount = visibleExpenses.length;
  els.activitySelectedTotal.textContent = money(selectedDaySpent);
  els.activitySelectedMeta.textContent = selectedActivityDate === today
    ? "Today"
    : formatDateLabel(selectedActivityDate);
  els.activityExpenseCount.textContent = `${selectedDayCount} ${selectedDayCount === 1 ? "entry" : "entries"}`;
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
  setTheme(paletteForScheme(state.colorScheme));
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
  const darkText = "#000000";
  const lightText = "#ffffff";
  return contrastRatio(hex, darkText) >= contrastRatio(hex, lightText)
    ? darkText
    : lightText;
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

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r)
    + 0.7152 * srgbToLinear(g)
    + 0.0722 * srgbToLinear(b);
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureColorContrast(color, background = "#1a141f", minimumRatio = 3.5) {
  if (contrastRatio(color, background) >= minimumRatio) return color;
  const { r, g, b } = hexToRgb(color);
  const lab = rgbToOklab(r, g, b);
  for (let lightness = lab.lightness + 0.015; lightness <= 0.94; lightness += 0.015) {
    const candidate = oklchToHex(lightness, lab.chroma, lab.hue);
    if (contrastRatio(candidate, background) >= minimumRatio) return candidate;
  }
  return oklchToHex(0.94, Math.min(lab.chroma, 0.08), lab.hue);
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

function linearToSrgb(channel) {
  const value = channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * (channel ** (1 / 2.4)) - 0.055;
  return clamp(value * 255, 0, 255);
}

function oklchToHex(lightness, chroma, hue) {
  const radians = hue * Math.PI / 180;
  const a = chroma * Math.cos(radians);
  const labB = chroma * Math.sin(radians);
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * labB;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * labB;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * labB;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return rgbToHex(
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  );
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

els.budgetResetEnabled.addEventListener("change", syncBudgetResetEditor);
els.budgetResetDay.addEventListener("input", syncBudgetResetEditor);
els.splitTotalIntoDailyQuota.addEventListener("change", () => syncSplitBudgetEditor());
els.splitBudgetDays.addEventListener("input", () => syncSplitBudgetEditor());
els.totalAmount.addEventListener("input", () => syncSplitBudgetEditor());

els.restoreManualQuotas.addEventListener("click", async () => {
  const previous = state.splitTotalIntoDailyQuota;
  state.splitTotalIntoDailyQuota = false;
  try {
    await saveState({ fields: { splitTotalIntoDailyQuota: false } });
    render();
    showAppMessage("Manual daily and today quotas restored.");
  } catch (error) {
    state.splitTotalIntoDailyQuota = previous;
    render();
    showAppMessage("Could not restore manual quotas: " + error.message, "error");
  }
});

els.addBudget.addEventListener("click", async () => {
  const amount = numberValue(els.budgetTopUpAmount.value);
  if (amount <= 0) {
    showAppMessage("Enter an amount greater than zero.", "error");
    els.budgetTopUpAmount.focus();
    return;
  }

  const previousAdjustments = state.budgetAdjustments;
  const adjustment = {
    id: makeId(),
    amount,
    date: todayISO(),
    createdAt: Date.now(),
  };
  state.budgetAdjustments = [...previousAdjustments, adjustment];
  els.budgetTopUpAmount.value = "";

  try {
    await saveState({ fields: { budgetAdjustments: state.budgetAdjustments } });
    render();
    showAppMessage(`${money(amount)} added to the current budget.`);
  } catch (error) {
    state.budgetAdjustments = previousAdjustments;
    els.budgetTopUpAmount.value = amount;
    render();
    showAppMessage("Could not add budget: " + error.message, "error");
  }
});

els.budgetTopUpAmount.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  els.addBudget.click();
});

els.manualBudgetReset.addEventListener("click", async () => {
  const resetAmount = numberValue(els.totalAmount.value);
  const resetRollover = els.resetRolloverOnBudgetReset.checked;
  const rolloverMessage = resetRollover ? " Daily rollover will also restart." : " Daily rollover will be kept.";
  if (!confirm(`Reset the total balance to ${money(resetAmount)} now? Expense history will be kept.${rolloverMessage}`)) return;

  const previous = {
    totalAmount: state.totalAmount,
    budgetResetEnabled: state.budgetResetEnabled,
    budgetResetDay: state.budgetResetDay,
    resetRolloverOnBudgetReset: state.resetRolloverOnBudgetReset,
    lastBudgetResetAt: state.lastBudgetResetAt,
    lastBudgetResetDate: state.lastBudgetResetDate,
    lastRolloverResetAt: state.lastRolloverResetAt,
    lastRolloverResetDate: state.lastRolloverResetDate,
  };
  const resetAt = Date.now();
  const resetDate = todayISO();
  state.totalAmount = resetAmount;
  state.budgetResetEnabled = els.budgetResetEnabled.checked;
  state.budgetResetDay = normalizeBudgetResetDay(els.budgetResetDay.value);
  state.resetRolloverOnBudgetReset = resetRollover;
  state.lastBudgetResetAt = resetAt;
  state.lastBudgetResetDate = resetDate;
  if (resetRollover) {
    state.lastRolloverResetAt = resetAt;
    state.lastRolloverResetDate = resetDate;
  }

  try {
    await saveState({
      fields: {
        totalAmount: state.totalAmount,
        budgetResetEnabled: state.budgetResetEnabled,
        budgetResetDay: state.budgetResetDay,
        resetRolloverOnBudgetReset: state.resetRolloverOnBudgetReset,
        lastBudgetResetAt: state.lastBudgetResetAt,
        lastBudgetResetDate: state.lastBudgetResetDate,
        lastRolloverResetAt: state.lastRolloverResetAt,
        lastRolloverResetDate: state.lastRolloverResetDate,
      },
    });
    render();
    showAppMessage(`Budget reset to ${money(state.totalAmount)}.${resetRollover ? " Rollover reset too." : " Rollover kept."}`);
  } catch (error) {
    Object.assign(state, previous);
    render();
    showAppMessage("Could not reset budget: " + error.message, "error");
  }
});

els.currencyToggle?.addEventListener("click", () => {
  const willOpen = !els.currencyPicker.classList.contains("is-open");
  setCurrencyPickerOpen(willOpen, false);
});

els.currencyToggle?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  setCurrencyPickerOpen(true, true);
});

els.currencyMenu?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-currency]");
  if (!option) return;
  chooseCurrency(option.dataset.currency);
});

els.currencyMenu?.addEventListener("keydown", (event) => {
  const options = [...els.currencyMenu.querySelectorAll("[data-currency]")];
  const currentIndex = options.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    setCurrencyPickerOpen(false);
    els.currencyToggle.focus();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    const option = event.target.closest("[data-currency]");
    if (!option) return;
    event.preventDefault();
    chooseCurrency(option.dataset.currency);
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = currentIndex < 0
    ? 0
    : (currentIndex + direction + options.length) % options.length;
  options[nextIndex]?.focus();
});

document.addEventListener("click", (event) => {
  if (!els.currencyPicker?.classList.contains("is-open")) return;
  if (els.currencyPicker.contains(event.target)) return;
  setCurrencyPickerOpen(false);
});

els.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const splitTotalIntoDailyQuota = els.splitTotalIntoDailyQuota.checked;
  const nextDailyQuota = splitTotalIntoDailyQuota ? state.dailyQuota : numberValue(els.dailyQuota.value);
  const nextRolloverEnabled = els.rolloverEnabled.checked;
  const quotaChanged = nextDailyQuota !== state.dailyQuota;
  const rolloverTurnedOn = nextRolloverEnabled && !state.rolloverEnabled;
  if (quotaChanged || rolloverTurnedOn) {
    state.startDate = todayISO();
  }
  state.dailyQuota = nextDailyQuota;
  state.dailyOverrides = state.dailyOverrides || {};
  if (!splitTotalIntoDailyQuota) {
    state.dailyOverrides[todayISO()] = numberValue(els.todayQuota.value);
  }
  state.totalAmount = numberValue(els.totalAmount.value);
  state.currency = els.currencyCode.value;
  state.rolloverEnabled = nextRolloverEnabled;
  state.splitTotalIntoDailyQuota = splitTotalIntoDailyQuota;
  state.splitBudgetDays = normalizeSplitBudgetDays(els.splitBudgetDays.value);
  state.budgetResetEnabled = els.budgetResetEnabled.checked;
  state.budgetResetDay = normalizeBudgetResetDay(els.budgetResetDay.value);
  state.resetRolloverOnBudgetReset = els.resetRolloverOnBudgetReset.checked;
  await saveState({
    fields: {
      dailyQuota: state.dailyQuota,
      dailyOverrides: state.dailyOverrides,
      totalAmount: state.totalAmount,
      currency: state.currency,
      rolloverEnabled: state.rolloverEnabled,
      splitTotalIntoDailyQuota: state.splitTotalIntoDailyQuota,
      splitBudgetDays: state.splitBudgetDays,
      budgetResetEnabled: state.budgetResetEnabled,
      budgetResetDay: state.budgetResetDay,
      resetRolloverOnBudgetReset: state.resetRolloverOnBudgetReset,
      startDate: state.startDate,
    },
  });
  render();
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await openProfile(els.profileName.value, els.profilePin.value);
});

els.profilePickerToggle.addEventListener("click", () => {
  setProfilePickerOpen(!els.profilePicker.classList.contains("is-open"), false);
});

els.profilePickerToggle.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  setProfilePickerOpen(true, true);
});

els.profilePickerMenu.addEventListener("click", (event) => {
  const option = event.target.closest("[data-profile-id]");
  if (!option) return;
  chooseProfile(option.dataset.profileId);
});

els.profilePickerMenu.addEventListener("keydown", (event) => {
  const options = [...els.profilePickerMenu.querySelectorAll("[data-profile-id]")];
  const currentIndex = options.indexOf(document.activeElement);

  if (event.key === "Escape") {
    event.preventDefault();
    setProfilePickerOpen(false);
    els.profilePickerToggle.focus();
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    const option = event.target.closest("[data-profile-id]");
    if (!option) return;
    event.preventDefault();
    chooseProfile(option.dataset.profileId);
    return;
  }

  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = currentIndex < 0
    ? 0
    : (currentIndex + direction + options.length) % options.length;
  options[nextIndex]?.focus();
});

document.addEventListener("click", (event) => {
  if (!els.profilePicker?.classList.contains("is-open")) return;
  if (els.profilePicker.contains(event.target)) return;
  setProfilePickerOpen(false);
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
  if (willOpen) {
    selectedExpenseDate = selectedActivityDate || todayISO();
    visibleExpenseMonth = monthStart(selectedExpenseDate);
  }
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
  if (suppressActivityHeatmapClick) return;
  const button = event.target.closest("[data-heatmap-date]");
  if (!button || button.disabled) return;
  selectSharedDate(button.dataset.heatmapDate);
  render();
});

function shiftActivityHeatmapMonth(months) {
  const current = dateFromISO(selectedActivityDate);
  const targetMonth = new Date(current.getFullYear(), current.getMonth() + months, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  targetMonth.setDate(Math.min(current.getDate(), lastDay));
  selectSharedDate(targetMonth.toLocaleDateString("en-CA"));
  render();
}

els.activityHeatmapViewport.addEventListener("touchstart", (event) => {
  if (!window.matchMedia("(max-width: 639px)").matches) return;

  if (event.touches.length === 1) {
    const touch = event.touches[0];
    activityHeatmapPan = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startScrollLeft: els.activityHeatmapViewport.scrollLeft,
      canPan: els.activityHeatmapViewport.scrollWidth > els.activityHeatmapViewport.clientWidth + 1,
      moved: false,
    };
    return;
  }

  if (event.touches.length !== 2) return;
  activityHeatmapPan = null;
  event.preventDefault();
  getActivityHeatmapBaseCellSize();
  const rect = els.activityHeatmapViewport.getBoundingClientRect();
  const viewportX = heatmapTouchMidpointX(event.touches) - rect.left;
  activityHeatmapPinch = {
    startDistance: heatmapTouchDistance(event.touches),
    startZoom: activityHeatmapZoom,
    anchor: { viewportX },
  };
  els.activityHeatmapViewport.classList.add("is-pinching");
}, { passive: false });

els.activityHeatmapViewport.addEventListener("touchmove", (event) => {
  if (activityHeatmapPinch && event.touches.length >= 2) {
    event.preventDefault();
    const distance = heatmapTouchDistance(event.touches);
    if (!activityHeatmapPinch.startDistance) return;
    setActivityHeatmapZoom(
      activityHeatmapPinch.startZoom * (distance / activityHeatmapPinch.startDistance),
      activityHeatmapPinch.anchor,
    );
    return;
  }

  if (!activityHeatmapPan || event.touches.length !== 1) return;
  const touch = event.touches[0];
  activityHeatmapPan.lastX = touch.clientX;
  activityHeatmapPan.lastY = touch.clientY;
  const deltaX = touch.clientX - activityHeatmapPan.startX;
  const deltaY = touch.clientY - activityHeatmapPan.startY;

  if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 6) return;
  event.preventDefault();
  activityHeatmapPan.moved = true;
  els.activityHeatmapViewport.classList.add("is-panning");

  if (activityHeatmapPan.canPan) {
    els.activityHeatmapViewport.scrollLeft = activityHeatmapPan.startScrollLeft - deltaX;
    return;
  }

  const offset = clamp(deltaX * 0.22, -24, 24);
  els.activityHeatmap.style.transform = `translateX(${offset}px)`;
}, { passive: false });

function finishActivityHeatmapGesture(event, cancelled = false) {
  if (activityHeatmapPinch && event.touches.length < 2) {
    activityHeatmapPinch = null;
    els.activityHeatmapViewport.classList.remove("is-pinching");
  }

  if (!activityHeatmapPan) return;
  const pan = activityHeatmapPan;
  const touch = event.changedTouches?.[0];
  const endX = touch?.clientX ?? pan.lastX;
  const endY = touch?.clientY ?? pan.lastY;
  const deltaX = endX - pan.startX;
  const deltaY = endY - pan.startY;
  activityHeatmapPan = null;
  els.activityHeatmapViewport.classList.remove("is-panning");
  els.activityHeatmap.style.removeProperty("transform");

  if (pan.moved && Math.abs(deltaX) >= 12) {
    suppressActivityHeatmapClick = true;
    setTimeout(() => {
      suppressActivityHeatmapClick = false;
    }, 360);
  }

  if (
    !cancelled
    && !pan.canPan
    && Math.abs(deltaX) >= 48
    && Math.abs(deltaX) > Math.abs(deltaY) * 1.2
  ) {
    shiftActivityHeatmapMonth(deltaX < 0 ? 1 : -1);
  }
}

els.activityHeatmapViewport.addEventListener("touchend", (event) => finishActivityHeatmapGesture(event));
els.activityHeatmapViewport.addEventListener("touchcancel", (event) => finishActivityHeatmapGesture(event, true));

function animateSettingsDialog(isOpening) {
  settingsDialogAnimation?.cancel();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return Promise.resolve();
  settingsDialogAnimation = els.settingsDialog.querySelector(".settings-dialog-card").animate(
    [
      { opacity: isOpening ? 0 : 1, transform: isOpening ? "translateY(14px) scale(0.97)" : "translateY(0) scale(1)" },
      { opacity: isOpening ? 1 : 0, transform: isOpening ? "translateY(0) scale(1)" : "translateY(10px) scale(0.98)" },
    ],
    {
      duration: isOpening ? 280 : 180,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  );
  return settingsDialogAnimation.finished.catch(() => {});
}

function openSettingsDialog() {
  setHeaderMenuOpen(false);
  pendingColorScheme = normalizeColorScheme(state.colorScheme);
  pendingThemeColorfulness = normalizeThemeFactor(state.themeColorfulness);
  pendingThemeBrightness = normalizeThemeFactor(state.themeBrightness);
  renderColorSchemeOptions(pendingColorScheme);
  syncThemeAdjustmentControls();
  renderColorSchemePreview(paletteForScheme(
    pendingColorScheme,
    pendingThemeColorfulness,
    pendingThemeBrightness,
  ));
  syncDebugDateControls();
  if (!els.settingsDialog.open) els.settingsDialog.showModal();
  animateSettingsDialog(true);
}

async function closeSettingsDialog(restoreTheme = true) {
  if (!els.settingsDialog.open) return;
  if (restoreTheme) setTheme(paletteForScheme(state.colorScheme));
  await animateSettingsDialog(false);
  settingsDialogAnimation?.cancel();
  settingsDialogAnimation = null;
  els.settingsDialog.close();
  els.openSettings.focus();
}

els.openSettings.addEventListener("click", openSettingsDialog);
els.settingsDialogClose.addEventListener("click", () => closeSettingsDialog(true));

els.colorSchemeOptions.addEventListener("change", (event) => {
  const input = event.target.closest('input[name="colorScheme"]');
  if (!input) return;
  pendingColorScheme = normalizeColorScheme(input.value);
  renderColorSchemeOptions(pendingColorScheme);
  const palette = paletteForScheme(
    pendingColorScheme,
    pendingThemeColorfulness,
    pendingThemeBrightness,
  );
  renderColorSchemePreview(palette);
  setTheme(palette);
});

function previewThemeAdjustments() {
  pendingThemeColorfulness = normalizeThemeFactor(els.themeColorfulness.value);
  pendingThemeBrightness = normalizeThemeFactor(els.themeBrightness.value);
  syncThemeAdjustmentControls();
  const palette = paletteForScheme(
    pendingColorScheme,
    pendingThemeColorfulness,
    pendingThemeBrightness,
  );
  renderColorSchemePreview(palette);
  setTheme(palette);
}

els.themeColorfulness.addEventListener("input", previewThemeAdjustments);
els.themeBrightness.addEventListener("input", previewThemeAdjustments);

els.debugPrevDay?.addEventListener("click", () => setDebugDateOffset(debugDateOffset - 1));
els.debugNextDay?.addEventListener("click", () => setDebugDateOffset(debugDateOffset + 1));
els.debugResetDate?.addEventListener("click", () => setDebugDateOffset(0));
els.debugDatePicker?.addEventListener("change", () => setDebugDate(els.debugDatePicker.value));

els.applyColorScheme.addEventListener("click", async () => {
  const previousScheme = state.colorScheme;
  const previousColorfulness = state.themeColorfulness;
  const previousBrightness = state.themeBrightness;
  state.colorScheme = normalizeColorScheme(pendingColorScheme);
  state.themeColorfulness = normalizeThemeFactor(pendingThemeColorfulness);
  state.themeBrightness = normalizeThemeFactor(pendingThemeBrightness);
  try {
    await saveState({
      fields: {
        colorScheme: state.colorScheme,
        themeColorfulness: state.themeColorfulness,
        themeBrightness: state.themeBrightness,
      },
    });
    await closeSettingsDialog(false);
    render();
    showAppMessage(`${colorSchemes[state.colorScheme].name} color scheme applied.`);
  } catch (error) {
    state.colorScheme = previousScheme;
    state.themeColorfulness = previousColorfulness;
    state.themeBrightness = previousBrightness;
    setTheme(paletteForScheme(previousScheme));
    showAppMessage("Could not save color scheme: " + error.message, "error");
  }
});

els.settingsDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeSettingsDialog(true);
});

els.settingsDialog.addEventListener("click", (event) => {
  if (event.target !== els.settingsDialog) return;
  closeSettingsDialog(true);
});

function resetBackgroundUploadDialog() {
  pendingBackgroundImage = "";
  pendingBackgroundImageName = "";
  els.backgroundInput.value = "";
  els.backgroundDropzone.classList.remove("is-dragover");
  els.backgroundUploadPreview.classList.add("hidden");
  els.backgroundUploadPreviewImage.removeAttribute("src");
  els.backgroundUploadPreviewName.textContent = "Selected image";
  els.backgroundUploadPreviewSource.textContent = "Ready to use";
  els.backgroundUploadStatus.textContent = "";
  els.backgroundUploadStatus.classList.remove("is-error");
  els.backgroundUploadApply.disabled = true;
}

function setBackgroundUploadStatus(message = "", isError = false) {
  els.backgroundUploadStatus.textContent = message;
  els.backgroundUploadStatus.classList.toggle("is-error", isError);
}

function openBackgroundUploadDialog() {
  setHeaderMenuOpen(false);
  resetBackgroundUploadDialog();
  if (!els.backgroundUploadDialog.open) {
    els.backgroundUploadDialog.showModal();
    renderIcons();
  }
  requestAnimationFrame(() => els.backgroundChooseFile.focus());
}

function closeBackgroundUploadDialog() {
  if (!els.backgroundUploadDialog.open) return;
  els.backgroundUploadDialog.close();
  resetBackgroundUploadDialog();
  els.uploadBackground.focus();
}

function readBackgroundImageFile(file, sourceLabel = "Selected from files") {
  if (!file) return;
  if (!String(file.type || "").startsWith("image/")) {
    setBackgroundUploadStatus("Choose or paste an image file.", true);
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    setBackgroundUploadStatus("That image is too large. Choose an image under 25 MB.", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pendingBackgroundImage = String(reader.result || "");
    pendingBackgroundImageName = file.name || "Pasted image";
    els.backgroundUploadPreviewImage.src = pendingBackgroundImage;
    els.backgroundUploadPreviewName.textContent = pendingBackgroundImageName;
    els.backgroundUploadPreviewSource.textContent = sourceLabel;
    els.backgroundUploadPreview.classList.remove("hidden");
    els.backgroundUploadApply.disabled = false;
    setBackgroundUploadStatus("Image ready. Review the preview, then use it as your background.");
    renderIcons();
  };
  reader.onerror = () => {
    setBackgroundUploadStatus("Could not read that image. Try another file.", true);
  };
  reader.readAsDataURL(file);
}

els.uploadBackground.addEventListener("click", openBackgroundUploadDialog);

els.backgroundChooseFile.addEventListener("click", () => {
  els.backgroundInput.value = "";
  els.backgroundInput.click();
});

els.backgroundInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  readBackgroundImageFile(file, "Selected from files");
});

["dragenter", "dragover"].forEach((eventName) => {
  els.backgroundDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    els.backgroundDropzone.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.backgroundDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    els.backgroundDropzone.classList.remove("is-dragover");
  });
});

els.backgroundDropzone.addEventListener("drop", (event) => {
  const file = [...(event.dataTransfer?.files || [])].find((entry) => String(entry.type || "").startsWith("image/"));
  if (!file) {
    setBackgroundUploadStatus("Drop an image file here.", true);
    return;
  }
  readBackgroundImageFile(file, "Dropped into uploader");
});

els.backgroundUploadDialog.addEventListener("paste", (event) => {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => String(item.type || "").startsWith("image/"));
  const file = imageItem?.getAsFile();
  if (!file) {
    setBackgroundUploadStatus("Your clipboard does not contain an image.", true);
    return;
  }
  event.preventDefault();
  readBackgroundImageFile(file, "Pasted from clipboard");
});

els.backgroundUploadApply.addEventListener("click", async () => {
  if (!pendingBackgroundImage) return;

  const previousBackground = state.background;
  const previousPalette = state.palette;
  els.backgroundUploadApply.disabled = true;
  els.backgroundChooseFile.disabled = true;
  setBackgroundUploadStatus("Processing and saving background...");

  try {
    const preparedBackground = await prepareBackground(pendingBackgroundImage);
    const nextPalette = await extractPalette(preparedBackground);
    const nextBackground = await uploadCustomBackground(preparedBackground);
    state.background = nextBackground;
    state.palette = nextPalette;
    await saveState({
      fields: { background: state.background, palette: state.palette },
      includeBackground: true,
    });
    closeBackgroundUploadDialog();
    render();
    showAppMessage("Background updated.");
  } catch (error) {
    state.background = previousBackground;
    state.palette = previousPalette;
    els.backgroundUploadApply.disabled = false;
    setBackgroundUploadStatus("Could not save background: " + error.message, true);
  } finally {
    els.backgroundChooseFile.disabled = false;
  }
});

els.backgroundUploadClose.addEventListener("click", closeBackgroundUploadDialog);
els.backgroundUploadCancel.addEventListener("click", closeBackgroundUploadDialog);

els.backgroundUploadDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeBackgroundUploadDialog();
});

els.backgroundUploadDialog.addEventListener("click", (event) => {
  if (event.target !== els.backgroundUploadDialog) return;
  closeBackgroundUploadDialog();
});

function openClearBackgroundConfirmDialog() {
  setHeaderMenuOpen(false);
  if (!els.clearBackgroundConfirmDialog.open) {
    els.clearBackgroundConfirmDialog.showModal();
    renderIcons();
  }
  requestAnimationFrame(() => els.clearBackgroundConfirmCancel.focus());
}

function closeClearBackgroundConfirmDialog() {
  if (!els.clearBackgroundConfirmDialog.open) return;
  els.clearBackgroundConfirmDialog.close();
  els.clearBackground.focus();
}

els.clearBackground.addEventListener("click", openClearBackgroundConfirmDialog);

els.clearBackgroundConfirmCancel.addEventListener("click", closeClearBackgroundConfirmDialog);

els.clearBackgroundConfirmSubmit.addEventListener("click", async () => {
  els.clearBackgroundConfirmSubmit.disabled = true;
  try {
    state.background = "";
    state.palette = defaults.palette;
    await saveState({ fields: { background: state.background, palette: state.palette }, includeBackground: true });
    closeClearBackgroundConfirmDialog();
    render();
    showAppMessage("Background cleared. Budget and expense data were kept.");
  } catch (error) {
    showAppMessage("Could not clear background: " + error.message, "error");
  } finally {
    els.clearBackgroundConfirmSubmit.disabled = false;
  }
});

els.clearBackgroundConfirmDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeClearBackgroundConfirmDialog();
});

els.clearBackgroundConfirmDialog.addEventListener("click", (event) => {
  if (event.target !== els.clearBackgroundConfirmDialog) return;
  closeClearBackgroundConfirmDialog();
});

function openResetConfirmDialog() {
  setHeaderMenuOpen(false);
  if (!els.resetConfirmDialog.open) {
    els.resetConfirmDialog.showModal();
    renderIcons();
  }
  requestAnimationFrame(() => els.resetConfirmCancel.focus());
}

function closeResetConfirmDialog() {
  if (!els.resetConfirmDialog.open) return;
  els.resetConfirmDialog.close();
  els.resetData.focus();
}

els.resetData.addEventListener("click", openResetConfirmDialog);

els.resetConfirmCancel.addEventListener("click", closeResetConfirmDialog);

els.resetConfirmSubmit.addEventListener("click", async () => {
  els.resetConfirmSubmit.disabled = true;
  try {
    state = { ...defaults, expenses: [] };
    await saveState({ includeBackground: true });
    closeResetConfirmDialog();
    render();
    showAppMessage("Profile data reset.");
  } catch (error) {
    showAppMessage("Could not reset profile data: " + error.message, "error");
  } finally {
    els.resetConfirmSubmit.disabled = false;
  }
});

els.resetConfirmDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeResetConfirmDialog();
});

els.resetConfirmDialog.addEventListener("click", (event) => {
  if (event.target !== els.resetConfirmDialog) return;
  closeResetConfirmDialog();
});

function openLogoutConfirmDialog() {
  setHeaderMenuOpen(false);
  if (!els.logoutConfirmDialog.open) {
    els.logoutConfirmDialog.showModal();
    renderIcons();
  }
  requestAnimationFrame(() => els.logoutConfirmCancel.focus());
}

function closeLogoutConfirmDialog() {
  if (!els.logoutConfirmDialog.open) return;
  els.logoutConfirmDialog.close();
  els.switchProfile.focus();
}

els.switchProfile.addEventListener("click", openLogoutConfirmDialog);

els.logoutConfirmCancel.addEventListener("click", closeLogoutConfirmDialog);

els.logoutConfirmSubmit.addEventListener("click", () => {
  els.logoutConfirmDialog.close();
  showAuth("Logged out.");
});

els.logoutConfirmDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeLogoutConfirmDialog();
});

els.logoutConfirmDialog.addEventListener("click", (event) => {
  if (event.target !== els.logoutConfirmDialog) return;
  closeLogoutConfirmDialog();
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
