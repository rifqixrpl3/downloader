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

    // Do not stream the media through a Vercel Function. Large media responses
    // consume the function's bandwidth and can exceed its response limits.
    // A redirect keeps the API key server-side while the browser downloads the
    // actual file directly from the upstream media host.
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, targetUrl.toString());
  } catch (error) {
    return res.status(502).send("Unable to download media");
  }
};
