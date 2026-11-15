const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

/**
 * Loads background.js in a VM sandbox. The transcript source logic is pure
 * except for chrome.tabs messaging and fetch, which the tests stub directly.
 */
function loadBackground({
  settings = {
    provider: "deepseek",
    aiApiKey: "test-key",
    aiBaseUrl: "https://api.deepseek.com",
    aiModel: "deepseek-v4-flash",
    supadataApiKey: "sd-test-key",
    transcriptSource: "auto",
  },
  fetchImpl,
  tabResponse = { success: false, error: "FREE_CAPTIONS_FAILED", code: "NO_CAPTION_TRACKS" },
} = {}) {
  const listeners = { addListener() {} };
  const localStorage = { ytd_settings: settings };
  const tabCalls = [];
  const fetchCalls = [];
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    AbortController,
    setTimeout: () => 0,
    clearTimeout() {},
    importScripts() {},
    fetch: async (...args) => {
      fetchCalls.push(args);
      if (fetchImpl) return fetchImpl(...args);
      throw new Error("fetch should not be called");
    },
    chrome: {
      storage: {
        local: {
          setAccessLevel: () => Promise.resolve(),
          get: async (key) => {
            if (key === null) return { ...localStorage };
            if (Array.isArray(key)) {
              return Object.fromEntries(
                key.map((item) => [item, localStorage[item]]),
              );
            }
            return { [key]: localStorage[key] };
          },
          set: async (values) => Object.assign(localStorage, values),
          remove: async (keys) => {
            for (const key of Array.isArray(keys) ? keys : [keys]) {
              delete localStorage[key];
            }
          },
        },
      },
      action: { onClicked: listeners },
      sidePanel: {
        setPanelBehavior() {},
        setOptions: () => Promise.resolve(),
      },
      runtime: {
        onInstalled: listeners,
        onMessage: listeners,
        openOptionsPage() {},
        getURL: (resourcePath) => `chrome-extension://test/${resourcePath}`,
        sendMessage: () => Promise.resolve({ success: true }),
      },
      tabs: {
        onUpdated: listeners,
        onActivated: listeners,
        query: async () => [{ id: 42 }],
        sendMessage: async (tabId, payload) => {
          tabCalls.push({ tabId, payload });
          return tabResponse;
        },
        create: async () => ({}),
      },
    },
    YTD_SETTINGS: {
      STORAGE_KEY: "ytd_settings",
      normalize: (value) => value,
      chatCompletionsUrl: (baseUrl) => `${baseUrl}/chat/completions`,
      isOfficialDeepSeekBase: (url) => {
        try {
          return new URL(String(url || "")).host === "api.deepseek.com";
        } catch (_error) {
          return false;
        }
      },
      canonicalYouTubeUrl: (videoId) =>
        `https://www.youtube.com/watch?v=${videoId}`,
    },
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("background.js"), sandbox);
  return {
    helpers: sandbox.__YTD_TRANSLATION_TESTING__,
    tabCalls,
    fetchCalls,
  };
}

const supadataPayload = {
  content: [
    { text: ">> Hello from Supadata", offset: 0, duration: 3000, lang: "en" },
    { text: "Second line", offset: 65000, duration: 2000, lang: "en" },
  ],
  lang: "en",
};

function supadataResponse(payload = supadataPayload) {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => payload,
  });
}

test("resolveTranscriptSource prefers the explicit request and defaults to auto", () => {
  const { helpers } = loadBackground();

  assert.equal(helpers.resolveTranscriptSource("supadata", "auto"), "supadata");
  assert.equal(helpers.resolveTranscriptSource("youtube", "supadata"), "youtube");
  assert.equal(helpers.resolveTranscriptSource(undefined, "youtube"), "youtube");
  assert.equal(helpers.resolveTranscriptSource("", "auto"), "auto");
  assert.equal(helpers.resolveTranscriptSource("bogus", "nope"), "auto");
});

