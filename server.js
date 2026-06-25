import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat, readdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { extname, join, normalize, relative, resolve } from "node:path";
import { Buffer } from "node:buffer";

const root = process.cwd();
const port = Number(process.env.PORT || 8080);
const adminUser = process.env.ADMIN_USER || "kaleido";
const adminPassword = process.env.ADMIN_PASSWORD || "";

const editableDirs = ["briefings", "guides", "benchmarks", "news"];
const editableFiles = ["index.html", "about.html", "editorial-policy.html"];
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": status >= 400 ? "no-store" : "public, max-age=300",
    ...headers
  });
  res.end(body);
}

function json(res, status, payload) {
  send(res, status, JSON.stringify(payload), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
}

function isAuthorized(req) {
  if (!adminPassword) return false;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const splitAt = decoded.indexOf(":");
  if (splitAt < 0) return false;
  const user = decoded.slice(0, splitAt);
  const password = decoded.slice(splitAt + 1);
  return user === adminUser && password === adminPassword;
}

function requireAdmin(req, res) {
  if (isAuthorized(req)) return true;
  res.writeHead(401, {
    "WWW-Authenticate": 'Basic realm="Kaleido Field Admin"',
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(adminPassword ? "Admin login required." : "Admin is disabled until ADMIN_PASSWORD is set.");
  return false;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function safeStaticPath(pathname) {
  let clean = decodeURIComponent(pathname);
  if (clean === "/admin") clean = "/admin.html";
  if (clean.endsWith("/")) clean += "index.html";
  if (!extname(clean)) clean += ".html";
  const full = normalize(join(root, clean));
  if (!full.startsWith(root)) return null;
  return full;
}

function safeEditablePath(inputPath) {
  const clean = inputPath.replace(/^\/+/, "");
  const full = resolve(root, clean);
  const rel = relative(root, full);
  if (rel.startsWith("..") || rel.includes("node_modules")) return null;
  if (editableFiles.includes(rel)) return full;
  const allowed = editableDirs.some((dir) => rel.startsWith(`${dir}/`) && rel.endsWith(".html"));
  return allowed ? full : null;
}

async function listHtmlFiles() {
  const files = [...editableFiles];
  for (const dir of editableDirs) {
    const entries = await readdir(join(root, dir), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".html")) files.push(`${dir}/${entry.name}`);
    }
  }

  return Promise.all(files.map(async (file) => {
    const full = join(root, file);
    const html = await readFile(full, "utf8");
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || file;
    const info = await stat(full);
    return { path: file, title, modified: info.mtime.toISOString() };
  }));
}

async function handleAdminApi(req, res, url) {
  if (!requireAdmin(req, res)) return;

  if (req.method === "GET" && url.pathname === "/api/admin/articles") {
    json(res, 200, { articles: await listHtmlFiles() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/article") {
    const path = url.searchParams.get("path") || "";
    const full = safeEditablePath(path);
    if (!full || !existsSync(full)) return json(res, 400, { error: "File is not editable." });
    json(res, 200, { path, content: await readFile(full, "utf8") });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/article") {
    const payload = JSON.parse(await readBody(req));
    const full = safeEditablePath(String(payload.path || ""));
    if (!full) return json(res, 400, { error: "File is not editable." });
    await writeFile(full, String(payload.content || ""), "utf8");
    json(res, 200, { ok: true, path: payload.path });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/upload") {
    const payload = JSON.parse(await readBody(req));
    const safeName = String(payload.filename || "upload.png").replace(/[^a-zA-Z0-9._-]/g, "-");
    const dataUrl = String(payload.dataUrl || "");
    const match = dataUrl.match(/^data:([\w/+.-]+);base64,(.+)$/);
    if (!match) return json(res, 400, { error: "Upload must be a base64 data URL." });
    await mkdir(join(root, "assets", "uploads"), { recursive: true });
    const filename = `${Date.now()}-${safeName}`;
    const out = join(root, "assets", "uploads", filename);
    await writeFile(out, Buffer.from(match[2], "base64"));
    json(res, 200, { ok: true, url: `/assets/uploads/${filename}` });
    return;
  }

  json(res, 404, { error: "Not found." });
}

async function handleStatic(req, res, url) {
  if (url.pathname.startsWith("/admin") && !requireAdmin(req, res)) return;
  const full = safeStaticPath(url.pathname);
  if (!full || !existsSync(full)) return send(res, 404, "Not found.", { "Content-Type": "text/plain; charset=utf-8" });

  const ext = extname(full);
  const headers = { "Content-Type": mimeTypes[ext] || "application/octet-stream" };
  if ([".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico"].includes(ext)) {
    headers["Cache-Control"] = "public, max-age=604800";
  }
  res.writeHead(200, headers);
  createReadStream(full).pipe(res);
}

createServer(async (req, res) => {
  try {
    const host = req.headers.host || "";
    const url = new URL(req.url || "/", `https://${host}`);
    if (host.startsWith("www.kaleidofield.com")) {
      res.writeHead(301, { Location: `https://kaleidofield.com${url.pathname}${url.search}` });
      res.end();
      return;
    }
    if (url.pathname.startsWith("/api/admin/")) {
      await handleAdminApi(req, res, url);
      return;
    }
    await handleStatic(req, res, url);
  } catch (error) {
    console.error(error);
    json(res, 500, { error: "Server error." });
  }
}).listen(port, () => {
  console.log(`Kaleido Field listening on ${port}`);
});
