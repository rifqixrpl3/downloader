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

    const apiResponse = await fetch(
      `https://everythingjkt48.my.id/api/download?apikey=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: body,
      }
    );

    const data = await apiResponse.json();
    return res.status(apiResponse.status).json(data);
  } catch (error) {
    console.error("Download API Error:", error);
    return res.status(502).json({
      ok: false,
      error: "API downloader tidak dapat dihubungi.",
    });
  }
};