test("free-only mode returns the failure code and never calls Supadata", async () => {
  const { helpers, tabCalls, fetchCalls } = loadBackground({
    tabResponse: {
      success: false,
      error: "FREE_CAPTIONS_FAILED",
      code: "NO_CAPTION_TRACKS",
    },
  });

  const result = await helpers.handleFetchTranscript(
    "abc123def45",
    42,
    "youtube",
  );

  assert.equal(result.success, false);
  assert.equal(result.error, "FREE_CAPTIONS_FAILED");
  assert.equal(result.code, "NO_CAPTION_TRACKS");
  assert.match(result.message, /不会调用 Supadata/);
  assert.equal(fetchCalls.length, 0);
  assert.equal(tabCalls.length, 1);
  assert.equal(tabCalls[0].payload.action, "extractFreeCaptions");
  assert.equal(tabCalls[0].payload.videoId, "abc123def45");
});

test("free YouTube captions are used without a transcript service", async () => {
  const { helpers, fetchCalls } = loadBackground({
    tabResponse: {
      success: true,
      language: "en",
      cues: [
        { text: ">> Hello there", start: 0, duration: 2 },
        { text: "General Kenobi", start: 65, duration: 3 },
      ],
    },
  });

  const result = await helpers.handleFetchTranscript(
    "abc123def45",
    42,
    "youtube",
  );

  assert.equal(result.success, true);
  assert.equal(result.transcriptSource, "youtube");
  assert.equal(result.transcriptText, "Hello there General Kenobi");
  assert.equal(
    result.transcriptTextTimestamped,
    "[0:00] Hello there\n[1:05] General Kenobi",
  );
  assert.equal(fetchCalls.length, 0);
});

test("auto mode reports why it fell back to Supadata", async () => {
  const { helpers, fetchCalls } = loadBackground({
    tabResponse: {
      success: false,
      error: "FREE_CAPTIONS_FAILED",
      code: "TIMEOUT",
    },
    fetchImpl: supadataResponse(),
  });

  const result = await helpers.handleFetchTranscript(
    "abc123def45",
    42,
    "auto",
  );

  assert.equal(result.success, true);
  assert.equal(result.transcriptSource, "supadata");
  assert.equal(result.freeCaptionFailure, "TIMEOUT");
  assert.equal(result.transcriptText, "Hello from Supadata Second line");
  assert.equal(fetchCalls.length, 1);
  assert.match(String(fetchCalls[0][0]), /api\.supadata\.ai/);
  assert.equal(fetchCalls[0][1].headers["x-api-key"], "sd-test-key");
});

test("Supadata-only mode never asks the page for captions", async () => {
  const { helpers, tabCalls, fetchCalls } = loadBackground({
    fetchImpl: supadataResponse(),
  });

  const result = await helpers.handleFetchTranscript(
    "abc123def45",
    42,
    "supadata",
  );

  assert.equal(result.success, true);
  assert.equal(result.transcriptSource, "supadata");
  assert.equal(result.freeCaptionFailure, undefined);
  assert.equal(tabCalls.length, 0);
  assert.equal(fetchCalls.length, 1);
});

test("auto mode explains a missing Supadata key after free captions fail", async () => {
  const { helpers, fetchCalls } = loadBackground({
    settings: {
      provider: "deepseek",
      aiApiKey: "test-key",
      aiBaseUrl: "https://api.deepseek.com",
      aiModel: "deepseek-v4-flash",
      supadataApiKey: "",
      transcriptSource: "auto",
    },
  });

  const result = await helpers.handleFetchTranscript(
    "abc123def45",
    42,
    "auto",
  );

  assert.equal(result.success, false);
  assert.equal(result.error, "NO_SUPADATA_KEY");
  assert.match(result.message, /无法读取 YouTube 自带字幕/);
  assert.equal(fetchCalls.length, 0);
});
