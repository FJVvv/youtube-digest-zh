/**
 * CAPTION CAPTURE (MAIN world content script)
 *
 * 在 YouTube 页面自身的 JS 上下文里运行（由 manifest 注册为 world: "MAIN"、
 * run_at: "document_start"），负责"免费读取 YouTube 自带字幕"：
 *
 * 1. 捕获播放器自己请求过的 /api/timedtext 字幕 URL（fetch / XHR / Resource
 *    Timing 三路兜底）。这些 URL 带着当前会话有效的 pot / signature，直接复用
 *    最省事，也最不容易被拒。
 * 2. 用捕获到的 URL、其次是 #movie_player 上的字幕轨 baseUrl 去取 json3。
 * 3. 前两步都拿不到时，临时打开播放器的字幕模块触发一次 timedtext 请求，
 *    取完后恢复用户原来的 CC 状态（原本关着的就关回去）。
 * 4. 把 json3 解析成 cues，用 window.postMessage 回传给隔离世界的 content.js。
 *
 * 协议：
 *   content.js → MAIN : {source:"ytd-caption-content", type:"extract", requestId, videoId}
 *   MAIN → content.js : {source:"ytd-caption-main", type:"result", requestId, cues,
 *                        language, provider:"youtube"}
 *                       {source:"ytd-caption-main", type:"error", requestId, code, message}
 *   code ∈ NO_CAPTION_TRACKS / CAPTION_FETCH_FAILED / EMPTY_CUES / TIMEOUT
 *
 * 说明：任务说明里回包示例出现了两个 source 字段（路由标记 + "youtube"）。
 * JS 对象字面量里重复键会互相覆盖，无法同时承载两个值，所以路由仍用
 * source:"ytd-caption-main"，来源记号放在 provider:"youtube"。
 *
 * 来源 / Attribution:
 *   timedtext 嗅探（fetch / XMLHttpRequest / Resource Timing）与 json3 解析的
 *   思路改写自 yt-dual-subs 的 inject.js（MIT License, Copyright (c) 2026
 *   Gythiro）。本项目按自己的消息协议与错误码重写。
 */
