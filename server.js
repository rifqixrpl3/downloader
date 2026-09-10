const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { Readable } = require("stream");

const port = 3000;
const root = __dirname;
const allowedHost = "everythingjkt48.my.id";
const allowedMediaHosts = ["tiktokcdn.com", "tiktokcdn-us.com", "tiktokv.com", "ibytedtos.com", "byteoversea.com", "muscdn.com", "cdninstagram.com", "fbcdn.net", "googlevideo.com", "pinimg.com"];
function isAllowedMediaHost(hostname) {
  return hostname === allowedHost || allowedMediaHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}
const mimeTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
const envPath = path.join(root, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) process.env[match[1].trim()] = match[2].trim();
  }
}
const apiKey = process.env.EVERYTHING_API_KEY;
async function readRequestBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (requestUrl.pathname === "/api/download" && request.method === "POST") {
    if (!apiKey) { response.writeHead(500); response.end(JSON.stringify({ ok: false, error: "API key server belum dikonfigurasi." })); return; }
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      try {
        const apiResponse = await fetch(`https://everythingjkt48.my.id/api/download?apikey=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body });
        response.writeHead(apiResponse.status, { "Content-Type": "application/json" });
        response.end(await apiResponse.text());
      } catch { response.writeHead(502); response.end(JSON.stringify({ ok: false, error: "API downloader tidak dapat dihubungi." })); }
    });
    return;
  }
  if (requestUrl.pathname === "/api/pinterest" && request.method === "GET") {
    const query = requestUrl.searchParams.get("q")?.trim();
    if (!apiKey) { response.writeHead(500); response.end(JSON.stringify({ ok: false, error: "API key server belum dikonfigurasi." })); return; }
    if (!query) { response.writeHead(400); response.end(JSON.stringify({ ok: false, error: "Kata kunci pencarian wajib diisi." })); return; }
    try {
      const apiResponse = await fetch(`https://${allowedHost}/api/pinterest?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apiKey)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
      const responseText = await apiResponse.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        response.writeHead(502, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: false, error: "Layanan Pinterest sedang bermasalah dan mengirim respons yang tidak valid." }));
        return;
      }
      response.writeHead(apiResponse.status, { "Content-Type": "application/json" });
      response.end(JSON.stringify(responseBody));
    } catch { response.writeHead(502); response.end(JSON.stringify({ ok: false, error: "API Pinterest tidak dapat dihubungi." })); }
    return;
  }
  if (requestUrl.pathname === "/api/youtube" && request.method === "POST") {
    if (!apiKey) { response.writeHead(500); response.end(JSON.stringify({ ok: false, error: "API key server belum dikonfigurasi." })); return; }
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", async () => {
      try {
        const apiResponse = await fetch(`https://everythingjkt48.my.id/api/youtube?apikey=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body });
        response.writeHead(apiResponse.status, { "Content-Type": "application/json" });
        response.end(await apiResponse.text());
      } catch { response.writeHead(502); response.end(JSON.stringify({ ok: false, error: "API YouTube tidak dapat dihubungi." })); }
    });
    return;
  }
  if (requestUrl.pathname === "/api/status" && request.method === "GET") {
    if (!apiKey) { response.writeHead(500, { "Content-Type": "application/json" }); response.end(JSON.stringify({ ok: false, status: "offline", error: "API key belum dikonfigurasi." })); return; }
    const startedAt = Date.now();
    try {
      const apiResponse = await fetch(`https://${allowedHost}/api/news?apikey=${encodeURIComponent(apiKey)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ ok: apiResponse.ok, status: apiResponse.ok ? "online" : "error", latency: Date.now() - startedAt, httpStatus: apiResponse.status, checkedAt: new Date().toISOString() }));
    } catch { response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify({ ok: false, status: "offline", latency: Date.now() - startedAt, checkedAt: new Date().toISOString() })); }
    return;
  }
  if (requestUrl.pathname === "/proxy-download" || requestUrl.pathname === "/api/proxy-download") {
    const target = requestUrl.searchParams.get("url");
    const requestedFilename = requestUrl.searchParams.get("filename") || "droply-media";
    if (!target) { response.writeHead(400); response.end("Missing url"); return; }
    try {
      const targetUrl = new URL(target);
      if (!isAllowedMediaHost(targetUrl.hostname)) { response.writeHead(403); response.end("Host is not allowed"); return; }
      if (targetUrl.pathname === "/api/download-image" && apiKey) targetUrl.searchParams.set("apikey", apiKey);
      const mediaResponse = await fetch(targetUrl);
      if (!mediaResponse.ok || !mediaResponse.body) { response.writeHead(mediaResponse.status || 502); response.end("Media tidak dapat diunduh"); return; }
      const contentType = mediaResponse.headers.get("content-type") || "application/octet-stream";
      const safeFilename = requestedFilename.replace(/[\\/:*?"<>|\r\n]/g, "-").replace(/[^\x20-\x7E]/g, "-").trim() || "droply-media";
      const extensionByType = { "video/mp4": ".mp4", "video/webm": ".webm", "audio/mpeg": ".mp3", "audio/mp4": ".m4a", "image/jpeg": ".jpg", "image/png": ".png" };
      const filename = /\.[a-z0-9]{2,5}$/i.test(safeFilename) ? safeFilename : `${safeFilename}${extensionByType[contentType.split(";")[0].toLowerCase()] || ""}`;
      const headers = {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      };
      const contentLength = mediaResponse.headers.get("content-length");
      if (contentLength) headers["Content-Length"] = contentLength;
      response.writeHead(200, headers);
      Readable.fromWeb(mediaResponse.body).pipe(response);
    } catch { response.writeHead(502); response.end("Unable to download media"); }
    return;
  }

  const filePath = path.join(root, requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) { response.writeHead(404); response.end("Not found"); return; }
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => console.log(`Droply running at http://localhost:${port}`));
