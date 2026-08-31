const apiKey = process.env.EVERYTHING_API_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "API key server belum dikonfigurasi." });
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const apiResponse = await fetch(
      `https://everythingjkt48.my.id/api/youtube?apikey=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: body,
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const data = await apiResponse.json();
    return res.status(apiResponse.status).json(data);
  } catch (error) {
    console.error("YouTube API Error:", error);
    return res.status(502).json({
      ok: false,
      error: "API YouTube tidak dapat dihubungi.",
    });
  }
};
