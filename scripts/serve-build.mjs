import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import app from "../dist/server/server.js";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const clientRoot = join(process.cwd(), "dist", "client");

const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function clientFile(pathname) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, "");
  const file = join(clientRoot, relative);
  if (!file.startsWith(clientRoot) || !existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

function requestHeaders(req) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }
  return headers;
}

async function bodyFor(req) {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);
    const staticFile = clientFile(url.pathname);
    if (staticFile) {
      res.statusCode = 200;
      res.setHeader("content-type", mime[extname(staticFile).toLowerCase()] || "application/octet-stream");
      if (req.method === "HEAD") return res.end();
      return createReadStream(staticFile).pipe(res);
    }

    const body = await bodyFor(req);
    const request = new Request(url, {
      method: req.method,
      headers: requestHeaders(req),
      body,
    });
    const response = await app.fetch(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (req.method === "HEAD") return res.end();
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Ishar Construction Kit test server error");
  }
});

server.listen(port, host, () => {
  console.log(`Ishar Construction Kit test build: http://${host}:${port}`);
});
