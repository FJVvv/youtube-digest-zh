const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function loadBackgroundHelpers({
  settings = {
    provider: "deepseek",
    aiApiKey: "test-key",
    aiBaseUrl: "https://api.deepseek.com",
    aiModel: "deepseek-v4-flash",
    transcriptSource: "auto",
  },
  fetchImpl,
} = {}) {
  const listeners = { addListener() {} };
  const localStorage = { ytd_settings: settings };
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    fetch: fetchImpl,
    AbortController,
    setTimeout: () => 0,
    clearTimeout: () => {},
    importScripts() {},
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
      tabs: { onUpdated: listeners, onActivated: listeners },
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
  return sandbox.__YTD_TRANSLATION_TESTING__;
}

function promptFileFetch(onCompletionRequest) {
  return async (url, options) => {
    if (String(url).startsWith("chrome-extension://")) {
      const fileName = String(url).split("/prompts/")[1];
      return {
        ok: true,
        status: 200,
        text: async () => read(`prompts/${fileName}`),
      };
    }
    return onCompletionRequest(url, options);
  };
}

test("chat transcript truncation keeps the start and the end", () => {
  const helpers = loadBackgroundHelpers({});
  const short = "short transcript";
  assert.equal(helpers.truncateTranscriptForChat(short, 100), short);

  const long = `${"A".repeat(300)}${"B".repeat(300)}`;
  const truncated = helpers.truncateTranscriptForChat(long, 400);
  assert.ok(truncated.length > 400);
  assert.ok(truncated.startsWith("A".repeat(280)));
  assert.ok(truncated.endsWith("B".repeat(120)));
  assert.match(truncated, /字幕中间部分因长度限制已省略/);
});

test("formatYouTubeCues builds transcript text and timestamps", () => {
  const helpers = loadBackgroundHelpers({});
  const result = helpers.formatYouTubeCues(
    [
      { text: ">> Hello there", start: 0, duration: 2 },
      { text: "General Kenobi", start: 65, duration: 3 },
    ],
    "en",
  );

  assert.equal(result.success, true);
  assert.equal(result.transcriptSource, "youtube");
  assert.equal(result.language, "en");
  assert.equal(result.transcript.length, 2);
  assert.equal(result.transcript[0].text, "Hello there");
  assert.equal(result.transcriptText, "Hello there General Kenobi");
  assert.equal(
    result.transcriptTextTimestamped,
    "[0:00] Hello there\n[1:05] General Kenobi",
  );
  assert.equal(helpers.formatYouTubeCues([], "en"), null);
});

test("chat answers use the configured model and include the transcript", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "这是回答。" } }],
        }),
      };
    }),
  });

  const result = await helpers.handleChatAsk({
    transcriptText: "[0:00] Hello there\n[1:05] General Kenobi\n",
    videoTitle: "Test Video",
    channelName: "Test Channel",
    videoDescription: "A description.",
    messages: [
      { role: "user", content: "第一个问题" },
      { role: "assistant", content: "第一个回答" },
    ],
    question: "第二个问题是什么？",
  });

  assert.equal(result.success, true);
  assert.equal(result.answer, "这是回答。");
  assert.equal(result.model, "deepseek-v4-flash");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].model, "deepseek-v4-flash");
  assert.equal(requests[0].messages[0].role, "system");
  assert.match(requests[0].messages[0].content, /Test Video/);
  assert.match(requests[0].messages[0].content, /Hello there/);
  const sentMessages = JSON.parse(JSON.stringify(requests[0].messages));
  assert.deepEqual(
    sentMessages.filter((message) => message.role !== "system"),
    [
      { role: "user", content: "第一个问题" },
      { role: "assistant", content: "第一个回答" },
      { role: "user", content: "第二个问题是什么？" },
    ],
  );
});

test("chat system prompt carries the duration, URL and prior summary", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "这是回答。" } }],
        }),
      };
    }),
  });

  const result = await helpers.handleChatAsk({
    transcriptText: "[0:00] Hello there",
    videoTitle: "Test Video",
    channelName: "Test Channel",
    videoDescription: "A description.",
    videoDuration: 754,
    videoUrl: "https://www.youtube.com/watch?v=abc123def45",
    analysisSummary: "这段视频讲解了如何处理幂等重试。",
    messages: [],
    question: "重点是什么？",
  });

  assert.equal(result.success, true);
  const systemMessage = requests[0].messages[0];
  assert.equal(systemMessage.role, "system");
  assert.match(systemMessage.content, /12:34/);
  assert.match(systemMessage.content, /https:\/\/www\.youtube\.com\/watch\?v=abc123def45/);
  assert.match(systemMessage.content, /这段视频讲解了如何处理幂等重试。/);
  assert.equal(helpers.formatVideoDurationForChat(754), "12:34");
  assert.equal(helpers.formatVideoDurationForChat(""), "Unknown");
});

