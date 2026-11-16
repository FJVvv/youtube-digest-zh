const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function createStorageStub() {
  const data = new Map();
  return {
    data,
    async get(key) {
      if (key == null) return Object.fromEntries(data.entries());
      const keys = Array.isArray(key) ? key : [key];
      const result = {};
      keys.forEach((item) => {
        if (data.has(item)) result[item] = data.get(item);
      });
      return result;
    },
    async set(values) {
      Object.entries(values || {}).forEach(([key, value]) => {
        data.set(key, JSON.parse(JSON.stringify(value)));
      });
    },
    async remove(keys) {
      (Array.isArray(keys) ? keys : [keys]).forEach((key) => data.delete(key));
    },
  };
}

/**
 * Loads sidepanel.js in a VM sandbox the same way transcript-search.test.js
 * does. The chat helpers under test are pure, so a memory storage stub and
 * empty DOM stubs are enough.
 */
function loadPanel() {
  const listeners = { addListener() {} };
  const storage = createStorageStub();
  const sandbox = {
    console,
    URL,
    TextDecoder,
    TextEncoder,
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval() {},
    clearInterval() {},
    IntersectionObserver: class {},
    CSS: { escape: (value) => value },
    window: { getSelection: () => null, close() {} },
    document: {
      addEventListener() {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => ({
        textContent: "",
        set innerHTML(value) {
          this.textContent = String(value);
        },
        get innerHTML() {
          return this.textContent;
        },
      }),
    },
    chrome: {
      runtime: { onMessage: listeners, sendMessage: async () => ({}) },
      windows: { getCurrent: async () => ({ id: 1 }) },
      tabs: { onUpdated: listeners, onActivated: listeners },
      storage: { local: storage },
    },
    YTD_SETTINGS: {},
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(read("sidepanel.js"), sandbox);
  return { testing: sandbox.__YTD_TRANSCRIPT_TESTING__, storage };
}

test("chat storage keys are namespaced per video", () => {
  const { testing } = loadPanel();
  assert.equal(testing.chatStorageKey("dQw4w9WgXcQ"), "ytd_chat_dQw4w9WgXcQ");
  assert.equal(testing.chatStorageKey(""), "ytd_chat_");
});

test("buildChatRecord keeps only the newest hundred messages", () => {
  const { testing } = loadPanel();
  const messages = Array.from({ length: 150 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `m${index}`,
  }));
  const record = testing.buildChatRecord({
    videoId: "vid",
    videoTitle: "标题",
    messages,
    now: 1234,
  });

  assert.equal(record.messages.length, 100);
  assert.equal(record.messages[0].content, "m50");
  assert.equal(record.messages[99].content, "m149");
  assert.equal(record.updatedAt, 1234);
  assert.equal(record.videoId, "vid");
});

test("buildChatRecord clips one oversized message to the character cap", () => {
  const { testing } = loadPanel();
  const record = testing.buildChatRecord({
    videoId: "vid",
    messages: [{ role: "user", content: "x".repeat(20000) }],
    now: 1,
  });

  assert.equal(record.messages.length, 1);
  assert.equal(record.messages[0].content.length, 12000);
});

test("pruneChatIndex drops the oldest entry and reports its video id", () => {
  const { testing } = loadPanel();
  const index = Array.from({ length: 51 }, (_, position) => ({
    videoId: `v${position}`,
    updatedAt: position + 1,
    messageCount: 2,
  }));

  const pruned = testing.pruneChatIndex(index, 50);

  assert.equal(pruned.index.length, 50);
  assert.deepEqual(JSON.parse(JSON.stringify(pruned.removedVideoIds)), ["v0"]);
  assert.equal(pruned.index[0].videoId, "v50");
  assert.equal(pruned.index[49].videoId, "v1");
});

test("formatChatExport includes the clickable video link line", () => {
  const { testing } = loadPanel();
  const text = testing.formatChatExport({
    videoId: "dQw4w9WgXcQ",
    videoUrl: "",
    videoTitle: "测试视频",
    channelName: "测试频道",
    messages: [
      { role: "user", content: "核心观点是什么" },
      { role: "assistant", content: "讲了三个观点。" },
    ],
  });

  assert.match(text, /YouTube Digest 对话/);
  assert.match(text, /视频：测试视频/);
  assert.match(
    text,
    /链接：https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ/,
  );
  assert.match(text, /频道：测试频道/);
  assert.match(text, /\[我\] 核心观点是什么/);
  assert.match(text, /\[AI\] 讲了三个观点。/);
});

test("chat records keep web citations and the export lists the sources", () => {
  const { testing } = loadPanel();
  const record = testing.buildChatRecord({
    videoId: "dQw4w9WgXcQ",
    videoTitle: "测试视频",
    messages: [
      { role: "user", content: "V4.1 什么时候发布？" },
      {
        role: "assistant",
        content: "2026 年 10 月。",
        citations: [
          {
            url: "https://api-docs.deepseek.com/news/2026/10/17/v4.1",
            title: "DeepSeek-V4.1-Flash-1017",
          },
          { url: "javascript:alert(1)", title: "bad" },
        ],
        truncated: true,
      },
    ],
    now: 99,
  });

  assert.equal(record.messages[1].citations.length, 1);
  assert.equal(
    record.messages[1].citations[0].url,
    "https://api-docs.deepseek.com/news/2026/10/17/v4.1",
  );
  assert.equal(record.messages[1].truncated, true);

  const text = testing.formatChatExport(record);
  assert.match(text, /\[AI\] 2026 年 10 月。/);
  assert.match(text, /来源：/);
  assert.match(
    text,
    /- DeepSeek-V4\.1-Flash-1017 https:\/\/api-docs\.deepseek\.com/,
  );
});

test("sanitizeFilename keeps Chinese characters and falls back to untitled", () => {
  const { testing } = loadPanel();

  assert.equal(testing.sanitizeFilename("人工智能 入门！"), "人工智能-入门");
  assert.equal(testing.sanitizeFilename("Hello 世界"), "Hello-世界");
  assert.equal(testing.sanitizeFilename("!!!"), "untitled");
  assert.equal(testing.sanitizeFilename("ABC"), "ABC");
});

test("chatAsk sends the prior turns only and the new context fields", () => {
  const js = read("sidepanel.js");

  assert.match(js, /messages: chatMessages\.slice\(0, -1\)\.map\(/);
  assert.match(js, /videoDuration: chatVideoDuration/);
  assert.match(js, /videoUrl: chatVideoUrl \|\| canonicalVideoUrl\(chatVideoId\)/);
  assert.match(js, /analysisContext: chatAnalysisContext\(\)/);
  assert.match(js, /await openChatConversation\(videoId, videoUrl\)/);
  assert.match(js, /await refreshChatContext\(\)/);
});

test("history, thinking and suggestion hooks are wired", () => {
  const js = read("sidepanel.js");

  assert.match(js, /getElementById\("chatHistoryBtn"\)/);
  assert.match(js, /function renderChatHistory\(/);
  assert.match(js, /function deleteChatConversation\(/);
  assert.match(js, /id = "chatThinking"/);
  assert.match(js, /setTimeout\([\s\S]*?8000\)/);
  assert.match(js, /function handleChatSuggestionClick\(/);
});

test("side panel markup exposes history, link and suggestion UI", () => {
  const html = read("sidepanel.html");

  assert.match(html, /id="chatHistoryBtn"/);
  assert.match(html, /id="chatHistoryPanel"/);
  assert.match(html, /id="chatHistoryList"/);
  assert.match(html, /id="chatReferenceLink"/);
  assert.match(html, /id="chatReferenceMeta"/);
  assert.match(html, /id="chatSuggestions"/);
  assert.equal((html.match(/class="chat-suggestion"/g) || []).length, 3);
});

test("side panel styles define the thinking animation and reduced motion", () => {
  const css = read("sidepanel.css");

  assert.match(css, /@keyframes chatThinkingDot/);
  assert.match(css, /\.chat-thinking-dots span/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.chat-history-item/);
  assert.match(css, /\.chat-suggestion \{/);
});
