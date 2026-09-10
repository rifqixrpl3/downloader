const { URL } = require("url");
const { Readable } = require("stream");

const apiKey = process.env.EVERYTHING_API_KEY;
const allowedHost = "everythingjkt48.my.id";
const allowedMediaHosts = ["tiktokcdn.com", "tiktokcdn-us.com", "tiktokv.com", "ibytedtos.com", "byteoversea.com", "muscdn.com", "cdninstagram.com", "fbcdn.net", "googlevideo.com", "pinimg.com"];
function isAllowedMediaHost(hostname) {
  return hostname === allowedHost || allowedMediaHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const target = req.query.url;
  const requestedFilename = req.query.filename || "droply-media";

  if (!target) {
    return res.status(400).send("Missing url");
  }

  try {
    const targetUrl = new URL(target);

    if (!isAllowedMediaHost(targetUrl.hostname)) {
      return res.status(403).send("Host is not allowed");
    }

    if (targetUrl.pathname === "/api/download-image" && apiKey) {
      targetUrl.searchParams.set("apikey", apiKey);
    }

    const mediaResponse = await fetch(targetUrl);
    if (!mediaResponse.ok || !mediaResponse.body) {
      return res.status(mediaResponse.status || 502).send("Media tidak dapat diunduh");
    }

    const contentType = mediaResponse.headers.get("content-type") || "application/octet-stream";
    const contentLength = mediaResponse.headers.get("content-length");
    const safeFilename = requestedFilename.replace(/[\\/:*?"<>|\r\n]/g, "-").replace(/[^\x20-\x7E]/g, "-").trim() || "droply-media";
    const extensionByType = { "video/mp4": ".mp4", "video/webm": ".webm", "audio/mpeg": ".mp3", "audio/mp4": ".m4a", "image/jpeg": ".jpg", "image/png": ".png" };
    const filename = /\.[a-z0-9]{2,5}$/i.test(safeFilename) ? safeFilename : `${safeFilename}${extensionByType[contentType.split(";")[0].toLowerCase()] || ""}`;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    return Readable.fromWeb(mediaResponse.body).pipe(res);
  } catch (error) {
    return res.status(502).send("Unable to download media");
  }
};
