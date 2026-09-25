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
  const formatInput = document.querySelector("#formatInput");
  const formatHint = document.querySelector("#formatHint");
  const imageGallery = document.querySelector("#imageGallery");
  const downloadMode = document.querySelector("#downloadMode");
  const youtubeMode = document.querySelector("#youtubeMode");
  const pinterestMode = document.querySelector("#pinterestMode");
  const apiStatus = document.querySelector("#apiStatus");
  const apiStatusText = document.querySelector("#apiStatusText");
  const apiNeedle = document.querySelector("#apiNeedle");
  const apiLatency = document.querySelector("#apiLatency");
  const footerApiStatus = document.querySelector("#footerApiStatus");
  const wibClock = document.querySelector("#wibClock");
  const systemPopup = document.querySelector("#systemPopup");
  const systemPopupClose = document.querySelector("#systemPopupClose");
  const systemPopupButton = document.querySelector("#systemPopupButton");
  const pageLoader = document.querySelector("#pageLoader");

  let activeMode = "download";

  if (pageLoader) {
    const loaderStartedAt = performance.now();
    const isSmallScreen = window.matchMedia("(max-width: 680px)").matches;
    const minimumLoaderTime = isSmallScreen ? 5500 : 1500;
    let loaderDismissalScheduled = false;
    const dismissPageLoader = () => {
      if (loaderDismissalScheduled) return;
      loaderDismissalScheduled = true;
      const remainingIntro = Math.max(0, minimumLoaderTime - (performance.now() - loaderStartedAt));
      window.setTimeout(() => {
        pageLoader.classList.add("is-hidden");
        window.setTimeout(() => pageLoader.remove(), 750);
      }, remainingIntro);
    };
    window.addEventListener("load", dismissPageLoader, { once: true });
    window.setTimeout(dismissPageLoader, 10000);
  }

  function updateWibClock() {
    if (!wibClock) return;
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    wibClock.textContent = formatter.format(new Date());
  }

  function closeSystemPopup() {
    if (!systemPopup) return;
    systemPopup.setAttribute("hidden", "true");
    systemPopup.style.display = "none";
    systemPopup.setAttribute("aria-hidden", "true");
  }

  function parseApiResponse(responseText) {
    try {
      return JSON.parse(responseText);
    } catch {
      if (/^\s*</.test(responseText)) {
        throw new Error("The server returned HTML instead of an API response. Check the deployed Pinterest API endpoint.");
      }
      throw new Error("The server returned an invalid API response.");
    }
  }

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.hidden = false;
    }
  }

  function hideError() {
    if (errorMessage) {
      errorMessage.hidden = true;
    }
  }

  function updateApiMeter(status) {
    const isOnline = status.status === "online";
    const latency = Number(status.latency);
    const safeLatency = Number.isFinite(latency) ? Math.max(0, latency) : 0;
    const needleAngle = isOnline ? Math.min(55, Math.max(-55, Math.log10(safeLatency + 10) * 43 - 52)) : -55;
    const speedClass = !isOnline ? "api-offline" : safeLatency < 400 ? "api-fast" : safeLatency < 1200 ? "api-normal" : "api-slow";

    if (apiStatus) {
      apiStatus.classList.remove("api-offline", "api-fast", "api-normal", "api-slow");
      apiStatus.classList.add(speedClass);
    }

    if (apiStatusText) {
      apiStatusText.textContent = isOnline ? (safeLatency < 400 ? "FAST" : safeLatency < 1200 ? "READY" : "SLOW") : "OFFLINE";
    }

    if (apiLatency) {
      apiLatency.textContent = isOnline ? `${Math.round(safeLatency)} ms` : "-- ms";
    }

    if (apiNeedle) {
      apiNeedle.style.transform = `rotate(${needleAngle}deg)`;
    }

    if (footerApiStatus) {
      footerApiStatus.textContent = isOnline ? "ONLINE" : "OFFLINE";
    }

    if (apiStatus) {
      apiStatus.title = `${isOnline ? "API active" : "API unavailable"} • ${isOnline ? `${Math.round(safeLatency)} ms` : "try again later"} • ${new Date(status.checkedAt).toLocaleTimeString("en-US")}`;
    }
  }

  async function checkApiStatus() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const status = await response.json();
      updateApiMeter(status);
    } catch {
      updateApiMeter({ status: "offline", latency: 0, checkedAt: new Date().toISOString() });
    }
  }

  function setLoading(isLoading) {
    if (downloadButton) downloadButton.disabled = isLoading;
    if (buttonText) {
      buttonText.textContent = isLoading
        ? "Processing link..."
        : activeMode === "pinterest"
          ? "Search photos"
          : activeMode === "youtube"
            ? "Download YouTube"
            : "Download now";
    }
  }

  function resolveMediaUrl(mediaUrl) {
    return new URL(mediaUrl, MEDIA_BASE_URL).href;
  }

  function createFilename(payload, mediaUrl, fallback = "droply-media") {
    const rawName = payload?.filename || payload?.title || fallback;
    const cleanName = String(rawName).replace(/[\\/:*?"<>|]/g, "-").trim() || fallback;
    if (/\.[a-z0-9]{2,5}$/i.test(cleanName)) return cleanName;
    const extension = new URL(mediaUrl, MEDIA_BASE_URL).pathname.match(/\.[a-z0-9]{2,5}$/i)?.[0];
    return `${cleanName}${extension || ""}`;
  }

  function downloadFile(mediaUrl, filename) {
    const proxyUrl = new URL("/api/proxy-download", window.location.origin);
    proxyUrl.searchParams.set("url", mediaUrl);
    proxyUrl.searchParams.set("filename", filename || "droply-media");

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

  function findMediaUrl(payload, preferAudio = false) {
    if (typeof payload === "string") return /^https?:\/\//i.test(payload) ? payload : "";
    if (!payload || typeof payload !== "object") return "";

    const preferredKeys = preferAudio
      ? ["audio", "audio_url", "mp3", "music", "download", "download_url", "video", "video_url", "play", "no_watermark", "media", "media_url", "url"]
      : ["download", "download_url", "video", "video_url", "play", "no_watermark", "media", "media_url", "url"];

    for (const key of preferredKeys) {
      const mediaUrl = findMediaUrl(payload[key], preferAudio);
      if (mediaUrl) return mediaUrl;
    }

    for (const [key, value] of Object.entries(payload)) {
      if (/^(image|images|thumbnail|cover|avatar|author|profile)/i.test(key)) continue;
      if (preferAudio && /^(video|video_url|download|download_url)$/i.test(key)) continue;
      const mediaUrl = findMediaUrl(value, preferAudio);
      if (mediaUrl) return mediaUrl;
    }

    return "";
  }

  function showResult(mediaUrl, sourceUrl, payload) {
    const resolvedUrl = resolveMediaUrl(mediaUrl);
    const filename = createFilename(payload, mediaUrl);
    if (emptyState) emptyState.hidden = true;
    if (imageGallery) imageGallery.hidden = true;
    if (resultContent) resultContent.hidden = false;
    if (resultLink) {
      resultLink.href = resolvedUrl;
      resultLink.download = filename;
    }
    if (resultTitle) resultTitle.textContent = payload?.title || "Media ready to download";
    if (resultMeta) resultMeta.textContent = `${filename} • ${new URL(sourceUrl).hostname}`;
    if (resultCount) resultCount.textContent = "1 item";
    if (resultLink) resultLink.textContent = "Download file  ↓";
  }

  function showImageResult(images, payload, sourceUrl) {
    if (emptyState) emptyState.hidden = true;
    if (resultContent) resultContent.hidden = false;
    if (imageGallery) {
      imageGallery.hidden = false;
      imageGallery.replaceChildren();
    }

    images.forEach((imageUrl, index) => {
      const link = document.createElement("a");
      link.className = "gallery-item";
      link.href = resolveMediaUrl(imageUrl);
      link.download = `droply-foto-${index + 1}`;

      const image = document.createElement("img");
      image.src = resolveMediaUrl(imageUrl);
      image.alt = `${payload.title || "Photo"} ${index + 1}`;
      image.loading = "lazy";

      link.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          await downloadFile(link.href, link.download);
        } catch (error) {
          showError(error.message || "Download photo failed. Please try again.");
        }
      });

      link.append(image);
      if (imageGallery) imageGallery.append(link);
    });

    if (resultCount) resultCount.textContent = `${images.length} photos`;
    if (resultTitle) resultTitle.textContent = payload.title || "Photo set ready to download";
    if (resultMeta) resultMeta.textContent = `Processed from ${new URL(sourceUrl).hostname}`;
    if (resultLink) {
      resultLink.textContent = "Download photo  ↓";
      resultLink.href = resolveMediaUrl(images[0]);
      resultLink.download = "droply-foto-1";
    }
  }

  function setMode(mode) {
    activeMode = mode;
    const isYoutube = mode === "youtube";
    const isPinterest = mode === "pinterest";

    if (downloadMode) downloadMode.classList.toggle("active", mode === "download");
    if (youtubeMode) youtubeMode.classList.toggle("active", isYoutube);
    if (pinterestMode) pinterestMode.classList.toggle("active", isPinterest);

    if (downloadMode) downloadMode.setAttribute("aria-selected", String(mode === "download"));
    if (youtubeMode) youtubeMode.setAttribute("aria-selected", String(isYoutube));
    if (pinterestMode) pinterestMode.setAttribute("aria-selected", String(isPinterest));

    if (urlInput) {
      urlInput.type = isPinterest ? "search" : "url";
      urlInput.placeholder = isPinterest ? "Example: Ronaldi" : isYoutube ? "https://youtube.com/watch?v=..." : "https://...";
    }

    if (buttonText) {
      buttonText.textContent = isPinterest ? "Search photos" : isYoutube ? "Download YouTube" : "Download now";
    }

    const panelLabel = document.querySelector(".panel-label");
    if (panelLabel) {
      panelLabel.textContent = isPinterest ? "SEARCH FOR THE PHOTO YOU WANT" : isYoutube ? "PASTE YOUTUBE LINK" : "PASTE LINK HERE";
    }

    const downloadOptions = document.querySelector(".download-options");
    if (downloadOptions) {
      downloadOptions.hidden = isPinterest || isYoutube;
    }

    syncFormatSelection();
  }

  function syncFormatSelection() {
    if (!formatInput || !audioOnlyInput) return;

    const isAudioOnly = audioOnlyInput.checked;
    if (isAudioOnly) {
      formatInput.value = "mp3";
      formatInput.disabled = true;
      if (formatHint) {
        formatHint.textContent = "Audio-only mode is active: format is automatically forced to MP3.";
      }
      return;
    }

    formatInput.disabled = false;
    if (!formatInput.value || formatInput.value === "mp3") {
      formatInput.value = "auto";
    }

    if (formatHint) {
      formatHint.textContent = "Video mode: format can be adjusted. Audio-only mode automatically uses MP3.";
    }
  }

  function extractImages(payload) {
    const imageKeys = /^(hd_image|image_url|download_url|image|images|src|original|originals|url)$/i;
    const urls = new Set();

    function visit(value, key = "", depth = 0) {
      if (depth > 8 || value == null) return;
      if (typeof value === "string") {
        if ((imageKeys.test(key) || /\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(value)) && /^https?:\/\//i.test(value)) {
          urls.add(value);
        }
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, key, depth + 1));
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey, depth + 1));
      }
    }

    visit(payload);
    return [...urls];
  }

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      if (clearButton) clearButton.hidden = !urlInput.value;
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      urlInput.value = "";
      clearButton.hidden = true;
      urlInput.focus();
    });
  }

  if (audioOnlyInput) {
    audioOnlyInput.addEventListener("change", syncFormatSelection);
  }

  if (downloadMode) downloadMode.addEventListener("click", () => setMode("download"));
  if (youtubeMode) youtubeMode.addEventListener("click", () => setMode("youtube"));
  if (pinterestMode) pinterestMode.addEventListener("click", () => setMode("pinterest"));

  if (dropZone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add("drag-active");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove("drag-active");
      });
    });

    dropZone.addEventListener("drop", (event) => {
      const text = event.dataTransfer.getData("text");
      if (text) {
        urlInput.value = text.trim();
        if (clearButton) clearButton.hidden = false;
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideError();

      const sourceUrl = urlInput.value.trim();
      if (!sourceUrl) return;

      setLoading(true);

      try {
        const payloadBody = {
          url: sourceUrl,
          audioOnly: audioOnlyInput.checked,
          quality: qualityInput.value || undefined,
          format: formatInput.value || undefined,
        };

        if (activeMode === "youtube") {
          const endpoint = API_ENDPOINT;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadBody),
          });

          const responseText = await response.text();
          const payload = parseApiResponse(responseText);

          if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
          if (payload?.ok === false) throw new Error(payload.error || "The API rejected the request.");

          const mediaUrl = audioOnlyInput.checked
            ? (payload?.audio || payload?.audio_url || payload?.mp3 || findMediaUrl(payload, true) || payload?.url)
            : (payload?.url || findMediaUrl(payload, false));

          if (!mediaUrl) throw new Error("The API responded without a usable media URL.");
          showResult(mediaUrl, sourceUrl, payload);
          return;
        }

        const endpoint = activeMode === "pinterest" ? `/api/pinterest?q=${encodeURIComponent(sourceUrl)}` : API_ENDPOINT;
        const request = activeMode === "pinterest"
          ? { method: "GET" }
          : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadBody) };

        const response = await fetch(endpoint, request);
        const responseText = await response.text();
        const payload = parseApiResponse(responseText);

        if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
        if (payload?.ok === false) throw new Error(payload.error || "The API rejected the request.");

        if (activeMode === "pinterest") {
          const images = extractImages(payload);
          if (!images.length) throw new Error("No photos were found for that keyword.");
          showImageResult(images, { ...payload, title: payload.title || `Pinterest results: ${sourceUrl}` }, `https://pinterest.com/search/pins/?q=${encodeURIComponent(sourceUrl)}`);
          return;
        }

        if (payload?.isImages && Array.isArray(payload.images) && payload.images.length) {
          showImageResult(payload.images, payload, sourceUrl);
          return;
        }

        const mediaUrl = audioOnlyInput.checked
          ? (payload?.audio || payload?.audio_url || payload?.mp3 || findMediaUrl(payload, true) || payload?.url)
          : (payload?.url || findMediaUrl(payload, false));

        if (!mediaUrl) throw new Error("The API responded without a usable media URL.");
        showResult(mediaUrl, sourceUrl, payload);
      } catch (error) {
        showError(error.message || "An error occurred while contacting the API.");
      } finally {
        setLoading(false);
      }
    });
  }

  if (resultLink) {
    resultLink.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        await downloadFile(resultLink.href, resultLink.download || "droply-media");
      } catch (error) {
        showError(error.message || "Download failed. Please try again.");
      }
    });
  }

  systemPopupClose?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeSystemPopup();
  });

  systemPopupButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeSystemPopup();
  });

  systemPopup?.addEventListener("click", (event) => {
    if (event.target === systemPopup) closeSystemPopup();
  });

  syncFormatSelection();
  updateWibClock();
  setInterval(updateWibClock, 1000);
  checkApiStatus();
  setInterval(checkApiStatus, 30000);
}
