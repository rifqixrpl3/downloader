const { URL } = require("url");

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

    const mediaResponse = await fetch(targetUrl.toString());

    if (!mediaResponse.ok) {
      return res.status(mediaResponse.status).send("Media request failed");
    }

    res.setHeader(
      "Content-Type",
      mediaResponse.headers.get("content-type") || "application/octet-stream"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="droply-media"');
    res.setHeader("Cache-Control", "no-store");

    for await (const chunk of mediaResponse.body) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    return res.status(502).send("Unable to download media");
  }
};
