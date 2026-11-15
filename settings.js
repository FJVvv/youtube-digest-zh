/**
 * Shared, non-secret configuration helpers.
 *
 * API keys are stored in chrome.storage.local by options.js. This file contains
 * defaults and validation only, so it is safe to publish.
 */
var YTD_SETTINGS = (() => {
  const STORAGE_KEY = "ytd_settings";
  const DEFAULTS = Object.freeze({
    provider: "deepseek",
    aiApiKey: "",
    aiBaseUrl: "https://api.deepseek.com",
    aiModel: "deepseek-v4-flash",
    supadataApiKey: "",
    transcriptSource: "auto",
  });

  const TRANSCRIPT_SOURCES = new Set(["auto", "supadata"]);

  function isLegacyCustom(input) {
    return !!input && input.provider === "custom";
  }

  function normalizeBaseUrl(value) {
    if (typeof value !== "string") return DEFAULTS.aiBaseUrl;
    const trimmed = value.trim().replace(/\/+$/, "");
    if (!trimmed) return DEFAULTS.aiBaseUrl;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return DEFAULTS.aiBaseUrl;
      }
    } catch (_error) {
      return DEFAULTS.aiBaseUrl;
    }
    return trimmed;
  }

  function normalizeModel(value) {
    if (typeof value !== "string") return DEFAULTS.aiModel;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 120) return DEFAULTS.aiModel;
    return trimmed;
  }

  function normalizeTranscriptSource(value) {
    return TRANSCRIPT_SOURCES.has(value) ? value : DEFAULTS.transcriptSource;
  }

  function normalize(input = {}) {
    const legacyCustom = isLegacyCustom(input);
    return {
      provider: DEFAULTS.provider,
      aiApiKey: legacyCustom
        ? ""
        : typeof input.aiApiKey === "string"
          ? input.aiApiKey.trim()
          : "",
      aiBaseUrl: legacyCustom
        ? DEFAULTS.aiBaseUrl
        : normalizeBaseUrl(input.aiBaseUrl),
      aiModel: legacyCustom
        ? DEFAULTS.aiModel
        : normalizeModel(input.aiModel),
      supadataApiKey:
        typeof input.supadataApiKey === "string"
          ? input.supadataApiKey.trim()
          : "",
      transcriptSource: normalizeTranscriptSource(input.transcriptSource),
    };
  }

  function migrateLegacyCustom(input = {}) {
    return {
      settings: normalize(input),
      migrated: isLegacyCustom(input),
    };
  }

  function chatCompletionsUrl(baseUrl = DEFAULTS.aiBaseUrl) {
    return `${normalizeBaseUrl(baseUrl)}/chat/completions`;
  }

  function isOfficialDeepSeekBase(url) {
    try {
      return new URL(String(url || "")).host === "api.deepseek.com";
    } catch (_error) {
      return false;
    }
  }

  function canonicalYouTubeUrl(videoId) {
    const normalized = String(videoId || "").trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(normalized)) {
      throw new Error("Invalid YouTube video ID.");
    }
    return `https://www.youtube.com/watch?v=${normalized}`;
  }

  return {
    STORAGE_KEY,
    DEFAULTS,
    isLegacyCustom,
    normalize,
    normalizeBaseUrl,
    migrateLegacyCustom,
    chatCompletionsUrl,
    isOfficialDeepSeekBase,
    canonicalYouTubeUrl,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = YTD_SETTINGS;
}
