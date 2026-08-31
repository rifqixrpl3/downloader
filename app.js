if (typeof document === "undefined") {
  if (typeof module !== "undefined") {
    module.exports = async function serverlessStub(req, res) {
      if (res && typeof res.status === "function") {
        return res.status(200).json({ ok: true, message: "Static asset loader stub" });
      }
      return { ok: true, message: "Static asset loader stub" };
    };
  }
} else {
  const API_ENDPOINT = "/api/download";
  const MEDIA_BASE_URL = "https://everythingjkt48.my.id";
  const form = document.querySelector("#downloadForm");
  const urlInput = document.querySelector("#urlInput");
  const clearButton = document.querySelector("#clearButton");
  const downloadButton = document.querySelector("#downloadButton");
  const buttonText = document.querySelector("#buttonText");
  const dropZone = document.querySelector("#dropZone");
  const emptyState = document.querySelector("#emptyState");
  const resultContent = document.querySelector("#resultContent");
  const resultLink = document.querySelector("#resultLink");
  const resultTitle = document.querySelector("#resultTitle");
  const resultMeta = document.querySelector("#resultMeta");
  const resultCount = document.querySelector("#resultCount");
  const errorMessage = document.querySelector("#errorMessage");
  const audioOnlyInput = document.querySelector("#audioOnlyInput");
  const qualityInput = document.querySelector("#qualityInput");
  const imageGallery = document.querySelector("#imageGallery");
  const downloadMode = document.querySelector("#downloadMode");
  const youtubeMode = document.querySelector("#youtubeMode");
  const pinterestMode = document.querySelector("#pinterestMode");
  const apiStatus = document.querySelector("#apiStatus");
  const apiStatusText = document.querySelector("#apiStatusText");
  const apiNeedle = document.querySelector("#apiNeedle");
  const apiLatency = document.querySelector("#apiLatency");
  const footerApiStatus = document.querySelector("#footerApiStatus");
  let activeMode = "download";

  function showError(message) { errorMessage.textContent = message; errorMessage.hidden = false; }
  function hideError() { errorMessage.hidden = true; }
  async function checkApiStatus() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const status = await response.json();
      const isOnline = status.status === "online";
      apiStatus.classList.toggle("api-offline", !isOnline);
      apiStatusText.textContent = isOnline ? "ONLINE" : "OFFLINE";
      apiLatency.textContent = isOnline ? `${status.latency} ms` : "-- ms";
      apiNeedle.style.transform = `rotate(${isOnline ? Math.min(55, Math.max(-55, status.latency / 10 - 35)) : -55}deg)`;
      footerApiStatus.textContent = isOnline ? "ONLINE" : "OFFLINE";
      apiStatus.title = `Terakhir dicek: ${new Date(status.checkedAt).toLocaleTimeString("id-ID")}`;
    } catch {
      apiStatus.classList.add("api-offline"); apiStatusText.textContent = "OFFLINE"; apiLatency.textContent = "-- ms"; apiNeedle.style.transform = "rotate(-55deg)"; footerApiStatus.textContent = "OFFLINE";
    }
  }
  function setLoading(isLoading) { downloadButton.disabled = isLoading; buttonText.textContent = isLoading ? "Memproses link..." : "Download sekarang"; }
  function resolveMediaUrl(mediaUrl) { return new URL(mediaUrl, MEDIA_BASE_URL).href; }
  function createFilename(payload, mediaUrl, fallback = "droply-media") {
    const rawName = payload?.filename || payload?.title || fallback;
    const cleanName = rawName.replace(/[\\/:*?"<>|]/g, "-").trim() || fallback;
    if (/\.[a-z0-9]{2,5}$/i.test(cleanName)) return cleanName;
    const extension = new URL(mediaUrl, MEDIA_BASE_URL).pathname.match(/\.[a-z0-9]{2,5}$/i)?.[0];
    return `${cleanName}${extension || ""}`;
  }
  async function downloadFile(mediaUrl, filename) {
    const proxyUrl = new URL("/proxy-download", window.location.origin);
    proxyUrl.searchParams.set("url", mediaUrl);
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("File tidak bisa diunduh dari server.");
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a"); link.href = blobUrl; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }
  function findMediaUrl(payload) {
    if (typeof payload === "string") return /^https?:\/\//i.test(payload) ? payload : "";
    if (!payload || typeof payload !== "object") return "";
    const preferredKeys = ["download", "download_url", "video", "video_url", "play", "no_watermark", "media", "media_url", "url"];
    for (const key of preferredKeys) {
      const mediaUrl = findMediaUrl(payload[key]);
      if (mediaUrl) return mediaUrl;
    }
    for (const [key, value] of Object.entries(payload)) {
      if (/^(image|images|thumbnail|cover|avatar|music|author|profile)/i.test(key)) continue;
      const mediaUrl = findMediaUrl(value);
      if (mediaUrl) return mediaUrl;
    }
    return "";
  }
  function showResult(mediaUrl, sourceUrl, payload) {
    const resolvedUrl = resolveMediaUrl(mediaUrl); const filename = createFilename(payload, mediaUrl); emptyState.hidden = true; imageGallery.hidden = true; resultContent.hidden = false; resultLink.href = resolvedUrl; resultLink.download = filename;
    resultTitle.textContent = payload?.title || "Media siap diunduh"; resultMeta.textContent = `${filename} • ${new URL(sourceUrl).hostname}`; resultCount.textContent = "1 item"; resultLink.textContent = "Download file  ↓";
  }
  function showImageResult(images, payload, sourceUrl) {
    emptyState.hidden = true; resultContent.hidden = false; imageGallery.hidden = false; imageGallery.replaceChildren();
    images.forEach((imageUrl, index) => {
      const link = document.createElement("a"); link.className = "gallery-item"; link.href = resolveMediaUrl(imageUrl); link.download = `droply-foto-${index + 1}`;
      const image = document.createElement("img"); image.src = resolveMediaUrl(imageUrl); image.alt = `${payload.title || "Foto"} ${index + 1}`; image.loading = "lazy";
      link.addEventListener("click", async (event) => { event.preventDefault(); try { await downloadFile(link.href, link.download); } catch (error) { showError(error.message || "Download foto gagal. Coba lagi."); } });
      link.append(image); imageGallery.append(link);
    });
    resultCount.textContent = `${images.length} foto`; resultTitle.textContent = payload.title || "Carousel foto siap diunduh"; resultMeta.textContent = `Diproses dari ${new URL(sourceUrl).hostname}`; resultLink.textContent = "Download foto  ↓"; resultLink.href = resolveMediaUrl(images[0]); resultLink.download = "droply-foto-1";
  }
  function setMode(mode) {
    activeMode = mode;
    const isYoutube = mode === "youtube";
    const isPinterest = mode === "pinterest";
    downloadMode.classList.toggle("active", mode === "download");
    youtubeMode.classList.toggle("active", isYoutube);
    pinterestMode.classList.toggle("active", isPinterest);
    downloadMode.setAttribute("aria-selected", String(mode === "download"));
    youtubeMode.setAttribute("aria-selected", String(isYoutube));
    pinterestMode.setAttribute("aria-selected", String(isPinterest));
    urlInput.type = isPinterest ? "search" : "url";
    urlInput.placeholder = isPinterest ? "Contoh: Ronaldi" : isYoutube ? "https://youtube.com/watch?v=..." : "https://...";
    buttonText.textContent = isPinterest ? "Cari foto" : isYoutube ? "Download YouTube" : "Download sekarang";
    document.querySelector(".panel-label").textContent = isPinterest ? "CARI FOTO YANG ANDA MAU" : isYoutube ? "TEMPEL LINK YOUTUBE" : "TEMPEL LINK DI SINI";
    document.querySelector(".download-options").hidden = isPinterest || isYoutube;
  }
  function extractImages(payload) {
    if (!payload || typeof payload !== "object") return [];
    const candidates = [payload.images, payload.results, payload.data, payload.photos, payload.items];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        const urls = candidate.map((item) => typeof item === "string" ? item : item?.hd_image || item?.download_url || item?.url || item?.image || item?.src).filter((url) => typeof url === "string" && /^https?:\/\//i.test(url));
        if (urls.length) return urls;
      }
    }
    return [];
  }

  urlInput.addEventListener("input", () => { clearButton.hidden = !urlInput.value; });
  clearButton.addEventListener("click", () => { urlInput.value = ""; clearButton.hidden = true; urlInput.focus(); });
  downloadMode.addEventListener("click", () => setMode("download"));
  youtubeMode.addEventListener("click", () => setMode("youtube"));
  pinterestMode.addEventListener("click", () => setMode("pinterest"));
  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add("drag-active"); }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove("drag-active"); }));
  dropZone.addEventListener("drop", (event) => { const text = event.dataTransfer.getData("text"); if (text) { urlInput.value = text.trim(); clearButton.hidden = false; } });

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); hideError();
    const sourceUrl = urlInput.value.trim();
    if (!sourceUrl) return;
    setLoading(true);
    try {
      if (activeMode === "youtube") {
        const endpoint = `/api/youtube`;
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: sourceUrl, audioOnly: audioOnlyInput.checked, quality: qualityInput.value }) });
        const responseText = await response.text();
        const payload = JSON.parse(responseText);
        if (!response.ok) throw new Error(payload?.message || payload?.error || `Request gagal (${response.status})`);
        if (payload?.ok === false) throw new Error(payload.error || "Request ditolak oleh API.");
        const mediaUrl = payload?.url || findMediaUrl(payload);
        if (!mediaUrl) throw new Error("API merespons tanpa URL media yang bisa dibuka.");
        showResult(mediaUrl, sourceUrl, payload); return;
      }
      const endpoint = activeMode === "pinterest" ? `/api/pinterest?q=${encodeURIComponent(sourceUrl)}` : API_ENDPOINT;
      const request = activeMode === "pinterest" ? { method: "GET" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: sourceUrl, audioOnly: audioOnlyInput.checked, quality: qualityInput.value }) };
      const response = await fetch(endpoint, request);
      const responseText = await response.text();
      const payload = JSON.parse(responseText);
      if (!response.ok) throw new Error(payload?.message || payload?.error || `Request gagal (${response.status})`);
      if (payload?.ok === false) throw new Error(payload.error || "Request ditolak oleh API.");
      if (activeMode === "pinterest") {
        const images = extractImages(payload);
        if (!images.length) throw new Error("Tidak ada foto yang ditemukan untuk kata kunci tersebut.");
        showImageResult(images, { ...payload, title: payload.title || `Hasil Pinterest: ${sourceUrl}` }, `https://pinterest.com/search/pins/?q=${encodeURIComponent(sourceUrl)}`); return;
      }
      if (payload?.isImages && Array.isArray(payload.images) && payload.images.length) { showImageResult(payload.images, payload, sourceUrl); return; }
      const mediaUrl = payload?.url || findMediaUrl(payload);
      if (!mediaUrl) throw new Error("API merespons tanpa URL media yang bisa dibuka.");
      showResult(mediaUrl, sourceUrl, payload);
    } catch (error) { showError(error.message || "Terjadi kesalahan saat menghubungi API."); }
    finally { setLoading(false); }
  });

  resultLink.addEventListener("click", async (event) => {
    event.preventDefault();
    try { await downloadFile(resultLink.href, resultLink.download || "droply-media"); }
    catch (error) { showError(error.message || "Download gagal. Coba lagi."); }
  });

  checkApiStatus();
  setInterval(checkApiStatus, 30000);
}
