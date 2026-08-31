if (typeof document === "undefined") {
  if (typeof module !== "undefined") {
    module.exports = {};
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
  const systemPopup = document.querySelector("#systemPopup");
  const systemPopupClose = document.querySelector("#systemPopupClose");
  const systemPopupButton = document.querySelector("#systemPopupButton");
  let activeMode = "download";

  function closeSystemPopup() { systemPopup?.setAttribute("hidden", ""); }

  function parseApiResponse(responseText) {
    try { return JSON.parse(responseText); }
    catch {
      if (/^\s*</.test(responseText)) throw new Error("Server mengirim halaman HTML, bukan respons API. Periksa endpoint API Pinterest pada deployment.");
      throw new Error("Server mengirim respons API yang tidak valid.");
    }
  }

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
  function downloadFile(mediaUrl, filename) {
    const proxyUrl = new URL("/api/proxy-download", window.location.origin);
    proxyUrl.searchParams.set("url", mediaUrl);
    if (window.matchMedia("(pointer: coarse)").matches) {
      window.location.assign(proxyUrl.href);
      return;
    }
    const link = document.createElement("a");
    link.href = proxyUrl.href;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
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
    const imageKeys = /^(hd_image|image_url|download_url|image|images|src|original|originals|url)$/i;
    const urls = new Set();
    function visit(value, key = "", depth = 0) {
      if (depth > 8 || value == null) return;
      if (typeof value === "string") {
        if ((imageKeys.test(key) || /\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(value)) && /^https?:\/\//i.test(value)) urls.add(value);
        return;
      }
      if (Array.isArray(value)) { value.forEach((item) => visit(item, key, depth + 1)); return; }
      if (typeof value === "object") Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey, depth + 1));
    }
    visit(payload);
    return [...urls];
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
        const payload = parseApiResponse(responseText);
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
      const payload = parseApiResponse(responseText);
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

  systemPopupClose?.addEventListener("click", closeSystemPopup);
  systemPopupButton?.addEventListener("click", closeSystemPopup);
  systemPopup?.addEventListener("click", (event) => { if (event.target === systemPopup) closeSystemPopup(); });

  checkApiStatus();
  setInterval(checkApiStatus, 30000);
}