(function () {
  "use strict";

  // ============================================================
  // CONSTANTS / LOGGING
  // ============================================================

  const DEBUG = false;
  const debugLog = (...args) => {
    if (DEBUG) console.log("[YouTube Digest Captions]", ...args);
  };

  const TIMEDTEXT_MARK = "/api/timedtext";
  const SOURCE_CONTENT = "ytd-caption-content";
  const SOURCE_MAIN = "ytd-caption-main";

  // Whole-request budget. content.js gives up after 15 s, so stay under it and
  // leave room for the postMessage round trip.
  const EXTRACT_BUDGET_MS = 12000;
  // One timedtext fetch. Aborted via AbortController so a stalled request can
  // never eat the whole budget.
  const FETCH_TIMEOUT_MS = 3500;
  const CAPTIONS_MODULE_WAIT_MS = 450;
  const CAPTURE_WAIT_MS = 1600;
  const CAPTURE_POLL_MS = 100;
  const MAX_URLS_PER_VIDEO = 12;
  const MAX_STRATEGY1_ATTEMPTS = 3;
  // Our own timedtext fetches are also visible to the Resource Timing scan.
  // Keep them marked for a moment so they are not mistaken for the player's.
  const SELF_URL_LINGER_MS = 5000;

  // ============================================================
  // PURE FUNCTIONS (also exported for Node unit tests)
  // ============================================================

  /**
   * Force fmt=json3 on a timedtext URL while keeping every other parameter
   * (pot, signature, expire, lang, tlang …). Returns null for an invalid URL.
   *
   * @param {string} url
   * @returns {string|null}
   */
  function normalizeTimedtextUrlForVideo(url) {
    if (typeof url !== "string") return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    let parsed;
    try {
      parsed = new URL(trimmed);
    } catch (_error) {
      return null;
    }
    // Only http(s) URLs can be fetched; anything else is not a timedtext URL.
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    parsed.searchParams.set("fmt", "json3");
    return parsed.toString();
  }

  /**
   * Convert a json3 caption payload into the cue shape the rest of the
   * extension uses.
   *
   * json3: {events:[{tStartMs, dDurationMs, segs:[{utf8}]}]}
   * cues:  [{text, start, duration, language}]
   *
   * - text: segs joined, whitespace collapsed, trimmed; empty events skipped
   * - start: seconds, floored from tStartMs
   * - duration: seconds, rounded from dDurationMs
   * - language: the language of the selected caption track
   * Consecutive events with exactly the same text are collapsed into one
   * (rolling auto-captions repeat the previous line).
   *
   * @param {{events?: Array}} json
   * @param {string} [language]
   * @returns {Array<{text: string, start: number, duration: number, language: string}>}
   */
  function parseJson3Cues(json, language) {
    const lang = typeof language === "string" ? language : "";
    const cues = [];
    if (!json || !Array.isArray(json.events)) return cues;

    let previousText = "";
    for (const event of json.events) {
      try {
        if (!event || !Array.isArray(event.segs)) continue;

        let text = "";
        for (const seg of event.segs) {
          if (seg && typeof seg.utf8 === "string") text += seg.utf8;
        }
        text = text.replace(/\s+/g, " ").trim();

        // Skip style/window/blank events, and repeated rolling lines.
        if (!text) continue;
        if (text === previousText) continue;
        previousText = text;

        const tStartMs = typeof event.tStartMs === "number" ? event.tStartMs : 0;
        const dDurationMs =
          typeof event.dDurationMs === "number" ? event.dDurationMs : 0;

        cues.push({
          text,
          start: Math.floor(tStartMs / 1000),
          duration: Math.round(dDurationMs / 1000),
          language: lang,
        });
      } catch (_error) {
        // A malformed event must not abort the rest of the track.
      }
    }
    return cues;
  }

  // Node unit tests require() this file. Content scripts have no `module`, so
  // in the browser this block is a no-op.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseJson3Cues, normalizeTimedtextUrlForVideo };
  }

  // Everything below needs a real page. `require()` in Node stops here.
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // The content script runs in the top frame only; this is just a guard against
  // odd embeds where the MAIN world script would land in a subframe.
  try {
    if (window.top !== window.self) return;
  } catch (_error) {
    return;
  }

  // ============================================================
  // CAPTURE STORE
  // ============================================================

  // videoId -> [url, …] (oldest first, newest last). "unknown" collects URLs
  // whose own ?v= could not be read, so a late capture is still usable.
  const capturesByVideo = new Map();
  // Timedtext URLs our own fetchJson3 currently has on the wire.
  const selfFetchUrls = new Set();

  function isTimedtext(url) {
    return typeof url === "string" && url.indexOf(TIMEDTEXT_MARK) !== -1;
  }

  function currentVideoIdFromLocation() {
    try {
      const id = new URLSearchParams(window.location.search).get("v");
      return id || "unknown";
    } catch (_error) {
      return "unknown";
    }
  }

  function videoIdOfUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.searchParams.get("v") || "unknown";
    } catch (_error) {
      return "unknown";
    }
  }

  function absoluteUrl(url) {
    try {
      return new URL(url, window.location.href).toString();
    } catch (_error) {
      return url;
    }
  }

  /**
   * Record a /api/timedtext URL seen on the wire. Called from the fetch hook,
   * the XHR hook and the Resource Timing observer, so it must never throw.
   */
  function noteTimedtext(url) {
    try {
      if (!isTimedtext(url)) return;
      const absolute = absoluteUrl(url);
      // Our own fmt=json3 fetches echo back through the hooks; ignore them so
      // they can never replace the player's fresher pot.
      if (selfFetchUrls.has(absolute)) return;

      const key = videoIdOfUrl(absolute);
      const list = capturesByVideo.get(key) || [];

      const existing = list.indexOf(absolute);
      if (existing !== -1) list.splice(existing, 1);
      list.push(absolute);
      while (list.length > MAX_URLS_PER_VIDEO) list.shift();

      capturesByVideo.set(key, list);
      debugLog("captured timedtext URL for", key);
    } catch (_error) {
      // Never throw into YouTube's page.
    }
  }

  /**
   * Newest-first candidate URLs for this request: the current page's video
   * first, then the "unknown" bucket.
   */
  function pickCapturedUrls(videoId) {
    const urls = [];
    const current =
      videoId && videoId !== "unknown"
        ? videoId
        : currentVideoIdFromLocation();

    const newestFirst = (key) => {
      const list = capturesByVideo.get(key);
      return list ? list.slice().reverse() : [];
    };

    for (const url of newestFirst(current)) urls.push(url);
    if (current !== "unknown") {
      for (const url of newestFirst("unknown")) urls.push(url);
    }
    return urls;
  }

  function languageOfUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      return (
        parsed.searchParams.get("lang") ||
        parsed.searchParams.get("tlang") ||
        ""
      );
    } catch (_error) {
      return "";
    }
  }

  // ============================================================
  // PLAYER ACCESS
  // ============================================================

  function activePlayer() {
    try {
      return document.querySelector("#movie_player") || null;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Caption tracks, in order of trust:
   * 1. the player's own response (works even before the captions module loads),
   * 2. player.getOption("captions", "tracklist") (only after the module loads),
   * 3. window.ytInitialPlayerResponse (very first load).
   */
  function readCaptionTracks() {
    try {
      const player = activePlayer();
      let response = null;
      if (player && typeof player.getPlayerResponse === "function") {
        response = player.getPlayerResponse();
      }
      if (!response) response = window.ytInitialPlayerResponse || null;

      const renderer =
        response &&
        response.captions &&
        response.captions.playerCaptionsTracklistRenderer;
      const tracks = renderer && renderer.captionTracks;
      if (Array.isArray(tracks) && tracks.length) return tracks;
    } catch (_error) {
      // fall through
    }

    try {
      const player = activePlayer();
      if (player && typeof player.getOption === "function") {
        const list = player.getOption("captions", "tracklist");
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (_error) {
      // fall through
    }

    return [];
  }

  /**
   * Pick the track to read: an official (non-ASR) track first, then an
   * en* track, then whatever comes first.
   */
  function pickPreferredTrack(tracks) {
    const usable = (Array.isArray(tracks) ? tracks : []).filter(
      (track) =>
        track &&
        typeof track === "object" &&
        typeof track.baseUrl === "string" &&
        track.baseUrl.length > 0,
    );
    if (!usable.length) return null;

    const official = usable.find((track) => track.kind !== "asr");
    if (official) return official;

    const english = usable.find(
      (track) =>
        typeof track.languageCode === "string" &&
        track.languageCode.toLowerCase().indexOf("en") === 0,
    );
    if (english) return english;

    return usable[0];
  }

  function saveCaptionState(player) {
    const snapshot = { track: null, ccPressed: null };
    try {
      if (player && typeof player.getOption === "function") {
        const track = player.getOption("captions", "track");
        snapshot.track = track && typeof track === "object" ? track : null;
      }
    } catch (_error) {
      // best effort
    }
    try {
      const button = document.querySelector(".ytp-subtitles-button");
      if (button) snapshot.ccPressed = button.getAttribute("aria-pressed");
    } catch (_error) {
      // best effort
    }
    return snapshot;
  }

  /**
   * Put the player's caption state back the way the viewer had it. Originally
   * off means "turn them off again"; failures are silent by design.
   */
  function restoreCaptionState(player, snapshot) {
    try {
      if (!player || !snapshot) return;

      if (snapshot.ccPressed === "false") {
        try {
          if (typeof player.setOption === "function") {
            player.setOption("captions", "track", {});
          }
        } catch (_error) {
          // ignore
        }
        let button = null;
        try {
          button = document.querySelector(".ytp-subtitles-button");
        } catch (_error) {
          button = null;
        }
        if (button && button.getAttribute("aria-pressed") === "true") {
          try {
            button.click();
          } catch (_error) {
            // ignore
          }
        }
        return;
      }

      const original = snapshot.track;
      if (
        original &&
        typeof original.languageCode === "string" &&
        typeof player.setOption === "function"
      ) {
        try {
          player.setOption("captions", "track", {
            languageCode: original.languageCode,
          });
        } catch (_error) {
          // ignore
        }
      }
    } catch (_error) {
      // Restoration is always best effort.
    }
  }

  // ============================================================
  // FETCH + PARSE
  // ============================================================

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
  }

  /**
   * Same-origin fetch of a timedtext URL with credentials (the pot/signature
   * belongs to this session) and a hard timeout.
   */
  async function fetchJson3(url, timeoutMs) {
    const controller = new AbortController();
    let timer = null;

    selfFetchUrls.add(url);
    try {
      timer = setTimeout(() => {
        try {
          controller.abort();
        } catch (_error) {
          // ignore
        }
      }, Math.max(500, timeoutMs));

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response || !response.ok) {
        throw new Error(
          "timedtext HTTP " + (response ? response.status : "network error"),
        );
      }

      const text = await response.text();
      if (!text) throw new Error("timedtext empty body");
      return JSON.parse(text);
    } finally {
      if (timer) clearTimeout(timer);
      // The Resource Timing entry for this request lands later than this
      // finally block; keep the URL marked so the observer does not record it
      // as the player's own fetch.
      setTimeout(() => {
        selfFetchUrls.delete(url);
      }, SELF_URL_LINGER_MS);
    }
  }

  /**
   * Fetch one URL and turn it into cues. Returns {ok:true, cues, language} on
   * success, or null (after recording why in `state`).
   */
  async function tryFetchCues(url, timeoutMs, fallbackLanguage, state) {
    state.attemptedFetch = true;
    try {
      const normalized = normalizeTimedtextUrlForVideo(url);
      if (!normalized) throw new Error("invalid timedtext URL");

      const json = await fetchJson3(normalized, timeoutMs);
      const language = languageOfUrl(normalized) || fallbackLanguage || "";
      const cues = parseJson3Cues(json, language);

      if (!cues.length) {
        state.emptyCues = true;
        return null;
      }
      return { ok: true, cues, language };
    } catch (error) {
      state.fetchFailed = true;
      debugLog("fetch failed", error && error.message);
      return null;
    }
  }

  /**
   * Strategy 3 helper: wait until a timedtext URL we did not know about shows
   * up in the capture store (the player just fetched it).
   */
  async function waitForFreshCapture(videoId, knownUrls, budgetMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < budgetMs) {
      await sleep(CAPTURE_POLL_MS);
      const fresh = pickCapturedUrls(videoId).find(
        (url) => !knownUrls.has(url),
      );
      if (fresh) return fresh;
    }
    return "";
  }

  // ============================================================
  // STRATEGIES
  // ============================================================

  function timeoutResult() {
    return {
      ok: false,
      code: "TIMEOUT",
      message: "读取 YouTube 字幕超时",
    };
  }

  /**
   * Strategy 3: ask the player to load captions, then let strategies 1/2 run
   * once more against the fresh capture / refreshed track list. Always restores
   * the viewer's original CC state, including on success and on throw.
   */
  async function triggerPlayerCaptions(videoId, deadline, state) {
    const player = activePlayer();
    if (!player || typeof player.loadModule !== "function") return null;
    if (deadline - Date.now() <= 0) return null;

    const snapshot = saveCaptionState(player);
    try {
      const knownUrls = new Set(pickCapturedUrls(videoId));

      try {
        player.loadModule("captions");
      } catch (error) {
        debugLog("loadModule(captions) failed", error && error.message);
        return null;
      }

      await sleep(
        Math.min(CAPTIONS_MODULE_WAIT_MS, Math.max(0, deadline - Date.now())),
      );

      const tracks = readCaptionTracks();
      const track = pickPreferredTrack(tracks);

      // Selecting a track is what actually arms the captions module; loading it
      // alone does not make the player fetch timedtext.
      try {
        if (track && typeof player.setOption === "function") {
          player.setOption("captions", "track", {
            languageCode: track.languageCode,
          });
        }
      } catch (_error) {
        // ignore
      }

      // Leave at least one fetch worth of budget before giving up on the wait.
      const waitBudget = Math.min(
        CAPTURE_WAIT_MS,
        Math.max(0, deadline - Date.now() - FETCH_TIMEOUT_MS),
      );
      const freshUrl = await waitForFreshCapture(videoId, knownUrls, waitBudget);

      if (freshUrl && deadline - Date.now() > 0) {
        const result = await tryFetchCues(
          freshUrl,
          Math.max(500, Math.min(FETCH_TIMEOUT_MS, deadline - Date.now())),
          track ? track.languageCode || "" : "",
          state,
        );
        if (result) return result;
      }

      // Loading the module may have populated baseUrls that were missing before.
      const retryTrack = pickPreferredTrack(readCaptionTracks()) || track;
      if (retryTrack && deadline - Date.now() > 0) {
        const result = await tryFetchCues(
          retryTrack.baseUrl,
          Math.max(500, Math.min(FETCH_TIMEOUT_MS, deadline - Date.now())),
          retryTrack.languageCode || "",
          state,
        );
        if (result) return result;
      }

      return null;
    } finally {
      restoreCaptionState(player, snapshot);
    }
  }

  function classifyFailure(state, deadline) {
    if (Date.now() >= deadline) return timeoutResult();
    if (state.emptyCues) {
      return {
        ok: false,
        code: "EMPTY_CUES",
        message: "该视频的字幕内容为空",
      };
    }
    if (state.attemptedFetch || state.fetchFailed) {
      return {
        ok: false,
        code: "CAPTION_FETCH_FAILED",
        message: "请求 YouTube 字幕失败",
      };
    }
    return {
      ok: false,
      code: "NO_CAPTION_TRACKS",
      message: "该视频没有可用的字幕轨",
    };
  }

  /**
   * Run the three strategies in order and return either a success result or a
   * classified failure. Never throws.
   */
  async function extractCues({ videoId, deadline }) {
    const state = {
      attemptedFetch: false,
      fetchFailed: false,
      emptyCues: false,
    };
    const remaining = () => deadline - Date.now();
    const timeoutFor = (capMs) => Math.max(500, Math.min(capMs, remaining()));

    // ---- Strategy 1: reuse a timedtext URL the player already requested ----
    const capturedUrls = pickCapturedUrls(videoId).slice(
      0,
      MAX_STRATEGY1_ATTEMPTS,
    );
    for (const url of capturedUrls) {
      if (remaining() <= 0) break;
      const result = await tryFetchCues(
        url,
        timeoutFor(FETCH_TIMEOUT_MS),
        "",
        state,
      );
      if (result) return result;
    }
    if (remaining() <= 0) return timeoutResult();

    // ---- Strategy 2: the player's own caption track list ----
    const tracks = readCaptionTracks();
    const track = pickPreferredTrack(tracks);
    if (track) {
      const result = await tryFetchCues(
        track.baseUrl,
        timeoutFor(FETCH_TIMEOUT_MS),
        track.languageCode || "",
        state,
      );
      if (result) return result;
    }
    if (remaining() <= 0) return timeoutResult();

    // ---- Strategy 3: make the player load captions, then retry 1/2 ----
    const triggered = await triggerPlayerCaptions(videoId, deadline, state);
    if (triggered) return triggered;

    return classifyFailure(state, deadline);
  }

  // ============================================================
  // MESSAGE BRIDGE (content.js <-> MAIN world)
  // ============================================================

  function postToContent(message) {
    try {
      window.postMessage(message, "*");
    } catch (_error) {
      // ignore
    }
  }

  async function handleExtractRequest(data) {
    const requestId = data && data.requestId;
    if (!requestId) return;

    const deadline = Date.now() + EXTRACT_BUDGET_MS;
    let result;
    try {
      // The page is the source of truth for "which video is this", but fall
      // back to the id content.js sent when the URL has no ?v=.
      const requestedVideoId =
        typeof data.videoId === "string" ? data.videoId : "";
      const current = currentVideoIdFromLocation();
      const videoId =
        current !== "unknown" ? current : requestedVideoId || "unknown";

      result = await extractCues({ videoId, deadline });
    } catch (error) {
      result = {
        ok: false,
        code: "CAPTION_FETCH_FAILED",
        message: String((error && error.message) || error),
      };
    }

    try {
      if (result && result.ok) {
        postToContent({
          source: SOURCE_MAIN,
          type: "result",
          requestId,
          cues: result.cues,
          language: result.language || "",
          provider: "youtube",
        });
        return;
      }

      postToContent({
        source: SOURCE_MAIN,
        type: "error",
        requestId,
        code: (result && result.code) || "CAPTION_FETCH_FAILED",
        message: (result && result.message) || "读取 YouTube 字幕失败",
      });
    } catch (_error) {
      // postMessage failures are not actionable; never throw into the page.
    }
  }

  // One extraction at a time: strategy 3 briefly changes the player's caption
  // state, so overlapping runs could restore each other's state by accident.
  let extractionQueue = Promise.resolve();

  window.addEventListener(
    "message",
    (event) => {
      try {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.source !== SOURCE_CONTENT) return;
        if (data.type !== "extract") return;

        const payload = data;
        extractionQueue = extractionQueue
          .then(() => handleExtractRequest(payload))
          .catch(() => {
            // handleExtractRequest already swallows its own failures.
          });
      } catch (_error) {
        // Never throw into YouTube's page.
      }
    },
    false,
  );

  // ============================================================
  // CAPTURE HOOKS
  // ============================================================

  // ---- hook fetch -----------------------------------------------------------
  try {
    const originalFetch = window.fetch;
    if (typeof originalFetch === "function") {
      window.fetch = function (input) {
        try {
          let url = "";
          if (typeof input === "string") url = input;
          else if (input && typeof input.url === "string") url = input.url;
          if (url) noteTimedtext(url);
        } catch (_error) {
          // never break the page's fetch
        }
        return originalFetch.apply(this, arguments);
      };
    }
  } catch (_error) {
    // never throw
  }

  // ---- hook XMLHttpRequest --------------------------------------------------
  try {
    const xhrProto = XMLHttpRequest.prototype;
    const originalOpen = xhrProto.open;
    const originalSend = xhrProto.send;

    xhrProto.open = function (method, url) {
      try {
        this.__ytdCaptionUrl = url;
      } catch (_error) {
        // ignore
      }
      return originalOpen.apply(this, arguments);
    };

    xhrProto.send = function () {
      try {
        if (this.__ytdCaptionUrl) noteTimedtext(this.__ytdCaptionUrl);
      } catch (_error) {
        // ignore
      }
      return originalSend.apply(this, arguments);
    };
  } catch (_error) {
    // never throw
  }

  // ---- capture via Resource Timing -----------------------------------------
  // Hook-independent fallback: the player's /api/timedtext request shows up in
  // Resource Timing with its full URL (pot included) even when the request was
  // made by code we did not wrap, or when another extension locked
  // XMLHttpRequest.prototype.open before we ran.
  try {
    const scan = (entries) => {
      for (const entry of entries) {
        try {
          if (entry && typeof entry.name === "string" && isTimedtext(entry.name)) {
            noteTimedtext(entry.name);
          }
        } catch (_error) {
          // ignore one bad entry
        }
      }
    };

    try {
      scan(performance.getEntriesByType("resource"));
    } catch (_error) {
      // ignore
    }

    if (typeof PerformanceObserver === "function") {
      const observer = new PerformanceObserver((list) => {
        try {
          scan(list.getEntries());
        } catch (_error) {
          // ignore
        }
      });
      observer.observe({ type: "resource", buffered: true });
    }
  } catch (_error) {
    // never throw
  }

  debugLog("caption capture installed");
})();
