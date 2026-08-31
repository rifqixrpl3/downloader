const { URL } = require("url");
const { Readable } = require("stream");

const apiKey = process.env.EVERYTHING_API_KEY;
const allowedHost = "everythingjkt48.my.id";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const target = req.query.url;

  if (!target) {
    return res.status(400).send("Missing url");
  }

  try {
    const targetUrl = new URL(target);

    if (targetUrl.hostname !== allowedHost) {
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
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "attachment; filename=download");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    return Readable.fromWeb(mediaResponse.body).pipe(res);
  } catch (error) {
    return res.status(502).send("Unable to download media");
  }
};
