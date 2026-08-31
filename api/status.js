const apiKey = process.env.EVERYTHING_API_KEY;
const allowedHost = "everythingjkt48.my.id";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      status: "offline",
      error: "API key belum dikonfigurasi.",
    });
  }

  const startedAt = Date.now();

  try {
    const apiResponse = await fetch(
      `https://${allowedHost}/api/news?apikey=${encodeURIComponent(apiKey)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: apiResponse.ok,
      status: apiResponse.ok ? "online" : "error",
      latency: Date.now() - startedAt,
      httpStatus: apiResponse.status,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      status: "offline",
      latency: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  }
};
