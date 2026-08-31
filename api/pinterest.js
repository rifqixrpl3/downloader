const apiKey = process.env.EVERYTHING_API_KEY;
const allowedHost = "everythingjkt48.my.id";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const query = req.query.q?.trim();

  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "API key server belum dikonfigurasi." });
  }

  if (!query) {
    return res.status(400).json({ ok: false, error: "Kata kunci pencarian wajib diisi." });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const apiResponse = await fetch(
      `https://${allowedHost}/api/pinterest?q=${encodeURIComponent(query)}&apikey=${encodeURIComponent(apiKey)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const data = await apiResponse.json();
    return res.status(apiResponse.status).json(data);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: "API Pinterest tidak dapat dihubungi.",
    });
  }
};
