const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const zlib = require("zlib");

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const root = __dirname;
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const dbPath = path.join(dataDir, "finance-db.json");
const dbTmpPath = `${dbPath}.tmp`;
const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp", ".ico"];
const staticCache = new Map();
let dbCache = null;

const defaults = {
  dailyQuota: 25,
  totalAmount: 500,
  currency: "USD",
  rolloverEnabled: true,
  background: "",
  palette: ["#f0a8c8", "#e8b86d", "#51314a", "#f07178", "#151018"],
  startDate: new Date().toLocaleDateString("en-CA"),
  dailyOverrides: {},
  expenses: [],
};
function freshDefaults() {
  return { ...defaults, startDate: new Date().toLocaleDateString("en-CA"), dailyOverrides: {}, expenses: [] };
}


function ensureDb() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], states: {} }));
  }
}

function readDb() {
  if (dbCache) return dbCache;
  ensureDb();
  dbCache = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  return dbCache;
}

function writeDb(db) {
  ensureDb();
  dbCache = db;
  fs.writeFileSync(dbTmpPath, JSON.stringify(db));
  fs.renameSync(dbTmpPath, dbPath);
}

function hashPin(pin, salt) {
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

function normalizeProfileName(name) {
  return String(name || "").trim().toLowerCase();
}

function publicUser(user) {
  return { id: user.id, name: user.name };
}

function sendJson(res, status, body, options = {}) {
  const payload = JSON.stringify(body);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": options.cacheControl || "no-store",
    ...(options.headers || {}),
  };
  if (options.etag) headers.ETag = options.etag;
  if (options.vary) headers.Vary = options.vary;
  if (options.statusText) headers["X-Status-Text"] = options.statusText;
  sendBody(res, status, {
    ...headers,
  }, Buffer.from(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function sendNotModified(res, headers = {}) {
  res.writeHead(304, headers);
  res.end();
}

function jsonEtag(value) {
  return `"${crypto.createHash("sha1").update(JSON.stringify(value)).digest("hex")}"`;
}

function stateForUser(db, userId) {
  const state = { ...freshDefaults(), ...(db.states[userId] || {}) };
  if (!state.dailyOverrides || typeof state.dailyOverrides !== "object") state.dailyOverrides = {};
  if (!Array.isArray(state.expenses)) state.expenses = [];
  return state;
}

function mutableStateForUser(db, userId) {
  const state = stateForUser(db, userId);
  db.states[userId] = state;
  return state;
}

function wantsMinimalResponse(req, url) {
  return /\breturn=minimal\b/.test(req.headers.prefer || "") || url.searchParams.get("return") === "minimal";
}

function sendStateWriteResponse(req, res, url, state) {
  const etag = jsonEtag(state);
  if (wantsMinimalResponse(req, url)) {
    sendJson(res, 200, { ok: true }, { cacheControl: "private, no-cache", etag });
    return;
  }
  sendJson(res, 200, { state }, { cacheControl: "private, no-cache", etag });
}

function cleanExpense(value) {
  const amount = Number(value?.amount);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value?.date || "")) ? String(value.date) : new Date().toLocaleDateString("en-CA");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid expense amount.");
  return {
    id: String(value?.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    amount,
    name: String(value?.name || "Expense").trim().slice(0, 48) || "Expense",
    date,
    createdAt: Number.isFinite(Number(value?.createdAt)) ? Number(value.createdAt) : Date.now(),
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12_000_000) {
        req.destroy();
        reject(new Error("Request is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });
  });
}

function authenticate(req, db) {
  const id = normalizeProfileName(req.headers["x-profile-id"]);
  const pin = String(req.headers["x-profile-pin"] || "");
  const user = db.users.find((entry) => entry.id === id);
  if (!user || user.pinHash !== hashPin(pin, user.salt)) return null;
  return user;
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");

  try {
    if (req.method === "GET" && url.pathname === "/api/assets") {
      const body = {
        assets: {
          background: publicAsset("background"),
          logo: publicAsset("logo-small") || publicAsset("logo"),
        },
      };
      const etag = jsonEtag(body);
      const cacheHeaders = {
        "Cache-Control": "public, no-cache",
        ETag: etag,
      };
      if (req.headers["if-none-match"] === etag) {
        sendNotModified(res, cacheHeaders);
        return;
      }
      sendJson(res, 200, body, { cacheControl: "public, no-cache", etag });
      return;
    }

    const db = readDb();

    if (req.method === "GET" && url.pathname === "/api/profiles") {
      sendJson(res, 200, { users: db.users.map(publicUser) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await parseBody(req);

      const name = String(body.name || "").trim();
      const pin = String(body.pin || "");
      const id = normalizeProfileName(name);
      if (!id) {
        sendError(res, 400, "Enter a profile name.");
        return;
      }

      let user = db.users.find((entry) => entry.id === id);
      if (user && user.pinHash !== hashPin(pin, user.salt)) {
        sendError(res, 401, "Wrong PIN for this profile.");
        return;
      }

      if (!user) {
        const salt = crypto.randomBytes(16).toString("hex");
        user = { id, name, salt, pinHash: hashPin(pin, salt) };
        db.users.push(user);
        db.states[id] = freshDefaults();
        writeDb(db);
      }

      const state = stateForUser(db, id);
      sendJson(res, 200, { user: publicUser(user), state }, { cacheControl: "private, no-cache", etag: jsonEtag(state) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
      const user = authenticate(req, db);
      if (!user) {
        sendError(res, 401, "Login required.");
        return;
      }
      const state = stateForUser(db, user.id);
      const etag = jsonEtag(state);
      const cacheHeaders = {
        "Cache-Control": "private, no-cache",
        ETag: etag,
      };
      if (req.headers["if-none-match"] === etag) {
        sendNotModified(res, cacheHeaders);
        return;
      }
      sendJson(res, 200, { user: publicUser(user), state }, { cacheControl: "private, no-cache", etag });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/expenses") {
      const user = authenticate(req, db);
      if (!user) {
        sendError(res, 401, "Login required.");
        return;
      }
      const body = await parseBody(req);
      const state = mutableStateForUser(db, user.id);
      state.expenses.push(cleanExpense(body.expense));
      writeDb(db);
      sendStateWriteResponse(req, res, url, state);
      return;
    }

    if (req.method === "PUT" && url.pathname.startsWith("/api/expenses/")) {
      const user = authenticate(req, db);
      if (!user) {
        sendError(res, 401, "Login required.");
        return;
      }
      const id = decodeURIComponent(url.pathname.slice("/api/expenses/".length));
      const state = mutableStateForUser(db, user.id);
      const index = state.expenses.findIndex((expense) => expense.id === id);
      if (index < 0) {
        sendError(res, 404, "Expense not found.");
        return;
      }
      const body = await parseBody(req);
      state.expenses[index] = cleanExpense({ ...body.expense, id });
      writeDb(db);
      sendStateWriteResponse(req, res, url, state);
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/expenses/")) {
      const user = authenticate(req, db);
      if (!user) {
        sendError(res, 401, "Login required.");
        return;
      }
      const id = decodeURIComponent(url.pathname.slice("/api/expenses/".length));
      const state = mutableStateForUser(db, user.id);
      state.expenses = state.expenses.filter((expense) => expense.id !== id);
      writeDb(db);
      sendStateWriteResponse(req, res, url, state);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/background") {
      const user = authenticate(req, db);
      if (!user) {
        sendError(res, 401, "Login required.");
        return;
      }
      const body = await parseBody(req);
      const upload = decodeImageDataUrl(body.image);
      fs.mkdirSync(uploadDir, { recursive: true });
      const fileName = `${crypto.createHash("sha1").update(user.id).digest("hex")}-background.${upload.ext}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, upload.buffer);
      staticCache.delete(filePath);
      const stats = fs.statSync(filePath);
      const version = `${Math.round(stats.mtimeMs)}-${stats.size}`;
      sendJson(res, 200, {
        background: {
          url: `/uploads/${fileName}?v=${encodeURIComponent(version)}`,
          version,
          size: stats.size,
        },
      });
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/state") {
      const user = authenticate(req, db);
      if (!user) {
        sendError(res, 401, "Login required.");
        return;
      }
      const body = await parseBody(req);
      const base = freshDefaults();
      const previous = stateForUser(db, user.id);
      db.states[user.id] = {
        ...base,
        ...previous,
        ...(body.state || {}),
        startDate: body.state?.startDate || previous.startDate || base.startDate,
        dailyOverrides: body.state?.dailyOverrides && typeof body.state.dailyOverrides === "object" ? body.state.dailyOverrides : previous.dailyOverrides || {},
        expenses: Array.isArray(body.state?.expenses) ? body.state.expenses : Array.isArray(previous.expenses) ? previous.expenses : [],
      };
      writeDb(db);
      sendStateWriteResponse(req, res, url, db.states[user.id]);
      return;
    }

    sendError(res, 404, "Not found.");
  } catch (error) {
    sendError(res, 400, error.message);
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;
  let filePath = path.normalize(path.join(root, requestPath));

  if (!filePath.startsWith(root) || filePath.includes(`${path.sep}data${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!path.extname(filePath)) {
    for (const ext of imageExtensions) {
      const candidate = path.normalize(filePath + ext);
      if (candidate.startsWith(root) && fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const cacheKey = filePath;
    const cached = staticCache.get(cacheKey);
    const stamp = `${stats.mtimeMs}:${stats.size}`;
    if (cached?.stamp === stamp) {
      sendStaticContent(req, res, filePath, cached.content, cached.etag);
      return;
    }

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const etag = `"${crypto.createHash("sha1").update(content).digest("hex")}"`;
      staticCache.set(cacheKey, { stamp, content, etag });
      sendStaticContent(req, res, filePath, content, etag);
    });
  });
}

function sendStaticContent(req, res, filePath, content, etag) {
  res.acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  const cacheControl = cacheControlFor(req, filePath);
  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, {
      "Cache-Control": cacheControl,
      ETag: etag,
    });
    res.end();
    return;
  }

  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".webp": "image/webp",
  };
  sendBody(res, 200, {
    "Cache-Control": cacheControl,
    "Content-Type": types[ext] || "application/octet-stream",
    ETag: etag,
  }, content);
}

function cacheControlFor(req, filePath) {
  const ext = path.extname(filePath);
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (ext === ".html") return "no-cache";
  if (url.pathname.startsWith("/vendor/")) return "public, max-age=31536000, immutable";
  if (ext === ".css" || ext === ".js") return "public, no-cache, must-revalidate";
  if (imageExtensions.includes(ext)) {
    return url.searchParams.has("v")
      ? "public, max-age=31536000, immutable"
      : "public, no-cache, must-revalidate";
  }
  return "public, max-age=300";
}

function publicAsset(name) {
  const filePath = resolvePublicAsset(name);
  if (!filePath) return null;
  const stats = fs.statSync(filePath);
  const version = `${Math.round(stats.mtimeMs)}-${stats.size}`;
  return {
    url: `/${name}?v=${encodeURIComponent(version)}`,
    version,
    size: stats.size,
  };
}

function resolvePublicAsset(name) {
  for (const ext of imageExtensions) {
    const filePath = path.normalize(path.join(root, `${name}${ext}`));
    if (filePath.startsWith(root) && fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

function decodeImageDataUrl(value) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=\s]+)$/i.exec(String(value || ""));
  if (!match) {
    throw new Error("Upload a valid image file.");
  }
  const extByMime = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > 6_000_000) {
    throw new Error("Background image is too large.");
  }
  return { buffer, ext: extByMime[match[1].toLowerCase()] };
}

function sendBody(res, status, headers, content) {
  let body = content;
  const responseHeaders = { ...headers };
  if (res.acceptsGzip && content.length > 1024 && isCompressible(responseHeaders["Content-Type"])) {
    body = zlib.gzipSync(content);
    responseHeaders["Content-Encoding"] = "gzip";
    responseHeaders["Vary"] = "Accept-Encoding";
  }
  responseHeaders["Content-Length"] = body.length;
  res.writeHead(status, responseHeaders);
  res.end(body);
}

function isCompressible(contentType = "") {
  return /^(application\/json|text\/|image\/svg\+xml)/.test(contentType);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`Finance Manager server running at http://${host}:${port}`);
});