test("chat does not repeat the pending question when history already ends with it", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "这是回答。" } }],
        }),
      };
    }),
  });

  const question = "这视频讲什么";
  const result = await helpers.handleChatAsk({
    transcriptText: "[0:00] Hello there",
    videoTitle: "Test Video",
    channelName: "Test Channel",
    videoDescription: "",
    messages: [
      { role: "user", content: "第一个问题" },
      { role: "assistant", content: "第一个回答" },
      { role: "user", content: question },
    ],
    question,
  });

  assert.equal(result.success, true);
  const nonSystemMessages = requests[0].messages.filter(
    (message) => message.role !== "system",
  );
  assert.deepEqual(nonSystemMessages, [
    { role: "user", content: "第一个问题" },
    { role: "assistant", content: "第一个回答" },
    { role: "user", content: question },
  ]);
  assert.equal(
    nonSystemMessages.filter((message) => message.content === question).length,
    1,
  );
});

test("chat truncates an oversized transcript with the explicit marker", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "这是回答。" } }],
        }),
      };
    }),
  });

  const hugeTranscript = `${"A".repeat(50_000)}${"B".repeat(50_000)}`;
  const result = await helpers.handleChatAsk({
    transcriptText: hugeTranscript,
    videoTitle: "Test Video",
    channelName: "Test Channel",
    videoDescription: "",
    messages: [],
    question: "讲了什么？",
  });

  assert.equal(result.success, true);
  const systemContent = requests[0].messages[0].content;
  assert.match(systemContent, /字幕中间部分因长度限制已省略/);
  assert.match(systemContent, /未覆盖的内容不要猜测/);
  assert.ok(
    systemContent.length < hugeTranscript.length,
    "oversized transcript should be shortened",
  );
});

test("chat requests use the 2048 max_tokens budget and 0.6 temperature", async () => {
  const requests = [];
  const helpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "这是回答。" } }],
        }),
      };
    }),
  });

  const result = await helpers.handleChatAsk({
    transcriptText: "[0:00] Hello there",
    videoTitle: "Test Video",
    channelName: "Test Channel",
    videoDescription: "",
    messages: [],
    question: "讲了什么？",
  });

  assert.equal(result.success, true);
  assert.equal(requests[0].max_tokens, 2048);
  assert.equal(requests[0].temperature, 0.6);
});

test("chat reports missing key, empty question, and missing transcript", async () => {
  const noKey = loadBackgroundHelpers({
    settings: {
      provider: "deepseek",
      aiApiKey: "",
      aiBaseUrl: "https://api.deepseek.com",
      aiModel: "deepseek-v4-flash",
    },
    fetchImpl: promptFileFetch(async () => {
      throw new Error("should not be called");
    }),
  });
  const noKeyResult = await noKey.handleChatAsk({
    transcriptText: "text",
    videoTitle: "Test",
    channelName: "",
    videoDescription: "",
    messages: [],
    question: "问题",
  });
  assert.equal(noKeyResult.success, false);
  assert.equal(noKeyResult.error, "NO_AI_KEY");

  const helpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async () => {
      throw new Error("should not be called");
    }),
  });
  const emptyQuestion = await helpers.handleChatAsk({
    transcriptText: "text",
    videoTitle: "Test",
    channelName: "",
    videoDescription: "",
    messages: [],
    question: "   ",
  });
  assert.equal(emptyQuestion.success, false);
  assert.equal(emptyQuestion.error, "EMPTY_QUESTION");

  const noTranscript = await helpers.handleChatAsk({
    transcriptText: "",
    videoTitle: "Test",
    channelName: "",
    videoDescription: "",
    messages: [],
    question: "问题",
  });
  assert.equal(noTranscript.success, false);
  assert.equal(noTranscript.error, "CHAT_NO_TRANSCRIPT");
});

test("connection test returns the model or a clear model error", async () => {
  const okHelpers = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "OK" } }],
      }),
    })),
  });
  const ok = await okHelpers.handleTestAiConnection();
  assert.equal(ok.success, true);
  assert.equal(ok.model, "deepseek-v4-flash");

  const missingModel = loadBackgroundHelpers({
    fetchImpl: promptFileFetch(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: "model not found" } }),
    })),
  });
  const failed = await missingModel.handleTestAiConnection();
  assert.equal(failed.success, false);
  assert.equal(failed.error, "MODEL_NOT_FOUND");
  assert.match(failed.message, /模型/);
});
